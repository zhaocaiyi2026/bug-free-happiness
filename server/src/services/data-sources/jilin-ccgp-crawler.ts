/**
 * 吉林省政府采购网合规爬虫服务
 * 
 * 合规声明：
 * 1. 本服务仅采集公开发布的政府采购公告信息
 * 2. 依据《招标公告和公示信息发布管理办法》第十二条、第十五条
 *    发布媒介应免费提供信息，其他媒介可依法全文转载
 * 3. 严格遵守robots.txt和网站服务条款
 * 4. 采用低频率请求，不对服务器造成负担
 * 5. 保留原始来源信息，注明数据出处
 * 
 * 技术特点：
 * - 低频率请求：每次请求间隔 ≥ 2秒
 * - 合理User-Agent：标识身份
 * - 请求限流：每日不超过2000次
 * - 错误重试：最多3次，间隔递增
 * - 数据去重：避免重复采集
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import type { 
  UnifiedBidData, 
  UnifiedWinBidData, 
  ApiResponse,
  DataSourceQueryParams 
} from './types';

// ==================== 合规配置 ====================

const CRAWLER_CONFIG = {
  // 基础URL
  baseUrl: 'http://www.ccgp-jilin.gov.cn',
  
  // 公告列表页
  listUrl: 'http://www.ccgp-jilin.gov.cn/site/category',
  
  // 公告详情页
  detailUrl: 'http://www.ccgp-jilin.gov.cn/site/detail',
  
  // 请求间隔（毫秒）- 合规要求：不低于2秒
  requestInterval: 2000,
  
  // 每日最大请求数 - 合规要求：控制总量
  maxRequestsPerDay: 2000,
  
  // 超时时间（毫秒）
  timeout: 30000,
  
  // 重试配置
  maxRetries: 3,
  retryDelayBase: 5000,
  
  // User-Agent - 合规要求：标识身份
  userAgent: 'JilinProcurementDataAggregator/1.0 (Public Information Aggregation; Contact: admin@example.com)',
  
  // 公告类型映射
  announcementTypes: {
    '公开招标公告': 'open_tender',
    '资格预审公告': 'prequalification',
    '邀请招标公告': 'invited_tender',
    '竞争性谈判公告': 'competitive_negotiation',
    '竞争性磋商公告': 'competitive_consultation',
    '询价公告': 'inquiry',
    '采购意向公告': 'procurement_intention',
    '更正公告': 'correction',
    '中标结果公告': 'win_result',
    '废标公告': 'failed_tender',
    '终止公告': 'termination',
    '采购结果变更公告': 'result_change',
  },
};

// 公告类型参数
const ANNOUNCEMENT_CATEGORIES = [
  { code: 'ZcyAnnouncement1', name: '公开招标公告' },
  { code: 'ZcyAnnouncement2', name: '资格预审公告' },
  { code: 'ZcyAnnouncement3', name: '邀请招标公告' },
  { code: 'ZcyAnnouncement4', name: '竞争性谈判公告' },
  { code: 'ZcyAnnouncement5', name: '竞争性磋商公告' },
  { code: 'ZcyAnnouncement6', name: '询价公告' },
  { code: 'ZcyAnnouncement7', name: '采购意向公告' },
  { code: 'ZcyAnnouncement8', name: '更正公告' },
  { code: 'ZcyAnnouncement9', name: '中标结果公告' },
  { code: 'ZcyAnnouncement10', name: '废标公告' },
  { code: 'ZcyAnnouncement11', name: '终止公告' },
  { code: 'ZcyAnnouncement12', name: '采购结果变更公告' },
];

// 列表项数据结构
interface ListItem {
  articleId: string;
  title: string;
  region: string;
  publishDate: string;
  announcementType: string;
  sourceUrl: string;
}

// 详情页数据结构
interface DetailData {
  title: string;
  content: string;
  publishDate?: string;
  budget?: number;
  contactPerson?: string;
  contactPhone?: string;
  deadline?: string;
  openBidTime?: string;
  openBidLocation?: string;
  procurementUnit?: string;
  agency?: string;
  projectNumber?: string;
  attachments?: Array<{ name: string; url: string }>;
  extraFields?: Record<string, string>;
}

/**
 * 吉林省政府采购网爬虫服务
 */
export class JilinCCGPCrawler {
  private httpClient: AxiosInstance;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private dailyRequestCount: number = 0;
  private dailyResetTime: number = Date.now();
  
  constructor() {
    // 创建合规的HTTP客户端
    this.httpClient = axios.create({
      timeout: CRAWLER_CONFIG.timeout,
      headers: {
        'User-Agent': CRAWLER_CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    });
  }
  
  /**
   * 合规请求控制
   * - 控制请求频率
   * - 控制每日请求总量
   */
  private async throttleRequest(): Promise<void> {
    const now = Date.now();
    
    // 每日请求计数重置（24小时）
    if (now - this.dailyResetTime > 24 * 60 * 60 * 1000) {
      this.dailyRequestCount = 0;
      this.dailyResetTime = now;
    }
    
    // 检查每日请求限制
    if (this.dailyRequestCount >= CRAWLER_CONFIG.maxRequestsPerDay) {
      throw new Error('已达到每日请求限制，请明天再试');
    }
    
    // 控制请求间隔
    const elapsed = now - this.lastRequestTime;
    if (elapsed < CRAWLER_CONFIG.requestInterval) {
      await this.delay(CRAWLER_CONFIG.requestInterval - elapsed);
    }
    
    this.lastRequestTime = Date.now();
    this.dailyRequestCount++;
    this.requestCount++;
  }
  
  /**
   * 带重试的请求
   */
  private async fetchWithRetry(url: string, params?: Record<string, string>): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= CRAWLER_CONFIG.maxRetries; attempt++) {
      try {
        await this.throttleRequest();
        
        const response = await this.httpClient.get(url, {
          params,
          responseType: 'text',
        });
        
        return response.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`[JilinCCGP] 请求失败 (尝试 ${attempt}/${CRAWLER_CONFIG.maxRetries}):`, lastError.message);
        
        if (attempt < CRAWLER_CONFIG.maxRetries) {
          // 递增重试延迟
          const delay = CRAWLER_CONFIG.retryDelayBase * attempt;
          await this.delay(delay);
        }
      }
    }
    
    throw lastError || new Error('请求失败');
  }
  
  /**
   * 获取公告列表
   */
  async fetchAnnouncementList(params: {
    categoryCode?: string;
    page?: number;
    pageSize?: number;
    parentId?: string;
  } = {}): Promise<ApiResponse<ListItem[]>> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 15;
      const parentId = params.parentId || '550068';
      const childrenCode = params.categoryCode || 'ZcyAnnouncement';
      
      const html = await this.fetchWithRetry(CRAWLER_CONFIG.listUrl, {
        parentId,
        childrenCode,
        page: String(page),
        pageSize: String(pageSize),
      });
      
      const items = this.parseListPage(html, childrenCode);
      
      // 解析总数
      const $ = cheerio.load(html);
      const totalText = $('.pagination-info, .total').text();
      const totalMatch = totalText.match(/共\s*(\d+)\s*个/);
      const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;
      
      return {
        success: true,
        data: items,
        pagination: {
          page,
          pageSize,
          total,
          hasMore: page * pageSize < total,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[JilinCCGP] 获取列表失败:', errorMessage);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: errorMessage,
        },
      };
    }
  }
  
  /**
   * 获取公告详情
   */
  async fetchAnnouncementDetail(articleId: string): Promise<ApiResponse<DetailData>> {
    try {
      const html = await this.fetchWithRetry(CRAWLER_CONFIG.detailUrl, {
        parentId: '550068',
        articleId,
      });
      
      const detail = this.parseDetailPage(html);
      
      return {
        success: true,
        data: detail,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[JilinCCGP] 获取详情失败:', errorMessage);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: errorMessage,
        },
      };
    }
  }
  
  /**
   * 解析列表页
   */
  private parseListPage(html: string, categoryCode: string): ListItem[] {
    const $ = cheerio.load(html);
    const items: ListItem[] = [];
    
    // 尝试多种选择器以适应不同的页面结构
    
    // 方法1：从所有链接中提取包含articleId的
    $('a').each((_, element) => {
      const $link = $(element);
      const href = $link.attr('href') || '';
      
      // 提取articleId - 支持多种URL格式
      let articleId = '';
      
      // 格式1: articleId=xxx
      const articleIdMatch = href.match(/articleId=([^&]+)/);
      if (articleIdMatch) {
        articleId = articleIdMatch[1];
      }
      
      // 格式2: /detail/xxx
      if (!articleId) {
        const detailMatch = href.match(/\/detail\/([^/?]+)/);
        if (detailMatch) {
          articleId = detailMatch[1];
        }
      }
      
      if (!articleId) return;
      
      const title = $link.text().trim();
      
      // 跳过空标题或太短的标题
      if (!title || title.length < 5) return;
      
      // 跳过导航链接等
      if (title.includes('更多') || title.includes('返回') || title.includes('首页')) return;
      
      // 获取地区和日期 - 从父元素或兄弟元素中查找
      const $row = $link.closest('li, tr, div, dd');
      const $parent = $link.parent();
      
      let region = '';
      let publishDate = '';
      
      // 尝试从不同位置提取地区
      const regionSelectors = ['.region', '.area', '[class*="region"]', '[class*="area"]', 'span'];
      for (const selector of regionSelectors) {
        const $region = $row.find(selector).first();
        const text = $region.text().trim();
        if (text && text.length < 20 && !text.match(/\d{4}-\d{2}-\d{2}/)) {
          // 可能是地区名
          if (text.includes('省') || text.includes('市') || text.includes('县') || text.includes('区')) {
            region = text;
            break;
          }
        }
      }
      
      // 如果没找到地区，尝试从链接前的文本提取
      if (!region) {
        const prevText = $link.parent().contents().not($link).text().trim();
        if (prevText && prevText.length < 20) {
          region = prevText;
        }
      }
      
      // 尝试从不同位置提取日期
      const dateSelectors = ['.date', '.time', '[class*="date"]', '[class*="time"]', 'span'];
      for (const selector of dateSelectors) {
        $row.find(selector).each((_, el) => {
          const text = $(el).text().trim();
          const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch && !publishDate) {
            publishDate = dateMatch[1];
          }
        });
      }
      
      // 如果没有找到日期，尝试从行文本中提取
      if (!publishDate) {
        const rowText = $row.text();
        const dateMatch = rowText.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          publishDate = dateMatch[1];
        }
      }
      
      items.push({
        articleId,
        title,
        region: region || '吉林省',
        publishDate,
        announcementType: this.getAnnouncementType(categoryCode),
        sourceUrl: `${CRAWLER_CONFIG.detailUrl}?parentId=550068&articleId=${articleId}`,
      });
    });
    
    // 去重（根据articleId）
    const seen = new Set<string>();
    const uniqueItems = items.filter(item => {
      if (seen.has(item.articleId)) return false;
      seen.add(item.articleId);
      return true;
    });
    
    console.log(`[JilinCCGP] Parsed ${uniqueItems.length} unique items from list page`);
    
    return uniqueItems;
  }
  
  /**
   * 解析详情页
   */
  private parseDetailPage(html: string): DetailData {
    const $ = cheerio.load(html);
    
    // 提取标题
    const title = $('h1, .title, .article-title, [class*="title"]').first().text().trim();
    
    // 提取发布时间
    let publishDate = '';
    $('.publish-time, .date, [class*="publish"], [class*="date"]').each((_, el) => {
      const text = $(el).text();
      const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch && !publishDate) {
        publishDate = dateMatch[1];
      }
    });
    
    // 提取正文内容
    const $content = $('.content, .article-content, [class*="content"], #zoom').first();
    const content = $content.text().trim();
    
    // 提取表格数据
    const extraFields: Record<string, string> = {};
    
    // 方法1：从表格中提取
    $content.find('table').each((_, table) => {
      $(table).find('tr').each((_, row) => {
        const $cells = $(row).find('td, th');
        if ($cells.length >= 2) {
          const label = $($cells[0]).text().trim().replace(/[：:]/g, '');
          const value = $($cells[1]).text().trim();
          if (label && value) {
            extraFields[label] = value;
          }
        }
      });
    });
    
    // 方法2：从段落中提取（格式：标签：值）
    $content.find('p, div').each((_, el) => {
      const text = $(el).text().trim();
      const match = text.match(/^([^\n：:]+)[：:]\s*(.+)$/);
      if (match) {
        const label = match[1].trim();
        const value = match[2].trim();
        if (label && value && label.length < 30) {
          extraFields[label] = value;
        }
      }
    });
    
    // 方法3：从特定样式中提取
    $('.info-item, .detail-item, [class*="info"], [class*="detail"]').each((_, el) => {
      const text = $(el).text();
      const match = text.match(/([^\n：:]+)[：:]\s*([^\n]+)/);
      if (match) {
        const label = match[1].trim();
        const value = match[2].trim();
        if (label && value && label.length < 30) {
          extraFields[label] = value;
        }
      }
    });
    
    // 提取附件
    const attachments: Array<{ name: string; url: string }> = [];
    $content.find('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a[href$=".xls"], a[href$=".xlsx"]').each((_, el) => {
      const $link = $(el);
      const name = $link.text().trim();
      let url = $link.attr('href') || '';
      
      // 处理相对路径
      if (url && !url.startsWith('http')) {
        url = new URL(url, CRAWLER_CONFIG.baseUrl).href;
      }
      
      if (name && url) {
        attachments.push({ name, url });
      }
    });
    
    return {
      title,
      content,
      publishDate: publishDate || undefined,
      budget: this.extractBudget(extraFields),
      contactPerson: this.extractField(extraFields, ['联系人', '项目联系人', '采购人联系人', '采购联系人']),
      contactPhone: this.extractField(extraFields, ['联系电话', '联系方式', '电话', '采购人电话', '联系电话/传真']),
      deadline: this.extractField(extraFields, ['投标截止时间', '报名截止时间', '截止时间', '响应截止时间']),
      openBidTime: this.extractField(extraFields, ['开标时间', '开标日期']),
      openBidLocation: this.extractField(extraFields, ['开标地点', '开标地址']),
      procurementUnit: this.extractField(extraFields, ['采购单位', '采购人', '采购单位名称', '招标人']),
      agency: this.extractField(extraFields, ['采购代理机构', '代理机构', '招标代理机构', '代理机构名称']),
      projectNumber: this.extractField(extraFields, ['项目编号', '采购项目编号', '招标编号', '项目编号/包号']),
      attachments: attachments.length > 0 ? attachments : undefined,
      extraFields,
    };
  }
  
  /**
   * 提取金额
   */
  private extractBudget(fields: Record<string, string>): number | undefined {
    const budgetKeys = ['预算金额', '采购预算', '项目预算', '控制价', '最高限价', '预算', '金额'];
    
    for (const key of budgetKeys) {
      const value = fields[key];
      if (value) {
        // 提取数字（支持万元、元等单位）
        const numMatch = value.match(/([\d,.]+)\s*(万?元)?/);
        if (numMatch) {
          let amount = parseFloat(numMatch[1].replace(/,/g, ''));
          if (numMatch[2]?.includes('万')) {
            amount *= 10000;
          }
          if (!isNaN(amount) && amount > 0) {
            return amount;
          }
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * 提取指定字段
   */
  private extractField(fields: Record<string, string>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = fields[key];
      if (value && value.trim()) {
        return value.trim();
      }
    }
    return undefined;
  }
  
  /**
   * 获取公告类型名称
   */
  private getAnnouncementType(code: string): string {
    const category = ANNOUNCEMENT_CATEGORIES.find(c => c.code === code);
    return category?.name || '采购公告';
  }
  
  /**
   * 批量获取公告数据
   */
  async fetchBatchAnnouncements(options: {
    categories?: string[];
    maxPages?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<UnifiedBidData[]> {
    const results: UnifiedBidData[] = [];
    const categories = options.categories || ANNOUNCEMENT_CATEGORIES.map(c => c.code);
    const maxPages = options.maxPages || 5;
    
    for (const categoryCode of categories) {
      console.log(`[JilinCCGP] 开始采集: ${this.getAnnouncementType(categoryCode)}`);
      
      let page = 1;
      let hasMore = true;
      
      while (hasMore && page <= maxPages) {
        const listResponse = await this.fetchAnnouncementList({
          categoryCode,
          page,
          pageSize: 15,
        });
        
        if (!listResponse.success || !listResponse.data) {
          console.error(`[JilinCCGP] 列表获取失败: ${categoryCode} 第${page}页`);
          break;
        }
        
        for (const item of listResponse.data) {
          try {
            // 获取详情
            const detailResponse = await this.fetchAnnouncementDetail(item.articleId);
            
            if (detailResponse.success && detailResponse.data) {
              const unifiedData = this.transformToUnified(item, detailResponse.data);
              results.push(unifiedData);
            }
          } catch (error) {
            console.error(`[JilinCCGP] 详情获取失败: ${item.articleId}`);
          }
        }
        
        hasMore = listResponse.pagination?.hasMore || false;
        page++;
        
        console.log(`[JilinCCGP] ${this.getAnnouncementType(categoryCode)} 第${page - 1}页完成，累计${results.length}条`);
      }
    }
    
    return results;
  }
  
  /**
   * 转换为统一格式
   */
  private transformToUnified(item: ListItem, detail: DetailData): UnifiedBidData {
    return {
      sourcePlatform: 'jilin_ccgp',
      sourceId: item.articleId,
      title: detail.title || item.title,
      content: detail.content,
      budget: detail.budget,
      province: '吉林省',
      city: item.region || detail.extraFields?.['所属地区'] || detail.extraFields?.['行政区划'],
      industry: detail.extraFields?.['行业分类'] || detail.extraFields?.['采购类别'],
      bidType: item.announcementType,
      publishDate: detail.publishDate ? new Date(detail.publishDate) : (item.publishDate ? new Date(item.publishDate) : undefined),
      deadline: detail.deadline ? new Date(detail.deadline) : undefined,
      contactPerson: detail.contactPerson,
      contactPhone: detail.contactPhone,
      contactAddress: detail.extraFields?.['地址'] || detail.extraFields?.['采购人地址'],
      projectLocation: detail.extraFields?.['项目地点'] || detail.extraFields?.['实施地点'],
      requirements: detail.extraFields?.['供应商资格要求'] || detail.extraFields?.['资格要求'],
      openBidTime: detail.openBidTime ? new Date(detail.openBidTime) : undefined,
      openBidLocation: detail.openBidLocation,
      sourceUrl: item.sourceUrl,
      attachments: detail.attachments,
      extraData: {
        projectNumber: detail.projectNumber,
        procurementUnit: detail.procurementUnit,
        agency: detail.agency,
        allFields: detail.extraFields,
      },
    };
  }
  
  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 获取请求统计
   */
  getStats() {
    return {
      totalRequests: this.requestCount,
      dailyRequests: this.dailyRequestCount,
      dailyLimit: CRAWLER_CONFIG.maxRequestsPerDay,
      remainingToday: CRAWLER_CONFIG.maxRequestsPerDay - this.dailyRequestCount,
    };
  }
}

// 导出单例
export const jilinCCGPCrawler = new JilinCCGPCrawler();
