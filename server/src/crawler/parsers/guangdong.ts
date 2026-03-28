/**
 * 广东省政府采购网解析器
 * 网站：http://gdgpo.czt.gd.gov.cn
 */

import * as cheerio from 'cheerio';
import { BaseParser } from './base';
import type { BidInfo, ParserConfig } from '../types';
import { INDUSTRY_MAPPING } from '../config';

export class GuangdongGpoParser extends BaseParser {
  constructor() {
    const config: ParserConfig = {
      name: '广东省政府采购网',
      baseUrl: 'http://gdgpo.czt.gd.gov.cn',
      listUrl: 'http://gdgpo.czt.gd.gov.cn/queryMoreInfoList.do',
      requestDelay: 4000,
      maxPages: 3,
      enabled: true,
      schedule: '5 */4 * * *',
    };
    super(config);
  }

  protected async parseListPage(page: number): Promise<BidInfo[]> {
    // 广东省采购网通常使用POST请求或带参数的GET
    const url = `${this.config.listUrl}?pageNo=${page}&pageSize=20`;
    
    try {
      const $ = await this.fetchPage(url);
      const bids: BidInfo[] = [];

      // 解析列表结构
      $('tr, .list-item, .bid-row').each((_, element) => {
        try {
          const $item = $(element);
          
          // 提取标题
          const titleEl = $item.find('a, .title').first();
          const title = this.cleanText(titleEl.text());
          
          if (!title || title.length < 5) return;
          
          // 提取链接
          let link = titleEl.attr('href') || '';
          if (link && !link.startsWith('http')) {
            link = link.startsWith('/') 
              ? `${this.config.baseUrl}${link}`
              : `${this.config.baseUrl}/${link}`;
          }
          
          // 提取所有文本用于分析
          const text = $item.text();
          
          // 提取日期
          const dateMatch = text.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
          const publishDate = dateMatch ? this.parseDate(dateMatch[1]) : undefined;
          
          // 提取金额
          const budgetMatch = text.match(/(\d+(?:\.\d+)?\s*[万亿]?元)/);
          const budget = budgetMatch ? this.parseBudget(budgetMatch[1]) : undefined;
          
          // 推断行业
          const industry = this.inferIndustry(title);
          
          // 推断招标类型
          const bidType = this.inferBidType(title);
          
          // 判断是否紧急
          const isUrgent = title.includes('紧急') || text.includes('紧急');
          
          bids.push({
            title,
            budget,
            province: '广东省',
            industry,
            bidType,
            publishDate,
            source: this.config.name,
            sourceUrl: link,
            isUrgent,
          });
        } catch (error) {
          console.error('[Parser] Error parsing Guangdong GPO item:', error);
        }
      });

      return bids;
    } catch (error) {
      console.error('[Parser] Error fetching Guangdong GPO page:', error);
      return [];
    }
  }

  private async fetchPage(url: string): Promise<cheerio.CheerioAPI> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
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

  private inferBidType(title: string): string | undefined {
    if (title.includes('公开招标')) return '公开招标';
    if (title.includes('竞争性谈判')) return '竞争性谈判';
    if (title.includes('竞争性磋商')) return '竞争性磋商';
    if (title.includes('询价')) return '询价';
    if (title.includes('单一来源')) return '单一来源';
    return undefined;
  }
}
