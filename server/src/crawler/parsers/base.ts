/**
 * 招标信息爬虫系统 - 基础解析器
 * 
 * 所有网站解析器的基类，定义通用接口和方法
 */

import type { BidInfo, ParserConfig, CrawlResult } from '../types';
import { fetchPage, fetchJson, delay } from '../fetcher';

export abstract class BaseParser {
  protected config: ParserConfig;

  constructor(config: ParserConfig) {
    this.config = config;
  }

  /**
   * 获取解析器名称
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * 获取请求延迟
   */
  get delay(): number {
    return this.config.requestDelay;
  }

  /**
   * 爬取入口方法
   */
  async crawl(): Promise<CrawlResult> {
    const startTime = Date.now();
    const bids: BidInfo[] = [];
    let error: string | undefined;

    try {
      console.log(`[Crawler] Starting crawl for ${this.config.name}`);
      
      for (let page = 1; page <= this.config.maxPages; page++) {
        try {
          const pageBids = await this.parseListPage(page);
          bids.push(...pageBids);
          
          console.log(`[Crawler] Page ${page}: found ${pageBids.length} items from ${this.config.name}`);
          
          // 页面间延迟
          if (page < this.config.maxPages) {
            await delay(this.config.requestDelay);
          }
        } catch (pageError) {
          console.error(`[Crawler] Error parsing page ${page} of ${this.config.name}:`, pageError);
          break;
        }
      }

      return {
        success: true,
        source: this.config.name,
        count: bids.length,
        data: bids,
        duration: Date.now() - startTime,
      };
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Crawler] Error crawling ${this.config.name}:`, error);
      
      return {
        success: false,
        source: this.config.name,
        count: 0,
        data: [],
        error,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 解析列表页 - 子类实现
   */
  protected abstract parseListPage(page: number): Promise<BidInfo[]>;

  /**
   * 解析详情页 - 子类可选实现
   */
  protected async parseDetailPage?(url: string): Promise<Partial<BidInfo>>;

  /**
   * 解析金额字符串
   */
  protected parseBudget(budgetStr: string): number | undefined {
    if (!budgetStr) return undefined;
    
    // 移除空格和特殊字符
    const cleaned = budgetStr.replace(/[\s,，]/g, '');
    
    // 匹配金额
    const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(万|亿|万元|亿元)?/);
    if (!match) return undefined;
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    if (unit && (unit.includes('亿'))) {
      return value * 100000000;
    } else if (unit && (unit.includes('万'))) {
      return value * 10000;
    }
    
    return value;
  }

  /**
   * 解析日期字符串
   */
  protected parseDate(dateStr: string): string | undefined {
    if (!dateStr) return undefined;
    
    // 尝试多种日期格式
    const patterns = [
      /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?/,
      /(\d{4})(\d{2})(\d{2})/,
      /(\d{1,2})[月/-](\d{1,2})[日号]?/,
    ];
    
    for (const pattern of patterns) {
      const match = dateStr.match(pattern);
      if (match) {
        if (match.length === 4) {
          // YYYY-MM-DD 格式
          const year = match[1];
          const month = match[2].padStart(2, '0');
          const day = match[3].padStart(2, '0');
          return `${year}-${month}-${day}`;
        } else if (match.length === 3) {
          // MM-DD 格式，使用当前年份
          const now = new Date();
          const year = now.getFullYear();
          const month = match[1].padStart(2, '0');
          const day = match[2].padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    return undefined;
  }

  /**
   * 清理文本
   */
  protected cleanText(text: string): string {
    return text
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 提取地区信息
   */
  protected extractLocation(text: string): { province?: string; city?: string } {
    const result: { province?: string; city?: string } = {};
    
    // 简单的地区提取逻辑
    // 实际应用中可以使用更复杂的地名库
    const provincePattern = /([\u4e00-\u9fa5]{2,}(?:省|市|自治区|特别行政区))/;
    const cityPattern = /([\u4e00-\u9fa5]{2,}(?:市|地区|州|盟))/;
    
    const provinceMatch = text.match(provincePattern);
    if (provinceMatch) {
      result.province = provinceMatch[1];
    }
    
    const cityMatch = text.match(cityPattern);
    if (cityMatch) {
      result.city = cityMatch[1];
    }
    
    return result;
  }
}
