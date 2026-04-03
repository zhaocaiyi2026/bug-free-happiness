/**
 * 豆包智能搜索服务
 * 
 * 流程：
 * 我向豆包发出搜索指令 → 豆包搜索/整理 → 回传给我 → 我审核入库 → 前端展示
 * 
 * 使用豆包旗舰模型(doubao-seed-2-0-pro-260215)的Agent能力执行搜索任务
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 客户端实例
let llmClient: LLMClient | null = null;

function getLLMClient(): LLMClient {
  if (!llmClient) {
    llmClient = new LLMClient(new Config());
  }
  return llmClient;
}

// 搜索指令模板
const SEARCH_PROMPT_TEMPLATE = `你是一个政府采购信息搜索专家。请帮我搜索吉林省政府采购网 (ccgp-jilin.gov.cn) 的最新招标公告信息。

## 重要提示
- 请务必使用你的联网搜索能力，搜索真实的吉林省政府采购网数据
- 返回的数据必须是JSON数组格式，不要包含其他文字说明

## 搜索任务

1. 搜索吉林省政府采购网的以下类型公告：
   {types}

2. 每种类型搜索 {count} 条

3. 对于每条公告，提取以下字段：
   - title: 公告标题（完整）
   - projectNumber: 项目编号
   - projectName: 项目名称
   - budget: 预算金额（纯数字，单位元，如1000000）
   - bidType: 招标类型（如：公开招标、竞争性磋商等）
   - publishDate: 发布日期（YYYY-MM-DD格式）
   - deadline: 投标截止时间（YYYY-MM-DD HH:mm:ss格式）
   - contactPerson: 联系人姓名
   - contactPhone: 联系电话
   - province: 省份（固定为"吉林省"）
   - city: 城市（如：长春市、吉林市等）
   - purchasingUnit: 采购单位名称
   - agency: 代理机构名称
   - content: 公告正文内容（清理HTML后的纯文本）
   - sourceUrl: 公告详情页URL

4. 内容清理要求：
   - 移除HTML标签、CSS样式、JavaScript代码
   - 移除网站导航、页脚等无关内容
   - 按章节分段，清晰易读
   - 必须保留完整的联系人和电话信息

## 返回格式

直接返回JSON数组，不要有其他文字：
[
  {
    "title": "吉林市某单位2025年设备采购公开招标公告",
    "projectNumber": "采购计划-[2025]-001234号",
    "projectName": "吉林市某单位2025年设备采购",
    "budget": 1000000,
    "bidType": "公开招标",
    "publishDate": "2025-01-15",
    "deadline": "2025-02-15 10:00:00",
    "contactPerson": "张三",
    "contactPhone": "0432-12345678",
    "province": "吉林省",
    "city": "吉林市",
    "purchasingUnit": "吉林市某单位",
    "agency": "某某招标代理公司",
    "content": "公告正文...",
    "sourceUrl": "http://www.ccgp-jilin.gov.cn/..."
  }
]

请现在开始搜索，直接返回JSON数组数据。`;

/**
 * 让豆包搜索吉林省政府采购网信息
 * 
 * @param types - 公告类型列表
 * @param countPerType - 每种类型搜索数量
 * @returns 搜索结果
 */
export async function doubaoSearchJilinBids(
  types: string[] = ['招标公告', '中标公告', '竞争性磋商'],
  countPerType: number = 5
): Promise<{
  success: boolean;
  message: string;
  data?: Array<Record<string, unknown>>;
  raw?: string;
}> {
  try {
    console.log('[豆包搜索] 开始搜索吉林省政府采购网信息');
    console.log(`[豆包搜索] 类型: ${types.join(', ')}, 每类数量: ${countPerType}`);
    
    const client = getLLMClient();
    
    // 构建搜索指令
    const prompt = SEARCH_PROMPT_TEMPLATE
      .replace('{types}', types.join('、'))
      .replace('{count}', String(countPerType));
    
    const messages = [
      {
        role: 'system',
        content: '你是一个政府采购信息搜索专家，擅长搜索和整理招标公告信息。请使用你的搜索能力搜索吉林省政府采购网的信息，并直接返回JSON格式的数据。'
      },
      {
        role: 'user',
        content: prompt
      }
    ];
    
    // 调用豆包旗舰模型（有Agent能力）
    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-pro-260215',
      temperature: 0.3,
      thinking: 'enabled',
    });
    
    console.log('[豆包搜索] 搜索完成，响应长度:', response.content.length);
    
    // 尝试多种方式解析JSON
    let data: Array<Record<string, unknown>> | null = null;
    
    // 方式1: 尝试提取 ```json ... ``` 块
    let jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/);
    
    // 方式2: 尝试提取 ``` ... ``` 块（无json标记）
    if (!jsonMatch) {
      jsonMatch = response.content.match(/```\s*([\s\S]*?)\s*```/);
    }
    
    // 方式3: 尝试直接找 [ ... ] 数组
    if (!jsonMatch) {
      const arrayMatch = response.content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        try {
          data = JSON.parse(arrayMatch[0]);
          console.log('[豆包搜索] 方式3解析到', data?.length || 0, '条数据');
        } catch (e) {
          console.warn('[豆包搜索] 方式3解析失败:', e);
        }
      }
    }
    
    if (jsonMatch && !data) {
      try {
        data = JSON.parse(jsonMatch[1]);
        console.log('[豆包搜索] 解析到', data?.length || 0, '条数据');
      } catch (e) {
        console.warn('[豆包搜索] JSON解析失败:', e);
      }
    }
    
    return {
      success: true,
      message: data ? `成功搜索并整理${data.length}条数据` : '搜索完成，但数据格式需要确认',
      data: data || undefined,
      raw: response.content
    };
    
  } catch (error) {
    console.error('[豆包搜索] 搜索失败:', error);
    return {
      success: false,
      message: `搜索失败: ${error}`,
    };
  }
}

/**
 * 审核并保存数据到数据库
 * 
 * @param data - 豆包返回的数据
 * @returns 保存结果
 */
export async function reviewAndSaveData(
  data: Array<Record<string, unknown>>
): Promise<{
  success: boolean;
  saved: number;
  skipped: number;
  errors: number;
  details: string[];
}> {
  const result = {
    success: true,
    saved: 0,
    skipped: 0,
    errors: 0,
    details: [] as string[],
  };
  
  const client = getSupabaseClient();
  
  for (const item of data) {
    try {
      // 审核数据完整性
      if (!item.title || !item.sourceUrl) {
        result.skipped++;
        result.details.push(`跳过: 缺少必要字段 - ${item.title || '未知标题'}`);
        continue;
      }
      
      // 审核联系人信息
      if (!item.contactPerson && !item.contactPhone) {
        result.skipped++;
        result.details.push(`跳过: 缺少联系信息 - ${item.title}`);
        continue;
      }
      
      // 检查是否已存在
      const { data: existing } = await client
        .from('bids')
        .select('id')
        .eq('source_url', item.sourceUrl)
        .maybeSingle();
      
      if (existing) {
        result.skipped++;
        result.details.push(`跳过: 已存在 - ${item.title}`);
        continue;
      }
      
      // 保存到数据库
      const { error } = await client
        .from('bids')
        .insert({
          title: item.projectName || item.title,
          content: item.content,
          project_code: item.projectNumber || null,
          budget: item.budget || null,
          bid_type: item.bidType || '公开招标',
          publish_date: item.publishDate ? new Date(item.publishDate as string).toISOString() : null,
          deadline: item.deadline ? new Date(item.deadline as string).toISOString() : null,
          contact_person: item.contactPerson || null,
          contact_phone: item.contactPhone || null,
          province: item.province || '吉林省',
          city: item.city || null,
          purchaser_name: item.purchasingUnit || null,
          agency_name: item.agency || null,
          source: '吉林省政府采购网',
          source_url: item.sourceUrl,
          announcement_type: item.bidType || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (error) {
        result.errors++;
        result.details.push(`错误: 保存失败 - ${item.title} - ${error.message}`);
      } else {
        result.saved++;
        result.details.push(`保存成功: ${item.title}`);
      }
      
    } catch (error) {
      result.errors++;
      result.details.push(`错误: 处理失败 - ${item.title || '未知'} - ${error}`);
    }
  }
  
  console.log(`[审核入库] 完成: 保存${result.saved}, 跳过${result.skipped}, 错误${result.errors}`);
  
  return result;
}

/**
 * 完整流程：搜索 → 审核 → 入库
 */
export async function doubaoSearchAndSave(
  types: string[] = ['招标公告', '中标公告', '竞争性磋商'],
  countPerType: number = 5
): Promise<{
  searchResult: Awaited<ReturnType<typeof doubaoSearchJilinBids>>;
  saveResult?: Awaited<ReturnType<typeof reviewAndSaveData>>;
}> {
  // 1. 豆包搜索
  const searchResult = await doubaoSearchJilinBids(types, countPerType);
  
  // 2. 如果搜索成功且有数据，审核入库
  let saveResult;
  if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
    saveResult = await reviewAndSaveData(searchResult.data);
  }
  
  return {
    searchResult,
    saveResult,
  };
}
