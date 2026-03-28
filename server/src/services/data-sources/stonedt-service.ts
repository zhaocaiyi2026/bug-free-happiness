/**
 * 思通数据免费招投标API服务
 * 
 * 官方文档：https://gitee.com/ilirui/free-bidding-data-interface
 * 
 * 获取授权：
 * 1. 关注微信公众号"思通数据"
 * 2. 点击菜单"体验账号"-"招标接口"
 * 3. 自动返回appId和appSecret
 * 
 * 接口说明：
 * - 招标列表：POST /api/invitationOftenderlist
 * - 招标详情：POST /api/invitationOftenderdetail
 * - 配额查询：POST /api/appquota
 * 
 * 费用：永久免费
 */

import axios from 'axios';
import type { 
  UnifiedBidData, 
  UnifiedWinBidData, 
  DataSourceQueryParams,
  ApiResponse 
} from './types';

// 思通数据API配置
const STONEDT_BASE_URL = 'http://data.stonedt.com/api';

// 请求参数类型
interface StoneDTListParams {
  keyword: string;
  starttime: string;
  endtime?: string;
  province?: string;
  city?: string;
  industry?: string;
  business_type?: string;
  stopword?: string;
  page?: number;
  size?: number;
}

// 响应数据类型
interface StoneDTListResponse {
  code: number;
  message: string;
  data: StoneDTBidItem[];
  count: number;
  page: number;
  page_count: number;
  size: number;
}

interface StoneDTDetailResponse {
  code: number;
  message: string;
  data: StoneDTBidItem;
}

interface StoneDTQuotaResponse {
  code: number;
  message: string;
  today_quota: number;
  app_quota: number;
  concurrent_ip: number;
}

// 招标数据项
interface StoneDTBidItem {
  article_public_id: string;
  project_id: string;
  business_type: string;
  title: string;
  content: string;
  source_name: string;
  informationtype: string;
  industry: string;
  detail_url: string;
  file_url: string;
  noticeid: string;
  candidate: string[];
  biao_price: number;
  winning_bidder: string[];
  province: string;
  city: string;
  bidding_unit: string;
  agency_unit: string;
  publish_time: string;
  qualification_requirements?: string;
  content_html?: string;
}

// 行业字典
const INDUSTRY_DICT: Record<string, string> = {
  '仪器仪表': '仪器设备',
  '机械设备': '设备采购',
  '农林牧渔': '农林牧渔',
  '交通工程': '交通运输',
  '制造生产': '制造业',
  '服务采购': '服务采购',
  '市政设施': '建筑工程',
  '行政办公': '办公用品',
  '能源化工': '环保能源',
  '建筑工程': '建筑工程',
  '环保绿化': '环保能源',
  '医疗卫生': '医疗设备',
  '弱电安防': '安防设备',
  '信息技术': 'IT服务',
  '日用百货': '办公用品',
  '服装布料': '纺织品',
  '家居建材': '建筑材料',
  '食品饮品': '食品饮料',
  '材料配件': '材料配件',
  '水利水电': '水利工程',
};

/**
 * 思通数据服务类
 */
export class StoneDTService {
  private appId: string;
  private appSecret: string;
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpireTime: number = 0;
  
  constructor(appId?: string, appSecret?: string) {
    this.appId = appId || process.env.STONEDT_APP_ID || '';
    this.appSecret = appSecret || process.env.STONEDT_APP_SECRET || '';
    this.baseUrl = STONEDT_BASE_URL;
  }
  
  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return !!(this.appId && this.appSecret);
  }
  
  /**
   * 获取Token
   */
  private async getToken(): Promise<string> {
    // Token有效期内直接返回
    if (this.token && Date.now() < this.tokenExpireTime) {
      return this.token;
    }
    
    // 生成Token（根据文档要求）
    // Token格式：Base64(appId:timestamp:signature)
    const timestamp = Date.now();
    const signStr = `${this.appId}${timestamp}${this.appSecret}`;
    
    // 使用简单的签名方式
    const crypto = await import('crypto');
    const signature = crypto.createHash('md5').update(signStr).digest('hex');
    
    this.token = `${this.appId}:${timestamp}:${signature}`;
    this.tokenExpireTime = timestamp + 3600000; // 1小时有效
    
    return this.token;
  }
  
  /**
   * 创建请求头
   */
  private async createHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    return {
      'Authorization': token,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }
  
  /**
   * 搜索招标列表
   */
  async searchBids(params: DataSourceQueryParams): Promise<ApiResponse<UnifiedBidData[]>> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: {
          code: 'NOT_CONFIGURED',
          message: '思通数据API未配置，请先关注微信公众号"思通数据"获取授权',
        },
      };
    }
    
    try {
      const listParams: StoneDTListParams = {
        keyword: params.keyword || '',
        starttime: params.publishDateStart?.toISOString().split('T')[0] || 
                   new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endtime: params.publishDateEnd?.toISOString().split('T')[0],
        province: params.province,
        city: params.city,
        industry: params.industry,
        page: params.page || 1,
        size: Math.min(params.pageSize || 20, 20), // 最大20条
      };
      
      const headers = await this.createHeaders();
      
      // 构建表单数据
      const formData = new URLSearchParams();
      Object.entries(listParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });
      
      const response = await axios.post<StoneDTListResponse>(
        `${this.baseUrl}/invitationOftenderlist`,
        formData.toString(),
        { 
          headers,
          timeout: 30000,
        }
      );
      
      if (response.data.code !== 200) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: response.data.message || '查询失败',
          },
        };
      }
      
      const { data, count, page, page_count } = response.data;
      
      // 转换为统一格式
      const unifiedData: UnifiedBidData[] = data.map(item => this.transformBidItem(item));
      
      return {
        success: true,
        data: unifiedData,
        pagination: {
          page,
          pageSize: listParams.size || 20,
          total: count,
          hasMore: page < page_count,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[StoneDT] Search bids failed:', errorMessage);
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
   * 获取招标详情
   */
  async getBidDetail(articlePublicId: string): Promise<ApiResponse<UnifiedBidData>> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: {
          code: 'NOT_CONFIGURED',
          message: '思通数据API未配置',
        },
      };
    }
    
    try {
      const headers = await this.createHeaders();
      
      const formData = new URLSearchParams();
      formData.append('article_public_id', articlePublicId);
      
      const response = await axios.post<StoneDTDetailResponse>(
        `${this.baseUrl}/invitationOftenderdetail`,
        formData.toString(),
        { 
          headers,
          timeout: 30000,
        }
      );
      
      if (response.data.code !== 200) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: response.data.message || '获取详情失败',
          },
        };
      }
      
      return {
        success: true,
        data: this.transformBidItem(response.data.data),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[StoneDT] Get bid detail failed:', errorMessage);
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
   * 查询配额
   */
  async getQuota(): Promise<{
    todayQuota: number;
    appQuota: number;
    concurrentIp: number;
  } | null> {
    if (!this.isAvailable()) {
      return null;
    }
    
    try {
      const headers = await this.createHeaders();
      
      const formData = new URLSearchParams();
      formData.append('appkey', this.appId);
      formData.append('api_name', 'tender');
      
      const response = await axios.post<StoneDTQuotaResponse>(
        `${this.baseUrl}/appquota`,
        formData.toString(),
        { 
          headers,
          timeout: 10000,
        }
      );
      
      if (response.data.code !== 200) {
        console.error('[StoneDT] Get quota failed:', response.data.message);
        return null;
      }
      
      return {
        todayQuota: response.data.today_quota,
        appQuota: response.data.app_quota,
        concurrentIp: response.data.concurrent_ip,
      };
    } catch (error) {
      console.error('[StoneDT] Get quota failed:', error);
      return null;
    }
  }
  
  /**
   * 批量获取招标数据（用于同步）
   */
  async fetchBidsBatch(
    options: {
      keyword?: string;
      province?: string;
      industry?: string;
      startDate?: Date;
      endDate?: Date;
      maxCount?: number;
    } = {}
  ): Promise<UnifiedBidData[]> {
    const results: UnifiedBidData[] = [];
    const maxCount = options.maxCount || 500;
    let page = 1;
    let hasMore = true;
    
    // 设置默认时间范围（最近30天）
    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    while (hasMore && results.length < maxCount) {
      const response = await this.searchBids({
        keyword: options.keyword,
        province: options.province,
        industry: options.industry,
        publishDateStart: startDate,
        publishDateEnd: endDate,
        page,
        pageSize: 20,
      });
      
      if (!response.success || !response.data) {
        console.error('[StoneDT] Batch fetch failed at page', page, response.error);
        break;
      }
      
      results.push(...response.data);
      hasMore = response.pagination?.hasMore || false;
      page++;
      
      // 速率限制（每次请求间隔500ms）
      await this.delay(500);
    }
    
    return results.slice(0, maxCount);
  }
  
  /**
   * 批量获取中标数据
   * 思通数据的中标信息在招标列表中，通过business_type区分
   */
  async fetchWinBidsBatch(
    options: {
      keyword?: string;
      province?: string;
      industry?: string;
      startDate?: Date;
      endDate?: Date;
      maxCount?: number;
    } = {}
  ): Promise<UnifiedWinBidData[]> {
    const results: UnifiedWinBidData[] = [];
    const maxCount = options.maxCount || 500;
    let page = 1;
    let hasMore = true;
    
    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    while (hasMore && results.length < maxCount) {
      try {
        const headers = await this.createHeaders();
        
        const formData = new URLSearchParams();
        formData.append('keyword', options.keyword || '');
        formData.append('starttime', startDate.toISOString().split('T')[0]);
        formData.append('endtime', endDate.toISOString().split('T')[0]);
        if (options.province) formData.append('province', options.province);
        if (options.industry) formData.append('industry', options.industry);
        formData.append('business_type', '中标结果公告'); // 筛选中标类型
        formData.append('page', String(page));
        formData.append('size', '20');
        
        const response = await axios.post<StoneDTListResponse>(
          `${this.baseUrl}/invitationOftenderlist`,
          formData.toString(),
          { headers, timeout: 30000 }
        );
        
        if (response.data.code !== 200) {
          console.error('[StoneDT] Win bids fetch failed at page', page);
          break;
        }
        
        // 转换中标数据
        const winBids = response.data.data
          .filter(item => item.winning_bidder && item.winning_bidder.length > 0)
          .map(item => this.transformWinBidItem(item));
        
        results.push(...winBids);
        hasMore = page < response.data.page_count;
        page++;
        
        await this.delay(500);
      } catch (error) {
        console.error('[StoneDT] Win bids batch fetch error:', error);
        break;
      }
    }
    
    return results.slice(0, maxCount);
  }
  
  /**
   * 转换招标数据项
   */
  private transformBidItem(item: StoneDTBidItem): UnifiedBidData {
    return {
      sourcePlatform: 'stonedt',
      sourceId: item.article_public_id,
      title: item.title,
      content: item.content,
      budget: item.biao_price || undefined,
      province: item.province || undefined,
      city: item.city || undefined,
      industry: this.mapIndustry(item.industry),
      bidType: item.business_type,
      publishDate: item.publish_time ? new Date(item.publish_time) : undefined,
      contactPerson: undefined, // 需要详情接口获取
      contactPhone: undefined,
      sourceUrl: item.detail_url,
      extraData: {
        projectId: item.project_id,
        sourceName: item.source_name,
        biddingUnit: item.bidding_unit,
        agencyUnit: item.agency_unit,
        fileUrl: item.file_url,
      },
    };
  }
  
  /**
   * 转换中标数据项
   */
  private transformWinBidItem(item: StoneDTBidItem): UnifiedWinBidData {
    return {
      sourcePlatform: 'stonedt',
      sourceId: item.article_public_id,
      title: item.title,
      content: item.content,
      winAmount: item.biao_price || undefined,
      province: item.province || undefined,
      city: item.city || undefined,
      industry: this.mapIndustry(item.industry),
      bidType: item.business_type,
      winCompany: item.winning_bidder?.[0],
      publishDate: item.publish_time ? new Date(item.publish_time) : undefined,
      sourceUrl: item.detail_url,
      extraData: {
        projectId: item.project_id,
        sourceName: item.source_name,
        biddingUnit: item.bidding_unit,
        candidates: item.candidate,
      },
    };
  }
  
  /**
   * 映射行业分类
   */
  private mapIndustry(industry: string): string | undefined {
    if (!industry) return undefined;
    return INDUSTRY_DICT[industry] || industry;
  }
  
  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例
export const stoneDTService = new StoneDTService();
