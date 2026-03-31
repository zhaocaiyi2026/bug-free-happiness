/**
 * 爬虫类型定义
 */

// 公告类型枚举
export enum AnnouncementType {
  // 采购类公告
  BID_ANNOUNCEMENT = '招标公告',
  PRE_QUALIFICATION = '资格预审公告',
  INVITATION_BID = '邀请招标公告',
  COMPETITIVE_NEGOTIATION = '竞争性谈判公告',
  COMPETITIVE_CONSULTATION = '竞争性磋商公告',
  INQUIRY = '询价公告',
  PROCUREMENT_INTENTION = '采购意向公告',
  
  // 变更类公告
  CORRECTION = '更正公告',
  TERMINATION = '终止公告',
  RESULT_CHANGE = '采购结果变更公告',
  
  // 结果类公告
  WIN_RESULT = '中标结果公告',
  ABANDONED_BID = '废标公告',
  
  // 项目类
  ONGOING_PROJECT = '在建项目',
  INSPECTION_PROJECT = '抽检项目',
}

// 省份配置
export interface ProvinceConfig {
  code: string;
  name: string;
  shortName: string;
  baseUrl: string;
  enabled: boolean;
}

// 爬虫配置
export interface CrawlerConfig {
  name: string;
  baseUrl: string;
  enabled: boolean;
  requestInterval: number;  // 请求间隔(毫秒)
  timeout: number;          // 超时时间(毫秒)
  maxRetries: number;       // 最大重试次数
  maxPages: number;         // 每次最大爬取页数
}

// 招标公告数据
export interface BidData {
  // 基本信息
  title: string;
  content?: string;
  announcement_type: AnnouncementType;
  
  // 项目信息
  project_code?: string;
  budget?: number;
  procurement_method?: string;
  
  // 地区信息
  province?: string;
  city?: string;
  region_code?: string;
  project_location?: string;
  
  // 分类信息
  industry?: string;
  category_code?: string;
  
  // 时间信息
  publish_date?: Date;
  deadline?: Date;
  open_bid_time?: Date;
  open_bid_location?: string;
  
  // 采购人信息
  purchaser_name?: string;
  purchaser_contact?: string;
  purchaser_phone?: string;
  purchaser_address?: string;
  
  // 代理机构信息
  agency_name?: string;
  agency_contact?: string;
  agency_phone?: string;
  
  // 中标信息
  winning_bidder?: string;
  winning_amount?: number;
  
  // 联系信息（兼容旧字段）
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  
  // 来源信息
  source_url: string;
  source_platform: string;
  source_id: string;
  data_type: 'crawler';
  
  // 其他
  requirements?: string;
  status?: string;
}

// 爬虫结果
export interface CrawlerResult {
  success: boolean;
  data: BidData[];
  total: number;
  page: number;
  hasMore: boolean;
  error?: string;
}

// 爬虫统计
export interface CrawlerStats {
  platform: string;
  startTime: Date;
  endTime?: Date;
  totalPages: number;
  totalItems: number;
  savedItems: number;
  duplicateItems: number;
  errorItems: number;
  errors: string[];
}

// 公告类型映射（各平台类型 -> 标准类型）
export type AnnouncementTypeMap = Record<string, AnnouncementType>;
