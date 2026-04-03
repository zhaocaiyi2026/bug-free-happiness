/**
 * 吉林省政府采购网数据采集服务
 * 
 * 数据来源：吉林省政府采购网 (公开信息)
 * 获取方式：网络搜索 + 公开访问
 * 
 * 合法合规说明：
 * 1. 仅采集公开发布的政府采购公告信息
 * 2. 通过公开的网络搜索获取公告URL
 * 3. 访问公开可访问的页面获取内容
 * 4. 不涉及任何登录、破解或非授权访问
 */

import { SearchClient, Config } from 'coze-coding-dev-sdk';
import { extractBidInfoFromContent, extractWinBidInfoFromContent } from './doubao-llm';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import axios from 'axios';
import * as cheerio from 'cheerio';

// 吉林省相关搜索配置
const JILIN_SEARCH_QUERIES = [
  // 招标公告
  { 
    type: 'bid' as const, 
    query: 'site:ccgp-jilin.gov.cn 招标公告 2025年', 
    category: '招标公告' 
  },
  { 
    type: 'bid' as const, 
    query: 'site:ccgp-jilin.gov.cn 竞争性磋商 2025年', 
    category: '竞争性磋商' 
  },
  { 
    type: 'bid' as const, 
    query: 'site:ccgp-jilin.gov.cn 公开招标 2025年', 
    category: '公开招标' 
  },
  { 
    type: 'bid' as const, 
    query: '吉林省 政府采购 招标公告 2025年1月 OR 2月 OR 3月 OR 4月', 
    category: '吉林省采购' 
  },
  { 
    type: 'bid' as const, 
    query: '长春市 政府采购 招标公告 2025年', 
    category: '长春市采购' 
  },
  { 
    type: 'bid' as const, 
    query: '吉林省 公共资源交易 招标公告 2025年', 
    category: '公共资源' 
  },
  
  // 中标公告
  { 
    type: 'win_bid' as const, 
    query: 'site:ccgp-jilin.gov.cn 中标公告 2025年', 
    category: '中标公告' 
  },
  { 
    type: 'win_bid' as const, 
    query: 'site:ccgp-jilin.gov.cn 成交公告 2025年', 
    category: '成交公告' 
  },
  { 
    type: 'win_bid' as const, 
    query: '吉林省 政府采购 中标 结果 2025年', 
    category: '中标结果' 
  },
];

// 搜索结果接口
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  siteName?: string;
}

// 采集统计
interface CollectionStats {
  total: number;
  saved: number;
  skipped: number;
  errors: number;
  details: string[];
}

// 搜索客户端
let searchClient: SearchClient | null = null;

/**
 * 获取搜索客户端
 */
function getSearchClient(): SearchClient {
  if (!searchClient) {
    const config = new Config();
    searchClient = new SearchClient(config);
  }
  return searchClient;
}

/**
 * 搜索吉林省政府采购信息
 */
async function searchJilinBidInfo(query: string, count: number = 15): Promise<SearchResult[]> {
  try {
    console.log(`[JilinCollector] 搜索: ${query}`);
    
    const client = getSearchClient();
    
    const response = await client.advancedSearch(query, {
      searchType: 'web',
      count: count,
      needContent: false,
      needUrl: true,
      needSummary: true,
      timeRange: '1y',
    });

    if (!response.web_items || response.web_items.length === 0) {
      console.log(`[JilinCollector] 未找到结果: ${query}`);
      return [];
    }

    return response.web_items.map(item => ({
      title: item.title || '',
      url: item.url || '',
      snippet: item.snippet || item.summary || '',
      siteName: item.site_name,
    }));
  } catch (error) {
    console.error(`[JilinCollector] 搜索失败: ${query}`, error);
    return [];
  }
}

/**
 * 获取详情页完整内容
 */
async function fetchPageContent(url: string): Promise<string> {
  try {
    console.log(`[JilinCollector] 获取详情页: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      validateStatus: (status) => status < 500,
    });

    const html = response.data;
    const $ = cheerio.load(html);
    
    // 移除无关内容
    $('script, style, nav, header, footer, .nav, .header, .footer, .sidebar, .advertisement').remove();
    
    // 尝试多种选择器提取正文
    const contentSelectors = [
      '.content', '.article', '.detail', '.main-content', '.post-content',
      '#content', '#article', '#detail', '#main-content',
      '.cont', '.txt', '.text', '.body', '.news-content',
      'article', '.entry-content', '.post-body',
    ];
    
    let content = '';
    let maxLen = 0;
    
    for (const selector of contentSelectors) {
      const elements = $(selector);
      elements.each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > maxLen) {
          maxLen = text.length;
          content = text;
        }
      });
      
      if (content.length > 500) {
        break;
      }
    }
    
    if (content.length < 200) {
      content = $('body').text().trim();
    }
    
    // 清理文本
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
    
    if (content.length > 15000) {
      content = content.substring(0, 15000);
    }
    
    console.log(`[JilinCollector] 获取到内容，长度: ${content.length}`);
    
    return content;
  } catch (error) {
    console.error(`[JilinCollector] 获取页面失败: ${url}`, error);
    return '';
  }
}

/**
 * 判断是否为有效的招标信息
 */
function isValidBidInfo(result: SearchResult, type: 'bid' | 'win_bid'): boolean {
  const text = `${result.title} ${result.snippet}`.toLowerCase();
  const url = result.url.toLowerCase();
  
  // 排除列表页
  const listPagePatterns = ['/index', '/list', 'index_', 'page='];
  if (listPagePatterns.some(pattern => url.includes(pattern))) {
    if (!url.match(/\d{6,}/)) {
      return false;
    }
  }
  
  // 排除不相关内容
  const excludeKeywords = ['培训', '课程', '招聘', '求职', '论文', '博客', '下载'];
  if (excludeKeywords.some(kw => text.includes(kw))) {
    return false;
  }
  
  // 必须包含关键词
  if (type === 'bid') {
    const keywords = ['招标', '采购', '投标', '公告', '磋商', '询价'];
    if (!keywords.some(kw => text.includes(kw))) {
      return false;
    }
  } else {
    const keywords = ['中标', '成交', '公示', '结果'];
    if (!keywords.some(kw => text.includes(kw))) {
      return false;
    }
  }
  
  return true;
}

/**
 * 保存招标信息到数据库
 */
async function saveBidInfo(data: Record<string, unknown>, fullContent: string): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    
    // 检查是否已存在
    const { data: existing } = await client
      .from('bids')
      .select('id')
      .eq('title', data.title as string)
      .maybeSingle();
    
    if (existing) {
      console.log(`[JilinCollector] 已存在，跳过: ${(data.title as string).substring(0, 30)}...`);
      return false;
    }
    
    const insertData = {
      title: data.title,
      content: fullContent || data.raw_content || '',
      source_url: data.source_url,
      source: '吉林省政府采购网',
      source_platform: 'jilin_ccgp',
      project_code: data.project_code,
      budget: data.budget,
      province: '吉林省',
      city: data.city || '吉林省',
      industry: data.industry,
      bid_type: data.bid_type || '公开招标',
      contact_person: data.contact_person,
      contact_phone: data.contact_phone,
      contact_address: data.contact_address,
      deadline: data.deadline ? `${data.deadline}T00:00:00` : null,
      requirements: data.requirements,
      status: 'active',
    };
    
    const { error } = await client.from('bids').insert(insertData);
    
    if (error) {
      console.error('[JilinCollector] 保存失败:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[JilinCollector] 保存异常:', error);
    return false;
  }
}

/**
 * 保存中标信息到数据库
 */
async function saveWinBidInfo(data: Record<string, unknown>, fullContent: string): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    
    const { data: existing } = await client
      .from('win_bids')
      .select('id')
      .eq('title', data.title as string)
      .maybeSingle();
    
    if (existing) {
      return false;
    }
    
    const insertData = {
      title: data.title,
      content: fullContent || '',
      source_url: data.source_url,
      source: '吉林省政府采购网',
      source_platform: 'jilin_ccgp',
      project_code: data.project_code,
      win_company: data.win_company,
      win_amount: data.win_amount,
      contact_person: data.contact_person,
      contact_phone: data.contact_phone,
      province: '吉林省',
      city: data.city || '吉林省',
      publish_date: data.publish_date || new Date().toISOString(),
    };
    
    const { error } = await client.from('win_bids').insert(insertData);
    
    if (error) {
      console.error('[JilinCollector] 保存中标失败:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[JilinCollector] 保存中标异常:', error);
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
    if (!isValidBidInfo(result, type)) {
      stats.skipped++;
      return;
    }
    
    // 获取详情页内容
    const fullContent = await fetchPageContent(result.url);
    
    let content = fullContent;
    if (!content || content.length < 100) {
      content = `${result.title}\n\n${result.snippet}`;
    }
    
    // 使用豆包大模型提取结构化信息
    console.log(`[JilinCollector] 提取信息: ${result.title.substring(0, 40)}...`);
    
    let extractedInfo = null;
    if (type === 'bid') {
      extractedInfo = await extractBidInfoFromContent(content, false);
    } else {
      extractedInfo = await extractWinBidInfoFromContent(content, false);
    }
    
    if (!extractedInfo) {
      stats.errors++;
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
      stats.details.push(`✓ ${extractedInfo.title?.substring(0, 50)}...`);
    } else {
      stats.skipped++;
    }
  } catch (error) {
    stats.errors++;
    console.error(`[JilinCollector] 处理失败: ${result.title}`, error);
  }
}

/**
 * 执行吉林省政府采购数据采集
 */
export async function runJilinCollection(
  options: { maxResults?: number } = {}
): Promise<CollectionStats> {
  const { maxResults = 12 } = options;
  
  const stats: CollectionStats = {
    total: 0,
    saved: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };
  
  console.log('[JilinCollector] ========== 开始采集吉林省政府采购信息 ==========');
  console.log(`[JilinCollector] 时间范围: 2025年至今`);
  console.log(`[JilinCollector] 数据来源: 吉林省政府采购网 (公开信息)`);
  
  for (const queryConfig of JILIN_SEARCH_QUERIES) {
    console.log(`\n[JilinCollector] --- ${queryConfig.category} ---`);
    
    const results = await searchJilinBidInfo(queryConfig.query, maxResults);
    stats.total += results.length;
    
    console.log(`[JilinCollector] 找到 ${results.length} 条结果`);
    
    for (const result of results) {
      await processSearchResult(result, queryConfig.type, stats);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n[JilinCollector] ========== 采集完成 ==========');
  console.log(`[JilinCollector] 总计: ${stats.total}`);
  console.log(`[JilinCollector] 保存: ${stats.saved}`);
  console.log(`[JilinCollector] 跳过: ${stats.skipped}`);
  console.log(`[JilinCollector] 错误: ${stats.errors}`);
  
  return stats;
}

export default {
  runJilinCollection,
};
