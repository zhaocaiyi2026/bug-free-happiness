/**
 * 吉林省政府采购数据采集服务 V4
 * 
 * 核心改进：直接从吉林省政府采购网列表页采集，而不是通过Web Search
 * 
 * 采集流程：
 * 1. 访问列表页获取公告链接
 * 2. 访问详情页提取完整信息（包括联系方式）
 * 3. 使用豆包大模型结构化提取
 * 
 * 数据来源：http://www.ccgp-jilin.gov.cn/site/category?parentId=550068&childrenCode=ZcyAnnouncement
 * 
 * 合法合规：仅采集公开发布的政府采购公告信息
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import axios from 'axios';
import * as cheerio from 'cheerio';

// 吉林省政府采购网配置
const JILIN_CONFIG = {
  // 列表页基础URL
  listUrl: 'http://www.ccgp-jilin.gov.cn/site/category',
  // 详情页基础URL
  detailUrl: 'http://www.ccgp-jilin.gov.cn/site/detail',
  // 父分类ID（采购公告）
  parentId: '550068',
  // 分类代码
  childrenCode: 'ZcyAnnouncement',
  // 每页数量
  pageSize: 15,
  // 请求间隔（毫秒）
  requestDelay: 1500,
  // 最大采集页数
  maxPages: 10,
  // 是否只采集2026年数据
  filter2026: true,
};

interface BidListItem {
  title: string;
  url: string;
  region: string;
  publishDate: string;
  articleId: string;
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
 * 从列表页获取公告链接
 * 注意：吉林省政府采购网是Vue.js渲染的SPA，HTML中可能没有完整数据
 * 我们需要尝试直接解析HTML或找到API接口
 */
async function fetchListPage(page: number): Promise<BidListItem[]> {
  try {
    console.log(`[JilinV4] 获取列表页: 第${page}页`);
    
    // 尝试直接访问列表页
    const url = `${JILIN_CONFIG.listUrl}?parentId=${JILIN_CONFIG.parentId}&childrenCode=${JILIN_CONFIG.childrenCode}`;
    
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
    const items: BidListItem[] = [];
    
    // 尝试多种选择器
    // 1. 标准链接选择器
    $('a[href*="articleId"]').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';
      const title = $el.text().trim();
      
      // 提取articleId
      const articleIdMatch = href.match(/articleId=([^&]+)/);
      if (!articleIdMatch) return;
      
      const articleId = articleIdMatch[1];
      const detailUrl = `${JILIN_CONFIG.detailUrl}?parentId=${JILIN_CONFIG.parentId}&articleId=${articleId}`;
      
      // 尝试提取地区（可能在链接前的span或相邻元素中）
      let region = '';
      const parentText = $el.parent()?.text() || '';
      const regionMatch = parentText.match(/\[([^\]]+)\]/);
      if (regionMatch) {
        region = regionMatch[1];
      }
      
      // 尝试提取日期
      let publishDate = '';
      const dateMatch = parentText.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        publishDate = dateMatch[1];
      }
      
      if (title && title.length > 10) {
        items.push({
          title,
          url: detailUrl,
          region,
          publishDate,
          articleId,
        });
      }
    });
    
    // 2. 如果上面没找到，尝试其他选择器
    if (items.length === 0) {
      // 尝试解析Vue渲染的数据
      const scriptData = $('script').toArray().find(script => {
        const content = $(script).html() || '';
        return content.includes('articleId') || content.includes('articleList');
      });
      
      if (scriptData) {
        console.log('[JilinV4] 发现可能的Vue数据，尝试解析...');
        // Vue数据通常在window.__INITIAL_STATE__或类似变量中
      }
    }
    
    // 去重
    const uniqueItems = items.filter((item, index, self) => 
      index === self.findIndex(i => i.articleId === item.articleId)
    );
    
    console.log(`[JilinV4] 解析到 ${uniqueItems.length} 条公告链接`);
    
    return uniqueItems;
  } catch (error) {
    console.error(`[JilinV4] 获取列表页失败:`, error);
    return [];
  }
}

/**
 * 获取详情页内容
 */
async function fetchDetailPage(url: string): Promise<{
  title: string;
  content: string;
  publishDate: string;
  rawHtml: string;
}> {
  try {
    console.log(`[JilinV4] 获取详情页: ${url.substring(0, 80)}...`);
    
    const response = await axios.get(url, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });
    
    const $ = cheerio.load(response.data);
    
    // 提取标题
    let title = '';
    const titleSelectors = ['h1', '.title', '.article-title', '.detail-title', 'h2'];
    for (const selector of titleSelectors) {
      const $title = $(selector).first();
      if ($title.length && $title.text().trim().length > 5) {
        title = $title.text().trim();
        break;
      }
    }
    
    // 提取发布时间
    let publishDate = '';
    const dateSelectors = ['.publish-time', '.date', '.time', '.article-date'];
    for (const selector of dateSelectors) {
      const $date = $(selector).first();
      if ($date.length) {
        const dateMatch = $date.text().match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          publishDate = dateMatch[1];
          break;
        }
      }
    }
    
    // 提取正文内容
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
      '.TRS_Editor',
      '.Custom_Editor',
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
      content = $('body').text().trim();
    }
    
    // 清理文本
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/[^\S\n]+/g, ' ')
      .trim();
    
    // 限制长度
    if (content.length > 25000) {
      content = content.substring(0, 25000);
    }
    
    console.log(`[JilinV4] 获取成功 - 标题: ${title.substring(0, 30)}..., 内容长度: ${content.length}`);
    
    return {
      title,
      content,
      publishDate,
      rawHtml: response.data,
    };
  } catch (error) {
    console.error(`[JilinV4] 获取详情页失败:`, error);
    return { title: '', content: '', publishDate: '', rawHtml: '' };
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
    if (JILIN_CONFIG.filter2026) {
      const has2026 = title.includes('2026') || content.includes('2026年') || content.includes('2026年度');
      if (!has2026) {
        console.log(`[JilinV4] 非2026年数据，跳过: ${title.substring(0, 40)}`);
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
  "budget": 预算金额（纯数字，单位元，如1000000）,
  "city": "吉林省内城市名（如长春市、吉林市、四平市、通化市、白城市、松原市、白山市、延边州等）",
  "industry": "所属行业",
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
   - 通常在"联系方式"、"采购人信息"、"代理机构信息"等段落
   - 电话格式可能是：0431-xxxxxxxx、139xxxxxxxx、0431-xxxxxxx转xxx
   - 多个联系人/电话都要提取，用逗号分隔

2. **预算金额处理**：
   - "100万元" → 1000000
   - "100万" → 1000000
   - "壹佰万元整" → 1000000
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
      console.log(`[JilinV4] 未找到JSON响应: ${responseContent.substring(0, 100)}`);
      return null;
    }
    
    const data = JSON.parse(jsonMatch[0]);
    
    // 验证必须有联系人和电话
    if (!data.contact_person || !data.contact_phone) {
      console.log(`[JilinV4] 缺少联系方式，跳过: ${title.substring(0, 40)}`);
      console.log(`[JilinV4] 提取结果: contact_person=${data.contact_person}, contact_phone=${data.contact_phone}`);
      return null;
    }
    
    console.log(`[JilinV4] 提取成功 - 联系人: ${data.contact_person}, 电话: ${data.contact_phone}`);
    
    return data;
  } catch (error) {
    console.error('[JilinV4] 提取失败:', error);
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
      console.log(`[JilinV4] 已存在，跳过: ${(data.title as string)?.substring(0, 40)}`);
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
      // 默认发布后30天截止
      const publishDate = new Date(data.publish_date as string);
      publishDate.setDate(publishDate.getDate() + 30);
      deadline = publishDate.toISOString();
    }
    
    const insertData = {
      title: data.title,
      content: content,
      source_url: url,
      source: '吉林省政府采购网',
      source_platform: 'jilin_ccgp_v4',
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
      console.error('[JilinV4] 保存失败:', error);
      return false;
    }
    
    console.log(`[JilinV4] ✓ 保存成功: ${(data.title as string)?.substring(0, 50)}`);
    return true;
  } catch (error) {
    console.error('[JilinV4] 保存异常:', error);
    return false;
  }
}

/**
 * 处理单个公告
 */
async function processBidItem(
  item: BidListItem,
  stats: CollectionStats
): Promise<void> {
  try {
    stats.total++;
    
    // 获取详情页
    const detail = await fetchDetailPage(item.url);
    
    if (!detail.content || detail.content.length < 200) {
      console.log(`[JilinV4] 内容过短，跳过: ${item.title.substring(0, 40)}`);
      stats.skipped++;
      return;
    }
    
    // 使用AI提取结构化信息
    const extractedInfo = await extractBidInfo(
      detail.title || item.title,
      detail.content,
      item.url
    );
    
    if (!extractedInfo) {
      stats.skipped++;
      return;
    }
    
    // 保存到数据库
    const saved = await saveBidToDatabase(extractedInfo, detail.content, item.url);
    
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
    console.error(`[JilinV4] 处理失败: ${item.title}`, error);
  }
}

/**
 * 主采集函数
 */
export async function collectJilin2026V4(options?: {
  maxPages?: number;
  filter2026?: boolean;
}): Promise<CollectionStats> {
  const stats: CollectionStats = {
    total: 0,
    saved: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };
  
  // 更新配置
  if (options?.maxPages) {
    JILIN_CONFIG.maxPages = options.maxPages;
  }
  if (options?.filter2026 !== undefined) {
    JILIN_CONFIG.filter2026 = options.filter2026;
  }
  
  console.log('[JilinV4] ===== 开始采集吉林省政府采购网数据 =====');
  console.log(`[JilinV4] 配置: 最大页数=${JILIN_CONFIG.maxPages}, 只采集2026年=${JILIN_CONFIG.filter2026}`);
  
  // 采集多页数据
  for (let page = 1; page <= JILIN_CONFIG.maxPages; page++) {
    console.log(`\n[JilinV4] ===== 第 ${page}/${JILIN_CONFIG.maxPages} 页 =====`);
    
    // 获取列表页
    const items = await fetchListPage(page);
    
    if (items.length === 0) {
      console.log(`[JilinV4] 第${page}页无数据，停止采集`);
      break;
    }
    
    // 处理每个公告
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`\n[JilinV4] 处理 ${i + 1}/${items.length}: ${item.title.substring(0, 40)}...`);
      
      await processBidItem(item, stats);
      
      // 请求间隔
      await delay(JILIN_CONFIG.requestDelay);
    }
    
    // 页间隔
    await delay(JILIN_CONFIG.requestDelay * 2);
  }
  
  console.log('\n[JilinV4] ===== 采集完成 =====');
  console.log(`[JilinV4] 总计: ${stats.total} 条`);
  console.log(`[JilinV4] 保存: ${stats.saved} 条`);
  console.log(`[JilinV4] 跳过: ${stats.skipped} 条`);
  console.log(`[JilinV4] 错误: ${stats.errors} 条`);
  
  if (stats.details.length > 0) {
    console.log('\n[JilinV4] 成功保存的公告:');
    stats.details.forEach((detail, i) => {
      console.log(`${i + 1}. ${detail}`);
    });
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
  
  console.log(`[JilinV4] 快速采集模式: ${urls.length} 个URL`);
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n[JilinV4] 处理 ${i + 1}/${urls.length}: ${url.substring(0, 60)}...`);
    
    stats.total++;
    
    try {
      const detail = await fetchDetailPage(url);
      
      if (!detail.content || detail.content.length < 200) {
        stats.skipped++;
        continue;
      }
      
      const extractedInfo = await extractBidInfo(detail.title, detail.content, url);
      
      if (!extractedInfo) {
        stats.skipped++;
        continue;
      }
      
      const saved = await saveBidToDatabase(extractedInfo, detail.content, url);
      
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
      console.error(`[JilinV4] 处理失败:`, error);
    }
    
    await delay(JILIN_CONFIG.requestDelay);
  }
  
  console.log('\n[JilinV4] 快速采集完成');
  console.log(`[JilinV4] 保存: ${stats.saved} 条`);
  
  return stats;
}

// 导出配置
export { JILIN_CONFIG };
