/**
 * 中国政府采购网解析器
 * 网站：http://www.ccgp.gov.cn
 * 
 * 说明：政府采购网是国家级官方平台，数据权威
 */

import * as cheerio from 'cheerio';
import { BaseParser } from './base';
import type { BidInfo, ParserConfig } from '../types';
import { INDUSTRY_MAPPING, PROVINCE_MAPPING } from '../config';

export class CcgpParser extends BaseParser {
  constructor() {
    const config: ParserConfig = {
      name: '中国政府采购网',
      baseUrl: 'http://www.ccgp.gov.cn',
      listUrl: 'http://www.ccgp.gov.cn/cggg/dfgg/index.htm',
      requestDelay: 5000,
      maxPages: 3,
      enabled: true,
      schedule: '0 */4 * * *',
    };
    super(config);
  }

  protected async parseListPage(page: number): Promise<BidInfo[]> {
    // 构建URL，第一页没有页码后缀
    const url = page === 1 
      ? this.config.listUrl 
      : `http://www.ccgp.gov.cn/cggg/dfgg/index_${page}.htm`;
    
    const $ = await this.fetchPage(url);
    const bids: BidInfo[] = [];

    // 政府采购网常见的列表结构
    $('ul.news_list li, .list li, .cggg-list li').each((_, element) => {
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
        
        // 提取日期
        const dateEl = $item.find('.date, .time, span');
        const dateText = dateEl.text();
        const publishDate = this.parseDate(dateText);
        
        // 提取地区信息（通常在标题前的方括号内）
        const locationMatch = title.match(/\[([^\]]+)\]/);
        let province: string | undefined;
        let city: string | undefined;
        
        if (locationMatch) {
          const locationText = locationMatch[1];
          province = this.inferProvince(locationText);
          city = locationText.includes('-') 
            ? locationText.split('-')[1] 
            : undefined;
        }
        
        // 推断行业
        const industry = this.inferIndustry(title);
        
        // 判断招标类型
        const bidType = this.inferBidType(title);
        
        // 判断是否紧急
        const isUrgent = title.includes('紧急') || title.includes('限时');
        
        bids.push({
          title,
          province,
          city,
          industry,
          bidType,
          publishDate,
          source: this.config.name,
          sourceUrl: link,
          isUrgent,
        });
      } catch (error) {
        console.error('[Parser] Error parsing CCGP item:', error);
      }
    });

    return bids;
  }

  private async fetchPage(url: string): Promise<cheerio.CheerioAPI> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    });
    
    const html = await response.text();
    return cheerio.load(html);
  }

  private inferIndustry(text: string): string | undefined {
    const lowerText = text.toLowerCase();
    for (const [keyword, industry] of Object.entries(INDUSTRY_MAPPING)) {
      if (lowerText.includes(keyword.toLowerCase())) {
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

  private inferBidType(title: string): string | undefined {
    if (title.includes('公开招标')) return '公开招标';
    if (title.includes('竞争性谈判')) return '竞争性谈判';
    if (title.includes('竞争性磋商')) return '竞争性磋商';
    if (title.includes('询价')) return '询价';
    if (title.includes('单一来源')) return '单一来源';
    if (title.includes('邀请招标')) return '邀请招标';
    return undefined;
  }
}
