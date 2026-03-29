/**
 * 招标数据采集服务
 * 使用Web Search搜索最近30天的招标采购、中标、拟新建项目、已备案项目信息
 */

import { SearchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { extractBidInfo, extractWinBidInfo } from './aliyun-nlp';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 搜索类型配置
const SEARCH_QUERIES = [
  // 招标采购
  { type: 'bid', query: '招标公告 招标采购 2026年3月 政府采购', category: '招标采购' },
  { type: 'bid', query: '工程项目招标 建设工程 采购公告 2026年3月', category: '招标采购' },
  { type: 'bid', query: '政府采购网 招标公告 最新招标', category: '招标采购' },
  
  // 中标信息
  { type: 'win_bid', query: '中标公告 中标结果公示 2026年3月', category: '中标信息' },
  { type: 'win_bid', query: '中标通知书 工程中标 建设项目中标', category: '中标信息' },
  
  // 拟建项目
  { type: 'bid', query: '拟建项目 项目备案 立项审批 2026年', category: '拟建项目' },
  { type: 'bid', query: '发改委立项 项目审批 备案公示', category: '拟建项目' },
  
  // 已备案项目
  { type: 'bid', query: '已备案项目 备案登记 企业投资项目', category: '已备案项目' },
];

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
  siteName?: string;
  publishTime?: string;
}

interface CollectedBid {
  title: string;
  content: string;
  source_url: string;
  source: string;
  category: string;
  type: 'bid' | 'win_bid';
  // 解析后的字段
  contact_person?: string;
  contact_phone?: string;
  budget?: number;
  deadline?: string;
  win_company?: string;
  win_amount?: number;
}

/**
 * 搜索招标信息
 */
async function searchBidInfo(query: string, count: number = 20): Promise<SearchResult[]> {
  try {
    console.log(`[SearchCollector] 搜索: ${query}`);
    
    const config = new Config();
    const client = new SearchClient(config);

    // 使用高级搜索，设置时间范围为最近30天
    const response = await client.advancedSearch(query, {
      searchType: 'web',
      count: count,
      needContent: false,
      needUrl: true,
      needSummary: true,
      timeRange: '1m', // 最近1个月
    });

    if (!response.web_items || response.web_items.length === 0) {
      console.log(`[SearchCollector] 未找到结果: ${query}`);
      return [];
    }

    return response.web_items.map(item => ({
      title: item.title || '',
      url: item.url || '',
      snippet: item.snippet || item.summary || '',
      content: item.content,
      siteName: item.site_name,
      publishTime: item.publish_time,
    }));
  } catch (error) {
    console.error(`[SearchCollector] 搜索失败: ${query}`, error);
    return [];
  }
}

/**
 * 判断是否为有效招标信息
 */
function isValidBidInfo(result: SearchResult): boolean {
  const title = result.title.toLowerCase();
  const snippet = result.snippet.toLowerCase();
  const content = `${title} ${snippet}`;
  
  // 排除不相关的内容
  const excludeKeywords = ['培训', '课程', '招聘', '求职', '论文', '资讯', '新闻', '博客'];
  if (excludeKeywords.some(kw => content.includes(kw))) {
    return false;
  }
  
  // 必须包含招标相关关键词
  const includeKeywords = ['招标', '采购', '中标', '投标', '公告', '公示', '项目', '工程'];
  if (!includeKeywords.some(kw => content.includes(kw))) {
    return false;
  }
  
  return true;
}

/**
 * 提取招标信息详情
 */
async function extractDetail(result: SearchResult, type: 'bid' | 'win_bid'): Promise<CollectedBid | null> {
  try {
    // 合并标题和摘要作为解析内容
    const content = `${result.title}\n\n${result.snippet}`;
    
    let extractedInfo = null;
    if (type === 'bid') {
      extractedInfo = await extractBidInfo(content);
    } else {
      extractedInfo = await extractWinBidInfo(content);
    }

    const collected: CollectedBid = {
      title: result.title,
      content: result.snippet,
      source_url: result.url,
      source: result.siteName || '网络搜索',
      category: '',
      type: type,
      // 解析后的字段
      ...extractedInfo,
    };

    return collected;
  } catch (error) {
    console.error(`[SearchCollector] 提取详情失败: ${result.title}`, error);
    return null;
  }
}

/**
 * 保存招标信息到数据库
 */
async function saveToDatabase(bid: CollectedBid): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    
    // 检查是否已存在（基于标题和来源URL）
    const { data: existing } = await client
      .from(bid.type === 'bid' ? 'bids' : 'win_bids')
      .select('id')
      .eq('title', bid.title)
      .maybeSingle();

    if (existing) {
      console.log(`[SearchCollector] 已存在，跳过: ${bid.title.substring(0, 50)}...`);
      return false;
    }

    // 构建插入数据
    if (bid.type === 'bid') {
      const insertData = {
        title: bid.title,
        content: bid.content,
        source_url: bid.source_url,
        source: bid.source,
        source_platform: 'web_search',
        contact_person: bid.contact_person,
        contact_phone: bid.contact_phone,
        budget: bid.budget,
        deadline: bid.deadline ? `${bid.deadline}T00:00:00` : null,
        status: 'active',
        province: null,
        city: null,
        industry: null,
        bid_type: bid.category || '公开招标',
      };

      const { error } = await client.from('bids').insert(insertData);
      if (error) {
        console.error(`[SearchCollector] 保存招标信息失败:`, error);
        return false;
      }
    } else {
      const insertData = {
        title: bid.title,
        content: bid.content,
        source_url: bid.source_url,
        source: bid.source,
        source_platform: 'web_search',
        win_company: bid.win_company,
        win_amount: bid.win_amount,
        contact_person: bid.contact_person,
        contact_phone: bid.contact_phone,
        publish_date: new Date().toISOString(),
      };

      const { error } = await client.from('win_bids').insert(insertData);
      if (error) {
        console.error(`[SearchCollector] 保存中标信息失败:`, error);
        return false;
      }
    }

    console.log(`[SearchCollector] 保存成功: ${bid.title.substring(0, 50)}...`);
    return true;
  } catch (error) {
    console.error(`[SearchCollector] 保存失败:`, error);
    return false;
  }
}

/**
 * 执行数据采集
 */
export async function runCollector(): Promise<{
  total: number;
  saved: number;
  skipped: number;
  errors: number;
}> {
  console.log('[SearchCollector] 开始采集招标信息...');
  
  const stats = {
    total: 0,
    saved: 0,
    skipped: 0,
    errors: 0,
  };

  for (const searchConfig of SEARCH_QUERIES) {
    console.log(`\n[SearchCollector] === ${searchConfig.category} ===`);
    
    // 搜索
    const results = await searchBidInfo(searchConfig.query, 15);
    stats.total += results.length;
    
    // 过滤和提取
    for (const result of results) {
      if (!isValidBidInfo(result)) {
        stats.skipped++;
        continue;
      }

      // 提取详情
      const bidInfo = await extractDetail(result, searchConfig.type as 'bid' | 'win_bid');
      if (!bidInfo) {
        stats.errors++;
        continue;
      }

      bidInfo.category = searchConfig.category;

      // 保存到数据库
      const saved = await saveToDatabase(bidInfo);
      if (saved) {
        stats.saved++;
      } else {
        stats.skipped++;
      }

      // 延迟，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 每个搜索之间延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n[SearchCollector] 采集完成:');
  console.log(`  - 总计搜索结果: ${stats.total}`);
  console.log(`  - 成功保存: ${stats.saved}`);
  console.log(`  - 跳过(重复/无效): ${stats.skipped}`);
  console.log(`  - 解析错误: ${stats.errors}`);

  return stats;
}

export default {
  runCollector,
  searchBidInfo,
};
