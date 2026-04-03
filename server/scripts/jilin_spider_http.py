#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
吉林省政府采购网合规采集器 (HTTP版本)
- 采集日期：2026年1月1日至今
- 使用纯HTTP请求 + 解析预渲染数据
- 支持JSON输出供Node.js调用
"""

import json
import random
import re
import sys
import os
import time
import html
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin, urlencode

try:
    import requests
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry
except ImportError:
    print("[ERROR] 请先安装依赖: pip install requests", file=sys.stderr)
    sys.exit(1)

# ===================== 核心配置 =====================
BASE_URL = "http://www.ccgp-jilin.gov.cn"
LIST_URL = "http://www.ccgp-jilin.gov.cn/site/category"
LIST_PARAMS = {
    "parentId": "550068",
    "childrenCode": "ZcyAnnouncement",
    "utm": "site.site-PC-39285.959-pc-websitegroup-navBar-front.12.5c33f4b02f3f11f1a56911aea690e44d"
}

START_DATE = "2026-01-01"
MAX_PAGE = 50

# 延迟配置（秒）
REQUEST_DELAY_MIN = 1.0
REQUEST_DELAY_MAX = 2.5

# 输出文件
OUTPUT_DIR = "/workspace/projects/server/data"
OUTPUT_JSON = os.path.join(OUTPUT_DIR, "jilin_procurement.json")
OUTPUT_CSV = os.path.join(OUTPUT_DIR, "jilin_procurement.csv")
# ======================================================


class JilinProcurementSpiderHTTP:
    """吉林省政府采购网合规采集器 (HTTP版本)"""
    
    def __init__(self):
        self.start_date = datetime.strptime(START_DATE, "%Y-%m-%d")
        self.all_data: List[Dict[str, Any]] = []
        self.link_set = set()
        self.session: Optional[requests.Session] = None
        
    def init_session(self):
        """初始化HTTP会话"""
        print("[INFO] 初始化HTTP会话...")
        
        self.session = requests.Session()
        
        # 设置重试策略
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # 设置请求头
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
            "Cache-Control": "max-age=0",
        })
        
        print("[INFO] HTTP会话初始化完成")
        
    def close_session(self):
        """关闭HTTP会话"""
        if self.session:
            self.session.close()
            self.session = None
            print("[INFO] HTTP会话已关闭")
            
    def request_delay(self):
        """请求延迟"""
        delay = random.uniform(REQUEST_DELAY_MIN, REQUEST_DELAY_MAX)
        time.sleep(delay)
        
    def fetch_page(self, page_num: int = 1) -> Optional[str]:
        """获取页面内容"""
        params = {**LIST_PARAMS, "page": page_num}
        url = f"{LIST_URL}?{urlencode(params)}"
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            response.encoding = 'utf-8'
            return response.text
        except Exception as e:
            print(f"[ERROR] 获取页面失败: {e}", file=sys.stderr)
            return None
            
    def parse_initial_state(self, html_content: str) -> Optional[Dict]:
        """解析__INITIAL_STATE__数据"""
        try:
            # 查找__INITIAL_STATE__
            match = re.search(r'window\.__INITIAL_STATE__\s*=\s*(\{.+?\});?\s*</script>', html_content, re.DOTALL)
            if match:
                json_str = match.group(1)
                # 解码unicode
                json_str = html.unescape(json_str)
                return json.loads(json_str)
        except Exception as e:
            print(f"[WARN] 解析INITIAL_STATE失败: {e}", file=sys.stderr)
        return None
        
    def parse_html_list(self, html_content: str) -> tuple:
        """从HTML中解析列表数据"""
        items = []
        has_older = False
        
        # 提取所有公告链接
        # 格式: <a href="...">标题</a> ... <span>日期</span>
        
        # 方法1: 提取articleId
        article_pattern = r'articleId["\s:]+(\d+)'
        article_ids = re.findall(article_pattern, html_content)
        
        # 方法2: 提取公告标题和链接
        # 政采云平台使用特定的数据结构
        title_pattern = r'"title"\s*:\s*"([^"]+)"'
        href_pattern = r'"url"\s*:\s*"([^"]+)"'
        date_pattern = r'"publishDate"\s*:\s*"([^"]+)"'
        id_pattern = r'"id"\s*:\s*"(\d+)"'
        
        titles = re.findall(title_pattern, html_content)
        hrefs = re.findall(href_pattern, html_content)
        dates = re.findall(date_pattern, html_content)
        ids = re.findall(id_pattern, html_content)
        
        # 方法3: 直接从HTML结构提取
        # <li><a href="/xx">标题</a><span>日期</span></li>
        li_pattern = r'<li[^>]*>.*?<a[^>]+href=["\']([^"\']+)["\'][^>]*>([^<]+)</a>.*?<span[^>]*>(\d{4}-\d{2}-\d{2})</span>.*?</li>'
        li_matches = re.findall(li_pattern, html_content, re.DOTALL)
        
        if li_matches:
            for href, title, date_str in li_matches:
                try:
                    # 构建完整URL
                    if href.startswith("http"):
                        link = href
                    elif href.startswith("/"):
                        link = BASE_URL + href
                    else:
                        link = BASE_URL + "/" + href
                    
                    # 解析日期
                    pub_date = None
                    try:
                        pub_date = datetime.strptime(date_str, "%Y-%m-%d")
                    except:
                        pass
                    
                    # 日期过滤
                    if pub_date and pub_date < self.start_date:
                        has_older = True
                        continue
                    
                    # 去重
                    if link in self.link_set:
                        continue
                    self.link_set.add(link)
                    
                    items.append({
                        "title": title.strip(),
                        "sourceUrl": link,
                        "publishDate": date_str,
                        "province": "吉林省",
                        "status": "pending"
                    })
                    
                except Exception:
                    continue
        
        # 方法4: 从__INITIAL_STATE__中提取
        initial_state = self.parse_initial_state(html_content)
        if initial_state:
            items.extend(self.extract_from_state(initial_state))
        
        return items, has_older
        
    def extract_from_state(self, state: Dict) -> List[Dict]:
        """从INITIAL_STATE提取数据"""
        items = []
        
        try:
            # 查找公告列表数据
            # 政采云平台的数据结构可能在不同位置
            def find_announcements(obj, depth=0):
                if depth > 10:
                    return []
                    
                result = []
                
                if isinstance(obj, dict):
                    # 查找包含announcement或list的key
                    for key in ['list', 'announcements', 'data', 'items', 'records']:
                        if key in obj and isinstance(obj[key], list):
                            for item in obj[key]:
                                if isinstance(item, dict):
                                    title = item.get('title') or item.get('name')
                                    url = item.get('url') or item.get('href') or item.get('sourceUrl')
                                    date = item.get('publishDate') or item.get('publish_date') or item.get('date')
                                    
                                    if title and url:
                                        # 构建完整URL
                                        if not url.startswith('http'):
                                            url = BASE_URL + (url if url.startswith('/') else '/' + url)
                                        
                                        if url not in self.link_set:
                                            self.link_set.add(url)
                                            result.append({
                                                "title": title,
                                                "sourceUrl": url,
                                                "publishDate": date or "",
                                                "province": "吉林省",
                                                "status": "pending"
                                            })
                    
                    # 递归查找
                    for value in obj.values():
                        result.extend(find_announcements(value, depth + 1))
                        
                elif isinstance(obj, list):
                    for item in obj:
                        result.extend(find_announcements(item, depth + 1))
                        
                return result
            
            items = find_announcements(state)
            
        except Exception as e:
            print(f"[WARN] 从STATE提取数据失败: {e}", file=sys.stderr)
            
        return items
        
    def fetch_detail(self, url: str) -> Dict[str, Any]:
        """获取详情页"""
        detail = {}
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            response.encoding = 'utf-8'
            content = response.text
            
            # 提取正文内容
            # 移除HTML标签，保留文本
            text = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL)
            text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
            text = re.sub(r'<[^>]+>', ' ', text)
            text = html.unescape(text)
            text = re.sub(r'\s+', ' ', text).strip()
            
            detail["content"] = text[:5000]  # 限制长度
            
            # 提取预算金额
            budget_patterns = [
                r"预算金额[：:]\s*([\d,\.]+)\s*万?元",
                r"采购预算[：:]\s*([\d,\.]+)\s*万?元",
                r"项目金额[：:]\s*([\d,\.]+)\s*万?元",
            ]
            for pattern in budget_patterns:
                match = re.search(pattern, text)
                if match:
                    detail["budget"] = match.group(1)
                    break
            
            # 提取联系人
            contact_patterns = [
                r"联系人[：:]\s*([^\s，,。.]+)",
                r"联系人员[：:]\s*([^\s，,。.]+)",
                r"采购人[：:]\s*([^\s，,。.]+)",
            ]
            for pattern in contact_patterns:
                match = re.search(pattern, text)
                if match:
                    detail["contactPerson"] = match.group(1).strip()
                    break
            
            # 提取联系电话
            phone_patterns = [
                r"联系电话[：:]\s*([\d\-\s\(\)（）]+)",
                r"电话[：:]\s*([\d\-\s\(\)（）]+)",
                r"联系方式[：:]\s*([\d\-\s\(\)（）]+)",
            ]
            for pattern in phone_patterns:
                match = re.search(pattern, text)
                if match:
                    phone = re.sub(r"[^\d\-]", "", match.group(1))
                    if len(phone) >= 7:
                        detail["contactPhone"] = phone
                        break
                        
        except Exception as e:
            print(f"[ERROR] 获取详情页失败: {url}, {e}", file=sys.stderr)
            
        return detail
        
    def run(self, fetch_details: bool = False, max_items: int = 0):
        """运行采集器"""
        print("=" * 70)
        print("    吉林省政府采购网 · 合规采集器 (HTTP版)")
        print(f"    采集日期范围：{START_DATE} 至今")
        print(f"    采集详情：{'是' if fetch_details else '否'}")
        print("=" * 70)
        
        try:
            self.init_session()
            
            for page_num in range(1, MAX_PAGE + 1):
                if max_items > 0 and len(self.all_data) >= max_items:
                    print(f"[INFO] 已达最大采集数量 {max_items}，停止")
                    break
                    
                print(f"\n[INFO] 正在采集第 {page_num} 页...")
                
                html_content = self.fetch_page(page_num)
                if not html_content:
                    print(f"[WARN] 第 {page_num} 页获取失败，跳过")
                    continue
                
                items, has_older = self.parse_html_list(html_content)
                
                if items:
                    # 过滤已存在的
                    new_items = [i for i in items if i["sourceUrl"] not in self.link_set]
                    self.all_data.extend(new_items)
                    print(f"[INFO] 第 {page_num} 页有效公告：{len(new_items)} 条，累计：{len(self.all_data)} 条")
                
                if has_older:
                    print("[INFO] 已到目标日期，停止采集")
                    break
                    
                if not items:
                    print("[INFO] 无更多数据，停止采集")
                    break
                
                self.request_delay()
            
            # 采集详情页（可选）
            if fetch_details and self.all_data:
                print(f"\n[INFO] 开始采集详情页...")
                
                for i, item in enumerate(self.all_data):
                    if max_items > 0 and i >= max_items:
                        break
                    
                    print(f"[INFO] 采集详情 {i+1}/{len(self.all_data)}: {item['title'][:30]}...")
                    
                    detail = self.fetch_detail(item["sourceUrl"])
                    item.update(detail)
                    item["status"] = "completed"
                    
                    self.request_delay()
                    
        except Exception as e:
            print(f"[ERROR] 采集过程异常: {e}", file=sys.stderr)
        finally:
            self.close_session()
        
        # 保存数据
        self.save_data()
        
        print("\n" + "=" * 70)
        print(f"[SUCCESS] 采集完成！总计：{len(self.all_data)} 条公告")
        print(f"[OUTPUT] JSON: {OUTPUT_JSON}")
        print("=" * 70)
        
        return self.all_data
        
    def save_data(self):
        """保存采集数据"""
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(self.all_data, f, ensure_ascii=False, indent=2)
        
        try:
            import pandas as pd
            df = pd.DataFrame(self.all_data)
            df.to_csv(OUTPUT_CSV, index=False, encoding="utf_8_sig")
        except ImportError:
            pass


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="吉林省政府采购网合规采集器 (HTTP版)")
    parser.add_argument("--details", action="store_true", help="采集详情页")
    parser.add_argument("--max-items", type=int, default=0, help="最大采集数量")
    parser.add_argument("--output", type=str, help="输出文件路径(JSON)")
    
    args = parser.parse_args()
    
    spider = JilinProcurementSpiderHTTP()
    data = spider.run(
        fetch_details=args.details,
        max_items=args.max_items
    )
    
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
    else:
        print("\n[DATA_OUTPUT]")
        print(json.dumps(data, ensure_ascii=False))


if __name__ == "__main__":
    main()
