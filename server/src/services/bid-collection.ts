/**
 * 合法合规的招标信息采集服务
 * 使用网络搜索获取公开发布的招标公告，用豆包大模型提取结构化信息
 * 
 * 数据来源：公开的政府采购网站、招标信息平台
 * 获取方式：网络搜索 + 公开访问
 * 
 * 重要：采集完整的公告详情页内容
 */

import { SearchClient, Config } from 'coze-coding-dev-sdk';
import { extractBidInfoFromContent, extractWinBidInfoFromContent } from './doubao-llm';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import axios from 'axios';
import * as cheerio from 'cheerio';

// 搜索配置 - 针对不同类型的招标信息
const SEARCH_QUERIES = [
  // 招标公告 - 政府采购
  { type: 'bid' as const, query: '竞争性磋商公告 政府采购 2025年 site:ccgp.gov.cn', category: '政府采购' },
  { type: 'bid' as const, query: '公开招标公告 采购 2025年 site:ccgp.gov.cn', category: '政府采购' },
  { type: 'bid' as const, query: '招标公告 政府采购 2025年1月 OR 2月 OR 3月 OR 4月', category: '政府采购' },
  
  // 招标公告 - 工程建设
  { type: 'bid' as const, query: '工程施工招标公告 2025年 site:ggzy.gov.cn', category: '工程建设' },
  { type: 'bid' as const, query: '建设工程 招标公告 2025年', category: '工程建设' },
  
  // 招标公告 - 吉林省
  { type: 'bid' as const, query: '吉林省 招标公告 政府采购 2025年', category: '吉林省采购' },
  { type: 'bid' as const, query: '长春市 招标公告 采购 2025年', category: '吉林省采购' },
  
  // 中标公告
  { type: 'win_bid' as const, query: '中标公告 政府采购 2025年 site:ccgp.gov.cn', category: '中标信息' },
  { type: 'win_bid' as const, query: '中标结果公示 2025年 政府采购', category: '中标信息' },
  { type: 'win_bid' as const, query: '成交公告 政府采购 2025年', category: '中标信息' },
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
      timeRange: '1y',
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
 * 获取详情页完整内容
 */
async function fetchFullPageContent(url: string): Promise<string> {
  try {
    console.log(`[BidCollector] 获取详情页: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      validateStatus: (status) => status < 500, // 接受所有小于500的状态码
    });

    const html = response.data;
    const $ = cheerio.load(html);
    
    // 移除无关内容
    $('script, style, nav, header, footer, .nav, .header, .footer, .sidebar, .menu, .advertisement, .ads, .comment, .related').remove();
    
    // 尝试多种选择器提取正文
    const contentSelectors = [
      // 政府采购网常见选择器
      '.content', '.article', '.detail', '.main-content', '.post-content',
      '#content', '#article', '#detail', '#main-content',
      '.cont', '.txt', '.text', '.body', '.news-content',
      '.announcement', '.notice', '.bulletin',
      'article', '.entry-content', '.post-body',
      // 通用选择器
      '.main', '.container .content',
      'table.info', '.info-table',
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
    
    // 如果还是没找到，尝试提取body中的文本
    if (content.length < 200) {
      content = $('body').text().trim();
    }
    
    // 清理文本
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/^\s+|\s+$/gm, '')
      .trim();
    
    // 限制长度（模型输入限制）
    if (content.length > 15000) {
      content = content.substring(0, 15000);
    }
    
    console.log(`[BidCollector] 获取到内容，长度: ${content.length}`);
    
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
  const url = result.url.toLowerCase();
  
  // 排除不相关内容
  const excludeKeywords = ['培训', '课程', '招聘', '求职', '论文', '博客', '新闻资讯', '下载', '软件'];
  if (excludeKeywords.some(kw => text.includes(kw))) {
    return false;
  }
  
  // 排除列表页URL（只采集详情页）
  const listPagePatterns = ['/index', '/list', 'index_', 'page=', '.htm/', '/more'];
  if (listPagePatterns.some(pattern => url.includes(pattern))) {
    // 但如果是具体的公告页面，保留
    if (!url.match(/\d{6,}/) && !url.match(/\/\d{4}\/\d{2}\/\d{2}\//)) {
      console.log(`[BidCollector] 跳过列表页: ${url}`);
      return false;
    }
  }
  
  // 必须包含相关关键词
  if (type === 'bid') {
    const keywords = ['招标', '采购', '投标', '公告', '磋商', '询价', '谈判'];
    if (!keywords.some(kw => text.includes(kw))) {
      return false;
    }
  } else {
    const keywords = ['中标', '成交', '公示', '结果'];
    if (!keywords.some(kw => text.includes(kw))) {
      return false;
    }
  }
  
  // 排除无效URL
  const invalidDomains = ['baike.baidu.com', 'zhidao.baidu.com', 'wenku.baidu.com', 'weibo.com', 'zhihu.com'];
  if (invalidDomains.some(domain => url.includes(domain))) {
    return false;
  }
  
  return true;
}

/**
 * 保存招标信息到数据库（含完整内容）
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
      console.log(`[BidCollector] 已存在，跳过: ${(data.title as string).substring(0, 30)}...`);
      return false;
    }
    
    // 构建插入数据 - 使用完整内容
    const insertData = {
      title: data.title,
      content: fullContent || data.raw_content || data.bid_scope || '',
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
      requirements: data.requirements,
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
 * 保存中标信息到数据库（含完整内容）
 */
async function saveWinBidInfo(data: Record<string, unknown>, fullContent: string): Promise<boolean> {
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
      content: fullContent || data.raw_content || '',
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
 * 处理单个搜索结果 - 获取详情页完整内容
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
    
    // 1. 获取详情页完整内容
    const fullContent = await fetchFullPageContent(result.url);
    
    // 如果详情页内容太短，使用搜索摘要
    let content = fullContent;
    if (!content || content.length < 100) {
      content = `${result.title}\n\n${result.snippet}`;
      console.log(`[BidCollector] 详情页内容不足，使用摘要`);
    }
    
    // 2. 使用豆包大模型提取结构化信息
    console.log(`[BidCollector] 提取信息: ${result.title.substring(0, 40)}...`);
    
    let extractedInfo = null;
    if (type === 'bid') {
      extractedInfo = await extractBidInfoFromContent(content, false);
    } else {
      extractedInfo = await extractWinBidInfoFromContent(content, false);
    }
    
    if (!extractedInfo) {
      stats.errors++;
      stats.details.push(`提取失败: ${result.title.substring(0, 30)}...`);
      return;
    }
    
    // 3. 添加来源信息
    const fullData = {
      ...extractedInfo,
      source_url: result.url,
      site_name: result.siteName,
    };
    
    // 4. 保存到数据库（使用完整内容）
    let saved = false;
    if (type === 'bid') {
      saved = await saveBidInfo(fullData, fullContent);
    } else {
      saved = await saveWinBidInfo(fullData, fullContent);
    }
    
    if (saved) {
      stats.saved++;
      stats.details.push(`✓ 已保存: ${extractedInfo.title?.substring(0, 50)}...`);
    } else {
      stats.skipped++;
    }
  } catch (error) {
    stats.errors++;
    console.error(`[BidCollector] 处理失败: ${result.title}`, error);
  }
}

/**
 * 执行采集任务（获取详情页完整内容）
 */
export async function runCollection(
  options: {
    maxResults?: number;
    queries?: string[];
  } = {}
): Promise<CollectionStats> {
  const { maxResults = 8 } = options;
  
  const stats: CollectionStats = {
    total: 0,
    saved: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };
  
  console.log('[BidCollector] ========== 开始采集招标信息（含详情页）==========');
  console.log(`[BidCollector] 时间范围: 2025年至今`);
  console.log(`[BidCollector] 数据来源: 公开的政府采购网站`);
  console.log(`[BidCollector] 每查询最多: ${maxResults} 条`);
  
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
      await new Promise(resolve => setTimeout(resolve, 1500));
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
 * 快速采集（使用搜索摘要）
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
          extractedInfo = await extractBidInfoFromContent(content, false);
        } else {
          extractedInfo = await extractWinBidInfoFromContent(content, false);
        }
        
        if (extractedInfo) {
          const fullData = {
            ...extractedInfo,
            source_url: result.url,
          };
          
          let saved = false;
          if (queryConfig.type === 'bid') {
            saved = await saveBidInfo(fullData, result.snippet);
          } else {
            saved = await saveWinBidInfo(fullData, result.snippet);
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

/**
 * 采集指定URL的招标信息
 */
export async function collectFromUrl(url: string, type: 'bid' | 'win_bid' = 'bid'): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  content?: string;
  message?: string;
}> {
  try {
    console.log(`[BidCollector] 采集指定URL: ${url}`);
    
    // 1. 获取详情页内容
    const fullContent = await fetchFullPageContent(url);
    
    if (!fullContent || fullContent.length < 100) {
      return { success: false, message: '无法获取页面内容' };
    }
    
    // 2. 提取结构化信息
    let extractedInfo = null;
    if (type === 'bid') {
      extractedInfo = await extractBidInfoFromContent(fullContent);
    } else {
      extractedInfo = await extractWinBidInfoFromContent(fullContent);
    }
    
    if (!extractedInfo) {
      return { success: false, message: '无法提取招标信息' };
    }
    
    // 3. 添加来源
    const fullData = {
      ...extractedInfo,
      source_url: url,
    };
    
    // 4. 保存
    let saved = false;
    if (type === 'bid') {
      saved = await saveBidInfo(fullData, fullContent);
    } else {
      saved = await saveWinBidInfo(fullData, fullContent);
    }
    
    return {
      success: saved,
      data: fullData,
      content: fullContent,
      message: saved ? '采集成功' : '保存失败（可能已存在）',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '采集失败',
    };
  }
}

export default {
  runCollection,
  quickCollection,
  collectFromUrl,
};
