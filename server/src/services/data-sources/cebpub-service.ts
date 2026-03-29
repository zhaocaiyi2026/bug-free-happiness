/**
 * 中国招标投标公共服务平台数据服务
 * 
 * 官方数据源，国务院批准、国家发改委主导建设的国家级招投标枢纽平台
 * 
 * 网址：http://www.cebpubservice.com
 * 
 * 法律依据：
 * - 《招标公告和公示信息发布管理办法》规定依法必须招标项目须在此公示
 * - 作为全国电子招投标数据交换核心渠道，信息权威性高
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import type { 
  UnifiedBidData, 
  UnifiedWinBidData, 
  DataSourceQueryParams,
  ApiResponse 
} from './types';
import { SYNC_BATCH_CONFIG } from './config';

// 中国招标投标公共服务平台配置
const CEBPUB_BASE_URL = 'http://www.cebpubservice.com';

/**
 * 中国招标投标公共服务平台服务类
 */
export class CEBPubService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = CEBPUB_BASE_URL;
  }
  
  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return true; // 公共服务平台，免费开放
  }
  
  /**
   * 搜索招标项目列表
   */
  async searchBids(params: DataSourceQueryParams): Promise<ApiResponse<UnifiedBidData[]>> {
    try {
      // 构建搜索请求
      const searchUrl = `${this.baseUrl}/ctpsp_iiss/searchbusinesshttpaction/getStringMethod.do`;
      
      const formData = new URLSearchParams();
      formData.append('searchName', params.keyword || '');
      formData.append('page', String(params.page || 1));
      formData.append('pageSize', String(params.pageSize || 20));
      formData.append('area_Province', params.province || '');
      formData.append('industry', params.industry || '');
      
      const response = await axios.post(searchUrl, formData.toString(), {
        timeout: SYNC_BATCH_CONFIG.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json, text/javascript, */*',
        },
      });
      
      // 解析响应
      const results: UnifiedBidData[] = [];
      
      // 处理可能的JSON或HTML响应
      if (response.data && typeof response.data === 'object') {
        // JSON格式响应
        const data = response.data.data || response.data.list || [];
        for (const item of data) {
          results.push({
            sourcePlatform: 'cebpub',
            sourceId: item.id || item.noticeId || '',
            title: item.title || item.noticeName || '',
            content: item.content || '',
            budget: this.parseBudget(item.budget || item.projectMoney),
            province: item.province || item.areaName,
            city: item.city,
            industry: item.industry || item.industryName,
            bidType: item.noticeType || '招标公告',
            publishDate: item.publishDate ? new Date(item.publishDate) : undefined,
            deadline: item.deadline ? new Date(item.deadline) : undefined,
            contactPerson: item.contactPerson || item.contactName,
            contactPhone: item.contactPhone || item.contactMobile,
            sourceUrl: item.sourceUrl || `${this.baseUrl}/notice/${item.id}`,
          });
        }
      } else {
        // HTML格式响应，使用cheerio解析
        const $ = cheerio.load(response.data);
        
        $('.list-item, .result-item, tr[data-id]').each((index, element) => {
          try {
            const $item = $(element);
            const title = $item.find('.title a, td:first-child a').text().trim();
            let sourceUrl = $item.find('a').first().attr('href') || '';
            
            if (sourceUrl && !sourceUrl.startsWith('http')) {
              sourceUrl = `${this.baseUrl}${sourceUrl}`;
            }
            
            const publishDate = $item.find('.date, .time, td:nth-child(3)').text().trim();
            const province = $item.find('.region, td:nth-child(2)').text().trim();
            
            if (title) {
              results.push({
                sourcePlatform: 'cebpub',
                sourceId: this.extractIdFromUrl(sourceUrl),
                title,
                content: '',
                province,
                publishDate: publishDate ? this.parseDate(publishDate) : undefined,
                sourceUrl,
              });
            }
          } catch (parseError) {
            // 忽略解析错误
          }
        });
      }
      
      return {
        success: true,
        data: results,
        pagination: {
          page: params.page || 1,
          pageSize: params.pageSize || 20,
          total: response.data?.total || results.length,
          hasMore: results.length === (params.pageSize || 20),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CEBPub] Search bids failed:', errorMessage);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: errorMessage,
        },
      };
    }
  }
  
  /**
   * 搜索中标项目列表
   */
  async searchWinBids(params: DataSourceQueryParams): Promise<ApiResponse<UnifiedWinBidData[]>> {
    try {
      // 中标结果公告
      const searchUrl = `${this.baseUrl}/ctpsp_iiss/searchresulthttpaction/getStringMethod.do`;
      
      const formData = new URLSearchParams();
      formData.append('searchName', params.keyword || '');
      formData.append('page', String(params.page || 1));
      formData.append('pageSize', String(params.pageSize || 20));
      
      const response = await axios.post(searchUrl, formData.toString(), {
        timeout: SYNC_BATCH_CONFIG.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      const results: UnifiedWinBidData[] = [];
      
      if (response.data && typeof response.data === 'object') {
        const data = response.data.data || response.data.list || [];
        for (const item of data) {
          results.push({
            sourcePlatform: 'cebpub',
            sourceId: item.id || item.resultId || '',
            title: item.title || item.projectName || '',
            content: item.content || '',
            winAmount: this.parseBudget(item.winAmount || item.bidWinPrice),
            province: item.province,
            city: item.city,
            winCompany: item.winCompany || item.bidWinner || item.successfulBidder,
            winCompanyPhone: item.winCompanyPhone,
            publishDate: item.publishDate ? new Date(item.publishDate) : undefined,
            winDate: item.winDate ? new Date(item.winDate) : undefined,
            sourceUrl: item.sourceUrl || `${this.baseUrl}/result/${item.id}`,
          });
        }
      }
      
      return {
        success: true,
        data: results,
        pagination: {
          page: params.page || 1,
          pageSize: params.pageSize || 20,
          total: response.data?.total || results.length,
          hasMore: results.length === (params.pageSize || 20),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CEBPub] Search win bids failed:', errorMessage);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: errorMessage,
        },
      };
    }
  }
  
  /**
   * 获取项目详情
   */
  async getProjectDetail(projectId: string): Promise<ApiResponse<{
    content: string;
    contactPerson?: string;
    contactPhone?: string;
    budget?: number;
    deadline?: Date;
  }>> {
    try {
      const detailUrl = `${this.baseUrl}/ctpsp_iiss/notice/${projectId}`;
      
      const response = await axios.get(detailUrl, {
        timeout: SYNC_BATCH_CONFIG.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      const $ = cheerio.load(response.data);
      
      // 提取正文内容
      const content = $('.notice-content, .detail-content, #content').text().trim();
      
      // 提取联系方式
      const contactPerson = this.extractContactPerson(content);
      const contactPhone = this.extractContactPhone(content);
      const budget = this.extractBudget(content);
      const deadline = this.extractDeadline(content);
      
      return {
        success: true,
        data: {
          content,
          contactPerson,
          contactPhone,
          budget,
          deadline,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CEBPub] Get project detail failed:', errorMessage);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: errorMessage,
        },
      };
    }
  }
  
  /**
   * 批量获取招标数据
   */
  async fetchBidsBatch(options: {
    startDate?: Date;
    endDate?: Date;
    keyword?: string;
    maxCount?: number;
  } = {}): Promise<UnifiedBidData[]> {
    const results: UnifiedBidData[] = [];
    const maxCount = options.maxCount || 100;
    let page = 1;
    let hasMore = true;
    
    while (hasMore && results.length < maxCount) {
      const response = await this.searchBids({
        keyword: options.keyword,
        publishDateStart: options.startDate,
        publishDateEnd: options.endDate,
        page,
        pageSize: 50,
      });
      
      if (!response.success || !response.data) {
        console.error('[CEBPub] Batch fetch failed at page', page);
        break;
      }
      
      // 获取详情补充联系方式
      for (const item of response.data) {
        if (results.length >= maxCount) break;
        
        if (item.sourceId && !item.contactPhone) {
          const detailResponse = await this.getProjectDetail(item.sourceId);
          if (detailResponse.success && detailResponse.data) {
            item.content = detailResponse.data.content;
            item.contactPerson = detailResponse.data.contactPerson;
            item.contactPhone = detailResponse.data.contactPhone;
            item.budget = detailResponse.data.budget;
            item.deadline = detailResponse.data.deadline;
          }
          await this.delay(500);
        }
        
        results.push(item);
      }
      
      hasMore = response.pagination?.hasMore || false;
      page++;
      
      console.log(`[CEBPub] Fetched ${results.length} bids, page ${page}`);
      await this.delay(300);
    }
    
    return results.slice(0, maxCount);
  }
  
  /**
   * 批量获取中标数据
   */
  async fetchWinBidsBatch(options: {
    startDate?: Date;
    endDate?: Date;
    keyword?: string;
    maxCount?: number;
  } = {}): Promise<UnifiedWinBidData[]> {
    const results: UnifiedWinBidData[] = [];
    const maxCount = options.maxCount || 100;
    let page = 1;
    let hasMore = true;
    
    while (hasMore && results.length < maxCount) {
      const response = await this.searchWinBids({
        keyword: options.keyword,
        publishDateStart: options.startDate,
        publishDateEnd: options.endDate,
        page,
        pageSize: 50,
      });
      
      if (!response.success || !response.data) {
        console.error('[CEBPub] Batch fetch win bids failed at page', page);
        break;
      }
      
      results.push(...response.data);
      hasMore = response.pagination?.hasMore || false;
      page++;
      
      console.log(`[CEBPub] Fetched ${results.length} win bids, page ${page}`);
      await this.delay(300);
    }
    
    return results.slice(0, maxCount);
  }
  
  // =============== 辅助方法 ===============
  
  private extractIdFromUrl(url: string): string {
    const match = url.match(/(\d{10,})/);
    return match ? match[1] : url.split('/').pop() || '';
  }
  
  private parseDate(dateStr: string): Date | undefined {
    try {
      const formats = [
        /(\d{4})-(\d{2})-(\d{2})/,
        /(\d{4})年(\d{1,2})月(\d{1,2})日/,
        /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
      ];
      
      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          const [, year, month, day] = match;
          return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
      }
      
      return undefined;
    } catch {
      return undefined;
    }
  }
  
  private parseBudget(value?: string | number): number | undefined {
    if (!value) return undefined;
    
    const strValue = String(value);
    const num = parseFloat(strValue.replace(/[^\d.]/g, ''));
    
    if (isNaN(num)) return undefined;
    
    if (strValue.includes('亿')) return num * 100000000;
    if (strValue.includes('万')) return num * 10000;
    
    return num;
  }
  
  private extractContactPerson(content: string): string | undefined {
    const patterns = [
      /联系人[：:]\s*([^\s,，。；;]+)/,
      /项目负责人[：:]\s*([^\s,，。；;]+)/,
      /采购人联系人[：:]\s*([^\s,，。；;]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    
    return undefined;
  }
  
  private extractContactPhone(content: string): string | undefined {
    const patterns = [
      /联系电话[：:]\s*(\d{3,4}[-\s]?\d{7,8}|\d{11})/,
      /电话[：:]\s*(\d{3,4}[-\s]?\d{7,8}|\d{11})/,
      /联系方式[：:]\s*(\d{3,4}[-\s]?\d{7,8}|\d{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    
    return undefined;
  }
  
  private extractBudget(content: string): number | undefined {
    const patterns = [
      /预算金额[：:]\s*([\d,.]+)\s*(万|亿元)?/,
      /采购预算[：:]\s*([\d,.]+)\s*(万|亿元)?/,
      /项目金额[：:]\s*([\d,.]+)\s*(万|亿元)?/,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const num = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[2];
        
        if (unit === '亿') return num * 100000000;
        if (unit === '万') return num * 10000;
        return num;
      }
    }
    
    return undefined;
  }
  
  private extractDeadline(content: string): Date | undefined {
    const patterns = [
      /截止时间[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}日?)/,
      /投标截止时间[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}日?)/,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return this.parseDate(match[1]);
      }
    }
    
    return undefined;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例
export const cebpubService = new CEBPubService();
