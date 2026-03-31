/**
 * 全国公共资源交易平台爬虫（网页版）
 * 
 * 官网: https://www.ggzy.gov.cn
 * 
 * 数据来源: 直接爬取网页HTML
 */

import { BaseCrawler } from './base.js';
import type { CrawlerConfig, BidData, CrawlerResult } from './types.js';
import { AnnouncementType } from './types.js';
import { PROVINCES } from './config.js';

// Cheerio 用于解析HTML
import * as cheerio from 'cheerio';

export class GgzyCrawler extends BaseCrawler {
  private listUrl: string;
  private detailUrl: string;

  constructor() {
    const config: CrawlerConfig = {
      name: '全国公共资源交易平台',
      baseUrl: 'https://www.ggzy.gov.cn',
      enabled: true,
      requestInterval: 2000,  // 政府网站需要更长间隔
      timeout: 30000,
      maxRetries: 3,
      maxPages: 50,
    };
    
    super(config);
    this.listUrl = 'https://www.ggzy.gov.cn/internet/tp/071001/071001001/071001001001.html';
    this.detailUrl = 'https://www.ggzy.gov.cn/internet/tp/071001/071001001/';
  }

  /**
   * 爬取列表页
   */
  async crawlList(
    page: number,
    announcementType?: string
  ): Promise<CrawlerResult> {
    try {
      // 构建URL（分页）
      const url = `${this.listUrl}?PageIndex=${page}`;
      
      const html = await this.requestWithRetry<string>({
        method: 'GET',
        url,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
      });

      // 解析HTML
      const { data, hasMore } = this.parseListPage(html);

      return {
        success: true,
        data,
        total: data.length,
        page,
        hasMore,
      };

    } catch (error: any) {
      return {
        success: false,
        data: [],
        total: 0,
        page,
        hasMore: false,
        error: error.message,
      };
    }
  }

  /**
   * 解析列表页HTML
   */
  private parseListPage(html: string): { data: BidData[]; hasMore: boolean } {
    const data: BidData[] = [];
    const $ = cheerio.load(html);

    try {
      // 查找列表项（根据实际网页结构调整选择器）
      const items = $('ul.list li, table tr, .list-item, .item');
      
      items.each((index, element) => {
        try {
          const $item = $(element);
          
          // 提取标题和链接
          const $link = $item.find('a').first();
          const title = $link.text().trim();
          const href = $link.attr('href') || '';
          
          if (!title || title.length < 5) return;
          
          // 提取发布日期
          const dateText = $item.find('.date, .time, span').last().text().trim();
          const publishDate = this.parseDate(dateText) || undefined;
          
          // 提取地区
          const regionText = $item.find('.region, .area').text().trim();
          
          // 提取公告类型
          const typeText = $item.find('.type, .category').text().trim();
          const announcementType = this.parseAnnouncementType(typeText);
          
          // 构建完整URL
          const sourceUrl = href.startsWith('http') 
            ? href 
            : `${this.config.baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
          
          // 提取ID
          const sourceId = this.extractId(href) || `${Date.now()}_${index}`;

          data.push({
            title,
            source_url: sourceUrl,
            source_platform: 'ggzy',
            source_id: sourceId,
            data_type: 'crawler',
            announcement_type: announcementType,
            publish_date: publishDate,
            province: regionText || undefined,
          });

        } catch (e) {
          // 忽略单个解析错误
        }
      });

      // 判断是否有下一页
      const hasMore = $('a.next, .next-page, [title="下一页"]').length > 0;

      return { data, hasMore };

    } catch (error) {
      console.error('解析列表页失败:', error);
      return { data, hasMore: false };
    }
  }

  /**
   * 爬取详情页
   */
  async crawlDetail(url: string): Promise<BidData | null> {
    try {
      const html = await this.requestWithRetry<string>({
        method: 'GET',
        url,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      return this.parseDetailPage(html, url);

    } catch (error) {
      console.error(`详情页爬取失败: ${url}`);
      return null;
    }
  }

  /**
   * 解析详情页
   */
  private parseDetailPage(html: string, url: string): BidData | null {
    const $ = cheerio.load(html);

    try {
      // 提取标题
      const title = $('h1, .title, .headline').first().text().trim();
      
      // 提取内容
      const content = $('.content, .detail, .article, .main-content').text().trim();
      
      // 提取项目信息
      const projectCode = this.extractField(html, '项目编号', '项目代码');
      const budget = this.extractBudget(html);
      const purchaserName = this.extractField(html, '采购人', '招标人', '业主');
      const agencyName = this.extractField(html, '代理机构', '招标代理');
      
      // 提取联系方式
      const contactPhone = this.extractPhone(html);
      const contactPerson = this.extractField(html, '联系人', '联系人员');
      
      // 提取发布日期
      const publishDate = this.parseDate(
        $('meta[name="publish-date"]').attr('content') ||
        $('span:contains("发布时间")').text()
      ) || undefined;

      // 确定公告类型
      const announcementType = this.detectAnnouncementType(html);

      return {
        title,
        content,
        project_code: projectCode,
        budget,
        purchaser_name: purchaserName,
        agency_name: agencyName,
        contact_person: contactPerson,
        contact_phone: contactPhone,
        announcement_type: announcementType,
        publish_date: publishDate,
        source_url: url,
        source_platform: 'ggzy',
        source_id: this.extractId(url),
        data_type: 'crawler',
      };

    } catch (error) {
      return null;
    }
  }

  /**
   * 从HTML中提取字段
   */
  private extractField(html: string, ...keywords: string[]): string | undefined {
    for (const keyword of keywords) {
      const patterns = [
        new RegExp(`${keyword}[：:]\s*([^\n<]+)`, 'i'),
        new RegExp(`${keyword}[\\s]*[：:][\\s]*([^\\n<]+)`, 'i'),
        new RegExp(`>${keyword}[：:]\s*([^<]+)<`, 'i'),
      ];
      
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          return match[1].trim();
        }
      }
    }
    return undefined;
  }

  /**
   * 提取预算金额
   */
  private extractBudget(html: string): number | undefined {
    const patterns = [
      /预算[金额]*[：:]\s*([0-9,.万亿]+)/i,
      /预算[金额]*[：:]\s*(\d[\d,.]*)/i,
      /控制价[：:]\s*([0-9,.万亿]+)/i,
      /投标限价[：:]\s*([0-9,.万亿]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return this.parseBudget(match[1]) || undefined;
      }
    }
    return undefined;
  }

  /**
   * 检测公告类型
   */
  private detectAnnouncementType(html: string): AnnouncementType {
    const lowerHtml = html.toLowerCase();
    
    if (lowerHtml.includes('中标') || lowerHtml.includes('成交')) {
      return AnnouncementType.WIN_RESULT;
    }
    if (lowerHtml.includes('废标')) {
      return AnnouncementType.ABANDONED_BID;
    }
    if (lowerHtml.includes('终止')) {
      return AnnouncementType.TERMINATION;
    }
    if (lowerHtml.includes('更正') || lowerHtml.includes('变更')) {
      return AnnouncementType.CORRECTION;
    }
    if (lowerHtml.includes('资格预审')) {
      return AnnouncementType.PRE_QUALIFICATION;
    }
    if (lowerHtml.includes('竞争性谈判')) {
      return AnnouncementType.COMPETITIVE_NEGOTIATION;
    }
    if (lowerHtml.includes('竞争性磋商')) {
      return AnnouncementType.COMPETITIVE_CONSULTATION;
    }
    if (lowerHtml.includes('询价')) {
      return AnnouncementType.INQUIRY;
    }
    if (lowerHtml.includes('采购意向')) {
      return AnnouncementType.PROCUREMENT_INTENTION;
    }
    
    return AnnouncementType.BID_ANNOUNCEMENT;
  }

  /**
   * 解析公告类型
   */
  private parseAnnouncementType(text: string): AnnouncementType {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('中标') || lowerText.includes('成交')) {
      return AnnouncementType.WIN_RESULT;
    }
    if (lowerText.includes('废标')) {
      return AnnouncementType.ABANDONED_BID;
    }
    if (lowerText.includes('终止')) {
      return AnnouncementType.TERMINATION;
    }
    if (lowerText.includes('更正') || lowerText.includes('变更')) {
      return AnnouncementType.CORRECTION;
    }
    
    return AnnouncementType.BID_ANNOUNCEMENT;
  }

  /**
   * 从URL中提取ID
   */
  private extractId(url: string): string {
    const match = url.match(/(\d{10,})/);
    return match ? match[1] : url.split('/').pop()?.split('.')[0] || '';
  }

  /**
   * 按省份爬取（访问省级平台）
   */
  async crawlByProvince(provinceCode: string, pages?: number): Promise<CrawlerResult[]> {
    const province = PROVINCES.find(p => p.code === provinceCode);
    if (!province || !province.enabled) {
      console.log(`省份 ${provinceCode} 未启用或不存在`);
      return [];
    }

    console.log(`\n爬取 ${province.name}...`);
    
    // 省级平台爬取逻辑（简化版，实际需要根据各省平台结构调整）
    const results: CrawlerResult[] = [];
    const maxPages = pages || this.config.maxPages;

    for (let page = 1; page <= maxPages; page++) {
      try {
        // 使用省级平台URL
        const provinceUrl = `${province.baseUrl}/jyxx/jsgc/zbgg`;
        const html = await this.requestWithRetry<string>({
          method: 'GET',
          url: `${provinceUrl}?PageIndex=${page}`,
        });

        const { data, hasMore } = this.parseListPage(html);
        
        // 设置省份信息
        data.forEach(item => {
          item.province = province.name;
          item.region_code = province.code;
        });

        results.push({
          success: true,
          data,
          total: data.length,
          page,
          hasMore,
        });

        if (!hasMore) break;
        await this.delay(this.config.requestInterval);

      } catch (error: any) {
        console.error(`${province.name} 第${page}页爬取失败:`, error.message);
        break;
      }
    }

    return results;
  }

  /**
   * 按公告类型爬取
   */
  async crawlByType(
    announcementType: string,
    pages?: number
  ): Promise<CrawlerResult[]> {
    // 根据类型构建不同的URL
    const typeUrls: Record<string, string> = {
      '招标公告': '071001001',
      '中标结果公告': '071001002',
      '更正公告': '071001003',
      '终止公告': '071001004',
      '废标公告': '071001005',
    };

    const typeCode = typeUrls[announcementType] || '071001001';
    const results: CrawlerResult[] = [];
    const maxPages = pages || this.config.maxPages;

    for (let page = 1; page <= maxPages; page++) {
      try {
        const url = `https://www.ggzy.gov.cn/internet/tp/071001/${typeCode}/${typeCode}.html?PageIndex=${page}`;
        const html = await this.requestWithRetry<string>({
          method: 'GET',
          url,
        });

        const { data, hasMore } = this.parseListPage(html);
        
        data.forEach(item => {
          item.announcement_type = announcementType as AnnouncementType;
        });

        results.push({
          success: true,
          data,
          total: data.length,
          page,
          hasMore,
        });

        if (!hasMore) break;
        await this.delay(this.config.requestInterval);

      } catch (error: any) {
        console.error(`${announcementType} 第${page}页爬取失败:`, error.message);
        break;
      }
    }

    return results;
  }
}
