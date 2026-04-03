#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
吉林省政府采购网合规采集器 (Selenium版本)
- 采集日期：2026年1月1日至今
- 使用Selenium + webdriver_manager
- 支持JSON输出供Node.js调用
"""

import json
import random
import re
import sys
import os
import time
from datetime import datetime
from typing import List, Dict, Any

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
    from webdriver_manager.chrome import ChromeDriverManager
except ImportError:
    print("[ERROR] 请先安装依赖: pip install selenium webdriver-manager", file=sys.stderr)
    sys.exit(1)

# ===================== 核心配置 =====================
BASE_URL = "http://www.ccgp-jilin.gov.cn"
LIST_URL = "http://www.ccgp-jilin.gov.cn/site/category?parentId=550068&childrenCode=ZcyAnnouncement&utm=site.site-PC-39285.959-pc-websitegroup-navBar-front.12.5c33f4b02f3f11f1a56911aea690e44d"

START_DATE = "2026-01-01"
MAX_PAGE = 50

# 延迟配置（秒）
VIEW_DELAY_MIN = 2.0
VIEW_DELAY_MAX = 4.0
PAGE_DELAY_MIN = 1.0
PAGE_DELAY_MAX = 2.0

# 输出文件
OUTPUT_DIR = "/workspace/projects/server/data"
OUTPUT_JSON = os.path.join(OUTPUT_DIR, "jilin_procurement.json")
OUTPUT_CSV = os.path.join(OUTPUT_DIR, "jilin_procurement.csv")
# ======================================================


class JilinProcurementSpiderSelenium:
    """吉林省政府采购网合规采集器 (Selenium版本)"""
    
    def __init__(self):
        self.start_date = datetime.strptime(START_DATE, "%Y-%m-%d")
        self.all_data: List[Dict[str, Any]] = []
        self.link_set = set()
        self.stop_flag = False
        self.driver = None
        
    def init_driver(self):
        """初始化Selenium WebDriver"""
        print("[INFO] 初始化浏览器驱动...")
        
        options = Options()
        options.add_argument('--headless')  # 无头模式
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--lang=zh-CN')
        
        # 设置User-Agent
        options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36')
        
        # 禁用自动化标识
        options.add_experimental_option('excludeSwitches', ['enable-automation'])
        options.add_experimental_option('useAutomationExtension', False)
        
        try:
            # 尝试使用webdriver_manager自动下载chromedriver
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=options)
        except Exception as e:
            print(f"[WARN] webdriver_manager失败: {e}, 尝试使用系统chromedriver", file=sys.stderr)
            try:
                self.driver = webdriver.Chrome(options=options)
            except Exception as e2:
                print(f"[ERROR] 无法初始化浏览器: {e2}", file=sys.stderr)
                raise
        
        # 执行脚本隐藏webdriver特征
        self.driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': '''
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                window.navigator.chrome = {runtime: {}};
                Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
                Object.defineProperty(navigator, 'languages', {get: () => ['zh-CN', 'zh', 'en']});
            '''
        })
        
        # 设置隐式等待
        self.driver.implicitly_wait(10)
        
        print("[INFO] 浏览器初始化完成")
        
    def close_driver(self):
        """关闭浏览器"""
        if self.driver:
            self.driver.quit()
            self.driver = None
            print("[INFO] 浏览器已关闭")
            
    def human_delay(self, min_sec: float = None, max_sec: float = None):
        """模拟人类停留时间"""
        min_sec = min_sec or VIEW_DELAY_MIN
        max_sec = max_sec or VIEW_DELAY_MAX
        time.sleep(random.uniform(min_sec, max_sec))
        
    def scroll_page(self):
        """滚动页面"""
        try:
            total_height = self.driver.execute_script("return document.body.scrollHeight")
            steps = random.randint(3, 5)
            for i in range(steps):
                scroll_y = int(total_height * (i + 1) / steps)
                self.driver.execute_script(f"window.scrollTo(0, {scroll_y});")
                time.sleep(random.uniform(0.2, 0.5))
            time.sleep(random.uniform(0.3, 0.6))
        except Exception:
            pass
            
    def parse_list_page(self) -> tuple:
        """解析列表页"""
        items = []
        has_older = False
        
        try:
            # 等待页面加载
            WebDriverWait(self.driver, 30).until(
                EC.presence_of_element_located((By.TAG_NAME, "li"))
            )
            
            # 获取所有li元素
            lis = self.driver.find_elements(By.TAG_NAME, "li")
            
            for li in lis:
                try:
                    # 查找链接
                    links = li.find_elements(By.TAG_NAME, "a")
                    if not links:
                        continue
                    
                    a = links[0]
                    title = a.text.strip()
                    if not title:
                        continue
                    
                    href = a.get_attribute("href")
                    if not href:
                        continue
                    
                    # 构建完整URL
                    if href.startswith("http"):
                        link = href
                    elif href.startswith("/"):
                        link = BASE_URL + href
                    else:
                        link = BASE_URL + "/" + href
                    
                    # 查找日期
                    spans = li.find_elements(By.TAG_NAME, "span")
                    date_str = ""
                    for span in spans:
                        text = span.text.strip()
                        # 尝试匹配日期格式
                        if re.match(r'\d{4}[-/年]\d{1,2}[-/月]\d{1,2}', text):
                            date_str = text
                            break
                    
                    # 解析日期
                    pub_date = None
                    if date_str:
                        for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%Y年%m月%d日"]:
                            try:
                                pub_date = datetime.strptime(date_str, fmt)
                                break
                            except ValueError:
                                continue
                    
                    # 日期过滤
                    if pub_date:
                        if pub_date < self.start_date:
                            has_older = True
                            continue
                    
                    # 去重
                    if link in self.link_set:
                        continue
                    self.link_set.add(link)
                    
                    items.append({
                        "title": title,
                        "sourceUrl": link,
                        "publishDate": date_str,
                        "province": "吉林省",
                        "status": "pending"
                    })
                    
                except Exception:
                    continue
                    
        except TimeoutException:
            print("[WARN] 页面加载超时")
        except Exception as e:
            print(f"[ERROR] 解析列表页失败: {e}", file=sys.stderr)
            
        return items, has_older
        
    def fetch_detail(self, url: str) -> Dict[str, Any]:
        """采集详情页"""
        detail = {}
        
        try:
            self.driver.get(url)
            self.human_delay(1.0, 2.0)
            
            # 获取页面文本
            try:
                # 尝试多种选择器
                for selector in ["article", ".content", ".article-content", ".detail-content", "body"]:
                    try:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            detail["content"] = elements[0].text.strip()
                            break
                    except:
                        continue
            except:
                pass
            
            content = detail.get("content", "")
            
            # 提取预算金额
            budget_patterns = [
                r"预算金额[：:]\s*([\d,\.]+)\s*万?元",
                r"采购预算[：:]\s*([\d,\.]+)\s*万?元",
                r"金额[：:]\s*([\d,\.]+)\s*万?元",
            ]
            for pattern in budget_patterns:
                match = re.search(pattern, content)
                if match:
                    detail["budget"] = match.group(1)
                    break
            
            # 提取联系人
            contact_patterns = [
                r"联系人[：:]\s*([^\s\n]+)",
                r"联系人员[：:]\s*([^\s\n]+)",
            ]
            for pattern in contact_patterns:
                match = re.search(pattern, content)
                if match:
                    detail["contactPerson"] = match.group(1).strip()
                    break
            
            # 提取联系电话
            phone_patterns = [
                r"联系电话[：:]\s*([\d\-\s]+)",
                r"电话[：:]\s*([\d\-\s]+)",
            ]
            for pattern in phone_patterns:
                match = re.search(pattern, content)
                if match:
                    phone = re.sub(r"[^\d\-]", "", match.group(1))
                    if len(phone) >= 7:
                        detail["contactPhone"] = phone
                        break
                        
        except Exception as e:
            print(f"[ERROR] 采集详情页失败: {url}, {e}", file=sys.stderr)
            
        return detail
        
    def run(self, fetch_details: bool = False, max_items: int = 0):
        """运行采集器"""
        print("=" * 70)
        print("    吉林省政府采购网 · 合规采集器 (Selenium版)")
        print(f"    采集日期范围：{START_DATE} 至今")
        print(f"    采集详情：{'是' if fetch_details else '否'}")
        print("=" * 70)
        
        try:
            self.init_driver()
            
            # 访问首页
            print("\n[INFO] 正在访问首页...")
            self.driver.get(LIST_URL)
            self.human_delay()
            self.scroll_page()
            
            # 解析第一页
            print("[INFO] 解析第 1 页...")
            items, has_older = self.parse_list_page()
            
            if items:
                self.all_data.extend(items)
                print(f"[INFO] 第 1 页有效公告：{len(items)} 条")
            
            if has_older:
                print("[INFO] 已到目标日期，停止翻页")
                self.stop_flag = True
            
            # 翻页采集
            page_num = 2
            while not self.stop_flag and page_num <= MAX_PAGE:
                if max_items > 0 and len(self.all_data) >= max_items:
                    print(f"[INFO] 已达最大采集数量 {max_items}，停止")
                    break
                
                print(f"[INFO] 正在翻页到第 {page_num} 页...")
                
                try:
                    # 尝试点击下一页
                    try:
                        next_btn = self.driver.find_element(By.CSS_SELECTOR, "a.next, .next-page, [class*='next']")
                        next_btn.click()
                        self.human_delay(PAGE_DELAY_MIN, PAGE_DELAY_MAX)
                        self.scroll_page()
                    except NoSuchElementException:
                        # 尝试通过URL翻页
                        page_url = f"{LIST_URL}&page={page_num}"
                        self.driver.get(page_url)
                        self.human_delay(PAGE_DELAY_MIN, PAGE_DELAY_MAX)
                    
                    items, has_older = self.parse_list_page()
                    
                    if items:
                        self.all_data.extend(items)
                        print(f"[INFO] 第 {page_num} 页有效公告：{len(items)} 条")
                    
                    if has_older or len(items) == 0:
                        print("[INFO] 无更多数据，停止翻页")
                        self.stop_flag = True
                        
                except TimeoutException:
                    print(f"[WARN] 第 {page_num} 页超时，跳过")
                except Exception as e:
                    print(f"[ERROR] 第 {page_num} 页异常: {e}", file=sys.stderr)
                    self.stop_flag = True
                
                page_num += 1
            
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
                    
                    self.human_delay(0.5, 1.0)
                    
        except Exception as e:
            print(f"[ERROR] 采集过程异常: {e}", file=sys.stderr)
        finally:
            self.close_driver()
        
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
    
    parser = argparse.ArgumentParser(description="吉林省政府采购网合规采集器 (Selenium版)")
    parser.add_argument("--details", action="store_true", help="采集详情页")
    parser.add_argument("--max-items", type=int, default=0, help="最大采集数量")
    parser.add_argument("--output", type=str, help="输出文件路径(JSON)")
    
    args = parser.parse_args()
    
    spider = JilinProcurementSpiderSelenium()
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
