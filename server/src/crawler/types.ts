/**
 * 招标信息爬虫系统 - 类型定义
 * 
 * 法律合规说明：
 * 1. 本系统仅爬取公开的招标公告信息
 * 2. 遵守robots.txt协议
 * 3. 设置合理的请求间隔（3-5秒）
 * 4. 标注数据来源
 */

// 招标信息结构
export interface BidInfo {
  title: string;              // 招标标题
  content?: string;           // 招标内容
  budget?: number;            // 预算金额
  province?: string;          // 省份
  city?: string;              // 城市
  industry?: string;          // 行业分类
  bidType?: string;           // 招标类型
  publishDate?: string;       // 发布日期
  deadline?: string;          // 截止日期
  source: string;             // 来源网站名称
  sourceUrl: string;          // 来源URL
  isUrgent?: boolean;         // 是否紧急
  // 联系人信息
  contactPerson?: string;     // 联系人
  contactPhone?: string;      // 联系电话
  contactEmail?: string;      // 联系邮箱
  contactAddress?: string;    // 联系地址
  // 详细信息
  projectLocation?: string;   // 项目地点
  requirements?: string;      // 资质要求
  openBidTime?: string;       // 开标时间
  openBidLocation?: string;   // 开标地点
}

// 中标信息结构
export interface WinBidInfo {
  title: string;              // 中标标题
  content?: string;           // 中标内容
  winAmount?: number;         // 中标金额
  province?: string;          // 省份
  city?: string;              // 城市
  industry?: string;          // 行业分类
  bidType?: string;           // 招标方式
  // 中标单位信息
  winCompany?: string;        // 中标单位名称
  winCompanyAddress?: string; // 中标单位地址
  winCompanyPhone?: string;   // 中标单位电话
  // 项目信息
  projectLocation?: string;   // 项目地点
  // 日期
  winDate?: string;           // 中标日期
  publishDate?: string;       // 公告日期
  // 来源
  source: string;             // 来源网站名称
  sourceUrl: string;          // 来源URL
}

// 解析器配置
export interface ParserConfig {
  name: string;               // 解析器名称
  baseUrl: string;            // 网站基础URL
  listUrl: string;            // 列表页URL模板
  robotsTxt?: string;         // robots.txt URL
  requestDelay: number;       // 请求间隔（毫秒）
  maxPages: number;           // 最大爬取页数
  enabled: boolean;           // 是否启用
  schedule: string;           // cron表达式
}

// 爬取结果
export interface CrawlResult {
  success: boolean;
  source: string;
  count: number;
  data: BidInfo[];
  error?: string;
  duration: number;           // 爬取耗时（毫秒）
}

// 中标爬取结果
export interface WinBidCrawlResult {
  success: boolean;
  source: string;
  count: number;
  data: WinBidInfo[];
  error?: string;
  duration: number;
}

// 爬虫状态
export interface CrawlerStatus {
  isRunning: boolean;
  lastRunTime?: string;
  nextRunTime?: string;
  totalCrawled: number;
  successCount: number;
  errorCount: number;
  sources: SourceStatus[];
}

// 数据源状态
export interface SourceStatus {
  name: string;
  enabled: boolean;
  lastCrawlTime?: string;
  lastCrawlCount?: number;
  lastError?: string;
}

// 爬虫日志
export interface CrawlLog {
  id: string;
  source: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'success' | 'failed';
  crawledCount: number;
  savedCount: number;
  error?: string;
}
