/**
 * 阿里云NLP招标信息抽取服务
 * 文档：https://help.aliyun.com/document_detail/256460.html
 */

// 静态导入模块 - 必须放在文件顶部
import * as NlpAutoml20191111 from '@alicloud/nlp-automl20191111';
import * as $OpenApi from '@alicloud/openapi-client';

// 服务名称常量
const SERVICE_NAME_ZHAOBIAO = 'NER-ZhaoBiao';  // 招标信息抽取
const SERVICE_NAME_ZHONGBIAO = 'NER-Zhongbiao'; // 中标信息抽取

// 配置
interface AliyunNlpConfig {
  accessKeyId: string;
  accessKeySecret: string;
  endpoint?: string;
}

// 招标信息抽取结果
export interface BidExtractResult {
  招标单位名称?: { span: string }[];
  招标单位联系人?: { span: string }[];
  招标单位联系电话?: { span: string }[];
  招标单位地址?: { span: string }[];
  招标代理机构单位名称?: { span: string }[];
  招标代理机构联系电话?: { span: string }[];
  招标代理机构联系人?: { span: string }[];
  项目预算?: { span: string }[];
  项目所在地?: { span: string }[];
  项目名称?: { span: string }[];
  项目编号?: { span: string }[];
  投标截止时间?: { span: string }[];
  开标日期?: { span: string }[];
  公告发布时间?: { span: string }[];
  公告类别?: { span: string }[];
  资格要求?: { span: string }[];
  招标范围?: { span: string }[];
  工期?: { span: string }[];
  标的物名称?: { span: string }[];
  建设规模?: { span: string }[];
  资金来源?: { span: string }[];
  业务类型?: { span: string }[];
}

// 中标信息抽取结果
export interface WinBidExtractResult {
  项目名称?: { span: string }[];
  项目编号?: { span: string }[];
  招标单位名称?: { span: string }[];
  招标单位联系人?: { span: string }[];
  招标单位联系电话?: { span: string }[];
  招标单位地址?: { span: string }[];
  招标代理机构单位名称?: { span: string }[];
  招标代理机构联系电话?: { span: string }[];
  招标代理机构联系人?: { span: string }[];
  第一中标供应商单位名称?: { span: string }[];
  第二中标供应商单位名称?: { span: string }[];
  第三中标供应商单位名称?: { span: string }[];
  中标金额?: { span: string }[];
  公告类别?: { span: string }[];
  公告发布时间?: { span: string }[];
  开标日期?: { span: string }[];
  项目负责人名称?: { span: string }[];
}

// 解析后的招标信息
export interface ParsedBidInfo {
  contactPerson?: string;
  contactPhone?: string;
  contactAddress?: string;
  budget?: number;
  projectLocation?: string;
  projectName?: string;
  projectCode?: string;
  deadline?: string;
  openBidDate?: string;
  publishDate?: string;
  bidType?: string;
  requirements?: string[];
  bidScope?: string;
  constructionPeriod?: string;
}

// 解析后的中标信息
export interface ParsedWinBidInfo {
  projectName?: string;
  projectCode?: string;
  bidUnit?: string;
  bidUnitContact?: string;
  bidUnitPhone?: string;
  winCompany?: string;
  winAmount?: number;
  publishDate?: string;
  openBidDate?: string;
  projectManager?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;

/**
 * 获取SDK的客户端类
 * 在ESM模式下，正确的路径是 NlpAutoml20191111.default.default
 */
function getNlpClientClass() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const module = NlpAutoml20191111 as any;
  
  // ESM模式：module.default.default
  if (module.default && typeof module.default.default === 'function') {
    return module.default.default;
  }
  
  // CommonJS模式：module.default
  if (typeof module.default === 'function') {
    return module.default;
  }
  
  return null;
}

/**
 * 获取SDK的Request类
 */
function getRunPreTrainServiceRequestClass() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const module = NlpAutoml20191111 as any;
  
  // ESM模式：module.default.RunPreTrainServiceRequest
  if (module.default && module.default.RunPreTrainServiceRequest) {
    return module.default.RunPreTrainServiceRequest;
  }
  
  // 直接访问
  if (module.RunPreTrainServiceRequest) {
    return module.RunPreTrainServiceRequest;
  }
  
  return null;
}

/**
 * 初始化阿里云NLP客户端
 */
function initClient(config?: AliyunNlpConfig) {
  const accessKeyId = config?.accessKeyId || process.env.ALIYUN_ACCESS_KEY_ID;
  const accessKeySecret = config?.accessKeySecret || process.env.ALIYUN_ACCESS_KEY_SECRET;
  
  if (!accessKeyId || !accessKeySecret) {
    console.warn('[AliyunNLP] 未配置阿里云AccessKey，招标信息抽取功能不可用');
    console.warn('[AliyunNLP] 请设置环境变量: ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET');
    return null;
  }

  const NlpClient = getNlpClientClass();
  if (!NlpClient) {
    console.error('[AliyunNLP] 无法获取SDK客户端类');
    return null;
  }

  const openApiConfig = new $OpenApi.Config({
    accessKeyId,
    accessKeySecret,
    endpoint: config?.endpoint || 'nlp-automl.cn-hangzhou.aliyuncs.com',
  });

  return new NlpClient(openApiConfig);
}

/**
 * 获取客户端实例（懒加载）
 */
function getClient() {
  if (!client) {
    client = initClient();
  }
  return client;
}

/**
 * 提取数组中的第一个值
 */
function extractFirstValue(arr?: { span: string }[]): string | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr[0]?.span;
}

/**
 * 提取所有值
 */
function extractAllValues(arr?: { span: string }[]): string[] {
  if (!arr || arr.length === 0) return [];
  return arr.map(item => item.span).filter(Boolean);
}

/**
 * 解析金额字符串为数字
 * 例如: "490000.00元" -> 490000
 */
function parseBudget(budgetStr?: string): number | undefined {
  if (!budgetStr) return undefined;
  
  // 如果是"万"为单位
  if (budgetStr.includes('万')) {
    const match = budgetStr.match(/[\d.]+/);
    if (match) {
      return parseFloat(match[0]) * 10000;
    }
  }
  
  // 如果是"亿"为单位
  if (budgetStr.includes('亿')) {
    const match = budgetStr.match(/[\d.]+/);
    if (match) {
      return parseFloat(match[0]) * 100000000;
    }
  }
  
  // 提取数字
  const cleaned = budgetStr.replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? undefined : num;
}

/**
 * 解析日期字符串为ISO格式
 */
function parseDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  
  // 尝试解析 yyyy-mm-dd 格式
  const match = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return undefined;
}

/**
 * 抽取招标信息
 * @param content 招标公告文本内容
 * @returns 解析后的招标信息
 */
export async function extractBidInfo(content: string): Promise<ParsedBidInfo | null> {
  const nlpClient = getClient();
  
  if (!nlpClient) {
    console.warn('[AliyunNLP] 客户端未初始化，跳过招标信息抽取');
    return null;
  }

  if (!content || content.trim().length === 0) {
    console.warn('[AliyunNLP] 内容为空，跳过招标信息抽取');
    return null;
  }

  try {
    console.log('[AliyunNLP] 开始抽取招标信息，内容长度:', content.length);
    
    const RequestClass = getRunPreTrainServiceRequestClass();
    if (!RequestClass) {
      console.error('[AliyunNLP] 无法获取RunPreTrainServiceRequest类');
      return null;
    }

    const request = new RequestClass({
      serviceName: SERVICE_NAME_ZHAOBIAO,
      predictContent: content,
    });

    const response = await nlpClient.runPreTrainService(request);
    
    // 获取预测结果 - 支持两种响应格式
    const predictResult = response.predictResult || response.body?.predictResult;
    if (!predictResult) {
      console.warn('[AliyunNLP] 未返回预测结果');
      return null;
    }

    const result: { records: BidExtractResult } = JSON.parse(predictResult);
    const records = result.records;

    console.log('[AliyunNLP] 抽取结果:', JSON.stringify(records, null, 2));

    // 解析为结构化数据
    const parsedInfo: ParsedBidInfo = {
      contactPerson: extractFirstValue(records.招标单位联系人),
      contactPhone: extractFirstValue(records.招标单位联系电话),
      contactAddress: extractFirstValue(records.招标单位地址),
      budget: parseBudget(extractFirstValue(records.项目预算)),
      projectLocation: extractFirstValue(records.项目所在地),
      projectName: extractFirstValue(records.项目名称),
      projectCode: extractFirstValue(records.项目编号),
      deadline: parseDate(extractFirstValue(records.投标截止时间)),
      openBidDate: parseDate(extractFirstValue(records.开标日期)),
      publishDate: parseDate(extractFirstValue(records.公告发布时间)),
      bidType: extractFirstValue(records.公告类别),
      requirements: extractAllValues(records.资格要求),
      bidScope: extractFirstValue(records.招标范围),
      constructionPeriod: extractFirstValue(records.工期),
    };

    // 过滤掉空值
    const filteredInfo = Object.fromEntries(
      Object.entries(parsedInfo).filter(([_, v]) => v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0))
    );

    console.log('[AliyunNLP] 解析后的招标信息:', filteredInfo);
    
    return Object.keys(filteredInfo).length > 0 ? filteredInfo as ParsedBidInfo : null;
    
  } catch (error) {
    console.error('[AliyunNLP] 招标信息抽取失败:', error);
    return null;
  }
}

/**
 * 抽取中标信息
 * @param content 中标公告文本内容
 * @returns 解析后的中标信息
 */
export async function extractWinBidInfo(content: string): Promise<ParsedWinBidInfo | null> {
  const nlpClient = getClient();
  
  if (!nlpClient) {
    console.warn('[AliyunNLP] 客户端未初始化，跳过中标信息抽取');
    return null;
  }

  if (!content || content.trim().length === 0) {
    console.warn('[AliyunNLP] 内容为空，跳过中标信息抽取');
    return null;
  }

  try {
    console.log('[AliyunNLP] 开始抽取中标信息，内容长度:', content.length);
    
    const RequestClass = getRunPreTrainServiceRequestClass();
    if (!RequestClass) {
      console.error('[AliyunNLP] 无法获取RunPreTrainServiceRequest类');
      return null;
    }

    const request = new RequestClass({
      serviceName: SERVICE_NAME_ZHONGBIAO,
      predictContent: content,
    });

    const response = await nlpClient.runPreTrainService(request);
    
    // 获取预测结果 - 支持两种响应格式
    const predictResult = response.predictResult || response.body?.predictResult;
    if (!predictResult) {
      console.warn('[AliyunNLP] 未返回预测结果');
      return null;
    }

    const result: { records: WinBidExtractResult } = JSON.parse(predictResult);
    const records = result.records;

    console.log('[AliyunNLP] 中标抽取结果:', JSON.stringify(records, null, 2));

    // 解析为结构化数据
    const parsedInfo: ParsedWinBidInfo = {
      projectName: extractFirstValue(records.项目名称),
      projectCode: extractFirstValue(records.项目编号),
      bidUnit: extractFirstValue(records.招标单位名称),
      bidUnitContact: extractFirstValue(records.招标单位联系人),
      bidUnitPhone: extractFirstValue(records.招标单位联系电话),
      winCompany: extractFirstValue(records.第一中标供应商单位名称),
      winAmount: parseBudget(extractFirstValue(records.中标金额)),
      publishDate: parseDate(extractFirstValue(records.公告发布时间)),
      openBidDate: parseDate(extractFirstValue(records.开标日期)),
      projectManager: extractFirstValue(records.项目负责人名称),
    };

    // 过滤掉空值
    const filteredInfo = Object.fromEntries(
      Object.entries(parsedInfo).filter(([_, v]) => v !== undefined && v !== '')
    );

    console.log('[AliyunNLP] 解析后的中标信息:', filteredInfo);
    
    return Object.keys(filteredInfo).length > 0 ? filteredInfo as ParsedWinBidInfo : null;
    
  } catch (error) {
    console.error('[AliyunNLP] 中标信息抽取失败:', error);
    return null;
  }
}

/**
 * 补全招标信息
 * 将抽取的信息合并到现有招标数据中
 */
export function mergeBidInfo(existing: Record<string, unknown>, extracted: ParsedBidInfo): Record<string, unknown> {
  return {
    ...existing,
    // 只在原数据缺失时使用抽取的数据
    contact_person: existing.contact_person || extracted.contactPerson,
    contact_phone: existing.contact_phone || extracted.contactPhone,
    contact_address: existing.contact_address || extracted.contactAddress,
    budget: existing.budget || extracted.budget,
    project_location: existing.project_location || extracted.projectLocation,
    deadline: existing.deadline ? existing.deadline : (extracted.deadline ? `${extracted.deadline}T00:00:00` : null),
    open_bid_time: existing.open_bid_time ? existing.open_bid_time : (extracted.openBidDate ? `${extracted.openBidDate}T00:00:00` : null),
    requirements: existing.requirements || (extracted.requirements?.join('\n') || null),
  };
}

/**
 * 补全中标信息
 */
export function mergeWinBidInfo(existing: Record<string, unknown>, extracted: ParsedWinBidInfo): Record<string, unknown> {
  return {
    ...existing,
    win_company: existing.win_company || extracted.winCompany,
    win_amount: existing.win_amount || extracted.winAmount,
    contact_person: existing.contact_person || extracted.bidUnitContact,
    contact_phone: existing.contact_phone || extracted.bidUnitPhone,
  };
}

// 导出服务状态检查函数
export function isServiceAvailable(): boolean {
  return !!(process.env.ALIYUN_ACCESS_KEY_ID && process.env.ALIYUN_ACCESS_KEY_SECRET);
}

export default {
  extractBidInfo,
  extractWinBidInfo,
  mergeBidInfo,
  mergeWinBidInfo,
  isServiceAvailable,
};
