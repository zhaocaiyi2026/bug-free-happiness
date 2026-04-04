/**
 * 豆包推送数据处理服务
 * 
 * 工作流程：
 * 1. 豆包推送数据
 * 2. 我进行分析，检查是否符合入库要求（联系人、电话、详情页、地址、项目信息等）
 * 3. 确认好后 → 发送给豆包大模型进行格式化处理
 * 4. 豆包大模型格式化处理完成 → 回传给我
 * 5. 我存入数据库并展示在前端
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import type { Message, LLMResponse } from 'coze-coding-dev-sdk';

// LLM配置
const DEFAULT_MODEL = 'doubao-seed-2-0-lite-260215';
const PRO_MODEL = 'doubao-seed-2-0-pro-260215';

// 推送数据类型
export interface PushedBidData {
  type: string;           // 公告类型：招标、中标、变更、废标等
  title: string;          // 标题
  area?: string;          // 地区
  publish_time?: string;  // 发布时间
  url: string;            // 来源URL
  content: string;        // 正文内容
  source?: string;        // 来源平台
  push_time?: string;     // 推送时间
}

// 审核结果
export interface ReviewResult {
  passed: boolean;
  reason: string;
  missingFields: string[];
}

// 格式化后的招标数据
export interface FormattedBidData {
  title: string;
  project_name?: string;
  project_code?: string;
  budget?: number;
  province?: string;
  city?: string;
  industry?: string;
  bid_type?: string;
  announcement_type?: string;
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
  source_url: string;
  source_platform?: string;
  content: string;
  formatted_content?: string;
}

// 格式化后的中标数据
export interface FormattedWinBidData {
  title: string;
  project_name?: string;
  project_code?: string;
  win_company?: string;
  win_amount?: number;
  province?: string;
  city?: string;
  bid_unit?: string;
  bid_agency?: string;
  publish_date?: string;
  win_date?: string;
  contact_person?: string;
  contact_phone?: string;
  source_url: string;
  source_platform?: string;
  content: string;
  formatted_content?: string;
}

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
 * 步骤1：数据审核
 * 检查是否符合入库要求
 * 
 * 必填字段：
 * - type: 公告类型（招标 / 中标）
 * - title: 公告标题
 * - content: 项目概况/详情
 * - 联系人: 从content提取
 * - 联系电话: 从content提取
 * 
 * 可选字段：
 * - 地址、时间等（不影响入库）
 */
export function reviewPushedData(data: PushedBidData): ReviewResult {
  const missingFields: string[] = [];
  const reasons: string[] = [];

  // 1. 必须有公告类型
  if (!data.type || data.type.trim() === '') {
    missingFields.push('公告类型');
    reasons.push('缺少公告类型(type)');
  }

  // 2. 必须有标题（至少5字符）
  if (!data.title || data.title.trim().length < 5) {
    missingFields.push('公告标题');
    reasons.push('标题缺失或过短(title)');
  }

  // 3. 必须有正文内容（至少50字符，包含项目概况即可）
  if (!data.content || data.content.length < 50) {
    missingFields.push('项目详情');
    reasons.push(`正文内容不足(content)：仅${data.content?.length || 0}字符，需至少50字符`);
    // 内容不足时直接返回，不再检查其他字段
    return {
      passed: false,
      reason: reasons.join('；'),
      missingFields,
    };
  }

  // 4. 从正文中提取联系人
  const contactInfo = extractContactInfo(data.content);
  
  if (!contactInfo.contactPerson) {
    missingFields.push('联系人');
    reasons.push('正文无法提取联系人');
  }

  // 5. 从正文中提取联系电话
  if (!contactInfo.contactPhone) {
    missingFields.push('联系电话');
    reasons.push('正文无法提取联系电话');
  }

  // 地址和时间不再强制要求，作为可选字段
  const passed = missingFields.length === 0;

  return {
    passed,
    reason: passed ? '审核通过' : reasons.join('；'),
    missingFields,
  };
}

/**
 * 从content中提取联系人和联系电话
 * 支持多种格式的联系人信息提取
 */
export function extractContactInfo(content: string): { contactPerson: string | null; contactPhone: string | null } {
  if (!content) return { contactPerson: null, contactPhone: null };
  
  let contactPerson: string | null = null;
  let contactPhone: string | null = null;
  
  // 提取联系人
  // 格式1: 联系人：张三
  // 格式2: 联系人: 张三
  // 格式3: 采购人联系人：张三
  // 格式4: 联系人姓名：张三
  const personPatterns = [
    /(?:采购人)?联系人[姓]?\s*[：:]\s*([^\s,，。；;\n]+)/,
    /(?:项目)?负责人\s*[：:]\s*([^\s,，。；;\n]+)/,
    /联系人员\s*[：:]\s*([^\s,，。；;\n]+)/,
  ];
  
  for (const pattern of personPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      contactPerson = match[1].trim();
      // 清理可能带上的电话号码（如果联系人后面紧跟电话）
      contactPerson = contactPerson.replace(/[\d\-()（）]+$/, '').trim();
      if (contactPerson && contactPerson.length >= 2 && contactPerson.length <= 10) {
        break;
      }
    }
  }
  
  // 提取联系电话
  // 格式1: 联系电话：0431-12345678
  // 格式2: 电话：0431-12345678
  // 格式3: 电话: 0431-12345678
  // 格式4: 手机：13812345678
  const phonePatterns = [
    /(?:联系)?电话\s*[：:]\s*([\d\-()（）\s]{7,20})/,
    /手机\s*[：:]\s*([\d\-()（）\s]{11,20})/,
    /联系电话[：:]\s*([\d\-()（）\s]{7,20})/,
    /(\d{3,4}[-－]\d{7,8})/,  // 座机格式：0431-12345678
    /(\d{11})/,  // 手机号格式
  ];
  
  for (const pattern of phonePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      let phone = match[1].trim();
      // 清理多余空格
      phone = phone.replace(/\s+/g, '');
      // 标准化分隔符
      phone = phone.replace(/[-－]/g, '-');
      
      // 验证电话号码格式
      if (phone.length >= 7 && phone.length <= 20) {
        contactPhone = phone;
        break;
      }
    }
  }
  
  return { contactPerson, contactPhone };
}

/**
 * 从content中提取地址信息
 * 支持多种格式的地址信息提取
 * 
 * 注意：地址必须是有效的具体地址，不能仅仅是省份名称
 */
export function extractAddress(content: string, area?: string): string | null {
  if (!content) return null;
  
  // 地址提取模式（优先级从高到低）
  const addressPatterns = [
    // 格式1: 地址：xxx
    /地址\s*[：:]\s*([^\n,，。；;]+)/,
    // 格式2: 项目地点：xxx
    /项目地点\s*[：:]\s*([^\n,，。；;]+)/,
    // 格式3: 建设地点：xxx
    /建设地点\s*[：:]\s*([^\n,，。；;]+)/,
    // 格式4: 采购人地址：xxx
    /采购人地址\s*[：:]\s*([^\n,，。；;]+)/,
    // 格式5: 投标地点：xxx
    /投标地点\s*[：:]\s*([^\n,，。；;]+)/,
    // 格式6: 开标地点：xxx
    /开标地点\s*[：:]\s*([^\n,，。；;]+)/,
    // 格式7: 联系地址：xxx
    /联系地址\s*[：:]\s*([^\n,，。；;]+)/,
  ];
  
  for (const pattern of addressPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const address = match[1].trim();
      // 地址至少要有6个字符（如：吉林省长春市）
      if (address.length >= 6) {
        return address;
      }
    }
  }
  
  // 尝试匹配省市区组合（如：吉林省长春市朝阳区xxx路xxx号）
  const fullAddressPattern = /(吉林省|北京市|上海市|天津市|重庆市)[^\n]*?(市|区|县|路|街|道|号)/;
  const fullMatch = content.match(fullAddressPattern);
  if (fullMatch) {
    const address = fullMatch[0].trim();
    if (address.length >= 6) {
      return address;
    }
  }
  
  // 如果 area 字段存在且是有效地址（至少包含省和市），则返回
  if (area && area.trim().length >= 4) {
    // 检查 area 是否包含省市组合
    if (/(省|市).*(市|区|县)/.test(area)) {
      return area.trim();
    }
  }
  
  return null;
}

/**
 * 步骤2：调用豆包大模型进行格式化处理
 */
export async function formatBidData(
  data: PushedBidData,
  useProModel: boolean = false
): Promise<FormattedBidData | null> {
  const client = getLLMClient();

  const systemPrompt = `你是一个专业的招标信息提取助手。请从以下招标公告内容中提取结构化信息。

请提取以下字段（如果存在）：
- project_name: 项目名称
- project_code: 项目编号
- budget: 项目预算金额（纯数字，单位为元）
- province: 省份
- city: 城市
- industry: 所属行业
- bid_type: 招标类型（如：公开招标、竞争性谈判、询价采购等）
- publish_date: 公告发布日期（格式：YYYY-MM-DD）
- deadline: 投标截止时间（格式：YYYY-MM-DD）
- contact_person: 联系人姓名
- contact_phone: 联系电话
- contact_address: 联系地址
- requirements: 资格要求摘要
- bid_scope: 招标范围/采购内容
- construction_period: 工期/交付时间
- bid_unit: 招标单位名称
- bid_agency: 招标代理机构名称
- formatted_content: 将原始内容格式化成标准的招标公告格式，包含以下章节：
  1. 项目概况
  2. 供应商资格要求
  3. 获取招标文件
  4. 投标截止时间及地点
  5. 联系方式

请以JSON格式返回结果，只返回JSON，不要有其他内容。如果某个字段无法提取，请设置为null。`;

  const userPrompt = `标题：${data.title}
来源：${data.source || '未知'}
地区：${data.area || '未知'}
发布时间：${data.publish_time || '未知'}
来源URL：${data.url}

正文内容：
${data.content}`;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const llmConfig = {
    model: useProModel ? PRO_MODEL : DEFAULT_MODEL,
    temperature: 0.1,
    thinking: 'disabled' as const,
  };

  try {
    console.log(`[数据处理] 开始格式化招标数据，使用模型: ${llmConfig.model}`);

    const response: LLMResponse = await client.invoke(messages, llmConfig);
    
    // 解析JSON响应
    const parsed = parseJsonResponse(response.content);
    
    if (!parsed) {
      console.warn('[数据处理] 无法解析格式化结果');
      return null;
    }

    // 构建格式化后的数据
    const result: FormattedBidData = {
      title: String(parsed.title || data.title),
      project_name: parsed.project_name ? String(parsed.project_name) : undefined,
      project_code: parsed.project_code ? String(parsed.project_code) : undefined,
      budget: parseBudget(parsed.budget),
      province: parsed.province ? String(parsed.province) : extractProvince(data.area),
      city: parsed.city ? String(parsed.city) : extractCity(data.area),
      industry: parsed.industry ? String(parsed.industry) : undefined,
      bid_type: parsed.bid_type ? String(parsed.bid_type) : normalizeBidType(data.type),
      announcement_type: data.type,
      publish_date: parseDate(parsed.publish_date) || parseDate(data.publish_time),
      deadline: parseDate(parsed.deadline),
      contact_person: parsed.contact_person ? String(parsed.contact_person) : undefined,
      contact_phone: parsed.contact_phone ? String(parsed.contact_phone) : undefined,
      contact_address: parsed.contact_address ? String(parsed.contact_address) : undefined,
      requirements: parsed.requirements ? String(parsed.requirements) : undefined,
      bid_scope: parsed.bid_scope ? String(parsed.bid_scope) : undefined,
      construction_period: parsed.construction_period ? String(parsed.construction_period) : undefined,
      bid_unit: parsed.bid_unit ? String(parsed.bid_unit) : undefined,
      bid_agency: parsed.bid_agency ? String(parsed.bid_agency) : undefined,
      source_url: data.url,
      source_platform: data.source || '豆包采集',
      content: data.content,
      formatted_content: parsed.formatted_content ? String(parsed.formatted_content) : undefined,
    };

    console.log('[数据处理] 格式化完成:', JSON.stringify(result, null, 2).substring(0, 500));
    
    return result;
  } catch (error) {
    console.error('[数据处理] 格式化失败:', error);
    return null;
  }
}

/**
 * 格式化中标数据
 */
export async function formatWinBidData(
  data: PushedBidData,
  useProModel: boolean = false
): Promise<FormattedWinBidData | null> {
  const client = getLLMClient();

  const systemPrompt = `你是一个专业的中标信息提取助手。请从中标公告内容中提取结构化信息。

请提取以下字段（如果存在）：
- project_name: 项目名称
- project_code: 项目编号
- win_company: 中标单位名称
- win_amount: 中标金额（纯数字，单位为元）
- province: 省份
- city: 城市
- bid_unit: 招标单位名称
- bid_agency: 招标代理机构名称
- publish_date: 公告发布日期（格式：YYYY-MM-DD）
- win_date: 中标日期
- contact_person: 联系人姓名
- contact_phone: 联系电话
- formatted_content: 将原始内容格式化成标准的中标公告格式

请以JSON格式返回结果，只返回JSON，不要有其他内容。如果某个字段无法提取，请设置为null。`;

  const userPrompt = `标题：${data.title}
来源：${data.source || '未知'}
地区：${data.area || '未知'}
发布时间：${data.publish_time || '未知'}
来源URL：${data.url}

正文内容：
${data.content}`;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const llmConfig = {
    model: useProModel ? PRO_MODEL : DEFAULT_MODEL,
    temperature: 0.1,
    thinking: 'disabled' as const,
  };

  try {
    console.log(`[数据处理] 开始格式化中标数据，使用模型: ${llmConfig.model}`);

    const response: LLMResponse = await client.invoke(messages, llmConfig);
    const parsed = parseJsonResponse(response.content);
    
    if (!parsed) {
      console.warn('[数据处理] 无法解析格式化结果');
      return null;
    }

    const result: FormattedWinBidData = {
      title: String(parsed.title || data.title),
      project_name: parsed.project_name ? String(parsed.project_name) : undefined,
      project_code: parsed.project_code ? String(parsed.project_code) : undefined,
      win_company: parsed.win_company ? String(parsed.win_company) : undefined,
      win_amount: parseBudget(parsed.win_amount),
      province: parsed.province ? String(parsed.province) : extractProvince(data.area),
      city: parsed.city ? String(parsed.city) : extractCity(data.area),
      bid_unit: parsed.bid_unit ? String(parsed.bid_unit) : undefined,
      bid_agency: parsed.bid_agency ? String(parsed.bid_agency) : undefined,
      publish_date: parseDate(parsed.publish_date) || parseDate(data.publish_time),
      win_date: parseDate(parsed.win_date),
      contact_person: parsed.contact_person ? String(parsed.contact_person) : undefined,
      contact_phone: parsed.contact_phone ? String(parsed.contact_phone) : undefined,
      source_url: data.url,
      source_platform: data.source || '豆包采集',
      content: data.content,
      formatted_content: parsed.formatted_content ? String(parsed.formatted_content) : undefined,
    };

    console.log('[数据处理] 中标格式化完成');
    
    return result;
  } catch (error) {
    console.error('[数据处理] 中标格式化失败:', error);
    return null;
  }
}

// ========== 辅助函数 ==========

/**
 * 解析JSON响应
 */
function parseJsonResponse(response: string): Record<string, unknown> | null {
  try {
    return JSON.parse(response);
  } catch {
    // 尝试提取JSON块
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {}
    }
    
    // 尝试找到第一个 { 和最后一个 }
    const firstBrace = response.indexOf('{');
    const lastBrace = response.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(response.substring(firstBrace, lastBrace + 1));
      } catch {}
    }
    
    return null;
  }
}

/**
 * 解析金额
 */
function parseBudget(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return undefined;

  let cleaned = value.replace(/,/g, '');

  if (cleaned.includes('万')) {
    const match = cleaned.match(/[\d.]+/);
    if (match) return parseFloat(match[0]) * 10000;
  }

  if (cleaned.includes('亿')) {
    const match = cleaned.match(/[\d.]+/);
    if (match) return parseFloat(match[0]) * 100000000;
  }

  const match = cleaned.match(/[\d.]+/);
  if (match) return parseFloat(match[0]);

  return undefined;
}

/**
 * 解析日期
 */
function parseDate(value: unknown): string | undefined {
  if (!value) return undefined;
  const dateStr = String(value);
  const match = dateStr.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return undefined;
}

/**
 * 从area字段提取省份
 */
function extractProvince(area?: string): string | undefined {
  if (!area) return undefined;
  const match = area.match(/([^省市区县]+省|[^省市区县]+自治区|北京|上海|天津|重庆)/);
  return match ? match[1] : area.split(/[市区县]/)[0];
}

/**
 * 从area字段提取城市
 */
function extractCity(area?: string): string | undefined {
  if (!area) return undefined;
  const parts = area.split(/[省市区县]/);
  if (parts.length >= 2) {
    return parts[1].replace(/^[市]/, '');
  }
  return undefined;
}

/**
 * 规范化招标类型
 */
function normalizeBidType(type?: string): string {
  if (!type) return '招标公告';
  
  const typeMap: Record<string, string> = {
    '招标': '公开招标',
    '招标公告': '公开招标',
    '公开招标公告': '公开招标',
    '竞争性谈判': '竞争性谈判',
    '竞争性谈判公告': '竞争性谈判',
    '竞争性磋商': '竞争性磋商',
    '竞争性磋商公告': '竞争性磋商',
    '询价': '询价',
    '询价公告': '询价',
    '单一来源': '单一来源',
    '单一来源公告': '单一来源',
    '单一来源采购': '单一来源',
    '更正': '更正公告',
    '更正公告': '更正公告',
    '废标': '废标公告',
    '废标公告': '废标公告',
    '终止': '终止公告',
    '终止公告': '终止公告',
  };

  // 去掉金额后缀
  let normalized = type.replace(/[\d,.]+万元?$/i, '').trim();
  
  return typeMap[normalized] || normalized || '招标公告';
}

/**
 * 检查服务是否可用
 */
export function isServiceAvailable(): boolean {
  try {
    getLLMClient();
    return true;
  } catch {
    return false;
  }
}
