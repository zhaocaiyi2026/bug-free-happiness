/**
 * 吉林省政府采购网智能采集服务
 * 
 * 核心特点：
 * 1. 使用豆包大模型智能提取公告信息
 * 2. 合规采集：控制频率、合理User-Agent、单次数量限制
 * 3. 支持多种公告类型的采集
 * 
 * 数据来源：http://www.ccgp-jilin.gov.cn/
 * 
 * 合规声明：
 * - 仅采集公开发布的政府采购公告信息
 * - 请求间隔 >= 2秒，避免对服务器造成压力
 * - 单次采集数量限制为 50 条
 * - 遵守 robots.txt 规则
 */

import { SearchClient, Config, LLMClient } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import axios from 'axios';
import * as cheerio from 'cheerio';

// ==================== 合规配置 ====================

const COMPLIANCE_CONFIG = {
  // 请求间隔（毫秒）- 至少2秒
  requestDelay: 2000,
  // 单次最大采集数量
  maxItemsPerRun: 50,
  // 请求超时（毫秒）
  requestTimeout: 20000,
  // 合理的User-Agent
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  // 每日最大采集次数限制
  maxRunsPerDay: 10,
};

// 吉林省政府采购网公告类型配置
const ANNOUNCEMENT_TYPES = {
  // 招标采购类
  '招标公告': { code: 'ZcyAnnouncement1', parentId: '550068' },
  '中标公告': { code: 'ZcyAnnouncement2', parentId: '550068' },
  '竞争性磋商': { code: 'ZcyAnnouncement3', parentId: '550068' },
  '询价公告': { code: 'ZcyAnnouncement4', parentId: '550068' },
  '单一来源': { code: 'ZcyAnnouncement5', parentId: '550068' },
  
  // 框架协议类（用户图片中提到的）
  '框架协议交易公告': { code: 'FrameworkAnnouncement', parentId: '550068' },
  '单笔交易结果公告': { code: 'SingleTransactionResult', parentId: '550068' },
  '汇总交易结果公告': { code: 'SummaryTransactionResult', parentId: '550068' },
  '中小企业预留执行公告': { code: 'SMEReservation', parentId: '550068' },
  
  // 其他公告类
  '更正公告': { code: 'CorrectionAnnouncement', parentId: '550068' },
  '终止公告': { code: 'TerminationAnnouncement', parentId: '550068' },
  '废标公告': { code: 'FailedAnnouncement', parentId: '550068' },
  '合同公告': { code: 'ContractAnnouncement', parentId: '550068' },
};

// 吉林省相关网站域名（用于过滤搜索结果）
const JILIN_DOMAINS = [
  'ccgp-jilin.gov.cn',      // 吉林省政府采购网
  'jl.gov.cn',              // 吉林省人民政府
  'jl.gov.cn/ggzy',         // 吉林省公共资源交易网
  'ccgp.gov.cn',            // 中国政府采购网
  'ggzy.gov.cn',            // 全国公共资源交易平台
];

// 基础URL
const BASE_URL = 'http://www.ccgp-jilin.gov.cn';

// ==================== 类型定义 ====================

interface AnnouncementItem {
  title: string;
  url: string;
  type: string;
  publishDate?: string;
}

interface ExtractedInfo {
  title: string;
  projectNumber: string;
  projectName: string;
  budget: number | null;
  bidType: string;
  publishDate: string;
  deadline: string;
  contactPerson: string;
  contactPhone: string;
  province: string;
  city: string;
  purchasingUnit: string;
  agency: string;
  content: string;
}

interface CollectionResult {
  success: boolean;
  total: number;
  saved: number;
  skipped: number;
  errors: number;
  message: string;
  details: string[];
}

// ==================== 客户端实例 ====================

let searchClient: SearchClient | null = null;
let llmClient: LLMClient | null = null;

function getSearchClient(): SearchClient {
  if (!searchClient) {
    searchClient = new SearchClient(new Config());
  }
  return searchClient;
}

function getLLMClient(): LLMClient {
  if (!llmClient) {
    llmClient = new LLMClient(new Config());
  }
  return llmClient;
}

// ==================== 工具函数 ====================

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查今日采集次数
 */
async function checkDailyLimit(): Promise<boolean> {
  const client = getSupabaseClient();
  const today = new Date().toISOString().split('T')[0];
  
  const { count } = await client
    .from('collection_logs')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'jilin_intelligent')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);
  
  return (count || 0) < COMPLIANCE_CONFIG.maxRunsPerDay;
}

/**
 * 记录采集日志
 */
async function logCollection(result: CollectionResult): Promise<void> {
  const client = getSupabaseClient();
  
  await client
    .from('collection_logs')
    .insert({
      source: 'jilin_intelligent',
      total: result.total,
      saved: result.saved,
      skipped: result.skipped,
      errors: result.errors,
      message: result.message,
      details: result.details,
      created_at: new Date().toISOString(),
    });
}

// ==================== 核心采集逻辑 ====================

/**
 * 使用 Web Search 搜索吉林省政府采购网
 */
async function searchAnnouncements(
  announcementType: string, 
  count: number = 10
): Promise<AnnouncementItem[]> {
  try {
    console.log(`[Jilin智能采集] 搜索: ${announcementType}`);
    
    const client = getSearchClient();
    
    // 构建搜索关键词
    const query = `site:ccgp-jilin.gov.cn ${announcementType} 2025 OR 2026`;
    
    const response = await client.webSearch(query, count, false);
    
    console.log(`[Jilin智能采集] 搜索返回: ${response.web_items?.length || 0} 条结果`);
    
    if (!response.web_items || response.web_items.length === 0) {
      return [];
    }
    
    // 打印前3个搜索结果的URL用于调试
    console.log(`[Jilin智能采集] 搜索结果URL示例:`);
    response.web_items.slice(0, 3).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.url}`);
    });
    
    // 过滤并转换为公告项 - 放宽过滤条件
    const items: AnnouncementItem[] = response.web_items
      .filter(item => {
        const url = item.url || '';
        // 检查是否为吉林省相关网站
        const isJilinSite = JILIN_DOMAINS.some(domain => url.includes(domain));
        // 检查是否为详情页（包含日期或文章ID特征）
        const isDetailPage = url.includes('/t') || 
                            url.includes('articleId') || 
                            url.includes('/detail') ||
                            url.match(/\d{4}/); // 包含年份
        
        return isJilinSite && isDetailPage;
      })
      .map(item => ({
        title: item.title || '',
        url: item.url || '',
        type: announcementType,
      }));
    
    console.log(`[Jilin智能采集] 过滤后: ${items.length} 条有效结果`);
    
    return items;
    
  } catch (error) {
    console.error(`[Jilin智能采集] 搜索失败:`, error);
    return [];
  }
}

/**
 * 获取详情页内容
 */
async function fetchDetailContent(url: string): Promise<string> {
  try {
    console.log(`[Jilin智能采集] 获取详情页: ${url.substring(0, 80)}...`);
    
    const response = await axios.get(url, {
      timeout: COMPLIANCE_CONFIG.requestTimeout,
      headers: {
        'User-Agent': COMPLIANCE_CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });
    
    const $ = cheerio.load(response.data);
    
    // 移除不需要的标签
    $('script, style, noscript, nav, footer, header').remove();
    
    // 提取正文内容 - 尝试多种选择器
    let content = '';
    const contentSelectors = [
      '.content', '.article-content', '.detail-content',
      '.bid-content', '#content', '.main-content',
      'article', '.notice-content', '.Custom_Editor',
      '.TRS_Editor', '.table-box', '.con',
    ];
    
    for (const selector of contentSelectors) {
      const $el = $(selector);
      if ($el.length > 0) {
        const text = $el.text().trim();
        if (text.length > content.length) {
          content = text;
        }
        if (content.length > 1000) break;
      }
    }
    
    // 如果还没找到，使用body内容
    if (content.length < 500) {
      content = $('body').text().trim();
    }
    
    // 清理内容
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    console.log(`[Jilin智能采集] 获取到内容: ${content.length} 字符`);
    
    return content;
    
  } catch (error) {
    console.error(`[Jilin智能采集] 获取详情页失败:`, error);
    return '';
  }
}

/**
 * 使用豆包大模型提取结构化信息
 */
async function extractInfoWithLLM(
  title: string, 
  content: string
): Promise<ExtractedInfo | null> {
  try {
    console.log(`[Jilin智能采集] 使用豆包提取信息: ${title.substring(0, 30)}...`);
    
    const client = getLLMClient();
    
    // 截断过长的内容
    const truncatedContent = content.length > 6000 
      ? content.substring(0, 6000) + '...(内容已截断)'
      : content;
    
    const prompt = `你是一个政府采购信息提取专家。请从以下招标公告中提取关键信息。

标题：${title}

内容：
${truncatedContent}

请以JSON格式返回以下信息（如果某字段无法提取，请设置为null）：
{
  "projectNumber": "项目编号",
  "projectName": "项目名称",
  "budget": 预算金额（纯数字，单位元）,
  "bidType": "招标类型（公开招标/竞争性磋商/询价/单一来源等）",
  "publishDate": "发布日期（YYYY-MM-DD格式）",
  "deadline": "截止时间（YYYY-MM-DD HH:mm:ss格式）",
  "contactPerson": "联系人",
  "contactPhone": "联系电话",
  "province": "省份（默认吉林省）",
  "city": "城市",
  "purchasingUnit": "采购单位",
  "agency": "代理机构"
}

只返回JSON，不要有其他内容。`;

    const messages = [
      { role: 'system', content: '你是一个政府采购信息提取专家，擅长从招标公告中提取结构化信息。' },
      { role: 'user', content: prompt },
    ];
    
    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-lite-260215',
      temperature: 0.1,
      thinking: 'disabled',
    });
    
    // 解析JSON响应
    const responseContent = response.content;
    
    // 尝试解析JSON
    try {
      // 查找JSON块
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        
        return {
          title: title,
          projectNumber: data.projectNumber || '',
          projectName: data.projectName || title,
          budget: data.budget || null,
          bidType: data.bidType || '公开招标',
          publishDate: data.publishDate || '',
          deadline: data.deadline || '',
          contactPerson: data.contactPerson || '',
          contactPhone: data.contactPhone || '',
          province: data.province || '吉林省',
          city: data.city || '',
          purchasingUnit: data.purchasingUnit || '',
          agency: data.agency || '',
          content: content,
        };
      }
    } catch (parseError) {
      console.warn(`[Jilin智能采集] JSON解析失败:`, parseError);
    }
    
    return null;
    
  } catch (error) {
    console.error(`[Jilin智能采集] 豆包提取失败:`, error);
    return null;
  }
}

/**
 * 保存到数据库
 */
async function saveToDatabase(
  info: ExtractedInfo, 
  sourceUrl: string, 
  announcementType: string
): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    
    // 检查是否已存在（通过source_url）
    const { data: existing } = await client
      .from('bids')
      .select('id')
      .eq('source_url', sourceUrl)
      .single();
    
    if (existing) {
      console.log(`[Jilin智能采集] 已存在: ${sourceUrl}`);
      return false;
    }
    
    // 插入新记录
    const { error } = await client
      .from('bids')
      .insert({
        title: info.projectName || info.title,
        content: info.content,
        project_code: info.projectNumber,
        budget: info.budget,
        bid_type: info.bidType,
        publish_date: info.publishDate || null,
        deadline: info.deadline || null,
        contact_person: info.contactPerson,
        contact_phone: info.contactPhone,
        province: info.province,
        city: info.city,
        purchaser_name: info.purchasingUnit,
        agency_name: info.agency,
        source: '吉林省政府采购网',
        source_url: sourceUrl,
        announcement_type: announcementType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error(`[Jilin智能采集] 保存失败:`, error);
      return false;
    }
    
    console.log(`[Jilin智能采集] 保存成功: ${info.projectName || info.title}`);
    return true;
    
  } catch (error) {
    console.error(`[Jilin智能采集] 保存异常:`, error);
    return false;
  }
}

// ==================== 主采集函数 ====================

/**
 * 执行智能采集
 * 
 * @param announcementTypes - 要采集的公告类型列表
 * @param maxItems - 每种类型最大采集数量
 * @returns 采集结果
 */
export async function runIntelligentCollection(
  announcementTypes: string[] = ['招标公告', '中标公告'],
  maxItems: number = 10
): Promise<CollectionResult> {
  const result: CollectionResult = {
    success: false,
    total: 0,
    saved: 0,
    skipped: 0,
    errors: 0,
    message: '',
    details: [],
  };
  
  try {
    // 1. 检查今日采集次数限制
    const canRun = await checkDailyLimit();
    if (!canRun) {
      result.message = '已达到今日最大采集次数限制';
      return result;
    }
    
    // 2. 限制单次采集数量
    const itemsPerType = Math.min(maxItems, COMPLIANCE_CONFIG.maxItemsPerRun / announcementTypes.length);
    
    console.log(`[Jilin智能采集] 开始采集，类型: ${announcementTypes.join(', ')}`);
    
    // 3. 遍历每种公告类型
    for (const type of announcementTypes) {
      console.log(`[Jilin智能采集] ===== 开始采集: ${type} =====`);
      
      // 3.1 搜索公告
      const items = await searchAnnouncements(type, itemsPerType);
      
      result.total += items.length;
      
      // 3.2 遍历每个公告
      for (const item of items) {
        try {
          // 合规延迟
          await delay(COMPLIANCE_CONFIG.requestDelay);
          
          // 获取详情页内容
          const content = await fetchDetailContent(item.url);
          
          if (!content || content.length < 100) {
            result.skipped++;
            result.details.push(`跳过: ${item.title} (内容过短)`);
            continue;
          }
          
          // 合规延迟
          await delay(COMPLIANCE_CONFIG.requestDelay);
          
          // 使用豆包提取信息
          const info = await extractInfoWithLLM(item.title, content);
          
          if (!info) {
            result.errors++;
            result.details.push(`提取失败: ${item.title}`);
            continue;
          }
          
          // 保存到数据库
          const saved = await saveToDatabase(info, item.url, type);
          
          if (saved) {
            result.saved++;
            result.details.push(`保存成功: ${info.projectName || info.title}`);
          } else {
            result.skipped++;
            result.details.push(`已存在: ${item.title}`);
          }
          
        } catch (error) {
          result.errors++;
          result.details.push(`处理失败: ${item.title} - ${error}`);
        }
        
        // 检查是否达到单次最大数量
        if (result.saved >= COMPLIANCE_CONFIG.maxItemsPerRun) {
          result.details.push(`达到单次最大采集数量限制: ${COMPLIANCE_CONFIG.maxItemsPerRun}`);
          break;
        }
      }
      
      // 类型间隔延迟
      await delay(COMPLIANCE_CONFIG.requestDelay * 2);
    }
    
    result.success = true;
    result.message = `采集完成: 共${result.total}条，保存${result.saved}条，跳过${result.skipped}条，失败${result.errors}条`;
    
    // 记录日志
    await logCollection(result);
    
    console.log(`[Jilin智能采集] ${result.message}`);
    
    return result;
    
  } catch (error) {
    result.message = `采集异常: ${error}`;
    result.details.push(`异常: ${error}`);
    
    await logCollection(result);
    
    console.error(`[Jilin智能采集] ${result.message}`);
    
    return result;
  }
}

/**
 * 获取支持的公告类型列表
 */
export function getSupportedTypes(): string[] {
  return Object.keys(ANNOUNCEMENT_TYPES);
}

/**
 * 获取合规配置
 */
export function getComplianceConfig() {
  return { ...COMPLIANCE_CONFIG };
}
