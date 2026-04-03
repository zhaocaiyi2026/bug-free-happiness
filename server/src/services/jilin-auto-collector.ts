/**
 * 吉林省政府采购网自动化采集服务
 * 
 * 特点：
 * 1. 使用FetchClient获取JavaScript渲染后的列表页
 * 2. 自动解析列表页获取所有公告URL
 * 3. 自动访问详情页获取完整内容
 * 4. 使用豆包大模型提取结构化信息
 * 
 * 合法合规：仅采集公开发布的政府采购公告信息
 */

import { LLMClient, FetchClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as cheerio from 'cheerio';

// 采集配置
const CONFIG = {
  // 列表页URL模板
  listUrl: 'http://www.ccgp-jilin.gov.cn/site/category?parentId=550068&childrenCode=ZcyAnnouncement',
  // 详情页URL模板
  detailUrlTemplate: 'http://www.ccgp-jilin.gov.cn/site/detail?parentId=550068&articleId={articleId}',
  // 请求间隔（毫秒）
  requestDelay: 1200,
  // 每批处理的数量
  batchSize: 20,
  // 是否只采集2026年数据
  filter2026: true,
};

interface BidItem {
  articleId: string;
  title: string;
  region: string;
  publishDate: string;
  detailUrl: string;
}

interface CollectionStats {
  total: number;
  saved: number;
  skipped: number;
  errors: number;
  details: string[];
}

// LLM客户端
let llmClient: LLMClient | null = null;
// Fetch客户端
let fetchClient: FetchClient | null = null;

function getLLMClient(): LLMClient {
  if (!llmClient) {
    llmClient = new LLMClient(new Config());
  }
  return llmClient;
}

function getFetchClient(): FetchClient {
  if (!fetchClient) {
    fetchClient = new FetchClient(new Config());
  }
  return fetchClient;
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 使用 FetchClient 获取页面内容（支持JavaScript渲染）
 */
async function fetchPage(url: string): Promise<string> {
  try {
    console.log(`[JilinAuto] 获取页面: ${url.substring(0, 80)}...`);
    
    const client = getFetchClient();
    const response = await client.fetch(url);
    
    if (response.status_code !== 0) {
      console.error(`[JilinAuto] 获取失败: ${response.status_message}`);
      return '';
    }
    
    // 提取文本内容
    const textContent = response.content
      .filter((item): item is { type: 'text'; text: string } => item.type === 'text' && !!item.text)
      .map(item => item.text)
      .join('\n');
    
    // 提取链接信息（用于获取articleId）
    const links = response.content
      .filter((item): item is { type: 'link'; url: string } => item.type === 'link' && !!item.url)
      .map(item => item.url);
    
    // 组合成HTML格式的字符串以便cheerio解析
    // 将文本和链接组合
    let html = textContent;
    
    // 添加链接信息作为HTML链接
    for (const link of links) {
      if (link.includes('articleId')) {
        html += `\n<a href="${link}">公告链接</a>`;
      }
    }
    
    console.log(`[JilinAuto] 获取成功: 标题=${response.title}, 内容长度=${html.length}, 链接数=${links.length}`);
    
    return html;
  } catch (error) {
    console.error(`[JilinAuto] 获取页面失败: ${url}`, error);
    return '';
  }
}

/**
 * 从FetchClient响应中提取公告链接
 */
function extractBidItemsFromResponse(
  response: Awaited<ReturnType<FetchClient['fetch']>>
): BidItem[] {
  const items: BidItem[] = [];
  
  // 从链接中提取
  for (const item of response.content) {
    if (item.type === 'link' && item.url) {
      const url = item.url;
      
      // 提取articleId
      const articleIdMatch = url.match(/articleId=([^&]+)/);
      if (!articleIdMatch) continue;
      
      const articleId = articleIdMatch[1];
      
      // 构造详情页URL
      const detailUrl = `http://www.ccgp-jilin.gov.cn/site/detail?parentId=550068&articleId=${articleId}`;
      
      items.push({
        articleId,
        title: `公告-${articleId}`,
        region: '',
        publishDate: '',
        detailUrl,
      });
    }
  }
  
  // 去重
  const uniqueItems = items.filter((item, index, self) => 
    index === self.findIndex(i => i.articleId === item.articleId)
  );
  
  return uniqueItems;
}

/**
 * 解析列表页HTML获取公告列表（备用方法）
 */
function parseListPage(html: string): BidItem[] {
  const items: BidItem[] = [];
  const $ = cheerio.load(html);
  
  // 查找所有包含articleId的链接
  $('a[href*="articleId"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    const title = $el.text().trim();
    
    // 提取articleId
    const articleIdMatch = href.match(/articleId=([^&]+)/);
    if (!articleIdMatch) return;
    
    const articleId = articleIdMatch[1];
    
    // 跳过非采购公告链接（如页码链接）
    if (!title || title.length < 10) return;
    
    // 尝试提取地区（通常在链接前的方括号中）
    let region = '';
    const parentText = $el.parent()?.text() || '';
    const regionMatch = parentText.match(/\[([^\]]+)\]/);
    if (regionMatch) {
      region = regionMatch[1].trim();
    }
    
    // 尝试提取日期
    let publishDate = '';
    const dateMatch = parentText.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      publishDate = dateMatch[1];
    }
    
    const detailUrl = `http://www.ccgp-jilin.gov.cn${href}`;
    
    items.push({
      articleId,
      title,
      region,
      publishDate,
      detailUrl,
    });
  });
  
  // 去重
  const uniqueItems = items.filter((item, index, self) => 
    index === self.findIndex(i => i.articleId === item.articleId)
  );
  
  return uniqueItems;
}

/**
 * 解析详情页HTML获取公告内容
 */
function parseDetailPage(html: string): { title: string; content: string } {
  const $ = cheerio.load(html);
  
  // 提取标题
  let title = '';
  const titleSelectors = ['h1', 'h2', '.title', '.article-title', '.detail-title'];
  for (const selector of titleSelectors) {
    const $title = $(selector).first();
    if ($title.length && $title.text().trim().length > 5) {
      title = $title.text().trim();
      break;
    }
  }
  
  // 提取正文 - 尝试多种选择器
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
    '.Custom_Editor',
    '.TRS_Editor',
    '.table-box',
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
  
  return { title, content };
}

/**
 * 使用豆包大模型从详情页提取结构化信息
 */
async function extractBidInfo(
  title: string,
  content: string
): Promise<Record<string, unknown> | null> {
  try {
    const client = getLLMClient();
    
    // 检查是否为2026年
    if (CONFIG.filter2026) {
      const has2026 = title.includes('2026') || content.includes('2026年') || content.includes('2026年度');
      if (!has2026) {
        return null;
      }
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
1. **联系人和电话是必填字段**，必须从公告中提取
2. 如果找不到联系人和电话，返回null
3. 请只返回JSON，不要有任何其他文字`;

    const response = await client.invoke(
      [{ role: 'user', content: prompt }],
      { temperature: 0.1, model: 'doubao-seed-2-0-pro-260215' }
    );

    const responseContent = response.content || '';
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) return null;
    
    const data = JSON.parse(jsonMatch[0]);
    
    // 验证必须有联系人和电话
    if (!data.contact_person || !data.contact_phone) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('[JilinAuto] 提取失败:', error);
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
    
    // 检查是否已存在
    const { data: existing } = await client
      .from('bids')
      .select('id')
      .eq('title', data.title as string)
      .maybeSingle();
    
    if (existing) {
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
      source_platform: 'jilin_auto',
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
      console.error('[JilinAuto] 保存失败:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[JilinAuto] 保存异常:', error);
    return false;
  }
}

/**
 * 处理单个公告
 */
async function processBidItem(
  item: BidItem,
  stats: CollectionStats,
  processedIds: Set<string>
): Promise<void> {
  // 检查是否已处理
  if (processedIds.has(item.articleId)) {
    return;
  }
  processedIds.add(item.articleId);
  
  stats.total++;
  
  try {
    // 获取详情页
    const client = getFetchClient();
    const response = await client.fetch(item.detailUrl);
    
    if (response.status_code !== 0 || !response.content) {
      stats.skipped++;
      console.log(`[JilinAuto] 获取详情页失败: ${item.articleId}`);
      return;
    }
    
    // 提取文本内容
    const textContent = response.content
      .filter((contentItem): contentItem is { type: 'text'; text: string } => 
        contentItem.type === 'text' && !!contentItem.text
      )
      .map(contentItem => contentItem.text)
      .join('\n');
    
    const content = textContent;
    const title = response.title || item.title;
    
    if (!content || content.length < 300) {
      stats.skipped++;
      console.log(`[JilinAuto] 内容太短: ${item.articleId}, 长度=${content.length}`);
      return;
    }
    
    // 使用AI提取结构化信息
    const extractedInfo = await extractBidInfo(title, content);
    
    if (!extractedInfo) {
      stats.skipped++;
      console.log(`[JilinAuto] AI提取失败: ${item.articleId}`);
      return;
    }
    
    // 保存到数据库
    const saved = await saveBidToDatabase(extractedInfo, content, item.detailUrl);
    
    if (saved) {
      stats.saved++;
      stats.details.push(
        `✓ ${(extractedInfo.title as string)?.substring(0, 50)}... [${extractedInfo.contact_person} ${extractedInfo.contact_phone}]`
      );
      console.log(`[JilinAuto] ✓ 保存成功: ${(extractedInfo.title as string)?.substring(0, 50)}...`);
    } else {
      stats.skipped++;
    }
  } catch (error) {
    stats.errors++;
    console.error(`[JilinAuto] 处理失败: ${item.title}`, error);
  }
}

/**
 * 主采集函数
 */
export async function collectJilinAuto(options?: {
  maxItems?: number;
  filter2026?: boolean;
}): Promise<CollectionStats> {
  const stats: CollectionStats = {
    total: 0,
    saved: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };
  
  const processedIds = new Set<string>();
  const maxItems = options?.maxItems || 100;
  
  if (options?.filter2026 !== undefined) {
    CONFIG.filter2026 = options.filter2026;
  }
  
  console.log('[JilinAuto] ===== 开始自动化采集吉林省政府采购网 =====');
  console.log(`[JilinAuto] 配置: 最大采集数=${maxItems}, 只采集2026年=${CONFIG.filter2026}`);
  
  // 获取列表页
  console.log('\n[JilinAuto] 步骤1: 获取列表页...');
  const client = getFetchClient();
  const listResponse = await client.fetch(CONFIG.listUrl);
  
  if (listResponse.status_code !== 0) {
    console.error('[JilinAuto] 获取列表页失败:', listResponse.status_message);
    return stats;
  }
  
  // 从响应中提取公告链接
  console.log('\n[JilinAuto] 步骤2: 解析列表页获取公告链接...');
  const items = extractBidItemsFromResponse(listResponse);
  
  console.log(`[JilinAuto] 解析到 ${items.length} 条公告链接`);
  
  if (items.length === 0) {
    console.error('[JilinAuto] 未找到公告链接');
    return stats;
  }
  
  // 处理每个公告
  console.log('\n[JilinAuto] 步骤3: 逐个处理公告...');
  const itemsToProcess = items.slice(0, maxItems);
  
  for (let i = 0; i < itemsToProcess.length; i++) {
    const item = itemsToProcess[i];
    console.log(`\n[JilinAuto] 处理 ${i + 1}/${itemsToProcess.length}: ${item.articleId}...`);
    
    await processBidItem(item, stats, processedIds);
    
    // 请求间隔
    await delay(CONFIG.requestDelay);
  }
  
  console.log('\n[JilinAuto] ===== 采集完成 =====');
  console.log(`[JilinAuto] 总计处理: ${stats.total} 条`);
  console.log(`[JilinAuto] 成功保存: ${stats.saved} 条`);
  console.log(`[JilinAuto] 跳过: ${stats.skipped} 条`);
  console.log(`[JilinAuto] 错误: ${stats.errors} 条`);
  
  if (stats.details.length > 0) {
    console.log('\n[JilinAuto] 成功保存的公告:');
    stats.details.forEach((detail, i) => {
      console.log(`${i + 1}. ${detail}`);
    });
  }
  
  return stats;
}

/**
 * 获取列表页公告数量
 */
export async function getListPageInfo(): Promise<{ total: number; items: BidItem[] }> {
  console.log('[JilinAuto] 获取列表页信息...');
  
  try {
    const client = getFetchClient();
    const response = await client.fetch(CONFIG.listUrl);
    
    if (response.status_code !== 0) {
      console.error('[JilinAuto] 获取列表页失败:', response.status_message);
      return { total: 0, items: [] };
    }
    
    const items = extractBidItemsFromResponse(response);
    
    // 尝试从标题或内容中提取总数
    let total = items.length;
    const textContent = response.content
      .filter((item): item is { type: 'text'; text: string } => item.type === 'text' && !!item.text)
      .map(item => item.text)
      .join(' ');
    
    const totalMatch = textContent.match(/共\s*(\d+)\s*个结果/);
    if (totalMatch) {
      total = parseInt(totalMatch[1], 10);
    }
    
    console.log(`[JilinAuto] 列表页信息: 总数=${total}, 当前页=${items.length}`);
    console.log(`[JilinAuto] 页面标题: ${response.title}`);
    
    return { total, items };
  } catch (error) {
    console.error('[JilinAuto] 获取列表页信息失败:', error);
    return { total: 0, items: [] };
  }
}

// 导出配置
export { CONFIG };
