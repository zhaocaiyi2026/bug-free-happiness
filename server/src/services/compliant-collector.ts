/**
 * 合规采集器 - 吉林省政府采购网
 * 
 * 遵循原则：
 * 1. 温和请求：随机间隔1-3秒，控制并发≤1
 * 2. 模拟真人：完整请求头、随机滚动、模拟点击
 * 3. 遵守规则：无robots.txt限制，公开数据
 * 4. 礼貌标识：标准浏览器UA
 */

import { chromium } from 'playwright';
import type { Browser, Page, BrowserContext } from 'playwright';
import { getSupabaseClient } from '@/storage/database/supabase-client.js';

// 配置
const CONFIG = {
  baseUrl: 'http://www.ccgp-jilin.gov.cn',
  listPageUrl: 'http://www.ccgp-jilin.gov.cn/site/category?parentId=550068&childrenCode=ZcyAnnouncement',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  minDelay: 1000,  // 最小延迟1秒
  maxDelay: 3000,  // 最大延迟3秒
  maxRetries: 3,   // 最大重试次数
  timeout: 30000,  // 页面超时30秒
};

// 随机延迟
function randomDelay(): Promise<void> {
  const delay = Math.random() * (CONFIG.maxDelay - CONFIG.minDelay) + CONFIG.minDelay;
  console.log(`[合规采集] 等待 ${(delay / 1000).toFixed(1)} 秒...`);
  return new Promise(resolve => setTimeout(resolve, delay));
}

// 指数退避
async function exponentialBackoff(retryCount: number): Promise<void> {
  const delay = Math.pow(2, retryCount) * 1000;
  console.log(`[合规采集] 指数退避 ${delay / 1000} 秒...`);
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 合规采集器类
 */
export class CompliantCollector {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  /**
   * 初始化浏览器
   */
  async init(): Promise<void> {
    console.log('[合规采集] 初始化浏览器...');
    
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    this.context = await this.browser.newContext({
      userAgent: CONFIG.userAgent,
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    this.page = await this.context.newPage();
    
    // 设置超时
    this.page.setDefaultTimeout(CONFIG.timeout);
    this.page.setDefaultNavigationTimeout(CONFIG.timeout);
    
    console.log('[合规采集] 浏览器初始化完成');
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      console.log('[合规采集] 浏览器已关闭');
    }
  }

  /**
   * 访问列表页并获取公告列表
   */
  async fetchListPage(pageNum: number = 1): Promise<Array<{
    title: string;
    date: string;
    url: string;
    region: string;
  }>> {
    if (!this.page) {
      throw new Error('浏览器未初始化');
    }

    const url = pageNum === 1 
      ? CONFIG.listPageUrl 
      : `${CONFIG.listPageUrl}&pageIndex=${pageNum}`;

    console.log(`[合规采集] 访问列表页: 第${pageNum}页`);

    let retryCount = 0;
    while (retryCount < CONFIG.maxRetries) {
      try {
        // 访问页面
        await this.page.goto(url, { waitUntil: 'networkidle' });
        
        // 随机延迟，模拟阅读
        await randomDelay();
        
        // 模拟滚动
        await this.page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await randomDelay();

        // 提取公告列表
        const announcements = await this.page.evaluate(() => {
          const items: Array<{ title: string; date: string; url: string; region: string }> = [];
          
          // 查找所有公告链接
          const links = document.querySelectorAll('a[href*="site/detail"]');
          
          links.forEach(link => {
            const href = link.getAttribute('href') || '';
            const text = link.textContent?.trim() || '';
            
            // 查找日期（通常在链接后面的文本中）
            const parent = link.closest('li') || link.parentElement;
            const dateText = parent?.textContent?.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
            
            // 查找地区
            const regionMatch = parent?.textContent?.match(/\[([^\]]+)\]/);
            const region = regionMatch ? regionMatch[1] : '';
            
            if (text && href) {
              items.push({
                title: text,
                date: dateText,
                url: href.startsWith('http') ? href : `http://www.ccgp-jilin.gov.cn${href}`,
                region,
              });
            }
          });
          
          return items;
        });

        console.log(`[合规采集] 第${pageNum}页获取到 ${announcements.length} 条公告`);
        return announcements;

      } catch (error) {
        retryCount++;
        console.error(`[合规采集] 第${pageNum}页获取失败 (重试 ${retryCount}/${CONFIG.maxRetries}):`, error);
        
        if (retryCount < CONFIG.maxRetries) {
          await exponentialBackoff(retryCount);
        } else {
          throw error;
        }
      }
    }

    return [];
  }

  /**
   * 访问详情页并提取完整信息
   */
  async fetchDetailPage(url: string): Promise<{
    title: string;
    content: string;
    projectNumber?: string;
    budget?: number;
    contactPerson?: string;
    contactPhone?: string;
    publishDate?: string;
    deadline?: string;
    purchasingUnit?: string;
    agency?: string;
  } | null> {
    if (!this.page) {
      throw new Error('浏览器未初始化');
    }

    console.log(`[合规采集] 访问详情页: ${url.substring(0, 80)}...`);

    let retryCount = 0;
    while (retryCount < CONFIG.maxRetries) {
      try {
        // 随机延迟
        await randomDelay();
        
        // 访问详情页
        await this.page.goto(url, { waitUntil: 'networkidle' });
        
        // 模拟阅读
        await this.page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 3);
        });
        await randomDelay();

        // 提取详情内容
        const detail = await this.page.evaluate(() => {
          // 提取标题
          const titleEl = document.querySelector('h1, .title, .article-title');
          const title = titleEl?.textContent?.trim() || '';
          
          // 提取正文
          const contentEl = document.querySelector('.article-content, .content, .detail-content, article');
          let content = contentEl?.textContent?.trim() || '';
          
          // 如果没找到，尝试获取整个主体内容
          if (!content) {
            const bodyEl = document.querySelector('body');
            content = bodyEl?.innerText || '';
          }
          
          // 清理内容
          content = content
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();

          // 提取项目编号
          const projectNumberMatch = content.match(/项目编号[：:]\s*([^\s\n]+)/);
          const projectNumber = projectNumberMatch ? projectNumberMatch[1] : undefined;

          // 提取预算金额
          const budgetMatch = content.match(/预算金额[：:]\s*([\d,]+\.?\d*)\s*元/);
          const budget = budgetMatch ? parseFloat(budgetMatch[1].replace(/,/g, '')) : undefined;

          // 提取联系人
          const contactMatch = content.match(/联系人[：:]\s*([^\s\n，,]+)/);
          const contactPerson = contactMatch ? contactMatch[1] : undefined;

          // 提取联系电话
          const phoneMatch = content.match(/联系电话[：:]\s*([\d-]+)/);
          const contactPhone = phoneMatch ? phoneMatch[1] : undefined;

          // 提取发布日期
          const dateMatch = content.match(/(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)/);
          const publishDate = dateMatch ? dateMatch[1].replace(/[年月]/g, '-').replace(/日/g, '') : undefined;

          return {
            title,
            content,
            projectNumber,
            budget,
            contactPerson,
            contactPhone,
            publishDate,
          };
        });

        console.log(`[合规采集] 详情页获取成功，正文长度: ${detail.content.length} 字符`);
        return detail;

      } catch (error) {
        retryCount++;
        console.error(`[合规采集] 详情页获取失败 (重试 ${retryCount}/${CONFIG.maxRetries}):`, error);
        
        if (retryCount < CONFIG.maxRetries) {
          await exponentialBackoff(retryCount);
        } else {
          console.error(`[合规采集] 详情页最终失败: ${url}`);
          return null;
        }
      }
    }

    return null;
  }

  /**
   * 批量采集公告（带日期过滤）
   */
  async collectAnnouncements(
    startDate: string, // 格式: 2026-01-01
    endDate: string,   // 格式: 2026-04-03
    maxPages: number = 10
  ): Promise<{
    total: number;
    collected: number;
    data: Array<Record<string, unknown>>;
  }> {
    console.log(`[合规采集] 开始采集 ${startDate} 至 ${endDate} 的公告，最多 ${maxPages} 页`);
    
    const startTime = new Date(startDate);
    const endTime = new Date(endDate);
    
    const allAnnouncements: Array<Record<string, unknown>> = [];
    let pageNum = 1;
    let shouldContinue = true;

    while (shouldContinue && pageNum <= maxPages) {
      const list = await this.fetchListPage(pageNum);
      
      if (list.length === 0) {
        console.log(`[合规采集] 第${pageNum}页无数据，停止采集`);
        break;
      }

      // 过滤日期范围
      for (const item of list) {
        const itemDate = new Date(item.date);
        
        if (itemDate > endTime) {
          // 日期太晚，继续
          continue;
        }
        
        if (itemDate < startTime) {
          // 日期太早，停止采集
          console.log(`[合规采集] 到达日期边界: ${item.date}`);
          shouldContinue = false;
          break;
        }

        // 日期在范围内，获取详情
        const detail = await this.fetchDetailPage(item.url);
        
        if (detail && detail.content.length >= 500) {
          allAnnouncements.push({
            title: detail.title || item.title,
            content: detail.content,
            projectNumber: detail.projectNumber,
            budget: detail.budget,
            contactPerson: detail.contactPerson,
            contactPhone: detail.contactPhone,
            publishDate: detail.publishDate || item.date,
            province: '吉林省',
            city: item.region,
            sourceUrl: item.url,
            source: '吉林省政府采购网',
          });
        }
      }

      pageNum++;
    }

    console.log(`[合规采集] 采集完成，共 ${allAnnouncements.length} 条有效数据`);
    
    return {
      total: (pageNum - 1) * 15,
      collected: allAnnouncements.length,
      data: allAnnouncements,
    };
  }
}

/**
 * 创建采集器实例
 */
export async function createCollector(): Promise<CompliantCollector> {
  const collector = new CompliantCollector();
  await collector.init();
  return collector;
}

/**
 * 便捷方法：采集并入库
 */
export async function collectAndSave(
  startDate: string = '2026-01-01',
  endDate: string = new Date().toISOString().split('T')[0],
  maxPages: number = 5
): Promise<{
  success: boolean;
  collected: number;
  saved: number;
  message: string;
}> {
  let collector: CompliantCollector | null = null;
  
  try {
    collector = await createCollector();
    const result = await collector.collectAnnouncements(startDate, endDate, maxPages);
    
    if (result.data.length === 0) {
      return {
        success: true,
        collected: 0,
        saved: 0,
        message: '未采集到符合条件的数据',
      };
    }

    // 入库
    const client = getSupabaseClient();
    let saved = 0;
    
    for (const item of result.data) {
      try {
        // 检查是否已存在
        const { data: existing } = await client
          .from('bids')
          .select('id')
          .eq('source_url', item.sourceUrl)
          .maybeSingle();
        
        if (existing) {
          continue;
        }

        // 插入数据
        const { error } = await client
          .from('bids')
          .insert({
            title: item.title,
            content: item.content,
            project_code: item.projectNumber || null,
            budget: item.budget || null,
            contact_person: item.contactPerson || null,
            contact_phone: item.contactPhone || null,
            publish_date: item.publishDate ? new Date(item.publishDate as string).toISOString() : null,
            province: item.province,
            city: item.city || null,
            source: item.source,
            source_url: item.sourceUrl,
            bid_type: '公开招标',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        if (!error) {
          saved++;
        }
      } catch (e) {
        console.error('[合规采集] 入库失败:', e);
      }
    }

    return {
      success: true,
      collected: result.collected,
      saved,
      message: `成功采集 ${result.collected} 条，入库 ${saved} 条`,
    };
    
  } catch (error) {
    console.error('[合规采集] 采集失败:', error);
    return {
      success: false,
      collected: 0,
      saved: 0,
      message: `采集失败: ${error}`,
    };
  } finally {
    if (collector) {
      await collector.close();
    }
  }
}
