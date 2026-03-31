/**
 * 中国政府采购网爬虫（网页版）
 * 
 * 官网: http://www.ccgp.gov.cn
 * 
 * 数据来源: 直接爬取网页HTML
 */

import { BaseCrawler } from './base.js';
import type { CrawlerConfig, BidData, CrawlerResult } from './types.js';
import { AnnouncementType } from './types.js';
import * as cheerio from 'cheerio';

export class CcgpCrawler extends BaseCrawler {
  // 搜索页面URL
  private searchUrl: string = 'https://search.ccgp.gov.cn';

  constructor() {
    const config: CrawlerConfig = {
      name: '中国政府采购网',
      baseUrl: 'http://www.ccgp.gov.cn',
      enabled: true,
      requestInterval: 2000,
      timeout: 30000,
      maxRetries: 3,
      maxPages: 30,
    };
    
    super(config);
  }

  /**
   * 爬取列表页
   */
  async crawlList(
    page: number,
    announcementType?: string
  ): Promise<CrawlerResult> {
    try {
      // 构建搜索URL
      const params = new URLSearchParams({
        page_index: String(page),
        page_size: '20',
        bidSort: '0',
        buyerName: '',
        projectId: '',
        pinMu: '0',
        bidType: '',
        start_time: '',
        end_time: '',
        search_type: '1',
        searchfield: '',
        keyword: '',
      });

      const html = await this.requestWithRetry<string>({
        method: 'GET',
        url: `${this.searchUrl}/bxsearch?${params.toString()}`,
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
      // 查找列表项（政府采购网结构）
      const items = $('ul.vT-srch-result-list > li, .result-list li, .list-item');
      
      items.each((index, element) => {
        try {
          const $item = $(element);
          
          // 提取标题和链接
          const $link = $item.find('a').first();
          const title = $link.attr('title') || $link.text().trim();
          const href = $link.attr('href') || '';
          
          if (!title || title.length < 5) return;
          
          // 提取发布日期
          const dateText = $item.find('.vT-srch-result-date, .date, span').last().text().trim();
          const publishDate = this.parseDate(dateText) || undefined;
          
          // 提取地区
          const regionText = $item.find('.vT-srch-result-region, .region').text().trim();
          
          // 提取公告类型
          const typeText = $item.find('.vT-srch-result-type, .type').text().trim();
          const announcementType = this.parseAnnouncementType(typeText);
          
          // 构建完整URL
          let sourceUrl = href;
          if (href && !href.startsWith('http')) {
            sourceUrl = href.startsWith('//') 
              ? `http:${href}` 
              : `${this.config.baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
          }
          
          // 提取ID
          const sourceId = this.extractId(href) || `ccgp_${Date.now()}_${index}`;

          data.push({
            title,
            source_url: sourceUrl,
            source_platform: 'ccgp',
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
      const hasMore = $('a.next, .next-page, .paging-next').length > 0 || 
                      html.includes('下一页');

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
      const title = $('h1, .title, .headline, .article-title').first().text().trim();
      
      // 提取内容
      const content = $('.vF-deail-content, .content, .detail, .article').text().trim();
      
      // 提取项目信息
      const text = html;
      
      // 项目编号
      const projectCode = this.extractField(text, '项目编号', '采购编号');
      
      // 预算金额
      const budgetMatch = text.match(/预算金额[：:]\s*([0-9,.万]+)/i);
      const budget = budgetMatch ? this.parseBudget(budgetMatch[1]) : undefined;
      
      // 采购人信息
      const purchaserName = this.extractField(text, '采购人名称', '采购人');
      const purchaserAddress = this.extractField(text, '采购人地址');
      const purchaserPhone = this.extractField(text, '采购人电话');
      
      // 代理机构信息
      const agencyName = this.extractField(text, '代理机构名称', '代理机构');
      const agencyAddress = this.extractField(text, '代理机构地址');
      const agencyPhone = this.extractField(text, '代理机构电话');
      
      // 中标信息
      const winningBidder = this.extractField(text, '中标供应商', '中标人', '成交供应商');
      const winningAmountMatch = text.match(/中标金额[：:]\s*([0-9,.万]+)/i);
      const winningAmount = winningAmountMatch ? this.parseBudget(winningAmountMatch[1]) : undefined;
      
      // 联系方式
      const contactPhone = this.extractPhone(text);
      const contactPerson = this.extractField(text, '联系人');
      
      // 发布日期
      const publishDateText = $('.vF-deail-time, .publish-date, .time').text().trim();
      const publishDate = this.parseDate(publishDateText) || undefined;
      
      // 采购方式
      const procurementMethod = this.extractField(text, '采购方式');
      
      // 公告类型
      const announcementType = this.detectAnnouncementType(html);

      return {
        title,
        content,
        project_code: projectCode,
        budget,
        procurement_method: procurementMethod,
        purchaser_name: purchaserName,
        purchaser_address: purchaserAddress,
        purchaser_phone: purchaserPhone,
        agency_name: agencyName,
        agency_address: agencyAddress,
        agency_phone: agencyPhone,
        winning_bidder: winningBidder,
        winning_amount: winningAmount,
        contact_person: contactPerson,
        contact_phone: contactPhone || purchaserPhone,
        announcement_type: announcementType,
        publish_date: publishDate,
        source_url: url,
        source_platform: 'ccgp',
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
  private extractField(text: string, ...keywords: string[]): string | undefined {
    for (const keyword of keywords) {
      const patterns = [
        new RegExp(`${keyword}[：:]*\\s*([^\\n<>]+)`, 'i'),
        new RegExp(`${keyword}[\\s]*[：:][\\s]*([^\\n<>]+)`, 'i'),
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const value = match[1].trim();
          // 过滤掉明显不相关的内容
          if (value.length > 0 && value.length < 200) {
            return value;
          }
        }
      }
    }
    return undefined;
  }

  /**
   * 检测公告类型
   */
  private detectAnnouncementType(html: string): AnnouncementType {
    const lowerHtml = html.toLowerCase();
    
    if (lowerHtml.includes('中标公告') || lowerHtml.includes('成交公告')) {
      return AnnouncementType.WIN_RESULT;
    }
    if (lowerHtml.includes('废标公告')) {
      return AnnouncementType.ABANDONED_BID;
    }
    if (lowerHtml.includes('终止公告')) {
      return AnnouncementType.TERMINATION;
    }
    if (lowerHtml.includes('更正公告') || lowerHtml.includes('变更公告')) {
      return AnnouncementType.CORRECTION;
    }
    if (lowerHtml.includes('竞争性谈判')) {
      return AnnouncementType.COMPETITIVE_NEGOTIATION;
    }
    if (lowerHtml.includes('竞争性磋商')) {
      return AnnouncementType.COMPETITIVE_CONSULTATION;
    }
    if (lowerHtml.includes('询价公告')) {
      return AnnouncementType.INQUIRY;
    }
    if (lowerHtml.includes('采购意向')) {
      return AnnouncementType.PROCUREMENT_INTENTION;
    }
    if (lowerHtml.includes('资格预审')) {
      return AnnouncementType.PRE_QUALIFICATION;
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
    const match = url.match(/(\d{15,})/);
    return match ? match[1] : url.split('/').pop()?.split('.')[0] || '';
  }

  /**
   * 按类型爬取
   */
  async crawlByType(
    announcementType: string,
    pages?: number
  ): Promise<CrawlerResult[]> {
    // 类型对应的bidType参数
    const typeParams: Record<string, string> = {
      '招标公告': '0',
      '中标公告': '1',
      '更正公告': '2',
      '终止公告': '3',
      '废标公告': '4',
      '竞争性谈判公告': '5',
      '竞争性磋商公告': '6',
      '询价公告': '7',
    };

    const bidType = typeParams[announcementType] || '0';
    const results: CrawlerResult[] = [];
    const maxPages = pages || this.config.maxPages;

    for (let page = 1; page <= maxPages; page++) {
      try {
        const params = new URLSearchParams({
          page_index: String(page),
          page_size: '20',
          bidSort: '0',
          buyerName: '',
          projectId: '',
          pinMu: '0',
          bidType,
          start_time: '',
          end_time: '',
          search_type: '1',
          searchfield: '',
          keyword: '',
        });

        const html = await this.requestWithRetry<string>({
          method: 'GET',
          url: `${this.searchUrl}/bxsearch?${params.toString()}`,
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
