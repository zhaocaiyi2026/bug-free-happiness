/**
 * 吉林省政府采购数据采集服务 V3
 * 
 * 改进方案：
 * 1. 使用 Web Search 搜索2026年数据
 * 2. 访问详情页获取完整公告正文
 * 3. 使用豆包大模型从完整正文中提取联系人、电话等信息
 * 
 * 合法合规：仅采集公开发布的政府采购公告信息
 */

import { SearchClient, Config, LLMClient } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import axios from 'axios';
import * as cheerio from 'cheerio';

// 2026年吉林省政府采购搜索配置
const JILIN_2026_QUERIES = [
  {
    type: 'bid' as const,
    query: 'site:ccgp-jilin.gov.cn 招标公告 2026年',
    description: '吉林省采购网招标公告2026年'
  },
  {
    type: 'bid' as const,
    query: 'site:ccgp-jilin.gov.cn 竞争性磋商 2026年',
    description: '吉林省采购网竞争性磋商2026年'
  },
  {
    type: 'bid' as const,
    query: 'site:ccgp-jilin.gov.cn 公开招标 2026年',
    description: '吉林省采购网公开招标2026年'
  },
  {
    type: 'win_bid' as const,
    query: 'site:ccgp-jilin.gov.cn 中标公告 2026年',
    description: '吉林省采购网中标公告2026年'
  },
  {
    type: 'bid' as const,
    query: '吉林省 公共资源交易中心 招标公告 2026年',
    description: '吉林省公共资源交易2026年'
  },
];

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  siteName?: string;
}

interface CollectionStats {
  total: number;
  saved: number;
  skipped: number;
  errors: number;
  details: string[];
}

// 客户端实例
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

/**
 * 搜索吉林省2026年政府采购信息
 */
async function searchJilin2026(query: string, count: number = 15): Promise<SearchResult[]> {
  try {
    console.log(`[JilinV3] 搜索: ${query}`);
    
    const client = getSearchClient();
    
    const response = await client.advancedSearch(query, {
      searchType: 'web',
      count: count,
      needContent: false,
      needUrl: true,
      needSummary: true,
      timeRange: '3m',
    });

    if (!response.web_items || response.web_items.length === 0) {
      console.log(`[JilinV3] 未找到结果: ${query}`);
      return [];
    }

    return response.web_items.map(item => ({
      title: item.title || '',
      url: item.url || '',
      snippet: item.snippet || item.summary || '',
      siteName: item.site_name,
    }));
  } catch (error) {
    console.error(`[JilinV3] 搜索失败: ${query}`, error);
    return [];
  }
}

/**
 * 访问详情页获取完整公告正文
 */
async function fetchPageContent(url: string): Promise<string> {
  try {
    console.log(`[JilinV3] 获取详情页: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });

    const $ = cheerio.load(response.data);
    
    // 尝试多种内容选择器
    let content = '';
    
    // 政府采购网站常见的内容区域
    const contentSelectors = [
      '.content',
      '.article-content',
      '.detail-content',
      '.bid-content',
      '#content',
      '.main-content',
      '.text-content',
      'article',
      '.notice-content',
      '.table-box',
      '.con',
      'body'
    ];
    
    for (const selector of contentSelectors) {
      const $el = $(selector);
      if ($el.length > 0) {
        const text = $el.text().trim();
        if (text.length > content.length) {
          content = text;
        }
        if (content.length > 500) break;
      }
    }
    
    // 清理文本
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
    
    if (content.length > 20000) {
      content = content.substring(0, 20000);
    }
    
    console.log(`[JilinV3] 获取到内容，长度: ${content.length}`);
    
    return content;
  } catch (error) {
    console.error(`[JilinV3] 获取页面失败: ${url}`, error);
    return '';
  }
}

/**
 * 使用豆包大模型从完整正文中提取招标信息
 */
async function extractBidInfoFromContent(
  title: string,
  content: string,
  url: string
): Promise<Record<string, unknown> | null> {
  try {
    const client = getLLMClient();
    
    // 检查是否为2026年
    const has2026 = title.includes('2026') || content.includes('2026年');
    if (!has2026) {
      console.log(`[JilinV3] 非2026年数据，跳过: ${title.substring(0, 30)}`);
      return null;
    }
    
    const prompt = `你是一个专业的招标信息提取助手。请从以下招标公告中提取结构化信息。

标题：${title}

公告正文：
${content}

请提取以下字段（如果存在）：
- title: 公告标题（清理后的完整标题）
- project_name: 项目名称
- budget: 项目预算金额（纯数字，单位为元）
- city: 城市（吉林省内的城市，如长春市、吉林市、四平市等）
- industry: 所属行业
- bid_type: 招标类型（公开招标、竞争性磋商、询价等）
- publish_date: 发布日期（格式：YYYY-MM-DD）
- deadline: 投标截止时间/开标时间（格式：YYYY-MM-DD HH:mm 或 YYYY-MM-DD）
- contact_person: 联系人姓名（必须提取）
- contact_phone: 联系电话（必须提取，多个电话用逗号分隔）
- contact_address: 联系地址
- bid_unit: 招标单位名称
- bid_agency: 招标代理机构名称
- requirements: 投标人资格要求（简述）

重要规则：
1. 联系人和联系电话是必填字段，必须仔细查找并提取
2. 电话号码可能出现在"联系方式"、"联系人"、"招标人"、"代理机构"等段落
3. 电话号码格式可能是：固话(0431-xxxxxxx)、手机(139xxxxxxxx)、带分机号等
4. 如果找不到联系人和电话，返回null
5. 预算金额要转换为元（如"100万元"转为1000000）
6. 请以JSON格式返回，只返回JSON

返回格式示例：
{"title": "XX项目招标公告", "budget": 1000000, "city": "长春市", "contact_person": "张三", "contact_phone": "0431-12345678", "deadline": "2026-04-15 09:00", ...}`;

    const response = await client.invoke(
      [{ role: 'user', content: prompt }],
      { temperature: 0.1, model: 'doubao-seed-2-0-lite-260215' }
    );

    const responseContent = response.content || '';
    
    // 尝试解析JSON
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`[JilinV3] 未找到JSON响应`);
      return null;
    }
    
    const data = JSON.parse(jsonMatch[0]);
    
    // 验证必须有联系人和电话
    if (!data.contact_person || !data.contact_phone) {
      console.log(`[JilinV3] 缺少联系方式，跳过: ${title.substring(0, 30)}`);
      return null;
    }
    
    // 设置默认发布日期
    if (!data.publish_date && title.includes('2026')) {
      data.publish_date = '2026-01-01';
    }
    
    return data;
  } catch (error) {
    console.error('[JilinV3] 提取失败:', error);
    return null;
  }
}

/**
 * 使用豆包大模型提取中标信息
 */
async function extractWinBidInfoFromContent(
  title: string,
  content: string,
  url: string
): Promise<Record<string, unknown> | null> {
  try {
    const client = getLLMClient();
    
    const has2026 = title.includes('2026') || content.includes('2026年');
    if (!has2026) return null;
    
    const prompt = `你是一个专业的中标信息提取助手。请从以下中标公告中提取结构化信息。

标题：${title}

公告正文：
${content}

请提取以下字段：
- title: 公告标题
- project_name: 项目名称
- win_company: 中标单位名称
- win_amount: 中标金额（纯数字，单位为元）
- bid_unit: 招标单位名称
- publish_date: 发布日期（YYYY-MM-DD）
- contact_person: 联系人（必须提取）
- contact_phone: 联系电话（必须提取）

重要规则：
1. 联系人和电话是必填字段
2. 如果找不到联系人和电话，返回null
3. 以JSON格式返回`;

    const response = await client.invoke(
      [{ role: 'user', content: prompt }],
      { temperature: 0.1, model: 'doubao-seed-2-0-lite-260215' }
    );

    const responseContent = response.content || '';
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const data = JSON.parse(jsonMatch[0]);
    
    if (!data.contact_person || !data.contact_phone) {
      return null;
    }
    
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * 检查是否为有效的详情页URL
 */
function isValidDetailUrl(url: string, title: string): boolean {
  const lowerUrl = url.toLowerCase();
  
  // 排除列表页
  if (lowerUrl.includes('/index') || lowerUrl.includes('/list')) {
    // 除非URL中包含具体ID
    if (!lowerUrl.match(/\d{6,}/)) {
      return false;
    }
  }
  
  // 排除不相关内容
  const excludeKeywords = ['培训', '课程', '招聘', '求职', '论文', '博客', '下载'];
  if (excludeKeywords.some(kw => title.toLowerCase().includes(kw))) {
    return false;
  }
  
  // 必须包含招标相关关键词
  const bidKeywords = ['招标', '采购', '投标', '公告', '磋商', '询价', '中标', '成交'];
  if (!bidKeywords.some(kw => title.includes(kw))) {
    return false;
  }
  
  return true;
}

/**
 * 保存招标信息到数据库
 */
async function saveBidInfo(data: Record<string, unknown>, content: string): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    
    // 检查是否已存在
    const { data: existing } = await client
      .from('bids')
      .select('id')
      .eq('title', data.title as string)
      .maybeSingle();
    
    if (existing) {
      console.log(`[JilinV3] 已存在，跳过: ${(data.title as string)?.substring(0, 30)}...`);
      return false;
    }
    
    // 计算截止日期
    let deadline = null;
    if (data.deadline) {
      const deadlineStr = data.deadline as string;
      if (deadlineStr.includes(':')) {
        deadline = `${deadlineStr}:00`;
      } else {
        deadline = `${deadlineStr}T17:00:00`;
      }
    } else if (data.publish_date) {
      const publishDate = new Date(data.publish_date as string);
      publishDate.setDate(publishDate.getDate() + 30);
      deadline = publishDate.toISOString();
    }
    
    const insertData = {
      title: data.title,
      content: content,
      source_url: data.source_url,
      source: '吉林省政府采购网',
      source_platform: 'jilin_ccgp_v3',
      budget: data.budget,
      province: '吉林省',
      city: data.city || '吉林省',
      industry: data.industry,
      bid_type: data.bid_type || '公开招标',
      contact_person: data.contact_person,
      contact_phone: data.contact_phone,
      contact_address: data.contact_address,
      deadline: deadline,
      publish_date: data.publish_date || new Date().toISOString(),
      status: 'active',
    };
    
    const { error } = await client.from('bids').insert(insertData);
    
    if (error) {
      console.error('[JilinV3] 保存失败:', error);
      return false;
    }
    
    console.log(`[JilinV3] ✓ 保存成功: ${(data.title as string)?.substring(0, 40)}...`);
    console.log(`[JilinV3]   联系人: ${data.contact_person}, 电话: ${data.contact_phone}`);
    return true;
  } catch (error) {
    console.error('[JilinV3] 保存异常:', error);
    return false;
  }
}

/**
 * 保存中标信息到数据库
 */
async function saveWinBidInfo(data: Record<string, unknown>, content: string): Promise<boolean> {
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
      content: content,
      source_url: data.source_url,
      source: '吉林省政府采购网',
      source_platform: 'jilin_ccgp_v3',
      win_company: data.win_company,
      win_amount: data.win_amount,
      contact_person: data.contact_person,
      contact_phone: data.contact_phone,
      province: '吉林省',
      city: data.city || '吉林省',
      publish_date: data.publish_date || new Date().toISOString(),
    };
    
    const { error } = await client.from('win_bids').insert(insertData);
    
    if (!error) {
      console.log(`[JilinV3] ✓ 中标保存成功: ${(data.title as string)?.substring(0, 40)}...`);
    }
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
    // 验证URL
    if (!isValidDetailUrl(result.url, result.title)) {
      stats.skipped++;
      return;
    }
    
    // 访问详情页获取完整正文
    const fullContent = await fetchPageContent(result.url);
    
    if (!fullContent || fullContent.length < 200) {
      console.log(`[JilinV3] 内容过短，跳过: ${result.title.substring(0, 30)}`);
      stats.skipped++;
      return;
    }
    
    // 使用豆包从完整正文中提取信息
    console.log(`[JilinV3] 提取信息: ${result.title.substring(0, 40)}...`);
    
    let extractedInfo = null;
    if (type === 'bid') {
      extractedInfo = await extractBidInfoFromContent(result.title, fullContent, result.url);
    } else {
      extractedInfo = await extractWinBidInfoFromContent(result.title, fullContent, result.url);
    }
    
    if (!extractedInfo) {
      stats.skipped++;
      return;
    }
    
    const fullData = {
      ...extractedInfo,
      source_url: result.url,
    };
    
    // 保存到数据库
    let saved = false;
    if (type === 'bid') {
      saved = await saveBidInfo(fullData, fullContent);
    } else {
      saved = await saveWinBidInfo(fullData, fullContent);
    }
    
    if (saved) {
      stats.saved++;
      stats.details.push(`✓ ${(extractedInfo.title as string)?.substring(0, 50)}... [${extractedInfo.contact_person} ${extractedInfo.contact_phone}]`);
    } else {
      stats.skipped++;
    }
  } catch (error) {
    stats.errors++;
    console.error(`[JilinV3] 处理失败: ${result.title}`, error);
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
  
  console.log('[JilinV3] ===== 开始采集吉林省2026年政府采购数据 =====');
  console.log('[JilinV3] 改进：访问详情页获取完整联系信息');
  
  for (const queryConfig of JILIN_2026_QUERIES) {
    console.log(`\n[JilinV3] 执行搜索: ${queryConfig.description}`);
    
    const results = await searchJilin2026(queryConfig.query, 15);
    stats.total += results.length;
    
    console.log(`[JilinV3] 找到 ${results.length} 条结果`);
    
    for (const result of results) {
      await processSearchResult(result, queryConfig.type, stats);
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 搜索间隔
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n[JilinV3] ===== 采集完成 =====');
  console.log(`[JilinV3] 总计: ${stats.total} 条`);
  console.log(`[JilinV3] 保存: ${stats.saved} 条`);
  console.log(`[JilinV3] 跳过: ${stats.skipped} 条`);
  console.log(`[JilinV3] 错误: ${stats.errors} 条`);
  
  return stats;
}

export { searchJilin2026 as searchJilin };
