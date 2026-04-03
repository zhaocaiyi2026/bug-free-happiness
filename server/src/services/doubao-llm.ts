/**
 * 豆包大模型招标信息提取服务
 * 从网页内容提取结构化招标信息
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import type { Message, LLMResponse } from 'coze-coding-dev-sdk';
import axios from 'axios';
import * as cheerio from 'cheerio';

// 提取结果类型
export interface ExtractedBidInfo {
  title: string;
  project_name?: string;
  project_code?: string;
  budget?: number;
  province?: string;
  city?: string;
  industry?: string;
  bid_type?: string;
  publish_date?: string;
  deadline?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_address?: string;
  requirements?: string;
  bid_scope?: string;
  construction_period?: string;
  bid_unit?: string;
  bid_agency?: string;
  source_url?: string;
  raw_content?: string;
}

// 提取结果类型（中标）
export interface ExtractedWinBidInfo {
  title: string;
  project_name?: string;
  project_code?: string;
  win_company?: string;
  win_amount?: number;
  bid_unit?: string;
  bid_agency?: string;
  publish_date?: string;
  contact_person?: string;
  contact_phone?: string;
  source_url?: string;
  raw_content?: string;
}

// LLM配置
const DEFAULT_MODEL = 'doubao-seed-2-0-lite-260215';
const PRO_MODEL = 'doubao-seed-2-0-pro-260215';

// 招标信息提取Prompt
const BID_EXTRACTION_PROMPT = `你是一个专业的招标信息提取助手。请从以下网页内容中提取招标公告的结构化信息。

请提取以下字段（如果存在）：
- title: 公告标题
- project_name: 项目名称
- project_code: 项目编号
- budget: 项目预算金额（数字，单位为元，如无单位默认为元）
- province: 省份
- city: 城市
- industry: 所属行业（如：工程建设、政府采购、医疗器械等）
- bid_type: 招标类型（如：公开招标、竞争性谈判、询价采购等）
- publish_date: 公告发布日期（格式：YYYY-MM-DD）
- deadline: 投标截止时间/开标时间（格式：YYYY-MM-DD HH:mm:ss 或 YYYY-MM-DD）
- contact_person: 联系人姓名
- contact_phone: 联系电话
- contact_address: 联系地址
- requirements: 资格要求
- bid_scope: 招标范围/采购内容
- construction_period: 工期/交付时间
- bid_unit: 招标单位名称
- bid_agency: 招标代理机构名称

请以JSON格式返回结果，只返回JSON，不要有其他内容。如果某个字段无法提取，请设置为null。

网页内容：
`;

// 中标信息提取Prompt
const WIN_BID_EXTRACTION_PROMPT = `你是一个专业的中标信息提取助手。请从以下网页内容中提取中标公告的结构化信息。

请提取以下字段（如果存在）：
- title: 公告标题
- project_name: 项目名称
- project_code: 项目编号
- win_company: 中标单位名称
- win_amount: 中标金额（数字，单位为元）
- bid_unit: 招标单位名称
- bid_agency: 招标代理机构名称
- publish_date: 公告发布日期（格式：YYYY-MM-DD）
- contact_person: 联系人姓名
- contact_phone: 联系电话

请以JSON格式返回结果，只返回JSON，不要有其他内容。如果某个字段无法提取，请设置为null。

网页内容：
`;

// LLM客户端
let llmClient: LLMClient | null = null;

/**
 * 获取LLM客户端
 */
function getLLMClient(): LLMClient {
  if (!llmClient) {
    const config = new Config();
    llmClient = new LLMClient(config);
  }
  return llmClient;
}

/**
 * 获取网页内容
 */
async function fetchWebContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });

    const html = response.data;
    
    // 使用cheerio解析HTML，提取正文内容
    const $ = cheerio.load(html);
    
    // 移除脚本、样式、导航等无关内容
    $('script, style, nav, header, footer, .nav, .header, .footer, .sidebar, .menu, .advertisement, .ads').remove();
    
    // 尝试提取主要内容区域
    let content = '';
    
    // 常见的内容区域选择器
    const contentSelectors = [
      '.content', '.article', '.detail', '.main-content', '.post-content',
      '#content', '#article', '#detail', '#main-content',
      'article', '.entry-content', '.post-body', '.news-content',
      '.cont', '.txt', '.text', '.body'
    ];
    
    for (const selector of contentSelectors) {
      const selected = $(selector).first();
      if (selected.length > 0 && selected.text().trim().length > 100) {
        content = selected.text().trim();
        break;
      }
    }
    
    // 如果没找到特定区域，提取body内容
    if (!content || content.length < 100) {
      content = $('body').text().trim();
    }
    
    // 清理多余空白
    content = content.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n');
    
    // 限制内容长度（避免超过模型token限制）
    if (content.length > 10000) {
      content = content.substring(0, 10000) + '...';
    }
    
    return content;
  } catch (error) {
    console.error('[DoubaoLLM] 获取网页内容失败:', error);
    throw new Error(`获取网页内容失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 使用LLM提取招标信息
 */
async function extractWithLLM(
  content: string,
  promptType: 'bid' | 'win_bid',
  useProModel: boolean = false
): Promise<string> {
  const client = getLLMClient();
  
  const systemPrompt = promptType === 'bid' 
    ? '你是一个专业的招标信息提取助手，擅长从网页内容中提取结构化信息。'
    : '你是一个专业的中标信息提取助手，擅长从网页内容中提取结构化信息。';
  
  const userPrompt = promptType === 'bid'
    ? BID_EXTRACTION_PROMPT + content
    : WIN_BID_EXTRACTION_PROMPT + content;
  
  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  
  const llmConfig = {
    model: useProModel ? PRO_MODEL : DEFAULT_MODEL,
    temperature: 0.1, // 低温度，保证输出稳定性
    thinking: 'disabled' as const,
  };
  
  try {
    console.log(`[DoubaoLLM] 开始提取${promptType === 'bid' ? '招标' : '中标'}信息，使用模型: ${llmConfig.model}`);
    
    const response: LLMResponse = await client.invoke(messages, llmConfig);
    
    console.log('[DoubaoLLM] 提取完成');
    
    return response.content;
  } catch (error) {
    console.error('[DoubaoLLM] LLM调用失败:', error);
    throw new Error(`LLM调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 解析JSON响应
 */
function parseJsonResponse(response: string): Record<string, unknown> | null {
  try {
    // 尝试直接解析
    return JSON.parse(response);
  } catch {
    // 尝试提取JSON块
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // 继续尝试其他方式
      }
    }
    
    // 尝试找到第一个 { 和最后一个 }
    const firstBrace = response.indexOf('{');
    const lastBrace = response.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(response.substring(firstBrace, lastBrace + 1));
      } catch {
        // 解析失败
      }
    }
    
    console.warn('[DoubaoLLM] 无法解析JSON响应');
    return null;
  }
}

/**
 * 解析金额
 */
function parseBudget(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return undefined;
  
  // 移除千分位分隔符
  let cleaned = value.replace(/,/g, '');
  
  // 处理"万元"、"亿元"等单位
  if (cleaned.includes('万')) {
    const match = cleaned.match(/[\d.]+/);
    if (match) {
      return parseFloat(match[0]) * 10000;
    }
  }
  
  if (cleaned.includes('亿')) {
    const match = cleaned.match(/[\d.]+/);
    if (match) {
      return parseFloat(match[0]) * 100000000;
    }
  }
  
  // 提取数字
  const match = cleaned.match(/[\d.]+/);
  if (match) {
    return parseFloat(match[0]);
  }
  
  return undefined;
}

/**
 * 解析日期
 */
function parseDate(value: unknown): string | undefined {
  if (!value) return undefined;
  
  const dateStr = String(value);
  
  // 尝试匹配 YYYY-MM-DD 格式
  const match = dateStr.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return undefined;
}

/**
 * 从URL提取招标信息
 */
export async function extractBidInfoFromUrl(
  url: string,
  useProModel: boolean = false
): Promise<ExtractedBidInfo | null> {
  try {
    console.log(`[DoubaoLLM] 从URL提取招标信息: ${url}`);
    
    // 1. 获取网页内容
    const content = await fetchWebContent(url);
    
    if (!content || content.length < 50) {
      console.warn('[DoubaoLLM] 网页内容过短');
      return null;
    }
    
    // 2. 使用LLM提取信息
    const llmResponse = await extractWithLLM(content, 'bid', useProModel);
    
    // 3. 解析JSON响应
    const parsed = parseJsonResponse(llmResponse);
    
    if (!parsed) {
      console.warn('[DoubaoLLM] 无法解析提取结果');
      return null;
    }
    
    // 4. 构建返回结果
    const result: ExtractedBidInfo = {
      title: String(parsed.title || ''),
      project_name: parsed.project_name ? String(parsed.project_name) : undefined,
      project_code: parsed.project_code ? String(parsed.project_code) : undefined,
      budget: parseBudget(parsed.budget),
      province: parsed.province ? String(parsed.province) : undefined,
      city: parsed.city ? String(parsed.city) : undefined,
      industry: parsed.industry ? String(parsed.industry) : undefined,
      bid_type: parsed.bid_type ? String(parsed.bid_type) : undefined,
      publish_date: parseDate(parsed.publish_date),
      deadline: parseDate(parsed.deadline),
      contact_person: parsed.contact_person ? String(parsed.contact_person) : undefined,
      contact_phone: parsed.contact_phone ? String(parsed.contact_phone) : undefined,
      contact_address: parsed.contact_address ? String(parsed.contact_address) : undefined,
      requirements: parsed.requirements ? String(parsed.requirements) : undefined,
      bid_scope: parsed.bid_scope ? String(parsed.bid_scope) : undefined,
      construction_period: parsed.construction_period ? String(parsed.construction_period) : undefined,
      bid_unit: parsed.bid_unit ? String(parsed.bid_unit) : undefined,
      bid_agency: parsed.bid_agency ? String(parsed.bid_agency) : undefined,
      source_url: url,
      raw_content: content.substring(0, 500), // 保存部分原始内容
    };
    
    // 过滤空值
    const filteredResult = Object.fromEntries(
      Object.entries(result).filter(([_, v]) => v !== undefined && v !== '' && v !== null)
    );
    
    console.log('[DoubaoLLM] 提取结果:', JSON.stringify(filteredResult, null, 2));
    
    return filteredResult as ExtractedBidInfo;
  } catch (error) {
    console.error('[DoubaoLLM] 提取失败:', error);
    throw error;
  }
}

/**
 * 从URL提取中标信息
 */
export async function extractWinBidInfoFromUrl(
  url: string,
  useProModel: boolean = false
): Promise<ExtractedWinBidInfo | null> {
  try {
    console.log(`[DoubaoLLM] 从URL提取中标信息: ${url}`);
    
    // 1. 获取网页内容
    const content = await fetchWebContent(url);
    
    if (!content || content.length < 50) {
      console.warn('[DoubaoLLM] 网页内容过短');
      return null;
    }
    
    // 2. 使用LLM提取信息
    const llmResponse = await extractWithLLM(content, 'win_bid', useProModel);
    
    // 3. 解析JSON响应
    const parsed = parseJsonResponse(llmResponse);
    
    if (!parsed) {
      console.warn('[DoubaoLLM] 无法解析提取结果');
      return null;
    }
    
    // 4. 构建返回结果
    const result: ExtractedWinBidInfo = {
      title: String(parsed.title || ''),
      project_name: parsed.project_name ? String(parsed.project_name) : undefined,
      project_code: parsed.project_code ? String(parsed.project_code) : undefined,
      win_company: parsed.win_company ? String(parsed.win_company) : undefined,
      win_amount: parseBudget(parsed.win_amount),
      bid_unit: parsed.bid_unit ? String(parsed.bid_unit) : undefined,
      bid_agency: parsed.bid_agency ? String(parsed.bid_agency) : undefined,
      publish_date: parseDate(parsed.publish_date),
      contact_person: parsed.contact_person ? String(parsed.contact_person) : undefined,
      contact_phone: parsed.contact_phone ? String(parsed.contact_phone) : undefined,
      source_url: url,
      raw_content: content.substring(0, 500),
    };
    
    // 过滤空值
    const filteredResult = Object.fromEntries(
      Object.entries(result).filter(([_, v]) => v !== undefined && v !== '' && v !== null)
    );
    
    console.log('[DoubaoLLM] 中标提取结果:', JSON.stringify(filteredResult, null, 2));
    
    return filteredResult as ExtractedWinBidInfo;
  } catch (error) {
    console.error('[DoubaoLLM] 中标提取失败:', error);
    throw error;
  }
}

/**
 * 从文本内容提取招标信息（用于RPA工具采集后的处理）
 */
export async function extractBidInfoFromContent(
  content: string,
  useProModel: boolean = false
): Promise<ExtractedBidInfo | null> {
  try {
    console.log(`[DoubaoLLM] 从文本内容提取招标信息，长度: ${content.length}`);
    
    if (!content || content.length < 50) {
      console.warn('[DoubaoLLM] 内容过短');
      return null;
    }
    
    // 使用LLM提取信息
    const llmResponse = await extractWithLLM(content, 'bid', useProModel);
    
    // 解析JSON响应
    const parsed = parseJsonResponse(llmResponse);
    
    if (!parsed) {
      console.warn('[DoubaoLLM] 无法解析提取结果');
      return null;
    }
    
    // 构建返回结果
    const result: ExtractedBidInfo = {
      title: String(parsed.title || ''),
      project_name: parsed.project_name ? String(parsed.project_name) : undefined,
      project_code: parsed.project_code ? String(parsed.project_code) : undefined,
      budget: parseBudget(parsed.budget),
      province: parsed.province ? String(parsed.province) : undefined,
      city: parsed.city ? String(parsed.city) : undefined,
      industry: parsed.industry ? String(parsed.industry) : undefined,
      bid_type: parsed.bid_type ? String(parsed.bid_type) : undefined,
      publish_date: parseDate(parsed.publish_date),
      deadline: parseDate(parsed.deadline),
      contact_person: parsed.contact_person ? String(parsed.contact_person) : undefined,
      contact_phone: parsed.contact_phone ? String(parsed.contact_phone) : undefined,
      contact_address: parsed.contact_address ? String(parsed.contact_address) : undefined,
      requirements: parsed.requirements ? String(parsed.requirements) : undefined,
      bid_scope: parsed.bid_scope ? String(parsed.bid_scope) : undefined,
      construction_period: parsed.construction_period ? String(parsed.construction_period) : undefined,
      bid_unit: parsed.bid_unit ? String(parsed.bid_unit) : undefined,
      bid_agency: parsed.bid_agency ? String(parsed.bid_agency) : undefined,
      raw_content: content.substring(0, 500),
    };
    
    // 过滤空值
    const filteredResult = Object.fromEntries(
      Object.entries(result).filter(([_, v]) => v !== undefined && v !== '' && v !== null)
    );
    
    return filteredResult as ExtractedBidInfo;
  } catch (error) {
    console.error('[DoubaoLLM] 提取失败:', error);
    throw error;
  }
}

/**
 * 从文本内容提取中标信息（用于RPA工具采集后的处理）
 */
export async function extractWinBidInfoFromContent(
  content: string,
  useProModel: boolean = false
): Promise<ExtractedWinBidInfo | null> {
  try {
    console.log(`[DoubaoLLM] 从文本内容提取中标信息，长度: ${content.length}`);
    
    if (!content || content.length < 50) {
      console.warn('[DoubaoLLM] 内容过短');
      return null;
    }
    
    // 使用LLM提取信息
    const llmResponse = await extractWithLLM(content, 'win_bid', useProModel);
    
    // 解析JSON响应
    const parsed = parseJsonResponse(llmResponse);
    
    if (!parsed) {
      console.warn('[DoubaoLLM] 无法解析提取结果');
      return null;
    }
    
    // 构建返回结果
    const result: ExtractedWinBidInfo = {
      title: String(parsed.title || ''),
      project_name: parsed.project_name ? String(parsed.project_name) : undefined,
      project_code: parsed.project_code ? String(parsed.project_code) : undefined,
      win_company: parsed.win_company ? String(parsed.win_company) : undefined,
      win_amount: parseBudget(parsed.win_amount),
      bid_unit: parsed.bid_unit ? String(parsed.bid_unit) : undefined,
      bid_agency: parsed.bid_agency ? String(parsed.bid_agency) : undefined,
      publish_date: parseDate(parsed.publish_date),
      contact_person: parsed.contact_person ? String(parsed.contact_person) : undefined,
      contact_phone: parsed.contact_phone ? String(parsed.contact_phone) : undefined,
      raw_content: content.substring(0, 500),
    };
    
    // 过滤空值
    const filteredResult = Object.fromEntries(
      Object.entries(result).filter(([_, v]) => v !== undefined && v !== '' && v !== null)
    );
    
    return filteredResult as ExtractedWinBidInfo;
  } catch (error) {
    console.error('[DoubaoLLM] 中标提取失败:', error);
    throw error;
  }
}

/**
 * 检查服务是否可用
 */
export function isServiceAvailable(): boolean {
  // SDK已内置配置，始终可用
  return true;
}

export default {
  extractBidInfoFromUrl,
  extractWinBidInfoFromUrl,
  extractBidInfoFromContent,
  extractWinBidInfoFromContent,
  isServiceAvailable,
};
