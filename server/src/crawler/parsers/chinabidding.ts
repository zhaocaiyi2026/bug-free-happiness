/**
 * 中国招标网解析器
 * 网站：https://www.chinabidding.cn
 */

import * as cheerio from 'cheerio';
import { BaseParser } from './base';
import type { BidInfo, ParserConfig } from '../types';
import { INDUSTRY_MAPPING, PROVINCE_MAPPING } from '../config';

export class ChinaBiddingParser extends BaseParser {
  constructor() {
    const config: ParserConfig = {
      name: '中国招标网',
      baseUrl: 'https://www.chinabidding.cn',
      listUrl: 'https://www.chinabidding.cn/search/searchgj/zbcg',
      requestDelay: 5000,
      maxPages: 2,
      enabled: true,
      schedule: '35 */4 * * *',
    };
    super(config);
  }

  protected async parseListPage(page: number): Promise<BidInfo[]> {
    const url = `${this.config.listUrl}?page=${page}`;
    const $ = await this.fetchPage(url);
    const bids: BidInfo[] = [];

    // 解析列表项（根据实际网站结构调整选择器）
    $('.list-item, .bid-item, .zbgg-item, table tr').each((_, element) => {
      try {
        const $item = $(element);
        
        // 提取标题
        const titleEl = $item.find('a').first();
        const title = this.cleanText(titleEl.text());
        
        if (!title || title.length < 5) return;
        
        // 提取链接
        let link = titleEl.attr('href') || '';
        if (link && !link.startsWith('http')) {
          link = link.startsWith('/') 
            ? `${this.config.baseUrl}${link}`
            : `${this.config.baseUrl}/${link}`;
        }
        
        // 提取其他信息
        const text = $item.text();
        
        // 提取日期
        const dateMatch = text.match(/(\d{4}[年/-]\d{1,2}[月/-]\d{1,2})/);
        const publishDate = dateMatch ? this.parseDate(dateMatch[1]) : undefined;
        
        // 提取金额
        const budgetMatch = text.match(/(\d+(?:\.\d+)?\s*[万亿]?元)/);
        const budget = budgetMatch ? this.parseBudget(budgetMatch[1]) : undefined;
        
        // 提取地区
        const location = this.extractLocation(text);
        
        // 推断行业
        const industry = this.inferIndustry(title + ' ' + text);
        
        // 推断省份
        const province = this.inferProvince(title + ' ' + text);
        
        // 判断是否紧急
        const isUrgent = title.includes('紧急') || text.includes('紧急');
        
        bids.push({
          title,
          budget,
          province: location.province || province,
          city: location.city,
          industry,
          publishDate,
          source: this.config.name,
          sourceUrl: link,
          isUrgent,
        });
      } catch (error) {
        console.error('[Parser] Error parsing item:', error);
      }
    });

    return bids;
  }

  private async fetchPage(url: string): Promise<cheerio.CheerioAPI> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    
    const html = await response.text();
    return cheerio.load(html);
  }

  private inferIndustry(text: string): string | undefined {
    for (const [keyword, industry] of Object.entries(INDUSTRY_MAPPING)) {
      if (text.includes(keyword)) {
        return industry;
      }
    }
    return undefined;
  }

  private inferProvince(text: string): string | undefined {
    for (const [keyword, province] of Object.entries(PROVINCE_MAPPING)) {
      if (text.includes(keyword)) {
        return province;
      }
    }
    return undefined;
  }
}
