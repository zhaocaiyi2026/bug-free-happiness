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
const SEARCH_PROMPT_TEMPLATE = `你是一个政府采购信息搜索专家。请帮我搜索吉林省政府采购网 (ccgp-jilin.gov.cn) 的招标公告信息。

## 当前时间
今天是2026年4月3日。

## 核心要求（必须严格遵守）
1. **必须使用联网搜索**：请务必访问吉林省政府采购网，搜索真实存在的公告
2. **必须获取完整正文**：每条公告必须包含完整的正文内容
3. **返回JSON数组格式**：直接返回JSON数组，不要有其他文字

## 时间范围要求
{dateRange}

## 搜索任务

### 第一步：搜索列表
搜索吉林省政府采购网的以下类型公告：
   {types}
每种类型搜索 {count} 条

### 第二步：访问详情页（关键！）
对于搜索到的每条公告，**必须点击进入详情页**，获取以下完整信息：

### 第三步：提取字段
- title: 公告标题（完整）
- projectNumber: 项目编号
- projectName: 项目名称
- budget: 预算金额（纯数字，单位元，如1000000）
- bidType: 招标类型（如：公开招标、竞争性磋商等）
- publishDate: 发布日期（YYYY-MM-DD格式）
- deadline: 投标截止时间（YYYY-MM-DD HH:mm:ss格式）
- contactPerson: 联系人姓名
- contactPhone: 联系电话（必须完整，包含区号）
- province: 省份（固定为"吉林省"）
- city: 城市（如：长春市、吉林市等）
- purchasingUnit: 采购单位名称
- agency: 代理机构名称
- content: **公告完整正文内容**（必须包含以下章节）：
  - 项目概况
  - 采购需求（详细清单）
  - 供应商资格要求
  - 获取招标文件的时间、地点、方式
  - 投标截止时间、开标时间地点
  - 联系方式（采购单位、代理机构）
  - 其他补充事宜
- sourceUrl: 公告详情页完整URL

### 第四步：内容清理
content字段必须：
  - 移除HTML标签、CSS样式、JavaScript代码
  - 移除网站导航、页脚、版权声明等无关内容
  - 按章节分段，使用换行符分隔，清晰易读
  - 保留所有关键信息（金额、时间、联系方式、技术参数等）
  - **content字段长度至少500字符**

## 数据质量要求
- 每条记录必须包含contactPerson或contactPhone（至少一个）
- 每条记录的content字段不能为空，且长度≥500字符
- 预算金额必须转换为纯数字

## 返回格式

直接返回JSON数组：
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
    "content": "项目概况\\n吉林市某单位2025年设备采购项目的潜在投标人...\\n\\n一、项目基本情况\\n1. 采购需求：...\\n2. 合同履行期限：...\\n\\n二、申请人的资格要求\\n...\\n\\n三、获取招标文件\\n...\\n\\n四、提交投标文件截止时间、开标时间和地点\\n...\\n\\n五、公告期限\\n...\\n\\n六、其他补充事宜\\n...",
    "sourceUrl": "http://www.ccgp-jilin.gov.cn/portal/..."
  }
]

请现在开始搜索，必须访问每条公告的详情页获取完整正文内容。`;

/**
 * 让豆包搜索吉林省政府采购网信息
 * 
 * @param types - 公告类型列表
 * @param countPerType - 每种类型搜索数量
 * @param dateRange - 时间范围（如："2026年1月至今"）
 * @returns 搜索结果
 */
export async function doubaoSearchJilinBids(
  types: string[] = ['招标公告', '中标公告', '竞争性磋商'],
  countPerType: number = 5,
  dateRange?: string
): Promise<{
  success: boolean;
  message: string;
  data?: Array<Record<string, unknown>>;
  raw?: string;
}> {
  try {
    console.log('[豆包搜索] 开始搜索吉林省政府采购网信息');
    console.log(`[豆包搜索] 类型: ${types.join(', ')}, 每类数量: ${countPerType}, 时间范围: ${dateRange || '不限'}`);
    
    const client = getLLMClient();
    
    // 构建时间范围说明
    let dateRangeText = '不限制发布时间，搜索最新的公告信息。';
    if (dateRange) {
      dateRangeText = `**重要**：只搜索发布日期在 ${dateRange} 的公告！请确保每条公告的publishDate字段都在这个时间范围内。`;
    }
    
    // 构建搜索指令
    const prompt = SEARCH_PROMPT_TEMPLATE
      .replace('{dateRange}', dateRangeText)
      .replace('{types}', types.join('、'))
      .replace('{count}', String(countPerType));
    
    const messages = [
      {
        role: 'system',
        content: '你是一个政府采购信息搜索专家，擅长搜索和整理招标公告信息。请使用你的联网搜索能力，访问吉林省政府采购网获取真实数据，并直接返回JSON格式的数据。'
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
      // 审核数据完整性 - 必须有标题和来源URL
      if (!item.title || !item.sourceUrl) {
        result.skipped++;
        result.details.push(`跳过: 缺少必要字段 - ${item.title || '未知标题'}`);
        continue;
      }
      
      // 审核联系人信息 - 必须有联系人或电话
      if (!item.contactPerson && !item.contactPhone) {
        result.skipped++;
        result.details.push(`跳过: 缺少联系信息 - ${item.title}`);
        continue;
      }
      
      // 审核正文内容 - 必须有完整的正文（至少500字符）
      const contentStr = typeof item.content === 'string' ? item.content : '';
      if (!item.content || contentStr.length < 500) {
        result.skipped++;
        result.details.push(`跳过: 正文内容不完整（${contentStr.length}字符）- ${item.title}`);
        continue;
      }
      
      // 多维度去重检查
      let isDuplicate = false;
      let duplicateReason = '';
      
      // 1. 根据sourceUrl去重
      const { data: existingByUrl } = await client
        .from('bids')
        .select('id, title')
        .eq('source_url', item.sourceUrl)
        .maybeSingle();
      
      if (existingByUrl) {
        isDuplicate = true;
        duplicateReason = 'URL已存在';
      }
      
      // 2. 根据项目编号去重（如果有）
      if (!isDuplicate && item.projectNumber) {
        const { data: existingByCode } = await client
          .from('bids')
          .select('id, title')
          .eq('project_code', item.projectNumber)
          .maybeSingle();
        
        if (existingByCode) {
          isDuplicate = true;
          duplicateReason = '项目编号已存在';
        }
      }
      
      // 3. 根据标题模糊匹配去重（相似度>80%）
      if (!isDuplicate && item.title) {
        const titleKeywords = (item.title as string).substring(0, 30);
        const { data: existingByTitle } = await client
          .from('bids')
          .select('id, title')
          .ilike('title', `%${titleKeywords}%`)
          .limit(1)
          .maybeSingle();
        
        if (existingByTitle) {
          // 简单相似度检查：如果标题前30字符匹配，认为是重复
          const existingTitleStart = (existingByTitle.title || '').substring(0, 30);
          if (titleKeywords === existingTitleStart) {
            isDuplicate = true;
            duplicateReason = '标题相似';
          }
        }
      }
      
      if (isDuplicate) {
        result.skipped++;
        result.details.push(`跳过: ${duplicateReason} - ${item.title}`);
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
  countPerType: number = 5,
  dateRange?: string
): Promise<{
  searchResult: Awaited<ReturnType<typeof doubaoSearchJilinBids>>;
  saveResult?: Awaited<ReturnType<typeof reviewAndSaveData>>;
}> {
  // 1. 豆包搜索
  const searchResult = await doubaoSearchJilinBids(types, countPerType, dateRange);
  
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
