/**
 * APISpace 招标数据服务
 * 
 * 商业数据源，提供海量招标中标数据
 * 
 * 文档：https://www.apispace.com/
 * API: https://23330.o.apispace.com/project-info-upgrade/
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
const APISPACE_BASE_URL = 'https://23330.o.apispace.com/project-info-upgrade';

// 请求参数类型
interface ApiSpaceSearchParams {
  startDate?: string;
  endDate?: string;
  keyword?: string;
  proviceCode?: string;
  cityCode?: string;
  classId?: number;        // 分类ID
  searchMode?: number;     // 搜索模式
  newsTypeID?: number;     // 信息类型：1-招标公告，2-中标公告，3-采购合同，4-采购意向，5-其他公告
  page?: number;
  pageSize?: number;
}

// API响应类型
interface ApiSpaceResponse {
  code: number;
  msg: string;
  data: {
    total: number;
    pageNumber: number;
    data: ApiSpaceProjectItem[];
  };
}

// 项目数据项
interface ApiSpaceProjectItem {
  id: number;
  title: string;
  newsTypeID: number;      // 1-招标公告，2-中标公告，3-采购合同，4-采购意向，5-其他公告
  publishTime: string;
  proviceCode: string;
  cityCode: string;
  countyCode?: string;
  projectMoney?: string;
  partANameList?: string[];
  partBNameList?: string[];
  projectClassID?: string;
  purchaseTypeID?: string;
  industryCodeList?: string[];
  hasFile: number;
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
  winCompany?: string;
  winAmount?: string;
  winDate?: string;
}

// 省份代码映射
const PROVINCE_CODE_MAP: Record<string, string> = {
  '110000': '北京市',
  '120000': '天津市',
  '130000': '河北省',
  '140000': '山西省',
  '150000': '内蒙古自治区',
  '210000': '辽宁省',
  '220000': '吉林省',
  '230000': '黑龙江省',
  '310000': '上海市',
  '320000': '江苏省',
  '330000': '浙江省',
  '340000': '安徽省',
  '350000': '福建省',
  '360000': '江西省',
  '370000': '山东省',
  '410000': '河南省',
  '420000': '湖北省',
  '430000': '湖南省',
  '440000': '广东省',
  '450000': '广西壮族自治区',
  '460000': '海南省',
  '500000': '重庆市',
  '510000': '四川省',
  '520000': '贵州省',
  '530000': '云南省',
  '540000': '西藏自治区',
  '610000': '陕西省',
  '620000': '甘肃省',
  '630000': '青海省',
  '640000': '宁夏回族自治区',
  '650000': '新疆维吾尔自治区',
};

/**
 * APISpace服务类
 */
export class ApiSpaceService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.APISPACE_API_KEY || '';
    this.baseUrl = APISPACE_BASE_URL;
  }
  
  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
  
  /**
   * 设置API密钥
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
  
  /**
   * 搜索招标项目列表
   */
  async searchBids(params: DataSourceQueryParams): Promise<ApiResponse<UnifiedBidData[]>> {
    try {
      const searchParams: ApiSpaceSearchParams = {
        startDate: params.publishDateStart?.toISOString().split('T')[0] || 
                   new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: params.publishDateEnd?.toISOString().split('T')[0] || 
                 new Date().toISOString().split('T')[0],
        keyword: params.keyword,
        newsTypeID: 1, // 招标公告
        page: params.page || 1,
        pageSize: Math.min(params.pageSize || 20, 50),
      };
      
      const response = await axios.post<ApiSpaceResponse>(
        `${this.baseUrl}/project-list`,
        searchParams,
        {
          headers: {
            'X-APISpace-Token': this.apiKey,
            'Content-Type': 'application/json',
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
      
      const { data, total, pageNumber } = response.data.data;
      
      // 转换为统一格式
      const unifiedData: UnifiedBidData[] = data.map(item => this.transformProjectItem(item));
      
      return {
        success: true,
        data: unifiedData,
        pagination: {
          page: pageNumber,
          pageSize: searchParams.pageSize || 20,
          total: total,
          hasMore: pageNumber * (searchParams.pageSize || 20) < total,
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
        startDate: params.publishDateStart?.toISOString().split('T')[0] || 
                   new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: params.publishDateEnd?.toISOString().split('T')[0] || 
                 new Date().toISOString().split('T')[0],
        keyword: params.keyword,
        newsTypeID: 2, // 中标公告
        page: params.page || 1,
        pageSize: Math.min(params.pageSize || 20, 50),
      };
      
      const response = await axios.post<ApiSpaceResponse>(
        `${this.baseUrl}/project-list`,
        searchParams,
        {
          headers: {
            'X-APISpace-Token': this.apiKey,
            'Content-Type': 'application/json',
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
      
      const { data, total, pageNumber } = response.data.data;
      
      // 转换为统一格式
      const unifiedData: UnifiedWinBidData[] = data.map(item => this.transformWinBidItem(item));
      
      return {
        success: true,
        data: unifiedData,
        pagination: {
          page: pageNumber,
          pageSize: searchParams.pageSize || 20,
          total: total,
          hasMore: pageNumber * (searchParams.pageSize || 20) < total,
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
  async getProjectDetail(projectId: number): Promise<ApiResponse<ApiSpaceProjectDetail>> {
    try {
      const response = await axios.post<{
        code: number;
        msg: string;
        data: ApiSpaceProjectDetail;
      }>(
        `${this.baseUrl}/project-detail`,
        { id: projectId },
        {
          headers: {
            'X-APISpace-Token': this.apiKey,
            'Content-Type': 'application/json',
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
      keyword?: string;
      maxCount?: number;
    } = {}
  ): Promise<UnifiedBidData[]> {
    const results: UnifiedBidData[] = [];
    const maxCount = options.maxCount || 100;
    let page = 1;
    let hasMore = true;
    
    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    while (hasMore && results.length < maxCount) {
      const response = await this.searchBids({
        publishDateStart: startDate,
        publishDateEnd: endDate,
        keyword: options.keyword,
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
      
      console.log(`[ApiSpace] Fetched ${results.length} bids, page ${page}`);
      
      // 速率限制
      await this.delay(300);
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
      keyword?: string;
      maxCount?: number;
    } = {}
  ): Promise<UnifiedWinBidData[]> {
    const results: UnifiedWinBidData[] = [];
    const maxCount = options.maxCount || 100;
    let page = 1;
    let hasMore = true;
    
    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    while (hasMore && results.length < maxCount) {
      const response = await this.searchWinBids({
        publishDateStart: startDate,
        publishDateEnd: endDate,
        keyword: options.keyword,
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
      
      console.log(`[ApiSpace] Fetched ${results.length} win bids, page ${page}`);
      
      // 速率限制
      await this.delay(300);
    }
    
    return results.slice(0, maxCount);
  }
  
  /**
   * 转换项目数据项
   */
  private transformProjectItem(item: ApiSpaceProjectItem): UnifiedBidData {
    return {
      sourcePlatform: 'apispace',
      sourceId: String(item.id),
      title: item.title,
      content: '',
      budget: this.parseBudget(item.projectMoney),
      province: this.getProvinceName(item.proviceCode),
      city: this.getCityName(item.cityCode),
      industry: undefined,
      bidType: this.getNewsTypeName(item.newsTypeID),
      publishDate: item.publishTime ? new Date(item.publishTime) : undefined,
      contactPerson: item.partANameList?.[0],
      contactPhone: undefined,
      sourceUrl: `https://apispace.com/project/${item.id}`,
      extraData: {
        newsTypeID: item.newsTypeID,
        projectClassID: item.projectClassID,
        purchaseTypeID: item.purchaseTypeID,
        industryCodes: item.industryCodeList,
      },
    };
  }
  
  /**
   * 转换中标数据项
   */
  private transformWinBidItem(item: ApiSpaceProjectItem): UnifiedWinBidData {
    return {
      sourcePlatform: 'apispace',
      sourceId: String(item.id),
      title: item.title,
      content: '',
      winAmount: this.parseBudget(item.projectMoney),
      province: this.getProvinceName(item.proviceCode),
      city: this.getCityName(item.cityCode),
      industry: undefined,
      bidType: this.getNewsTypeName(item.newsTypeID),
      winCompany: item.partBNameList?.[0] || item.partANameList?.[0],
      publishDate: item.publishTime ? new Date(item.publishTime) : undefined,
      sourceUrl: `https://apispace.com/project/${item.id}`,
      extraData: {
        newsTypeID: item.newsTypeID,
        projectClassID: item.projectClassID,
        purchaseTypeID: item.purchaseTypeID,
      },
    };
  }
  
  /**
   * 解析预算金额
   */
  private parseBudget(money?: string): number | undefined {
    if (!money) return undefined;
    
    // 处理 "160万"、"1.5亿" 等格式
    if (money.includes('万')) {
      const num = parseFloat(money.replace('万', ''));
      return num * 10000;
    }
    if (money.includes('亿')) {
      const num = parseFloat(money.replace('亿', ''));
      return num * 100000000;
    }
    
    const num = parseFloat(money);
    return isNaN(num) ? undefined : num;
  }
  
  /**
   * 获取省份名称
   */
  private getProvinceName(code?: string): string | undefined {
    if (!code) return undefined;
    return PROVINCE_CODE_MAP[code] || undefined;
  }
  
  /**
   * 获取城市名称
   */
  private getCityName(code?: string): string | undefined {
    if (!code) return undefined;
    // 城市代码需要单独的映射表，暂时返回空
    return undefined;
  }
  
  /**
   * 获取信息类型名称
   */
  private getNewsTypeName(typeId?: number): string {
    const typeMap: Record<number, string> = {
      1: '招标公告',
      2: '中标公告',
      3: '采购合同',
      4: '采购意向',
      5: '其他公告',
    };
    return typeId ? typeMap[typeId] || '未知类型' : '未知类型';
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
