/**
 * 招标信息内容清理服务
 * 使用豆包大模型智能整理内容格式并提取关键信息
 * 
 * @module bid-content-cleaner
 * @description 提供招标信息内容的智能清理和关键信息提取功能
 * 
 * @example
 * // 单条清理
 * const result = await cleanBidContentWithLLM(title, content);
 * 
 * // 批量清理
 * const results = await cleanBidContentsWithLLM(items);
 * 
 * // 自动清理新数据
 * await autoCleanNewBids();
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import type { Message } from 'coze-coding-dev-sdk';

// ==================== 类型定义 ====================

/**
 * 清理结果类型
 */
export interface CleanedBidContent {
  /** 公告标题 */
  title: string;
  /** 清理后的内容 */
  content: string;
  /** 项目编号 */
  projectNumber: string;
  /** 项目名称 */
  projectName: string;
  /** 预算金额（元） */
  budget: number | null;
  /** 招标类型 */
  bidType: string;
  /** 发布日期 YYYY-MM-DD */
  publishDate: string;
  /** 截止时间 YYYY-MM-DD HH:mm:ss */
  deadline: string;
  /** 联系人 */
  contactPerson: string;
  /** 联系电话 */
  contactPhone: string;
}

/**
 * 清理配置
 */
export interface CleanerConfig {
  /** 使用的模型 */
  model: 'doubao-seed-2-0-lite-260215' | 'doubao-seed-2-0-pro-260215';
  /** 最大处理内容长度 */
  maxContentLength: number;
  /** 批量处理时的延迟（毫秒） */
  batchDelay: number;
  /** 温度参数 */
  temperature: number;
}

/**
 * 清理统计
 */
export interface CleanerStats {
  /** 处理总数 */
  total: number;
  /** 成功数 */
  success: number;
  /** 失败数 */
  failed: number;
  /** 跳过数 */
  skipped: number;
  /** 处理时长（毫秒） */
  duration: number;
}

// ==================== 默认配置 ====================

const DEFAULT_CONFIG: CleanerConfig = {
  model: 'doubao-seed-2-0-lite-260215',
  maxContentLength: 8000,
  batchDelay: 300,
  temperature: 0.1,
};

// ==================== Prompt 模板 ====================

/**
 * 内容清理 Prompt
 * 让豆包完成两个任务：内容整理 + 关键信息提取
 */
const CONTENT_CLEAN_PROMPT = `你是一个专业的内容整理助手。请完成以下两个任务：

## 任务1：整理内容格式
将招标公告内容整理成清晰、规范的格式：
1. 清理HTML代码、CSS样式、JavaScript代码、网站导航、页脚等无关内容
2. 按章节分段，使用"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"作为章节分隔线
3. 每个字段单独一行，格式为"字段名：内容"
4. 移除空白字段和无意义内容
5. 保留所有重要信息，特别是联系方式、截止时间等关键信息

## 任务2：提取关键信息
从内容中提取以下信息：
- project_number: 项目编号
- project_name: 项目名称
- budget: 预算金额（纯数字，单位为元）
- bid_type: 招标类型（如：公开招标、竞争性谈判等）
- publish_date: 发布日期（格式：YYYY-MM-DD）
- deadline: 截止时间（格式：YYYY-MM-DD HH:mm:ss）
- contact_person: 联系人
- contact_phone: 联系电话

## 返回格式
请以JSON格式返回，格式如下：
{
  "cleaned_content": "整理后的内容...",
  "project_number": "项目编号",
  "project_name": "项目名称",
  "budget": 1000000,
  "bid_type": "招标类型",
  "publish_date": "2024-01-01",
  "deadline": "2024-01-15 10:00:00",
  "contact_person": "联系人",
  "contact_phone": "联系电话"
}

如果某个字段无法提取，请设置为null。只返回JSON，不要有其他内容。

原始内容：
`;

// ==================== 核心实现 ====================

// LLM客户端单例
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
 * 使用豆包大模型整理内容并提取关键信息
 * 
 * @param title - 公告标题
 * @param rawContent - 原始内容
 * @param config - 清理配置（可选）
 * @returns 清理结果
 * 
 * @example
 * const result = await cleanBidContentWithLLM(
 *   '某某项目招标公告',
 *   '原始HTML内容...'
 * );
 * console.log(result.content); // 清理后的内容
 * console.log(result.contactPhone); // 提取的电话
 */
export async function cleanBidContentWithLLM(
  title: string,
  rawContent: string,
  config: Partial<CleanerConfig> = {}
): Promise<CleanedBidContent> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  console.log(`[ContentCleaner] 开始清理: ${title}`);
  const startTime = Date.now();
  
  try {
    const client = getLLMClient();
    
    // 限制内容长度
    const truncatedContent = rawContent.length > finalConfig.maxContentLength 
      ? rawContent.substring(0, finalConfig.maxContentLength) + '...(内容已截断)'
      : rawContent;
    
    const messages: Message[] = [
      { 
        role: 'system', 
        content: '你是一个专业的内容整理助手，擅长整理招标公告内容并提取关键信息。' 
      },
      { 
        role: 'user', 
        content: CONTENT_CLEAN_PROMPT + truncatedContent 
      },
    ];
    
    // 调用LLM
    const response = await client.invoke(messages, {
      model: finalConfig.model,
      temperature: finalConfig.temperature,
      thinking: 'disabled',
    });
    
    const responseContent = response.content;
    
    // 解析JSON响应
    const result = parseJsonResponse(responseContent);
    
    if (result) {
      const duration = Date.now() - startTime;
      console.log(`[ContentCleaner] 清理完成: ${title} (${duration}ms)`);
      
      return {
        title: title,
        content: result.cleaned_content || rawContent,
        projectNumber: result.project_number || '',
        projectName: result.project_name || title,
        budget: result.budget || null,
        bidType: result.bid_type || '公开招标',
        publishDate: result.publish_date || '',
        deadline: result.deadline || '',
        contactPerson: result.contact_person || '',
        contactPhone: result.contact_phone || '',
      };
    }
    
    // JSON解析失败，返回简单清理后的内容
    console.warn(`[ContentCleaner] JSON解析失败，使用简单清理`);
    return {
      title: title,
      content: simpleClean(rawContent),
      projectNumber: '',
      projectName: title,
      budget: null,
      bidType: '公开招标',
      publishDate: '',
      deadline: '',
      contactPerson: '',
      contactPhone: '',
    };
  } catch (error) {
    console.error(`[ContentCleaner] 清理失败: ${error}`);
    // 失败时返回简单清理后的内容
    return {
      title: title,
      content: simpleClean(rawContent),
      projectNumber: '',
      projectName: title,
      budget: null,
      bidType: '公开招标',
      publishDate: '',
      deadline: '',
      contactPerson: '',
      contactPhone: '',
    };
  }
}

/**
 * 批量清理招标信息
 * 
 * @param items - 待清理的项目列表
 * @param onProgress - 进度回调
 * @param config - 清理配置
 * @returns 清理结果列表
 * 
 * @example
 * const results = await cleanBidContentsWithLLM(
 *   [{ id: 1, title: '项目A', content: '...' }],
 *   (id, success, result) => console.log(`${id}: ${success}`)
 * );
 */
export async function cleanBidContentsWithLLM(
  items: Array<{ id: number; title: string; content: string }>,
  onProgress?: (id: number, success: boolean, result?: CleanedBidContent) => void,
  config: Partial<CleanerConfig> = {}
): Promise<Array<{ id: number; result: CleanedBidContent }>> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const results: Array<{ id: number; result: CleanedBidContent }> = [];
  
  for (const item of items) {
    try {
      const result = await cleanBidContentWithLLM(item.title, item.content, config);
      results.push({ id: item.id, result });
      onProgress?.(item.id, true, result);
      
      // 添加延迟，避免API调用过快
      await new Promise(resolve => setTimeout(resolve, finalConfig.batchDelay));
    } catch (error) {
      console.error(`[ContentCleaner] 清理失败: ${item.id}`, error);
      onProgress?.(item.id, false);
    }
  }
  
  return results;
}

// ==================== 辅助函数 ====================

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
      } catch {
        // 继续
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
    
    return null;
  }
}

/**
 * 简单清理（LLM失败时的备选方案）
 */
function simpleClean(text: string): string {
  let cleaned = text;
  
  // 移除HTML标签
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  
  // 移除多余空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // 移除多余空格
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  
  return cleaned.trim();
}

/**
 * 简单清理（不使用LLM，用于备选）
 */
export function cleanBidContent(title: string, rawContent: string): CleanedBidContent {
  const cleaned = simpleClean(rawContent);
  
  return {
    title: title,
    content: cleaned,
    projectNumber: '',
    projectName: title,
    budget: null,
    bidType: '公开招标',
    publishDate: '',
    deadline: '',
    contactPerson: '',
    contactPhone: '',
  };
}
