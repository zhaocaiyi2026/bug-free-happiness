/**
 * 招标详情格式化服务
 * 使用豆包大模型将原始内容格式化成标准的招标公告格式
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import type { Message, LLMResponse } from 'coze-coding-dev-sdk';

// LLM配置
const DEFAULT_MODEL = 'doubao-seed-2-0-lite-260215';
const PRO_MODEL = 'doubao-seed-2-0-pro-260215';

// 格式化结果类型
export interface FormattedBidDetail {
  /** 项目概况 */
  projectOverview: string;
  /** 项目基本情况 */
  basicInfo: string;
  /** 申请人资格要求 */
  qualificationRequirements: string;
  /** 获取招标文件 */
  getBidDocuments: string;
  /** 投标截止时间、开标时间和地点 */
  bidSubmission: string;
  /** 公告期限 */
  announcementPeriod: string;
  /** 其他补充事宜 */
  otherMatters: string;
  /** 联系方式 */
  contactInfo: string;
  /** 原始格式化后的完整文本 */
  formattedContent: string;
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

// 格式化Prompt
const FORMAT_PROMPT = `你是一个专业的招标公告格式化助手。请将以下招标公告内容整理成标准格式。

输出要求：
1. 保持原文的真实信息，不要编造或修改任何数据
2. 按照以下章节结构整理内容，如果原文没有某个章节的信息，该章节可以省略
3. 每个章节内部保持条理清晰的编号格式

标准章节格式如下：

项目概况
（简要描述项目基本信息，一句话概括）

一、项目基本情况
1. 采购需求/招标范围：...
2. 合同履行期限/工期：...
3. 其他基本情况...

二、申请人的资格要求
1. ...
2. ...

三、获取招标文件
时间：...
地点：...
方式：...
售价：...

四、提交投标文件截止时间、开标时间和地点
提交投标文件截止时间：...
开标时间：...
地点：...

五、公告期限
...

六、其他补充事宜
...

七、联系方式
1. 采购人信息
名称：...
地址：...
联系方式：...
2. 采购代理机构信息
名称：...
地址：...
联系方式：...

请直接输出格式化后的文本，不要添加任何解释说明。

原始内容：
`;

/**
 * 格式化招标详情
 */
export async function formatBidDetail(
  content: string,
  useProModel: boolean = false
): Promise<FormattedBidDetail | null> {
  try {
    console.log(`[BidDetailFormatter] 开始格式化招标详情，内容长度: ${content.length}`);
    
    if (!content || content.length < 50) {
      console.warn('[BidDetailFormatter] 内容过短');
      return null;
    }
    
    const client = getLLMClient();
    
    const messages: Message[] = [
      { 
        role: 'system', 
        content: '你是一个专业的招标公告格式化助手，擅长将招标公告内容整理成标准的章节格式。你需要保持原文的真实信息，不要编造或修改任何数据。' 
      },
      { role: 'user', content: FORMAT_PROMPT + content },
    ];
    
    const llmConfig = {
      model: useProModel ? PRO_MODEL : DEFAULT_MODEL,
      temperature: 0.1,
      thinking: 'disabled' as const,
    };
    
    console.log(`[BidDetailFormatter] 使用模型: ${llmConfig.model}`);
    
    const response: LLMResponse = await client.invoke(messages, llmConfig);
    
    const formattedContent = response.content;
    
    console.log('[BidDetailFormatter] 格式化完成');
    
    // 解析各章节内容
    const result = parseFormattedContent(formattedContent);
    
    return {
      ...result,
      formattedContent,
    };
  } catch (error) {
    console.error('[BidDetailFormatter] 格式化失败:', error);
    throw error;
  }
}

/**
 * 解析格式化后的内容，提取各章节
 */
function parseFormattedContent(content: string): Omit<FormattedBidDetail, 'formattedContent'> {
  const result: Omit<FormattedBidDetail, 'formattedContent'> = {
    projectOverview: '',
    basicInfo: '',
    qualificationRequirements: '',
    getBidDocuments: '',
    bidSubmission: '',
    announcementPeriod: '',
    otherMatters: '',
    contactInfo: '',
  };
  
  // 提取项目概况（在"一、"之前的内容）
  const overviewMatch = content.match(/项目概况\s*([\s\S]*?)(?=一、|$)/);
  if (overviewMatch) {
    result.projectOverview = overviewMatch[1].trim();
  }
  
  // 提取各章节内容
  const sections = [
    { key: 'basicInfo', pattern: /一、项目基本情况\s*([\s\S]*?)(?=二、|$)/ },
    { key: 'qualificationRequirements', pattern: /二、申请人的资格要求\s*([\s\S]*?)(?=三、|$)/ },
    { key: 'getBidDocuments', pattern: /三、获取招标文件\s*([\s\S]*?)(?=四、|$)/ },
    { key: 'bidSubmission', pattern: /四、提交投标文件截止时间、开标时间和地点\s*([\s\S]*?)(?=五、|$)/ },
    { key: 'announcementPeriod', pattern: /五、公告期限\s*([\s\S]*?)(?=六、|$)/ },
    { key: 'otherMatters', pattern: /六、其他补充事宜\s*([\s\S]*?)(?=七、|$)/ },
    { key: 'contactInfo', pattern: /七、联系方式\s*([\s\S]*?)$/ },
  ];
  
  for (const section of sections) {
    const match = content.match(section.pattern);
    if (match) {
      (result as any)[section.key] = match[1].trim();
    }
  }
  
  return result;
}

/**
 * 格式化中标详情
 */
export async function formatWinBidDetail(
  content: string,
  useProModel: boolean = false
): Promise<string | null> {
  try {
    console.log(`[BidDetailFormatter] 开始格式化中标详情，内容长度: ${content.length}`);
    
    if (!content || content.length < 50) {
      console.warn('[BidDetailFormatter] 内容过短');
      return null;
    }
    
    const client = getLLMClient();
    
    const winBidPrompt = `你是一个专业的中标公告格式化助手。请将以下中标公告内容整理成标准格式。

输出要求：
1. 保持原文的真实信息，不要编造或修改任何数据
2. 按照以下章节结构整理内容，如果原文没有某个章节的信息，该章节可以省略
3. 每个章节内部保持条理清晰的编号格式

标准章节格式如下：

项目概况
（简要描述项目基本信息）

一、中标信息
中标单位：...
中标金额：...
中标日期：...

二、项目基本情况
...

三、联系方式
1. 采购人信息
名称：...
联系方式：...
2. 中标单位信息
名称：...
地址：...
联系方式：...

请直接输出格式化后的文本，不要添加任何解释说明。

原始内容：
`;
    
    const messages: Message[] = [
      { 
        role: 'system', 
        content: '你是一个专业的中标公告格式化助手，擅长将中标公告内容整理成标准的章节格式。你需要保持原文的真实信息，不要编造或修改任何数据。' 
      },
      { role: 'user', content: winBidPrompt + content },
    ];
    
    const llmConfig = {
      model: useProModel ? PRO_MODEL : DEFAULT_MODEL,
      temperature: 0.1,
      thinking: 'disabled' as const,
    };
    
    console.log(`[BidDetailFormatter] 使用模型: ${llmConfig.model}`);
    
    const response: LLMResponse = await client.invoke(messages, llmConfig);
    
    console.log('[BidDetailFormatter] 格式化完成');
    
    return response.content;
  } catch (error) {
    console.error('[BidDetailFormatter] 格式化失败:', error);
    throw error;
  }
}

/**
 * 检查服务是否可用
 */
export function isServiceAvailable(): boolean {
  return true;
}

export default {
  formatBidDetail,
  formatWinBidDetail,
  isServiceAvailable,
};
