#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
吉林省政府采购网合规采集器 - 简化版
- 采集日期：2026年1月1日至今
- 使用HTTP请求 + 解析预渲染数据
- 支持JSON输出供Node.js调用
"""

import json
import random
import re
import sys
import os
import time
import html as html_module
from datetime import datetime
from typing import List, Dict, Any, Tuple

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

# 延迟配置
REQUEST_DELAY_MIN = 1.0
REQUEST_DELAY_MAX = 2.0

# 输出配置
OUTPUT_DIR = "/workspace/projects/server/data"
OUTPUT_JSON = os.path.join(OUTPUT_DIR, "jilin_procurement.json")
OUTPUT_CSV = os.path.join(OUTPUT_DIR, "jilin_procurement.csv")
# ======================================================


class JilinProcurementSpider:
    """吉林省政府采购网合规采集器"""
    
    def __init__(self):
        self.start_date = datetime.strptime(START_DATE, "%Y-%m-%d")
        self.all_data: List[Dict[str, Any]] = []
        self.link_set = set()
        
    def request_delay(self):
        """请求延迟"""
        time.sleep(random.uniform(REQUEST_DELAY_MIN, REQUEST_DELAY_MAX))
        
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
            
    def parse_initial_state(self, html_content: str) -> List[Dict]:
        """从INITIAL_STATE解析数据"""
        items = []
        
        try:
            # 查找INITIAL_STATE
            start = html_content.find('window.__INITIAL_STATE__=')
            if start < 0:
                return []
                
            start += len('window.__INITIAL_STATE__=')
            json_str = html_content[start:]
            
            # 匹配花括号
            depth = 0
            end = 0
            for i, c in enumerate(json_str[:100000]):
                if c == '{':
                    depth += 1
                elif c == '}':
                    depth -= 1
                    if depth == 0:
                        end = i + 1
                        break
            
            if end == 0:
                return []
                
            json_str = json_str[:end]
            json_str = html_module.unescape(json_str)
            state = json.loads(json_str)
            
            # 递归查找公告数据
            def find_announcements(obj, depth=0):
                if depth > 30:
                    return
                if isinstance(obj, dict):
                    for k, v in obj.items():
                        if k in ['list', 'data', 'items', 'records', 'announcements']:
                            if isinstance(v, list):
                                for item in v:
                                    if isinstance(item, dict):
                                        title = item.get('title') or item.get('name')
                                        url = item.get('url') or item.get('href') or item.get('sourceUrl')
                                        date = item.get('publishDate') or item.get('publish_date') or item.get('date')
                                        
                                        if title and url:
                                            if not url.startswith('http'):
                                                url = BASE_URL + (url if url.startswith('/') else '/' + url)
                                            
                                            if url not in self.link_set:
                                                self.link_set.add(url)
                                                items.append({
                                                    "title": title,
                                                    "sourceUrl": url,
                                                    "publishDate": date or "",
                                                    "province": "吉林省",
                                                    "status": "pending"
                                                })
                        find_announcements(v, depth+1)
                elif isinstance(obj, list):
                    for item in obj:
                        find_announcements(item, depth+1)
            
            find_announcements(state)
            
        except Exception as e:
            print(f"[WARN] 解析INITIAL_STATE失败: {e}", file=sys.stderr)
            
        return items
        
    def run(self, max_items: int = 0):
        """
        运行采集器
        
        Args:
            max_items: 最大采集数量
        """
        print("=" * 70)
        print("    吉林省政府采购网 · 合规采集器")
        print(f"    采集日期范围：{START_DATE} 至今")
        print("=" * 70)
        
        try:
            import requests
        except ImportError:
            print("[ERROR] 请先安装requests: pip install requests", file=sys.stderr)
            return []
        
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9",
        })
        
        try:
            # 获取首页
            print("\n[INFO] 正在访问首页...")
            url = f"{LIST_URL}?{'&'.join(f'{k}={v}' for k, v in LIST_PARAMS.items())}"
            response = session.get(url, timeout=30)
            response.encoding = 'utf-8'
            content = response.text
            print(f"[INFO] 获取到页面，长度: {len(content)}")
            
            # 尝试从INITIAL_STATE提取数据
            items = self.parse_initial_state(content)
            
            if items:
                self.all_data.extend(items)
                print(f"[INFO] 从INITIAL_STATE提取到 {len(items)} 条数据")
            else:
                print("[WARN] HTTP模式无法获取公告列表数据")
                print("[INFO] 吉林省政府采购网使用Vue.js动态渲染，需要浏览器环境")
                print("[INFO] 请在有Playwright/Selenium环境的服务器上运行采集器")
                print("[INFO] 安装命令: pip install playwright && playwright install chromium")
                
        except Exception as e:
            print(f"[ERROR] HTTP采集失败: {e}", file=sys.stderr)
        finally:
            session.close()
            
        # 保存数据
        self.save_data()
        
        print("\n" + "=" * 70)
        print(f"[SUCCESS] 采集完成！总计：{len(self.all_data)} 条公告")
        print(f"[OUTPUT] JSON: {OUTPUT_JSON}")
        print("=" * 70)
        
        return self.all_data


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="吉林省政府采购网合规采集器")
    parser.add_argument("--max-items", type=int, default=0, help="最大采集数量")
    parser.add_argument("--output", type=str, help="输出文件路径")
    
    args = parser.parse_args()
    
    spider = JilinProcurementSpider()
    data = spider.run(max_items=args.max_items)
    
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
    else:
        print("\n[DATA_OUTPUT]")
        print(json.dumps(data, ensure_ascii=False))


if __name__ == "__main__":
    main()
