/**
 * 招标信息爬虫系统 - 入口文件
 * 
 * 使用方法：
 * 1. 启动定时任务：startCrawler()
 * 2. 停止定时任务：stopCrawler()
 * 3. 手动爬取：manualCrawl()
 * 4. 获取状态：getCrawlerStatus()
 */

// 导出类型
export * from './types';

// 导出配置
export { CRAWLER_CONFIG, PARSER_CONFIGS } from './config';

// 导出功能模块
export { startScheduler, stopScheduler, manualCrawl, getCrawlerStatus, getCrawlerStats, getCrawlLogs } from './scheduler';
export { saveBids, cleanupOldData } from './storage';
export { createParser, getAvailableParsers } from './parsers';

// 导出解析器
export * from './parsers';

import { startScheduler, stopScheduler } from './scheduler';

/**
 * 启动爬虫服务
 */
export function startCrawler(): void {
  console.log('=================================');
  console.log('招标信息爬虫系统启动');
  console.log('=================================');
  console.log('合规说明:');
  console.log('- 请求间隔: 3-5秒');
  console.log('- 爬取频率: 每4小时');
  console.log('- 遵守robots.txt协议');
  console.log('- 数据来源标注');
  console.log('=================================');
  
  startScheduler();
}

/**
 * 停止爬虫服务
 */
export function stopCrawlerService(): void {
  stopScheduler();
}
