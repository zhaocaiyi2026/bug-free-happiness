/**
 * 定时任务调度器
 * 
 * 功能:
 * 1. 定时爬取各平台数据
 * 2. 支持按省份、类型并行爬取
 * 3. 爬取结果入库
 */

import cron from 'node-cron';
import { GgzyCrawler } from './ggzy.js';
import { CcgpCrawler } from './ccgp.js';
import { DataStorage } from './storage.js';
import type { CrawlerStats } from './types.js';
import { AnnouncementType } from './types.js';
import { PROVINCES, PLATFORMS } from './config.js';

export class CrawlerScheduler {
  private storage: DataStorage;
  private ggzyCrawler: GgzyCrawler;
  private ccgpCrawler: CcgpCrawler;
  private isRunning: boolean = false;

  constructor() {
    this.storage = new DataStorage();
    this.ggzyCrawler = new GgzyCrawler();
    this.ccgpCrawler = new CcgpCrawler();
  }

  /**
   * 启动定时任务
   */
  start(): void {
    console.log('\n====================================');
    console.log('招标爬虫定时任务启动');
    console.log('====================================\n');

    // 每小时执行一次增量爬取
    cron.schedule('0 * * * *', () => {
      this.runIncremental();
    });

    // 每天凌晨2点执行全量爬取
    cron.schedule('0 2 * * *', () => {
      this.runFull();
    });

    // 每周日凌晨3点清理过期数据
    cron.schedule('0 3 * * 0', () => {
      this.cleanup();
    });

    console.log('定时任务已启动:');
    console.log('  - 增量爬取: 每小时执行');
    console.log('  - 全量爬取: 每天凌晨2点');
    console.log('  - 数据清理: 每周日凌晨3点');
  }

  /**
   * 增量爬取（只爬取最新页面）
   */
  async runIncremental(): Promise<void> {
    if (this.isRunning) {
      console.log('爬虫正在运行，跳过本次增量爬取');
      return;
    }

    this.isRunning = true;
    console.log('\n------------------------------------');
    console.log(`开始增量爬取: ${new Date().toLocaleString()}`);
    console.log('------------------------------------\n');

    try {
      const allStats: CrawlerStats[] = [];

      // 爬取全国公共资源交易平台 - 前3页
      console.log('爬取全国公共资源交易平台...');
      const ggzyResult = await this.ggzyCrawler.run({ pages: 3 });
      allStats.push(ggzyResult);

      // 爬取中国政府采购网 - 前3页
      console.log('\n爬取中国政府采购网...');
      const ccgpResult = await this.ccgpCrawler.run({ pages: 3 });
      allStats.push(ccgpResult);

      // 汇总统计
      this.printSummary(allStats);

    } catch (error) {
      console.error('增量爬取失败:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 全量爬取（爬取更多页面）
   */
  async runFull(): Promise<void> {
    if (this.isRunning) {
      console.log('爬虫正在运行，跳过本次全量爬取');
      return;
    }

    this.isRunning = true;
    console.log('\n====================================');
    console.log(`开始全量爬取: ${new Date().toLocaleString()}`);
    console.log('====================================\n');

    try {
      const allStats: CrawlerStats[] = [];

      // 1. 爬取全国公共资源交易平台 - 各省份
      console.log('爬取全国公共资源交易平台...');
      
      const enabledProvinces = PROVINCES.filter(p => p.enabled);
      const provinceBatches = this.chunk(enabledProvinces, 5); // 每5个省份一批

      for (const batch of provinceBatches) {
        console.log(`\n爬取省份: ${batch.map(p => p.shortName).join(', ')}`);
        
        const promises = batch.map(async (province) => {
          const results = await this.ggzyCrawler.crawlByProvince(province.code, 10);
          const data = results.flatMap(r => r.data);
          
          if (data.length > 0) {
            const stats = this.ggzyCrawler.getStats();
            await this.storage.saveBatch(data, stats);
            return stats;
          }
          return null;
        });

        const batchResults = await Promise.all(promises);
        allStats.push(...batchResults.filter(Boolean) as CrawlerStats[]);

        // 批次间隔
        await this.delay(5000);
      }

      // 2. 爬取中国政府采购网 - 按公告类型
      console.log('\n爬取中国政府采购网...');
      
      const typePromises = Object.values(AnnouncementType).map(async (type) => {
        try {
          const results = await this.ccgpCrawler.crawlByType(type, 5);
          const data = results.flatMap(r => r.data);
          
          if (data.length > 0) {
            const stats = this.ccgpCrawler.getStats();
            await this.storage.saveBatch(data, stats);
            return stats;
          }
        } catch (error) {
          console.error(`爬取${type}失败:`, error);
        }
        return null;
      });

      const typeResults = await Promise.all(typePromises);
      allStats.push(...typeResults.filter(Boolean) as CrawlerStats[]);

      // 汇总统计
      this.printSummary(allStats);

    } catch (error) {
      console.error('全量爬取失败:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 清理过期数据
   */
  async cleanup(): Promise<void> {
    console.log('\n清理过期数据...');
    const deleted = await this.storage.cleanup(365);
    console.log(`已清理 ${deleted} 条过期数据`);
  }

  /**
   * 手动触发爬取
   */
  async runManual(options?: {
    platform?: 'ggzy' | 'ccgp' | 'all';
    pages?: number;
    province?: string;
    announcementType?: string;
  }): Promise<CrawlerStats[]> {
    const allStats: CrawlerStats[] = [];
    const pages = options?.pages || 10;

    if (options?.platform === 'ggzy' || options?.platform === 'all' || !options?.platform) {
      if (options?.province) {
        const results = await this.ggzyCrawler.crawlByProvince(options.province, pages);
        const data = results.flatMap(r => r.data);
        const stats = this.ggzyCrawler.getStats();
        if (data.length > 0) {
          await this.storage.saveBatch(data, stats);
        }
        allStats.push(stats);
      } else {
        const result = await this.ggzyCrawler.run({ pages });
        allStats.push(result);
      }
    }

    if (options?.platform === 'ccgp' || options?.platform === 'all' || !options?.platform) {
      if (options?.announcementType) {
        const results = await this.ccgpCrawler.crawlByType(options.announcementType, pages);
        const data = results.flatMap(r => r.data);
        const stats = this.ccgpCrawler.getStats();
        if (data.length > 0) {
          await this.storage.saveBatch(data, stats);
        }
        allStats.push(stats);
      } else {
        const result = await this.ccgpCrawler.run({ pages });
        allStats.push(result);
      }
    }

    return allStats;
  }

  /**
   * 获取当前数据统计
   */
  async getStats(): Promise<{
    total: number;
    byPlatform: Record<string, number>;
    byType: Record<string, number>;
    byProvince: Record<string, number>;
  }> {
    return this.storage.getStats();
  }

  /**
   * 打印汇总统计
   */
  private printSummary(statsList: CrawlerStats[]): void {
    console.log('\n====================================');
    console.log('爬取完成汇总');
    console.log('====================================');

    let totalPages = 0;
    let totalItems = 0;
    let totalSaved = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;

    for (const stats of statsList) {
      console.log(`\n${stats.platform}:`);
      console.log(`  爬取页数: ${stats.totalPages}`);
      console.log(`  获取条数: ${stats.totalItems}`);
      console.log(`  保存条数: ${stats.savedItems}`);
      console.log(`  重复跳过: ${stats.duplicateItems}`);
      console.log(`  错误条数: ${stats.errorItems}`);
      
      if (stats.errors.length > 0) {
        console.log(`  错误详情: ${stats.errors.slice(0, 3).join('; ')}${stats.errors.length > 3 ? '...' : ''}`);
      }

      totalPages += stats.totalPages;
      totalItems += stats.totalItems;
      totalSaved += stats.savedItems;
      totalDuplicates += stats.duplicateItems;
      totalErrors += stats.errorItems;
    }

    console.log('\n------------------------------------');
    console.log(`总计:`);
    console.log(`  爬取页数: ${totalPages}`);
    console.log(`  获取条数: ${totalItems}`);
    console.log(`  保存条数: ${totalSaved}`);
    console.log(`  重复跳过: ${totalDuplicates}`);
    console.log(`  错误条数: ${totalErrors}`);
    console.log('====================================\n');
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 数组分块
   */
  private chunk<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }
}
