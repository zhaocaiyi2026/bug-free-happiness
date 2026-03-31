/**
 * 爬虫基类
 */

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { CrawlerConfig, BidData, CrawlerResult, CrawlerStats } from './types.js';

export abstract class BaseCrawler {
  protected config: CrawlerConfig;
  protected client: AxiosInstance;
  protected stats: CrawlerStats;
  protected requestCount: number = 0;

  constructor(config: CrawlerConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    });
    
    this.stats = {
      platform: config.name,
      startTime: new Date(),
      totalPages: 0,
      totalItems: 0,
      savedItems: 0,
      duplicateItems: 0,
      errorItems: 0,
      errors: [],
    };
  }

  /**
   * 延迟函数
   */
  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 带重试的请求
   */
  protected async requestWithRetry<T>(
    config: AxiosRequestConfig,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        this.requestCount++;
        const response = await this.client.request<T>(config);
        return response.data;
      } catch (error: any) {
        lastError = error;
        
        // 如果是429限流，等待更长时间
        if (error.response?.status === 429) {
          await this.delay(5000);
        } else {
          await this.delay(this.config.requestInterval);
        }
        
        console.log(`[重试 ${i + 1}/${retries}] ${config.url} - ${error.message}`);
      }
    }
    
    throw lastError;
  }

  /**
   * 解析金额字符串
   */
  protected parseBudget(value: string | undefined | null): number | null {
    if (!value) return null;
    
    // 移除空格和特殊字符
    const cleaned = value.replace(/[\s,，]/g, '');
    
    // 匹配数字
    const match = cleaned.match(/[\d.]+/);
    if (!match) return null;
    
    const num = parseFloat(match[0]);
    if (isNaN(num)) return null;
    
    // 处理单位
    if (cleaned.includes('万') || cleaned.includes('W')) {
      return num * 10000;
    }
    if (cleaned.includes('亿')) {
      return num * 100000000;
    }
    
    return num;
  }

  /**
   * 解析日期字符串
   */
  protected parseDate(value: string | undefined | null): Date | null {
    if (!value) return null;
    
    // 常见日期格式
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/,                          // 2025-01-01
      /^(\d{4})\/(\d{2})\/(\d{2})$/,                        // 2025/01/01
      /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,                  // 2025年1月1日
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/, // 2025-01-01 12:00:00
    ];
    
    for (const format of formats) {
      const match = value.match(format);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const day = parseInt(match[3]);
        return new Date(year, month, day);
      }
    }
    
    // 尝试直接解析
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * 清理HTML标签
   */
  protected cleanHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 提取联系电话
   */
  protected extractPhone(text: string): string | null {
    const patterns = [
      /(?:电话|联系方式|联系电话|Tel|Phone)[：:]\s*([0-9\-]{7,20})/i,
      /(1[3-9]\d{9})/,                           // 手机号
      /(0\d{2,3}[-\s]?\d{7,8})/,                 // 座机
      /(\d{3,4}[-\s]?\d{7,8})/,                  // 座机(简化)
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].replace(/\s/g, '-');
      }
    }
    
    return null;
  }

  /**
   * 获取统计信息
   */
  getStats(): CrawlerStats {
    this.stats.endTime = new Date();
    return this.stats;
  }

  /**
   * 抽象方法：爬取列表页
   */
  abstract crawlList(page: number, announcementType?: string): Promise<CrawlerResult>;

  /**
   * 抽象方法：爬取详情页
   */
  abstract crawlDetail(url: string): Promise<BidData | null>;

  /**
   * 运行爬虫
   */
  async run(options?: {
    pages?: number;
    announcementType?: string;
  }): Promise<CrawlerStats> {
    const maxPages = options?.pages || this.config.maxPages;
    const announcementType = options?.announcementType;
    
    console.log(`\n====================================`);
    console.log(`开始爬取: ${this.config.name}`);
    console.log(`====================================\n`);
    
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= maxPages) {
      try {
        console.log(`正在爬取第 ${page} 页...`);
        
        const result = await this.crawlList(page, announcementType);
        
        if (!result.success) {
          console.error(`第 ${page} 页爬取失败: ${result.error}`);
          this.stats.errors.push(`第 ${page} 页: ${result.error}`);
          break;
        }
        
        this.stats.totalPages++;
        this.stats.totalItems += result.data.length;
        
        console.log(`第 ${page} 页完成，获取 ${result.data.length} 条数据`);
        
        hasMore = result.hasMore;
        page++;
        
        // 请求间隔
        await this.delay(this.config.requestInterval);
        
      } catch (error: any) {
        console.error(`第 ${page} 页异常:`, error.message);
        this.stats.errors.push(`第 ${page} 页异常: ${error.message}`);
        break;
      }
    }
    
    return this.getStats();
  }
}
