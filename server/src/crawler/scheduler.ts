/**
 * 招标信息爬虫系统 - 定时任务调度器
 * 
 * 调度策略（符合法律法规）：
 * 1. 每4小时执行一次主爬取任务
 * 2. 各数据源错峰爬取，避免集中请求
 * 3. 每天凌晨清理过期数据
 */

import cron, { type ScheduledTask } from 'node-cron';
import type { CrawlResult, CrawlerStatus, CrawlLog } from './types';
import { createParser, getAvailableParsers } from './parsers';
import { saveBids, cleanupOldData, getCrawlerStats, clearDedupCache } from './storage';
import { PARSER_CONFIGS, CRAWLER_CONFIG } from './config';

// 爬虫状态
let isRunning = false;
let lastRunTime: string | undefined;
const crawlLogs: CrawlLog[] = [];
let totalCrawled = 0;
let successCount = 0;
let errorCount = 0;

// 定时任务实例
let mainTask: ScheduledTask | null = null;
let cleanupTask: ScheduledTask | null = null;
let sourceTasks: Map<string, ScheduledTask> = new Map();

/**
 * 执行单个数据源的爬取
 */
async function crawlSource(sourceName: string): Promise<CrawlResult | null> {
  const parser = createParser(sourceName);
  if (!parser) {
    console.log(`[Scheduler] Parser not found: ${sourceName}`);
    return null;
  }

  const logId = `${sourceName}-${Date.now()}`;
  const log: CrawlLog = {
    id: logId,
    source: sourceName,
    startTime: new Date().toISOString(),
    status: 'running',
    crawledCount: 0,
    savedCount: 0,
  };

  crawlLogs.push(log);

  try {
    console.log(`[Scheduler] Starting crawl for ${sourceName}`);
    
    const result = await parser.crawl();
    
    log.endTime = new Date().toISOString();
    log.status = result.success ? 'success' : 'failed';
    log.crawledCount = result.count;
    log.error = result.error;

    if (result.success && result.data.length > 0) {
      // 保存数据
      const saveResult = await saveBids(result.data);
      log.savedCount = saveResult.saved;
      
      console.log(
        `[Scheduler] ${sourceName} completed: ` +
        `crawled=${result.count}, saved=${saveResult.saved}, ` +
        `duplicates=${saveResult.duplicates}`
      );
      
      totalCrawled += result.count;
      successCount++;
    } else if (!result.success) {
      errorCount++;
    }

    return result;
  } catch (error) {
    log.endTime = new Date().toISOString();
    log.status = 'failed';
    log.error = error instanceof Error ? error.message : 'Unknown error';
    errorCount++;
    
    console.error(`[Scheduler] Error crawling ${sourceName}:`, error);
    return null;
  }
}

/**
 * 执行所有数据源的爬取
 */
async function crawlAllSources(): Promise<void> {
  if (isRunning) {
    console.log('[Scheduler] Crawler already running, skipping...');
    return;
  }

  isRunning = true;
  lastRunTime = new Date().toISOString();
  
  console.log('[Scheduler] Starting crawl cycle...');
  console.log(`[Scheduler] Available parsers: ${getAvailableParsers().join(', ')}`);

  const results: CrawlResult[] = [];
  
  // 按配置顺序爬取各数据源
  for (const config of PARSER_CONFIGS) {
    if (!config.enabled) {
      continue;
    }

    const result = await crawlSource(config.name);
    if (result) {
      results.push(result);
    }

    // 数据源之间的延迟
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  // 汇总结果
  const totalCrawled = results.reduce((sum, r) => sum + r.count, 0);
  const successSources = results.filter(r => r.success).length;
  
  console.log(
    `[Scheduler] Crawl cycle completed: ` +
    `sources=${successSources}/${results.length}, ` +
    `total_items=${totalCrawled}`
  );

  isRunning = false;
}

/**
 * 启动定时任务
 */
export function startScheduler(): void {
  console.log('[Scheduler] Starting crawler scheduler...');
  
  // 清空去重缓存
  clearDedupCache();

  // 主爬取任务：每4小时执行
  mainTask = cron.schedule(
    CRAWLER_CONFIG.schedule.mainCrawl,
    () => {
      console.log('[Scheduler] Main crawl task triggered');
      crawlAllSources();
    },
    {
      timezone: 'Asia/Shanghai',
    }
  );

  // 为每个数据源创建独立任务（错峰）
  for (const config of PARSER_CONFIGS) {
    if (!config.enabled || !config.schedule) {
      continue;
    }

    const task = cron.schedule(
      config.schedule,
      () => {
        crawlSource(config.name);
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    sourceTasks.set(config.name, task);
  }

  // 清理任务：每天凌晨3点
  cleanupTask = cron.schedule(
    CRAWLER_CONFIG.schedule.cleanup,
    async () => {
      console.log('[Scheduler] Cleanup task triggered');
      await cleanupOldData();
    },
    {
      timezone: 'Asia/Shanghai',
    }
  );

  console.log('[Scheduler] Scheduler started');
  console.log(`[Scheduler] Main task: ${CRAWLER_CONFIG.schedule.mainCrawl}`);
  console.log(`[Scheduler] Source tasks: ${sourceTasks.size}`);
}

/**
 * 停止定时任务
 */
export function stopScheduler(): void {
  console.log('[Scheduler] Stopping scheduler...');

  if (mainTask) {
    mainTask.stop();
    mainTask = null;
  }

  if (cleanupTask) {
    cleanupTask.stop();
    cleanupTask = null;
  }

  for (const [name, task] of sourceTasks) {
    task.stop();
    console.log(`[Scheduler] Stopped task for ${name}`);
  }
  sourceTasks.clear();

  console.log('[Scheduler] Scheduler stopped');
}

/**
 * 手动触发爬取
 */
export async function manualCrawl(sourceName?: string): Promise<CrawlResult | CrawlResult[] | null> {
  if (isRunning) {
    console.log('[Scheduler] Crawler already running');
    return null;
  }

  if (sourceName) {
    return crawlSource(sourceName);
  } else {
    await crawlAllSources();
    return null;
  }
}

/**
 * 获取爬虫状态
 */
export function getCrawlerStatus(): CrawlerStatus {
  return {
    isRunning,
    lastRunTime,
    nextRunTime: getNextRunTime(),
    totalCrawled,
    successCount,
    errorCount,
    sources: PARSER_CONFIGS.map(config => ({
      name: config.name,
      enabled: config.enabled,
    })),
  };
}

/**
 * 获取下次运行时间
 */
function getNextRunTime(): string | undefined {
  // 简单估算：下次整4小时
  const now = new Date();
  const nextHour = Math.ceil((now.getHours() + 1) / 4) * 4;
  const next = new Date(now);
  next.setHours(nextHour % 24, 0, 0, 0);
  
  return next.toISOString();
}

/**
 * 获取爬取日志
 */
export function getCrawlLogs(limit: number = 20): CrawlLog[] {
  return crawlLogs.slice(-limit);
}

/**
 * 导出统计函数
 */
export { getCrawlerStats };
