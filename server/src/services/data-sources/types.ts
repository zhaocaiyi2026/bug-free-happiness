/**
 * 官方数据源服务 - 类型定义
 * 
 * 用于对接政府采购网、公共资源交易平台等合规数据源
 */

// 官方数据源类型
export type OfficialDataSource = 
  | 'ccgp'           // 中国政府采购网
  | 'cebpub'         // 中国招标投标公共服务平台
  | 'ggzy'           // 全国公共资源交易平台
  | 'province_gd'    // 广东省政府采购网
  | 'province_zj'    // 浙江省政府采购网
  | 'apispace';      // APISpace 商业数据源（备用）

// 数据源配置接口
export interface DataSourceConfig {
  name: string;
  platform: OfficialDataSource;
  baseUrl: string;
  apiEndpoint?: string;
  enabled: boolean;
  priority: number;        // 优先级，数字越大优先级越高
  rateLimit: {
    requestsPerSecond: number;
    requestsPerDay: number;
  };
  auth?: {
    type: 'api_key' | 'oauth' | 'signature';
    apiKey?: string;
    secret?: string;
    tokenEndpoint?: string;
  };
}

// 同步任务类型
export interface SyncTask {
  id: string;
  source: OfficialDataSource;
  type: 'full' | 'incremental' | 'realtime';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  totalCount: number;
  successCount: number;
  errorCount: number;
  errors: SyncError[];
}

// 同步错误
export interface SyncError {
  timestamp: Date;
  message: string;
  data?: Record<string, unknown>;
}

// 统一招标数据格式
export interface UnifiedBidData {
  // 来源信息
  sourcePlatform: OfficialDataSource;
  sourceId: string;            // 来源平台唯一ID
  
  // 基本信息
  title: string;
  content?: string;
  
  // 金额
  budget?: number;
  
  // 地区
  province?: string;
  city?: string;
  
  // 分类
  industry?: string;
  bidType?: string;
  
  // 时间
  publishDate?: Date;
  deadline?: Date;
  
  // 联系方式
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  
  // 项目详情
  projectLocation?: string;
  requirements?: string;
  openBidTime?: Date;
  openBidLocation?: string;
  
  // 来源链接
  sourceUrl: string;
  
  // 附件
  attachments?: Attachment[];
  
  // 扩展字段
  extraData?: Record<string, unknown>;
}

// 统一中标数据格式
export interface UnifiedWinBidData {
  sourcePlatform: OfficialDataSource;
  sourceId: string;
  
  title: string;
  content?: string;
  
  // 中标金额
  winAmount?: number;
  
  // 地区
  province?: string;
  city?: string;
  
  // 分类
  industry?: string;
  bidType?: string;
  
  // 中标单位
  winCompany?: string;
  winCompanyAddress?: string;
  winCompanyPhone?: string;
  
  // 时间
  winDate?: Date;
  publishDate?: Date;
  
  // 项目信息
  projectLocation?: string;
  
  // 来源
  sourceUrl: string;
  
  extraData?: Record<string, unknown>;
}

// 附件
export interface Attachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

// 数据源状态
export interface DataSourceStatus {
  platform: OfficialDataSource;
  name: string;
  enabled: boolean;
  connected: boolean;
  lastSyncTime?: Date;
  lastSyncCount: number;
  lastSyncStatus: 'success' | 'failed' | 'partial';
  totalRecords: number;
  errorMessage?: string;
}

// API响应包装
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

// 数据源查询参数
export interface DataSourceQueryParams {
  keyword?: string;
  province?: string;
  city?: string;
  industry?: string;
  bidType?: string;
  budgetMin?: number;
  budgetMax?: number;
  publishDateStart?: Date;
  publishDateEnd?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: 'publishDate' | 'budget' | 'deadline';
  sortOrder?: 'asc' | 'desc';
}
