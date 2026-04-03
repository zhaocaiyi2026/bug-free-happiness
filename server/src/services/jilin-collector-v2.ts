/**
 * 吉林省政府采购数据采集服务 V2
 * 
 * 优化方案：
 * 1. 使用 Web Search 直接搜索2026年数据
 * 2. 从搜索摘要中直接提取信息（无需访问页面）
 * 3. 使用豆包大模型智能提取结构化数据
 * 
 * 合法合规：仅采集公开发布的政府采购公告信息
 */

import { SearchClient, Config } from 'coze-coding-dev-sdk';
import { LLMClient } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 2026年吉林省政府采购搜索配置
const JILIN_2026_QUERIES = [
  // 招标公告 - 明确指定2026年
  {
    type: 'bid' as const,
    query: '吉林省 政府采购 招标公告 2026年',
    description: '吉林省政府采购招标公告2026年'
  },
  {
    type: 'bid' as const,
    query: 'site:ccgp-jilin.gov.cn 招标公告 2026年',
    description: '吉林省采购网招标公告2026年'
  },
  {
    type: 'bid' as const,
    query: '吉林省 公共资源交易中心 招标 2026年1月 OR 2月 OR 3月 OR 4月',
    description: '吉林省公共资源交易2026年'
  },
  {
    type: 'bid' as const,
    query: '长春市 政府采购 招标公告 2026年',
    description: '长春市政府采购2026年'
  },
  {
    type: 'bid' as const,
    query: '吉林省 竞争性磋商 公告 2026年',
    description: '吉林省竞争性磋商2026年'
  },
  // 中标公告
  {
    type: 'win_bid' as const,
    query: '吉林省 政府采购 中标公告 2026年',
    description: '吉林省中标公告2026年'
  },
  {
    type: 'win_bid' as const,
    query: 'site:ccgp-jilin.gov.cn 中标 结果 2026年',
    description: '吉林省采购网中标结果2026年'
  },
];

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  siteName?: string;
  publishTime?: string;
}

interface CollectionStats {
  total: number;
  saved: number;
  skipped: number;
  errors: number;
  details: string[];
}

// 搜索客户端
let searchClient: SearchClient | null = null;
let llmClient: LLMClient | null = null;

function getSearchClient(): SearchClient {
  if (!searchClient) {
    const config = new Config();
    searchClient = new SearchClient(config);
  }
  return searchClient;
}

function getLLMClient(): LLMClient {
  if (!llmClient) {
    const config = new Config();
    llmClient = new LLMClient(config);
  }
  return llmClient;
}

/**
 * 搜索吉林省2026年政府采购信息
 */
async function searchJilin2026(query: string, count: number = 15): Promise<SearchResult[]> {
  try {
    console.log(`[JilinV2] 搜索: ${query}`);
    
    const client = getSearchClient();
    
    // 使用 advancedSearch，设置时间范围为最近3个月（覆盖2026年1月至今）
    const response = await client.advancedSearch(query, {
      searchType: 'web',
      count: count,
      needContent: true,  // 获取完整内容
      needUrl: true,
      needSummary: true,
      timeRange: '3m',  // 最近3个月
    });

    if (!response.web_items || response.web_items.length === 0) {
      console.log(`[JilinV2] 未找到结果: ${query}`);
      return [];
    }

    return response.web_items.map(item => ({
      title: item.title || '',
      url: item.url || '',
      snippet: item.snippet || item.summary || '',
      siteName: item.site_name,
      publishTime: item.publish_time,
    }));
  } catch (error) {
    console.error(`[JilinV2] 搜索失败: ${query}`, error);
    return [];
  }
}

/**
 * 使用豆包大模型从搜索结果直接提取招标信息
 */
async function extractBidInfoFromSearchResult(
  title: string,
  snippet: string,
  url: string
): Promise<Record<string, unknown> | null> {
  try {
    const client = getLLMClient();
    
    // 先检查标题是否包含2026年
    const has2026InTitle = title.includes('2026');
    
    const prompt = `你是一个专业的招标信息提取助手。请从以下搜索结果中提取招标公告的结构化信息。

标题：${title}
摘要：${snippet}
来源URL：${url}

请提取以下字段（如果存在）：
- title: 公告标题（清理后的完整标题）
- project_name: 项目名称
- budget: 项目预算金额（数字，单位为元，纯数字不要带单位）
- city: 城市（吉林省内的城市，如长春市、吉林市、四平市等）
- industry: 所属行业（如：工程建设、医疗器械、信息技术等）
- bid_type: 招标类型（公开招标、竞争性磋商、询价等）
- publish_date: 发布日期（格式：YYYY-MM-DD）
- deadline: 投标截止时间（格式：YYYY-MM-DD）
- contact_person: 联系人姓名
- contact_phone: 联系电话
- bid_unit: 招标单位名称

重要规则：
1. 如果标题或内容中包含"2026年"，则这是2026年的招标信息
2. 如果没有明确的发布日期，但标题中有"2026年"，请设置 publish_date 为 "2026-01-01"
3. 请以JSON格式返回，只返回JSON，不要有其他内容
4. budget 必须是纯数字，不要包含"万元"、"元"等单位

返回格式示例：
{"title": "吉林省XX项目招标公告", "budget": 1000000, "city": "长春市", "publish_date": "2026-01-15", ...}`;

    // 使用正确的 invoke 方法
    const response = await client.invoke(
      [{ role: 'user', content: prompt }],
      { temperature: 0.1, model: 'doubao-seed-2-0-lite-260215' }
    );

    const content = response.content || '';
    
    // 尝试解析JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`[JilinV2] 未找到JSON: ${content.substring(0, 100)}`);
      return null;
    }
    
    const data = JSON.parse(jsonMatch[0]);
    
    // 如果标题包含2026年，但没有发布日期，设置默认日期
    if (has2026InTitle && !data.publish_date) {
      data.publish_date = '2026-01-01';
    }
    
    // 验证年份（放宽条件：只要标题包含2026就接受）
    if (data.publish_date && !data.publish_date.startsWith('2026') && !has2026InTitle) {
      console.log(`[JilinV2] 跳过非2026年数据: ${data.publish_date}`);
      return null;
    }
    
    // 标题包含2026年的数据直接接受
    if (has2026InTitle) {
      data.is_2026 = true;
    }
    
    return data;
  } catch (error) {
    console.error('[JilinV2] 提取失败:', error);
    return null;
  }
}

/**
 * 使用豆包大模型提取中标信息
 */
async function extractWinBidInfoFromSearchResult(
  title: string,
  snippet: string,
  url: string
): Promise<Record<string, unknown> | null> {
  try {
    const client = getLLMClient();
    
    const has2026InTitle = title.includes('2026');
    
    const prompt = `你是一个专业的中标信息提取助手。请从以下搜索结果中提取中标公告的结构化信息。

标题：${title}
摘要：${snippet}
来源URL：${url}

请提取以下字段（如果存在）：
- title: 公告标题
- project_name: 项目名称
- win_company: 中标单位名称
- win_amount: 中标金额（数字，单位为元，纯数字）
- bid_unit: 招标单位名称
- publish_date: 发布日期（格式：YYYY-MM-DD）
- contact_person: 联系人
- contact_phone: 联系电话

重要规则：
1. 如果标题或内容中包含"2026年"，则这是2026年的中标信息
2. 如果没有明确的发布日期，但标题中有"2026年"，请设置 publish_date 为 "2026-01-01"
3. 请以JSON格式返回，只返回JSON

返回格式示例：
{"title": "XX项目中标公告", "win_company": "XX公司", "win_amount": 1000000, ...}`;

    const response = await client.invoke(
      [{ role: 'user', content: prompt }],
      { temperature: 0.1, model: 'doubao-seed-2-0-lite-260215' }
    );

    const content = response.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const data = JSON.parse(jsonMatch[0]);
    
    if (has2026InTitle && !data.publish_date) {
      data.publish_date = '2026-01-01';
    }
    
    if (data.publish_date && !data.publish_date.startsWith('2026') && !has2026InTitle) {
      return null;
    }
    
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * 检查是否为有效的招标/中标信息
 */
function isValidResult(title: string, snippet: string): boolean {
  const text = `${title} ${snippet}`.toLowerCase();
  
  // 排除不相关内容
  const excludeKeywords = ['培训', '课程', '招聘', '求职', '论文', '博客'];
  if (excludeKeywords.some(kw => text.includes(kw))) {
    return false;
  }
  
  return true;
}

/**
 * 保存招标信息到数据库
 */
async function saveBidInfo(data: Record<string, unknown>): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    
    // 检查是否已存在
    const { data: existing } = await client
      .from('bids')
      .select('id')
      .eq('title', data.title as string)
      .maybeSingle();
    
    if (existing) {
      console.log(`[JilinV2] 已存在，跳过: ${(data.title as string)?.substring(0, 30)}...`);
      return false;
    }
    
    // 计算截止日期：如果没有，设置为发布日期后30天
    let deadline = data.deadline ? `${data.deadline}T17:00:00` : null;
    if (!deadline && data.publish_date) {
      const publishDate = new Date(data.publish_date as string);
      publishDate.setDate(publishDate.getDate() + 30);
      deadline = publishDate.toISOString();
    }
    
    const insertData = {
      title: data.title,
      content: data.raw_content || `${data.title}\n\n项目名称：${data.project_name || ''}\n\n来源：吉林省政府采购网`,
      source_url: data.source_url,
      source: '吉林省政府采购网',
      source_platform: 'jilin_ccgp_v2',
      budget: data.budget,
      province: '吉林省',
      city: data.city || '吉林省',
      industry: data.industry,
      bid_type: data.bid_type || '公开招标',
      contact_person: data.contact_person,
      contact_phone: data.contact_phone,
      deadline: deadline,
      publish_date: data.publish_date || new Date().toISOString(),
      status: 'active',
    };
    
    const { error } = await client.from('bids').insert(insertData);
    
    if (error) {
      console.error('[JilinV2] 保存失败:', error);
      return false;
    }
    
    console.log(`[JilinV2] ✓ 保存成功: ${(data.title as string)?.substring(0, 40)}... 预算: ${data.budget || '未知'} 城市: ${data.city || '未知'}`);
    return true;
  } catch (error) {
    console.error('[JilinV2] 保存异常:', error);
    return false;
  }
}

/**
 * 保存中标信息到数据库
 */
async function saveWinBidInfo(data: Record<string, unknown>): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    
    const { data: existing } = await client
      .from('win_bids')
      .select('id')
      .eq('title', data.title as string)
      .maybeSingle();
    
    if (existing) return false;
    
    const insertData = {
      title: data.title,
      content: data.raw_content || '',
      source_url: data.source_url,
      source: '吉林省政府采购网',
      source_platform: 'jilin_ccgp_v2',
      win_company: data.win_company,
      win_amount: data.win_amount,
      contact_person: data.contact_person,
      contact_phone: data.contact_phone,
      province: '吉林省',
      city: data.city || '吉林省',
      publish_date: data.publish_date || new Date().toISOString(),
    };
    
    const { error } = await client.from('win_bids').insert(insertData);
    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * 处理单个搜索结果
 */
async function processSearchResult(
  result: SearchResult,
  type: 'bid' | 'win_bid',
  stats: CollectionStats
): Promise<void> {
  try {
    if (!isValidResult(result.title, result.snippet)) {
      stats.skipped++;
      return;
    }
    
    // 使用豆包提取结构化信息
    console.log(`[JilinV2] 提取信息: ${result.title.substring(0, 40)}...`);
    
    let extractedInfo = null;
    if (type === 'bid') {
      extractedInfo = await extractBidInfoFromSearchResult(
        result.title,
        result.snippet,
        result.url
      );
    } else {
      extractedInfo = await extractWinBidInfoFromSearchResult(
        result.title,
        result.snippet,
        result.url
      );
    }
    
    if (!extractedInfo) {
      stats.skipped++;
      return;
    }
    
    const fullData = {
      ...extractedInfo,
      source_url: result.url,
      raw_content: result.snippet,
    };
    
    // 保存到数据库
    let saved = false;
    if (type === 'bid') {
      saved = await saveBidInfo(fullData);
    } else {
      saved = await saveWinBidInfo(fullData);
    }
    
    if (saved) {
      stats.saved++;
      stats.details.push(`✓ ${(extractedInfo.title as string)?.substring(0, 50)}...`);
    } else {
      stats.skipped++;
    }
  } catch (error) {
    stats.errors++;
    console.error(`[JilinV2] 处理失败: ${result.title}`, error);
  }
}

/**
 * 执行采集任务
 */
export async function collectJilin2026(): Promise<CollectionStats> {
  const stats: CollectionStats = {
    total: 0,
    saved: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };
  
  console.log('[JilinV2] ===== 开始采集吉林省2026年政府采购数据 =====');
  console.log('[JilinV2] 目标：2026年1月至今的招标/中标信息');
  
  for (const queryConfig of JILIN_2026_QUERIES) {
    console.log(`\n[JilinV2] 执行搜索: ${queryConfig.description}`);
    
    const results = await searchJilin2026(queryConfig.query, 20);
    stats.total += results.length;
    
    console.log(`[JilinV2] 找到 ${results.length} 条结果`);
    
    for (const result of results) {
      await processSearchResult(result, queryConfig.type, stats);
    }
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n[JilinV2] ===== 采集完成 =====');
  console.log(`[JilinV2] 总计: ${stats.total} 条`);
  console.log(`[JilinV2] 保存: ${stats.saved} 条`);
  console.log(`[JilinV2] 跳过: ${stats.skipped} 条`);
  console.log(`[JilinV2] 错误: ${stats.errors} 条`);
  
  return stats;
}

/**
 * 导出采集函数
 */
export { searchJilin2026 as searchJilin };
