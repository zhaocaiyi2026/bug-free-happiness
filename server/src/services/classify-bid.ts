/**
 * 豆包大模型智能分类服务
 * 从招标公告标题中智能提取：
 * 1. 公告类型（采购启动/采购变更/采购结果/采购后）
 * 2. 行业关键词（如"考试设备支持"、"污染治理监测"等）
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import type { Message } from 'coze-coding-dev-sdk';

const PRO_MODEL = 'doubao-seed-2-0-pro-260215';

export interface ClassifyResult {
  classifiedType: string;   // 公告类型
  classifiedIndustry: string; // 行业关键词
}

function createLLMClient(model: string) {
  return new LLMClient(new Config({ model }));
}

/**
 * 使用豆包大模型从标题智能分类
 */
export async function classifyBidTitle(title: string): Promise<ClassifyResult> {
  if (!title || title.trim().length < 5) {
    return {
      classifiedType: '招标公告',
      classifiedIndustry: '招标',
    };
  }

  const client = createLLMClient(PRO_MODEL);

  const systemPrompt = '你是一个专业的政府采购招标信息分类专家。';

  const userPrompt = `你是一个政府采购招标信息分类专家。请根据以下招标公告标题，智能提取两个信息：

1. 公告类型：从以下类型中选择最匹配的一个
   - 采购启动：招标公告、竞争性磋商公告、竞争性谈判公告、询价公告、单一来源采购公示、邀请招标公告
   - 采购变更：变更公告、补充公告、更正公告、延期公告、废标公告
   - 采购结果：中标公告、成交公告、结果公告
   - 采购后：合同公告、验收公告

2. 行业关键词：提取标题中描述的核心业务内容（不是地名、不是公司名、不是年份），如"考试设备支持及服务"、"污染治理前期监测检测"、"农村公路日常养护"等，保留3-8个核心字符。

标题：${title}

请返回JSON格式：
{
  "classifiedType": "公告类型",
  "classifiedIndustry": "行业关键词"
}

只返回JSON，不要其他内容。`;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const response = await client.invoke(messages, {
      model: PRO_MODEL,
      temperature: 0.1,
      thinking: 'disabled' as const,
    });

    // 解析响应
    const content = response.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*?\}/);

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        classifiedType: result.classifiedType || '招标公告',
        classifiedIndustry: result.classifiedIndustry || '招标',
      };
    }

    console.warn('[ClassifyService] 无法解析分类结果，使用默认分类');
    return {
      classifiedType: '招标公告',
      classifiedIndustry: '招标',
    };
  } catch (error) {
    console.error('[ClassifyService] 分类失败:', error);
    return {
      classifiedType: '招标公告',
      classifiedIndustry: '招标',
    };
  }
}

/**
 * 批量分类（用于更新现有数据）
 */
export async function classifyBidTitles(titles: string[]): Promise<ClassifyResult[]> {
  const results: ClassifyResult[] = [];

  for (const title of titles) {
    const result = await classifyBidTitle(title);
    results.push(result);
    // 添加小延迟避免API限流
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}
