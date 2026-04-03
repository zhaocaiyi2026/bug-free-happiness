/**
 * 吉林省政府采购数据采集服务 V5
 * 
 * 核心改进：
 * 1. 使用 Web Search 搜索 site:ccgp-jilin.gov.cn 获取详情页URL
 * 2. 使用 web_fetch (内置HTTP客户端) 访问详情页获取完整正文
 * 3. 使用豆包大模型从正文中提取结构化信息
 * 
 * 数据来源：http://www.ccgp-jilin.gov.cn/
 * 
 * 合法合规：仅采集公开发布的政府采购公告信息
 */

import { SearchClient, Config, LLMClient } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import axios from 'axios';
import * as cheerio from 'cheerio';

// 吉林省政府采购网配置
const JILIN_CONFIG = {
  baseUrl: 'http://www.ccgp-jilin.gov.cn',
  parentId: '550068',
  requestDelay: 1500,
  // 2026年相关的搜索关键词（不含site:前缀，使用sites参数限定）
  searchQueries: [
    // 按类型搜索2026年数据
    '2026年 招标公告 竞争性磋商',
    '2026年 公开招标 采购',
    '2026年 询价 采购',
    '2026年 中标公告',
    // 按地区搜索
    '长春市 2026年 采购',
    '吉林市 2026年 采购',
    '四平市 2026年 采购',
    '通化市 2026年 采购',
    '白城市 2026年 采购',
    '松原市 2026年 采购',
    '延边 2026年 采购',
    // 通用搜索
    '2026年度 采购项目',
    '2026年 政府采购 吉林省',
    '2026年 磋商公告',
  ],
};

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
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
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查URL是否为详情页
 */
function isDetailPageUrl(url: string): boolean {
  // 详情页格式: /site/detail?articleId=xxx
  return url.includes('/site/detail') && url.includes('articleId');
}

/**
 * 使用 Web Search 搜索吉林省政府采购网
 */
async function searchJilinSite(query: string, count: number = 20): Promise<SearchResult[]> {
  try {
    console.log(`[JilinV5] 搜索: ${query}`);
    
    const client = getSearchClient();
    
    // 使用 webSearch 进行普通搜索
    const response = await client.webSearch(query, count, false);
    
    console.log(`[JilinV5] 搜索返回: ${response.web_items?.length || 0} 条结果`);
    
    if (!response.web_items || response.web_items.length === 0) {
      console.log(`[JilinV5] 未找到结果: ${query}`);
      return [];
    }
    
    // 打印前3个结果URL用于调试
    console.log(`[JilinV5] 前3个结果URL:`);
    response.web_items.slice(0, 3).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.url}`);
    });
    
    // 过滤只保留吉林省政府采购网的详情页URL
    const detailPages = response.web_items
      .filter(item => {
        const url = item.url || '';
        // 只保留吉林省政府采购网的URL
        if (!url.includes('ccgp-jilin.gov.cn')) return false;
        // 详情页格式: /site/detail?articleId=xxx
        return url.includes('/site/detail') || url.includes('articleId');
      })
      .map(item => ({
        title: item.title || '',
        url: item.url || '',
        snippet: item.snippet || '',
      }));
    
    console.log(`[JilinV5] 找到 ${detailPages.length} 个吉林省政府采购网详情页URL`);
    
    return detailPages;
  } catch (error) {
    console.error(`[JilinV5] 搜索失败: ${query}`, error);
    return [];
  }
}

/**
 * 从列表页HTML中提取公告链接
 * 注意：吉林省政府采购网是Vue.js SPA，HTML中可能没有完整数据
 */
async function fetchListPageUrls(): Promise<SearchResult[]> {
  try {
    console.log('[JilinV5] 尝试从列表页获取公告链接...');
    
    const listUrl = `${JILIN_CONFIG.baseUrl}/site/category?parentId=${JILIN_CONFIG.parentId}&childrenCode=ZcyAnnouncement`;
    
    const response = await axios.get(listUrl, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    const $ = cheerio.load(response.data);
    const items: SearchResult[] = [];
    const addedUrls = new Set<string>();
    
    // 尝试从HTML中提取articleId
    // Vue.js SPA中，数据可能嵌入在script标签中
    const scripts = $('script').toArray();
    for (const script of scripts) {
      const content = $(script).html() || '';
      // 查找articleId - 使用RegExp.exec而不是matchAll
      const articleIdRegex = /articleId[=:]?\s*["']([^"']+)["']/g;
      let match;
      while ((match = articleIdRegex.exec(content)) !== null) {
        const articleId = match[1];
        if (articleId && articleId.length > 5) {
          const detailUrl = `${JILIN_CONFIG.baseUrl}/site/detail?parentId=${JILIN_CONFIG.parentId}&articleId=${articleId}`;
          if (!addedUrls.has(detailUrl)) {
            addedUrls.add(detailUrl);
            items.push({
              title: `吉林省采购公告`,
              url: detailUrl,
              snippet: '',
            });
          }
        }
      }
    }
    
    console.log(`[JilinV5] 从列表页HTML提取到 ${items.length} 个公告链接`);
    
    return items;
  } catch (error) {
    console.error('[JilinV5] 获取列表页失败:', error);
    return [];
  }
}

/**
 * 获取详情页内容
 */
async function fetchDetailContent(url: string): Promise<string> {
  try {
    console.log(`[JilinV5] 获取详情页: ${url.substring(0, 80)}...`);
    
    const response = await axios.get(url, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
    });
    
    const $ = cheerio.load(response.data);
    
    // 提取正文内容 - 尝试多种选择器
    let content = '';
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
      '.con',
      '.table-box',
      '.Custom_Editor',
      '.TRS_Editor',
    ];
    
    for (const selector of contentSelectors) {
      const $el = $(selector);
      if ($el.length > 0) {
        const text = $el.text().trim();
        if (text.length > content.length) {
          content = text;
        }
        if (content.length > 1000) break;
      }
    }
    
    // 如果还没找到，尝试获取body内容
    if (content.length < 500) {
      // 移除script和style标签
      $('script, style, noscript').remove();
      content = $('body').text().trim();
    }
    
    // 清理文本
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
    
    // 限制长度
    if (content.length > 25000) {
      content = content.substring(0, 25000);
    }
    
    console.log(`[JilinV5] 获取成功，内容长度: ${content.length}`);
    
    return content;
  } catch (error) {
    console.error(`[JilinV5] 获取详情页失败:`, error);
    return '';
  }
}

/**
 * 使用豆包大模型从详情页提取结构化信息
 */
async function extractBidInfo(
  title: string,
  content: string,
  url: string
): Promise<Record<string, unknown> | null> {
  try {
    const client = getLLMClient();
    
    // 检查是否为2026年
    const has2026 = title.includes('2026') || content.includes('2026年') || content.includes('2026年度');
    if (!has2026) {
      console.log(`[JilinV5] 非2026年数据，跳过: ${title.substring(0, 40)}`);
      return null;
    }
    
    const prompt = `你是一个专业的招标信息提取助手。请从以下政府采购公告中提取结构化信息。

标题：${title}

公告正文：
${content}

请提取以下字段（必须严格按照JSON格式返回）：

{
  "title": "公告完整标题",
  "project_name": "项目名称",
  "budget": 预算金额（纯数字，单位元，如1000000，没有则null）,
  "city": "吉林省内城市名（如长春市、吉林市、四平市、通化市、白城市、松原市、白山市、延边州等）",
  "industry": "所属行业（如医疗、教育、交通、IT等）",
  "bid_type": "招标类型（公开招标/竞争性磋商/竞争性谈判/询价/单一来源等）",
  "publish_date": "发布日期（格式YYYY-MM-DD）",
  "deadline": "投标截止时间/开标时间（格式YYYY-MM-DD HH:mm）",
  "contact_person": "联系人姓名（必填，仔细查找）",
  "contact_phone": "联系电话（必填，多个用逗号分隔）",
  "contact_address": "联系地址",
  "bid_unit": "采购人/招标单位名称",
  "bid_agency": "采购代理机构名称",
  "project_number": "项目编号"
}

重要提取规则：
1. **联系人和电话是必填字段**，必须从公告中提取：
   - 通常在"联系方式"、"采购人信息"、"代理机构信息"、"项目联系方式"等段落
   - 电话格式可能是：0431-xxxxxxxx、159xxxxxxxx、0431-xxxxxxx转xxx
   - 多个联系人/电话都要提取，用逗号分隔

2. **预算金额处理**：
   - "100万元" → 1000000
   - "100万" → 1000000
   - 找不到预算则设为null

3. **城市提取**：
   - 从标题或正文中提取吉林省内城市
   - 格式：长春市、吉林市、四平市等

4. 如果找不到联系人和电话，返回null表示无效数据

请只返回JSON，不要有任何其他文字。`;

    const response = await client.invoke(
      [{ role: 'user', content: prompt }],
      { temperature: 0.1, model: 'doubao-seed-2-0-pro-260215' }
    );

    const responseContent = response.content || '';
    
    // 提取JSON
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`[JilinV5] 未找到JSON响应`);
      return null;
    }
    
    const data = JSON.parse(jsonMatch[0]);
    
    // 验证必须有联系人和电话
    if (!data.contact_person || !data.contact_phone) {
      console.log(`[JilinV5] 缺少联系方式，跳过: ${title.substring(0, 40)}`);
      console.log(`[JilinV5] 提取结果: contact_person=${data.contact_person}, contact_phone=${data.contact_phone}`);
      return null;
    }
    
    console.log(`[JilinV5] ✓ 提取成功 - 联系人: ${data.contact_person}, 电话: ${data.contact_phone}`);
    
    return data;
  } catch (error) {
    console.error('[JilinV5] 提取失败:', error);
    return null;
  }
}

/**
 * 保存招标信息到数据库
 */
async function saveBidToDatabase(
  data: Record<string, unknown>,
  content: string,
  url: string
): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    
    // 检查是否已存在（基于标题）
    const { data: existing } = await client
      .from('bids')
      .select('id')
      .eq('title', data.title as string)
      .maybeSingle();
    
    if (existing) {
      console.log(`[JilinV5] 已存在，跳过: ${(data.title as string)?.substring(0, 40)}`);
      return false;
    }
    
    // 计算截止日期
    let deadline = null;
    if (data.deadline) {
      const deadlineStr = data.deadline as string;
      if (deadlineStr.includes(':')) {
        deadline = `${deadlineStr}:00`.replace('T', ' ');
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
      source_url: url,
      source: '吉林省政府采购网',
      source_platform: 'jilin_ccgp_v5',
      budget: data.budget,
      province: '吉林省',
      city: data.city || '吉林省',
      industry: data.industry,
      bid_type: data.bid_type || '公开招标',
      contact_person: data.contact_person,
      contact_phone: data.contact_phone,
      contact_address: data.contact_address,
      deadline: deadline,
      publish_date: data.publish_date || new Date().toISOString().split('T')[0],
      status: 'active',
    };
    
    const { error } = await client.from('bids').insert(insertData);
    
    if (error) {
      console.error('[JilinV5] 保存失败:', error);
      return false;
    }
    
    console.log(`[JilinV5] ✓ 保存成功: ${(data.title as string)?.substring(0, 50)}`);
    return true;
  } catch (error) {
    console.error('[JilinV5] 保存异常:', error);
    return false;
  }
}

/**
 * 处理单个公告
 */
async function processBidItem(
  item: SearchResult,
  stats: CollectionStats,
  processedUrls: Set<string>
): Promise<void> {
  try {
    // 检查是否已处理
    if (processedUrls.has(item.url)) {
      return;
    }
    processedUrls.add(item.url);
    
    stats.total++;
    
    // 获取详情页内容
    const content = await fetchDetailContent(item.url);
    
    if (!content || content.length < 300) {
      console.log(`[JilinV5] 内容过短，跳过: ${item.title.substring(0, 40)}`);
      stats.skipped++;
      return;
    }
    
    // 使用AI提取结构化信息
    const extractedInfo = await extractBidInfo(item.title, content, item.url);
    
    if (!extractedInfo) {
      stats.skipped++;
      return;
    }
    
    // 保存到数据库
    const saved = await saveBidToDatabase(extractedInfo, content, item.url);
    
    if (saved) {
      stats.saved++;
      stats.details.push(
        `✓ ${(extractedInfo.title as string)?.substring(0, 50)}... [${extractedInfo.contact_person} ${extractedInfo.contact_phone}]`
      );
    } else {
      stats.skipped++;
    }
  } catch (error) {
    stats.errors++;
    console.error(`[JilinV5] 处理失败: ${item.title}`, error);
  }
}

/**
 * 主采集函数
 */
export async function collectJilin2026V5(options?: {
  maxQueries?: number;
  resultsPerQuery?: number;
  useListPage?: boolean;
}): Promise<CollectionStats> {
  const stats: CollectionStats = {
    total: 0,
    saved: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };
  
  const processedUrls = new Set<string>();
  const maxQueries = options?.maxQueries || 10;
  const resultsPerQuery = options?.resultsPerQuery || 20;
  const useListPage = options?.useListPage !== false; // 默认使用列表页方式
  
  console.log('[JilinV5] ===== 开始采集吉林省政府采购网数据 =====');
  console.log(`[JilinV5] 配置: 最大搜索次数=${maxQueries}, 每次搜索结果数=${resultsPerQuery}, 使用列表页=${useListPage}`);
  
  // 方式1：从列表页获取URL
  if (useListPage) {
    console.log('\n[JilinV5] ===== 从列表页获取公告链接 =====');
    const listResults = await fetchListPageUrls();
    
    if (listResults.length > 0) {
      console.log(`[JilinV5] 从列表页获取到 ${listResults.length} 个公告链接`);
      
      for (let j = 0; j < listResults.length; j++) {
        const item = listResults[j];
        console.log(`\n[JilinV5] 处理 ${j + 1}/${listResults.length}: ${item.url.substring(0, 60)}...`);
        
        await processBidItem(item, stats, processedUrls);
        
        // 请求间隔
        await delay(JILIN_CONFIG.requestDelay);
      }
    }
  }
  
  // 方式2：通过Web Search获取URL
  const queries = JILIN_CONFIG.searchQueries.slice(0, maxQueries);
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`\n[JilinV5] ===== 搜索 ${i + 1}/${queries.length}: ${query} =====`);
    
    // 搜索获取详情页URL
    const results = await searchJilinSite(query, resultsPerQuery);
    
    if (results.length === 0) {
      console.log(`[JilinV5] 未找到结果，跳过`);
      continue;
    }
    
    // 处理每个详情页
    for (let j = 0; j < results.length; j++) {
      const item = results[j];
      console.log(`\n[JilinV5] 处理 ${j + 1}/${results.length}: ${item.title.substring(0, 40)}...`);
      
      await processBidItem(item, stats, processedUrls);
      
      // 请求间隔
      await delay(JILIN_CONFIG.requestDelay);
    }
    
    // 搜索间隔
    await delay(JILIN_CONFIG.requestDelay * 2);
  }
  
  console.log('\n[JilinV5] ===== 采集完成 =====');
  console.log(`[JilinV5] 总计处理: ${stats.total} 条`);
  console.log(`[JilinV5] 成功保存: ${stats.saved} 条`);
  console.log(`[JilinV5] 跳过: ${stats.skipped} 条`);
  console.log(`[JilinV5] 错误: ${stats.errors} 条`);
  
  if (stats.details.length > 0) {
    console.log('\n[JilinV5] 成功保存的公告:');
    stats.details.slice(0, 20).forEach((detail, i) => {
      console.log(`${i + 1}. ${detail}`);
    });
    if (stats.details.length > 20) {
      console.log(`... 还有 ${stats.details.length - 20} 条`);
    }
  }
  
  return stats;
}

/**
 * 快速采集模式 - 直接使用已知URL采集
 */
export async function quickCollectFromUrls(urls: string[]): Promise<CollectionStats> {
  const stats: CollectionStats = {
    total: 0,
    saved: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };
  
  const processedUrls = new Set<string>();
  
  console.log(`[JilinV5] 快速采集模式: ${urls.length} 个URL`);
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    
    if (processedUrls.has(url)) continue;
    processedUrls.add(url);
    
    console.log(`\n[JilinV5] 处理 ${i + 1}/${urls.length}: ${url.substring(0, 60)}...`);
    
    stats.total++;
    
    try {
      const content = await fetchDetailContent(url);
      
      if (!content || content.length < 300) {
        stats.skipped++;
        continue;
      }
      
      // 从URL或内容中提取标题
      const titleMatch = content.match(/(.{20,100})公告/);
      const title = titleMatch ? titleMatch[1] + '公告' : `吉林省采购公告 ${i + 1}`;
      
      const extractedInfo = await extractBidInfo(title, content, url);
      
      if (!extractedInfo) {
        stats.skipped++;
        continue;
      }
      
      const saved = await saveBidToDatabase(extractedInfo, content, url);
      
      if (saved) {
        stats.saved++;
        stats.details.push(
          `✓ ${(extractedInfo.title as string)?.substring(0, 50)}... [${extractedInfo.contact_person} ${extractedInfo.contact_phone}]`
        );
      } else {
        stats.skipped++;
      }
    } catch (error) {
      stats.errors++;
      console.error(`[JilinV5] 处理失败:`, error);
    }
    
    await delay(JILIN_CONFIG.requestDelay);
  }
  
  console.log('\n[JilinV5] 快速采集完成');
  console.log(`[JilinV5] 保存: ${stats.saved} 条`);
  
  return stats;
}

// 导出配置
export { JILIN_CONFIG };
