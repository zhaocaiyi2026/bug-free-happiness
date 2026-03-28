/**
 * APISpace 招标数据服务
 * 
 * 商业数据源，用于：
 * 1. 开发测试阶段验证流程
 * 2. 官方API申请期间的过渡方案
 * 3. 官方API的备用数据源
 * 
 * 文档：https://www.apispace.com/
 */

import axios from 'axios';
import type { 
  UnifiedBidData, 
  UnifiedWinBidData, 
  DataSourceQueryParams,
  ApiResponse 
} from './types';
import { SYNC_BATCH_CONFIG } from './config';

// APISpace API配置
const APISPACE_BASE_URL = 'https://23330.o.apispace.com/project-info';

// 请求参数类型
interface ApiSpaceSearchParams {
  startDate?: string;
  endDate?: string;
  keyword?: string;
  proviceCode?: string;
  cityCode?: string;
  classId?: number;        // 分类ID
  searchMode?: number;     // 搜索模式
  searchType?: number;     // 搜索类型：1-招标，2-中标
  pageIndex?: number;
  pageSize?: number;
}

// API响应类型
interface ApiSpaceResponse {
  code: number;
  msg: string;
  data: {
    data: ApiSpaceProjectItem[];
    maxCount: number;
    pageID: number;
    hasNext: boolean;
  };
}

// 项目数据项
interface ApiSpaceProjectItem {
  id: number;
  title: string;
  newsTypeID: number;      // 1-招标，2-中标，3-采购合同，4-采购意向
  publish: string;
  proviceCode: string;
  cityCode: string;
  collectWebID: number;
  hasFile: number;
  isHasFile: boolean;
  score: number;
}

// 项目详情类型
interface ApiSpaceProjectDetail {
  id: number;
  title: string;
  content: string;
  publishTime: string;
  buyerName?: string;
  buyerContact?: string;
  agentName?: string;
  agentContact?: string;
  budget?: string;
  deadline?: string;
  province?: string;
  city?: string;
  projectLocation?: string;
  sourceUrl?: string;
  attachments?: Array<{
    name: string;
    url: string;
  }>;
  // 中标特有字段
  winCompany?: string;
  winAmount?: string;
  winDate?: string;
}

/**
 * APISpace服务类
 */
export class ApiSpaceService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.APISPACE_API_KEY || 'demo_key';
    this.baseUrl = APISPACE_BASE_URL;
  }
  
  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== 'demo_key';
  }
  
  /**
   * 搜索招标项目列表
   */
  async searchBids(params: DataSourceQueryParams): Promise<ApiResponse<UnifiedBidData[]>> {
    try {
      const searchParams: ApiSpaceSearchParams = {
        startDate: params.publishDateStart?.toISOString().split('T')[0],
        endDate: params.publishDateEnd?.toISOString().split('T')[0],
        keyword: params.keyword,
        proviceCode: params.province,
        cityCode: params.city,
        searchType: 1, // 招标
        pageIndex: params.page || 1,
        pageSize: params.pageSize || 20,
      };
      
      const response = await axios.get<ApiSpaceResponse>(
        `${this.baseUrl}/project-list`,
        {
          params: searchParams,
          headers: {
            'X-APISpace-Token': this.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: SYNC_BATCH_CONFIG.timeout,
        }
      );
      
      if (response.data.code !== 200) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: response.data.msg,
          },
        };
      }
      
      const { data, maxCount, hasNext, pageID } = response.data.data;
      
      // 转换为统一格式
      const unifiedData: UnifiedBidData[] = data.map(item => ({
        sourcePlatform: 'apispace',
        sourceId: String(item.id),
        title: item.title,
        publishDate: new Date(item.publish),
        province: item.proviceCode,
        city: item.cityCode,
        sourceUrl: `https://apispace.com/project/${item.id}`,
      }));
      
      return {
        success: true,
        data: unifiedData,
        pagination: {
          page: pageID,
          pageSize: params.pageSize || 20,
          total: maxCount,
          hasMore: hasNext,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ApiSpace] Search bids failed:', errorMessage);
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
      const searchParams: ApiSpaceSearchParams = {
        startDate: params.publishDateStart?.toISOString().split('T')[0],
        endDate: params.publishDateEnd?.toISOString().split('T')[0],
        keyword: params.keyword,
        proviceCode: params.province,
        cityCode: params.city,
        searchType: 2, // 中标
        pageIndex: params.page || 1,
        pageSize: params.pageSize || 20,
      };
      
      const response = await axios.get<ApiSpaceResponse>(
        `${this.baseUrl}/project-list`,
        {
          params: searchParams,
          headers: {
            'X-APISpace-Token': this.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: SYNC_BATCH_CONFIG.timeout,
        }
      );
      
      if (response.data.code !== 200) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: response.data.msg,
          },
        };
      }
      
      const { data, maxCount, hasNext, pageID } = response.data.data;
      
      // 转换为统一格式
      const unifiedData: UnifiedWinBidData[] = data.map(item => ({
        sourcePlatform: 'apispace',
        sourceId: String(item.id),
        title: item.title,
        publishDate: new Date(item.publish),
        province: item.proviceCode,
        city: item.cityCode,
        sourceUrl: `https://apispace.com/project/${item.id}`,
      }));
      
      return {
        success: true,
        data: unifiedData,
        pagination: {
          page: pageID,
          pageSize: params.pageSize || 20,
          total: maxCount,
          hasMore: hasNext,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ApiSpace] Search win bids failed:', errorMessage);
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
  async getProjectDetail(projectId: number, isWinBid: boolean = false): Promise<ApiResponse<ApiSpaceProjectDetail>> {
    try {
      const response = await axios.get<{
        code: number;
        msg: string;
        data: ApiSpaceProjectDetail;
      }>(
        `${this.baseUrl}/project-detail`,
        {
          params: {
            id: projectId,
          },
          headers: {
            'X-APISpace-Token': this.apiKey,
          },
          timeout: SYNC_BATCH_CONFIG.timeout,
        }
      );
      
      if (response.data.code !== 200) {
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
        data: response.data.data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ApiSpace] Get project detail failed:', errorMessage);
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
   * 批量获取招标数据（用于同步）
   */
  async fetchBidsBatch(
    options: {
      startDate?: Date;
      endDate?: Date;
      maxCount?: number;
    } = {}
  ): Promise<UnifiedBidData[]> {
    const results: UnifiedBidData[] = [];
    const maxCount = options.maxCount || SYNC_BATCH_CONFIG.maxRecordsPerSync;
    let page = 1;
    let hasMore = true;
    
    while (hasMore && results.length < maxCount) {
      const response = await this.searchBids({
        publishDateStart: options.startDate,
        publishDateEnd: options.endDate,
        page,
        pageSize: 50,
      });
      
      if (!response.success || !response.data) {
        console.error('[ApiSpace] Batch fetch failed at page', page);
        break;
      }
      
      results.push(...response.data);
      hasMore = response.pagination?.hasMore || false;
      page++;
      
      // 速率限制
      await this.delay(500);
    }
    
    return results.slice(0, maxCount);
  }
  
  /**
   * 批量获取中标数据（用于同步）
   */
  async fetchWinBidsBatch(
    options: {
      startDate?: Date;
      endDate?: Date;
      maxCount?: number;
    } = {}
  ): Promise<UnifiedWinBidData[]> {
    const results: UnifiedWinBidData[] = [];
    const maxCount = options.maxCount || SYNC_BATCH_CONFIG.maxRecordsPerSync;
    let page = 1;
    let hasMore = true;
    
    while (hasMore && results.length < maxCount) {
      const response = await this.searchWinBids({
        publishDateStart: options.startDate,
        publishDateEnd: options.endDate,
        page,
        pageSize: 50,
      });
      
      if (!response.success || !response.data) {
        console.error('[ApiSpace] Batch fetch win bids failed at page', page);
        break;
      }
      
      results.push(...response.data);
      hasMore = response.pagination?.hasMore || false;
      page++;
      
      // 速率限制
      await this.delay(500);
    }
    
    return results.slice(0, maxCount);
  }
  
  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例
export const apiSpaceService = new ApiSpaceService();
