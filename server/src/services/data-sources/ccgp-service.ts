/**
 * 中国政府采购网数据服务
 * 
 * 官方API接入指南：
 * 1. 向财政部信息网络中心提交申请
 * 2. 填写《中国政府采购网数据接口开通申请表》
 * 3. 获取API密钥和签名Secret
 * 
 * 联系方式：
 * - 电话：010-63819308 / 4008101996
 * - 地址：北京市丰台区西四环南路27号
 * 
 * 文档：《中国政府采购网数据接口规范(V1.1)》
 */

import axios from 'axios';
import crypto from 'crypto';
import type { 
  UnifiedBidData, 
  UnifiedWinBidData, 
  DataSourceQueryParams,
  ApiResponse 
} from './types';
import { SYNC_BATCH_CONFIG } from './config';

// 政府采购网API配置
const CCGP_BASE_URL = 'http://www.ccgp.gov.cn/crps';

// API请求签名参数
interface SignatureParams {
  appKey: string;
  timestamp: number;
  nonce: string;
  [key: string]: string | number;
}

// 政府采购公告类型
const NoticeType = {
  TENDER: '1',           // 招标公告
  WIN_RESULT: '2',       // 中标结果
  CONTRACT: '3',         // 合同公告
  INTENTION: '4',        // 采购意向
  PRE_ANNOUNCE: '5',     // 资格预审公告
} as const;

// 搜索参数类型
interface CCGPSearchParams {
  keyword?: string;
  provinceCode?: string;
  cityCode?: string;
  noticeType?: string;
  industryCode?: string;
  budgetMin?: number;
  budgetMax?: number;
  publishDateStart?: string;
  publishDateEnd?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 中国政府采购网服务类
 */
export class CCGPService {
  private appKey: string;
  private appSecret: string;
  private baseUrl: string;
  private enabled: boolean;
  
  constructor() {
    this.appKey = process.env.CCGP_API_KEY || '';
    this.appSecret = process.env.CCGP_SECRET || '';
    this.baseUrl = CCGP_BASE_URL;
    this.enabled = !!(this.appKey && this.appSecret);
  }
  
  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return this.enabled;
  }
  
  /**
   * 生成API签名
   * 按照官方规范进行签名
   */
  private generateSignature(params: SignatureParams): string {
    // 1. 按参数名ASCII码从小到大排序
    const sortedKeys = Object.keys(params).sort();
    
    // 2. 拼接成键值对字符串
    const paramStr = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // 3. 拼接secret并MD5加密
    const signStr = paramStr + this.appSecret;
    return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  }
  
  /**
   * 创建带签名的请求参数
   */
  private createSignedParams(params: Record<string, string | number>): Record<string, string | number> {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    
    const signatureParams: SignatureParams = {
      appKey: this.appKey,
      timestamp,
      nonce,
      ...params,
    };
    
    const signature = this.generateSignature(signatureParams);
    
    return {
      ...signatureParams,
      sign: signature,
    };
  }
  
  /**
   * 搜索招标公告
   */
  async searchTenders(params: DataSourceQueryParams): Promise<ApiResponse<UnifiedBidData[]>> {
    if (!this.enabled) {
      return {
        success: false,
        error: {
          code: 'NOT_CONFIGURED',
          message: 'CCGP API未配置，请先申请API密钥',
        },
      };
    }
    
    try {
      const searchParams: Record<string, string | number> = {
        noticeType: NoticeType.TENDER,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
      };
      
      if (params.keyword) searchParams.keyword = params.keyword;
      if (params.province) searchParams.provinceCode = params.province;
      if (params.city) searchParams.cityCode = params.city;
      if (params.publishDateStart) {
        searchParams.publishDateStart = params.publishDateStart.toISOString().split('T')[0];
      }
      if (params.publishDateEnd) {
        searchParams.publishDateEnd = params.publishDateEnd.toISOString().split('T')[0];
      }
      
      const signedParams = this.createSignedParams(searchParams);
      
      const response = await axios.get<{
        code: number;
        msg: string;
        data: {
          list: CCGPTenderItem[];
          total: number;
          page: number;
          pageSize: number;
        };
      }>(
        `${this.baseUrl}/api/tender/search`,
        {
          params: signedParams,
          timeout: SYNC_BATCH_CONFIG.timeout,
        }
      );
      
      if (response.data.code !== 0) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: response.data.msg,
          },
        };
      }
      
      const { list, total, page, pageSize } = response.data.data;
      
      // 转换为统一格式
      const unifiedData: UnifiedBidData[] = list.map(item => this.transformTenderItem(item));
      
      return {
        success: true,
        data: unifiedData,
        pagination: {
          page,
          pageSize,
          total,
          hasMore: page * pageSize < total,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CCGP] Search tenders failed:', errorMessage);
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
   * 搜索中标结果
   */
  async searchWinResults(params: DataSourceQueryParams): Promise<ApiResponse<UnifiedWinBidData[]>> {
    if (!this.enabled) {
      return {
        success: false,
        error: {
          code: 'NOT_CONFIGURED',
          message: 'CCGP API未配置，请先申请API密钥',
        },
      };
    }
    
    try {
      const searchParams: Record<string, string | number> = {
        noticeType: NoticeType.WIN_RESULT,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
      };
      
      if (params.keyword) searchParams.keyword = params.keyword;
      if (params.province) searchParams.provinceCode = params.province;
      
      const signedParams = this.createSignedParams(searchParams);
      
      const response = await axios.get<{
        code: number;
        msg: string;
        data: {
          list: CCGPWinResultItem[];
          total: number;
          page: number;
          pageSize: number;
        };
      }>(
        `${this.baseUrl}/api/winresult/search`,
        {
          params: signedParams,
          timeout: SYNC_BATCH_CONFIG.timeout,
        }
      );
      
      if (response.data.code !== 0) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: response.data.msg,
          },
        };
      }
      
      const { list, total, page, pageSize } = response.data.data;
      
      // 转换为统一格式
      const unifiedData: UnifiedWinBidData[] = list.map(item => this.transformWinResultItem(item));
      
      return {
        success: true,
        data: unifiedData,
        pagination: {
          page,
          pageSize,
          total,
          hasMore: page * pageSize < total,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CCGP] Search win results failed:', errorMessage);
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
  async getTenderDetail(tenderId: string): Promise<ApiResponse<UnifiedBidData>> {
    if (!this.enabled) {
      return {
        success: false,
        error: {
          code: 'NOT_CONFIGURED',
          message: 'CCGP API未配置',
        },
      };
    }
    
    try {
      const signedParams = this.createSignedParams({ id: tenderId });
      
      const response = await axios.get<{
        code: number;
        msg: string;
        data: CCGPTenderDetail;
      }>(
        `${this.baseUrl}/api/tender/detail`,
        {
          params: signedParams,
          timeout: SYNC_BATCH_CONFIG.timeout,
        }
      );
      
      if (response.data.code !== 0) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: response.data.msg,
          },
        };
      }
      
      return {
        success: true,
        data: this.transformTenderDetail(response.data.data),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CCGP] Get tender detail failed:', errorMessage);
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
   * 转换招标列表项
   */
  private transformTenderItem(item: CCGPTenderItem): UnifiedBidData {
    return {
      sourcePlatform: 'ccgp',
      sourceId: item.id,
      title: item.title,
      budget: item.budget ? parseFloat(item.budget) : undefined,
      province: item.provinceName,
      city: item.cityName,
      industry: item.industryName,
      bidType: item.purchaseMethod,
      publishDate: item.publishDate ? new Date(item.publishDate) : undefined,
      deadline: item.deadline ? new Date(item.deadline) : undefined,
      contactPerson: item.contactPerson,
      contactPhone: item.contactPhone,
      sourceUrl: item.sourceUrl,
    };
  }
  
  /**
   * 转换中标结果项
   */
  private transformWinResultItem(item: CCGPWinResultItem): UnifiedWinBidData {
    return {
      sourcePlatform: 'ccgp',
      sourceId: item.id,
      title: item.title,
      winAmount: item.winAmount ? parseFloat(item.winAmount) : undefined,
      province: item.provinceName,
      city: item.cityName,
      industry: item.industryName,
      winCompany: item.winnerName,
      winDate: item.winDate ? new Date(item.winDate) : undefined,
      publishDate: item.publishDate ? new Date(item.publishDate) : undefined,
      sourceUrl: item.sourceUrl,
    };
  }
  
  /**
   * 转换招标详情
   */
  private transformTenderDetail(item: CCGPTenderDetail): UnifiedBidData {
    return {
      sourcePlatform: 'ccgp',
      sourceId: item.id,
      title: item.title,
      content: item.content,
      budget: item.budget ? parseFloat(item.budget) : undefined,
      province: item.provinceName,
      city: item.cityName,
      industry: item.industryName,
      bidType: item.purchaseMethod,
      publishDate: item.publishDate ? new Date(item.publishDate) : undefined,
      deadline: item.deadline ? new Date(item.deadline) : undefined,
      contactPerson: item.contactPerson,
      contactPhone: item.contactPhone,
      contactEmail: item.contactEmail,
      contactAddress: item.contactAddress,
      projectLocation: item.projectLocation,
      requirements: item.requirements,
      openBidTime: item.openBidTime ? new Date(item.openBidTime) : undefined,
      openBidLocation: item.openBidLocation,
      sourceUrl: item.sourceUrl,
      attachments: item.attachments?.map(att => ({
        name: att.name,
        url: att.url,
      })),
    };
  }
}

// ==================== 类型定义 ====================

interface CCGPTenderItem {
  id: string;
  title: string;
  budget?: string;
  provinceName?: string;
  cityName?: string;
  industryName?: string;
  purchaseMethod?: string;
  publishDate?: string;
  deadline?: string;
  contactPerson?: string;
  contactPhone?: string;
  sourceUrl: string;
}

interface CCGPWinResultItem {
  id: string;
  title: string;
  winAmount?: string;
  provinceName?: string;
  cityName?: string;
  industryName?: string;
  winnerName?: string;
  winDate?: string;
  publishDate?: string;
  sourceUrl: string;
}

interface CCGPTenderDetail extends CCGPTenderItem {
  content?: string;
  contactEmail?: string;
  contactAddress?: string;
  projectLocation?: string;
  requirements?: string;
  openBidTime?: string;
  openBidLocation?: string;
  attachments?: Array<{
    name: string;
    url: string;
  }>;
}

// 导出单例
export const ccgpService = new CCGPService();
