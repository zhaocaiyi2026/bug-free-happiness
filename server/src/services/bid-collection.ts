/**
 * 合法合规的招标信息采集服务
 * 使用网络搜索获取公开发布的招标公告，用豆包大模型提取结构化信息
 * 
 * 数据来源：公开的政府采购网站、招标信息平台
 * 获取方式：网络搜索 + 公开访问
 */

import { SearchClient, Config } from 'coze-coding-dev-sdk';
import { extractBidInfoFromContent, extractWinBidInfoFromContent } from './doubao-llm';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import axios from 'axios';
import * as cheerio from 'cheerio';

// 搜索配置 - 针对不同类型的招标信息
const SEARCH_QUERIES = [
  // 招标公告
  { type: 'bid' as const, query: '招标公告 政府采购 2025年 site:ccgp.gov.cn', category: '政府采购' },
  { type: 'bid' as const, query: '招标公告 工程建设 2025年 site:ggzy.gov.cn', category: '工程建设' },
  { type: 'bid' as const, query: '公开招标公告 2025年1月 OR 2月 OR 3月 OR 4月', category: '公开招标' },
  { type: 'bid' as const, query: '政府采购招标 公告 最新', category: '政府采购' },
  
  // 中标公告
  { type: 'win_bid' as const, query: '中标公告 政府采购 2025年 site:ccgp.gov.cn', category: '政府采购' },
  { type: 'win_bid' as const, query: '中标结果公示 2025年 site:ggzy.gov.cn', category: '工程建设' },
  { type: 'win_bid' as const, query: '中标通知书 2025年 政府采购', category: '中标信息' },
];

// 搜索结果接口
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  siteName?: string;
  publishTime?: string;
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
 * 搜索招标信息
 */
async function searchBidInfo(query: string, count: number = 10): Promise<SearchResult[]> {
  try {
    console.log(`[BidCollector] 搜索: ${query}`);
    
    const client = getSearchClient();
    
    const response = await client.advancedSearch(query, {
      searchType: 'web',
      count: count,
      needContent: false,
      needUrl: true,
      needSummary: true,
      timeRange: '1y', // 最近1年
    });

    if (!response.web_items || response.web_items.length === 0) {
      console.log(`[BidCollector] 未找到结果: ${query}`);
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
    console.error(`[BidCollector] 搜索失败: ${query}`, error);
    return [];
  }
}

/**
 * 获取网页内容（公开访问）
 */
async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    });

    const $ = cheerio.load(response.data);
    
    // 移除无关内容
    $('script, style, nav, header, footer, .nav, .advertisement').remove();
    
    // 提取正文
    let content = '';
    const contentSelectors = [
      '.content', '.article', '.detail', '.main-content',
      '#content', '#article', '.cont', '.text', 'article'
    ];
    
    for (const selector of contentSelectors) {
      const selected = $(selector).first();
      if (selected.length > 0 && selected.text().trim().length > 100) {
        content = selected.text().trim();
        break;
      }
    }
    
    if (!content || content.length < 100) {
      content = $('body').text().trim();
    }
    
    // 清理并限制长度
    content = content.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n');
    if (content.length > 8000) {
      content = content.substring(0, 8000);
    }
    
    return content;
  } catch (error) {
    console.error(`[BidCollector] 获取页面失败: ${url}`, error);
    return '';
  }
}

/**
 * 判断是否为有效的招标信息
 */
function isValidBidInfo(result: SearchResult, type: 'bid' | 'win_bid'): boolean {
  const text = `${result.title} ${result.snippet}`.toLowerCase();
  
  // 排除不相关内容
  const excludeKeywords = ['培训', '课程', '招聘', '求职', '论文', '博客', '新闻资讯'];
  if (excludeKeywords.some(kw => text.includes(kw))) {
    return false;
  }
  
  // 必须包含相关关键词
  if (type === 'bid') {
    const keywords = ['招标', '采购', '投标', '公告'];
    if (!keywords.some(kw => text.includes(kw))) {
      return false;
    }
  } else {
    const keywords = ['中标', '成交', '公示'];
    if (!keywords.some(kw => text.includes(kw))) {
      return false;
    }
  }
  
  // 排除无效URL
  const invalidDomains = ['baike.baidu.com', 'zhidao.baidu.com', 'wenku.baidu.com'];
  if (invalidDomains.some(domain => result.url.includes(domain))) {
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
      console.log(`[BidCollector] 已存在，跳过: ${(data.title as string).substring(0, 30)}...`);
      return false;
    }
    
    // 构建插入数据
    const insertData = {
      title: data.title,
      content: data.raw_content || data.bid_scope || '',
      source_url: data.source_url,
      source: '豆包智能采集',
      source_platform: 'web_search',
      project_code: data.project_code,
      budget: data.budget,
      province: data.province,
      city: data.city,
      industry: data.industry,
      bid_type: data.bid_type || '公开招标',
      contact_person: data.contact_person,
      contact_phone: data.contact_phone,
      contact_address: data.contact_address,
      deadline: data.deadline ? `${data.deadline}T00:00:00` : null,
      status: 'active',
    };
    
    const { error } = await client.from('bids').insert(insertData);
    
    if (error) {
      console.error('[BidCollector] 保存失败:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[BidCollector] 保存异常:', error);
    return false;
  }
}

/**
 * 保存中标信息到数据库
 */
async function saveWinBidInfo(data: Record<string, unknown>): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    
    // 检查是否已存在
    const { data: existing } = await client
      .from('win_bids')
      .select('id')
      .eq('title', data.title as string)
      .maybeSingle();
    
    if (existing) {
      console.log(`[BidCollector] 已存在，跳过: ${(data.title as string).substring(0, 30)}...`);
      return false;
    }
    
    // 构建插入数据
    const insertData = {
      title: data.title,
      content: data.raw_content || '',
      source_url: data.source_url,
      source: '豆包智能采集',
      source_platform: 'web_search',
      project_code: data.project_code,
      win_company: data.win_company,
      win_amount: data.win_amount,
      contact_person: data.contact_person,
      contact_phone: data.contact_phone,
      publish_date: data.publish_date || new Date().toISOString(),
    };
    
    const { error } = await client.from('win_bids').insert(insertData);
    
    if (error) {
      console.error('[BidCollector] 保存中标失败:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[BidCollector] 保存中标异常:', error);
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
    // 验证是否有效
    if (!isValidBidInfo(result, type)) {
      stats.skipped++;
      return;
    }
    
    // 合并标题和摘要作为内容
    let content = `${result.title}\n\n${result.snippet}`;
    
    // 尝试获取完整页面内容（可选）
    const pageContent = await fetchPageContent(result.url);
    if (pageContent && pageContent.length > content.length) {
      content = pageContent;
    }
    
    // 使用豆包大模型提取结构化信息
    let extractedInfo = null;
    if (type === 'bid') {
      extractedInfo = await extractBidInfoFromContent(content);
    } else {
      extractedInfo = await extractWinBidInfoFromContent(content);
    }
    
    if (!extractedInfo) {
      stats.errors++;
      stats.details.push(`提取失败: ${result.title.substring(0, 30)}...`);
      return;
    }
    
    // 添加来源信息
    const fullData = {
      ...extractedInfo,
      source_url: result.url,
      site_name: result.siteName,
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
      stats.details.push(`✓ 已保存: ${extractedInfo.title?.substring(0, 40)}...`);
    } else {
      stats.skipped++;
    }
  } catch (error) {
    stats.errors++;
    console.error(`[BidCollector] 处理失败: ${result.title}`, error);
  }
}

/**
 * 执行采集任务
 */
export async function runCollection(
  options: {
    maxResults?: number;  // 每个查询最大结果数
    queries?: string[];   // 自定义查询
  } = {}
): Promise<CollectionStats> {
  const { maxResults = 10 } = options;
  
  const stats: CollectionStats = {
    total: 0,
    saved: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };
  
  console.log('[BidCollector] ========== 开始采集招标信息 ==========');
  console.log(`[BidCollector] 时间范围: 2025年1月至今`);
  console.log(`[BidCollector] 数据来源: 公开的政府采购网站`);
  
  for (const queryConfig of SEARCH_QUERIES) {
    console.log(`\n[BidCollector] --- ${queryConfig.category} ---`);
    
    // 搜索
    const results = await searchBidInfo(queryConfig.query, maxResults);
    stats.total += results.length;
    
    console.log(`[BidCollector] 找到 ${results.length} 条结果`);
    
    // 处理每个结果
    for (const result of results) {
      await processSearchResult(result, queryConfig.type, stats);
      
      // 延迟，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 每个查询之间延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n[BidCollector] ========== 采集完成 ==========');
  console.log(`[BidCollector] 总计搜索结果: ${stats.total}`);
  console.log(`[BidCollector] 成功保存: ${stats.saved}`);
  console.log(`[BidCollector] 跳过(重复/无效): ${stats.skipped}`);
  console.log(`[BidCollector] 处理错误: ${stats.errors}`);
  
  return stats;
}

/**
 * 快速采集（使用搜索摘要，不获取完整页面）
 */
export async function quickCollection(): Promise<CollectionStats> {
  const stats: CollectionStats = {
    total: 0,
    saved: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };
  
  console.log('[BidCollector] 开始快速采集...');
  
  for (const queryConfig of SEARCH_QUERIES) {
    const results = await searchBidInfo(queryConfig.query, 5);
    stats.total += results.length;
    
    for (const result of results) {
      if (!isValidBidInfo(result, queryConfig.type)) {
        stats.skipped++;
        continue;
      }
      
      // 直接使用摘要提取
      const content = `${result.title}\n\n${result.snippet}`;
      
      try {
        let extractedInfo = null;
        if (queryConfig.type === 'bid') {
          extractedInfo = await extractBidInfoFromContent(content);
        } else {
          extractedInfo = await extractWinBidInfoFromContent(content);
        }
        
        if (extractedInfo) {
          const fullData = {
            ...extractedInfo,
            source_url: result.url,
          };
          
          let saved = false;
          if (queryConfig.type === 'bid') {
            saved = await saveBidInfo(fullData);
          } else {
            saved = await saveWinBidInfo(fullData);
          }
          
          if (saved) {
            stats.saved++;
          } else {
            stats.skipped++;
          }
        } else {
          stats.errors++;
        }
      } catch (error) {
        stats.errors++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`[BidCollector] 快速采集完成: 保存 ${stats.saved} 条`);
  return stats;
}

export default {
  runCollection,
  quickCollection,
};
