/**
 * 招标爬虫运行脚本
 * 
 * 使用方法:
 *   # 增量爬取（默认）
 *   npx tsx src/scripts/run-crawler.ts
 * 
 *   # 全量爬取
 *   npx tsx src/scripts/run-crawler.ts --full
 * 
 *   # 指定平台
 *   npx tsx src/scripts/run-crawler.ts --platform ggzy
 *   npx tsx src/scripts/run-crawler.ts --platform ccgp
 * 
 *   # 指定省份（仅ggzy）
 *   npx tsx src/scripts/run-crawler.ts --province 220000
 * 
 *   # 指定页数
 *   npx tsx src/scripts/run-crawler.ts --pages 20
 * 
 *   # 查看统计
 *   npx tsx src/scripts/run-crawler.ts --stats
 */

import 'dotenv/config';
import { CrawlerScheduler } from '../crawler/scheduler.js';
import { DataStorage } from '../crawler/storage.js';

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  full: args.includes('--full'),
  platform: args.find(a => a.startsWith('--platform='))?.split('=')[1] as 'ggzy' | 'ccgp' | undefined,
  province: args.find(a => a.startsWith('--province='))?.split('=')[1],
  pages: parseInt(args.find(a => a.startsWith('--pages='))?.split('=')[1] || '10'),
  stats: args.includes('--stats'),
};

async function main() {
  console.log('\n====================================');
  console.log('全国招标信息爬虫');
  console.log('====================================\n');

  const scheduler = new CrawlerScheduler();

  // 查看统计
  if (options.stats) {
    console.log('正在获取数据统计...\n');
    const stats = await scheduler.getStats();
    
    console.log(`总数据量: ${stats.total} 条\n`);
    
    console.log('按平台统计:');
    Object.entries(stats.byPlatform)
      .sort((a, b) => b[1] - a[1])
      .forEach(([platform, count]) => {
        console.log(`  ${platform}: ${count} 条`);
      });
    
    console.log('\n按类型统计:');
    Object.entries(stats.byType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count} 条`);
      });
    
    console.log('\n按省份统计 (Top 10):');
    Object.entries(stats.byProvince)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([province, count]) => {
        console.log(`  ${province}: ${count} 条`);
      });
    
    return;
  }

  // 执行爬取
  if (options.full) {
    await scheduler.runFull();
  } else {
    const statsList = await scheduler.runManual({
      platform: options.platform,
      pages: options.pages,
      province: options.province,
    });
    
    // 打印结果
    console.log('\n====================================');
    console.log('爬取完成');
    console.log('====================================');
    
    for (const stats of statsList) {
      console.log(`\n${stats.platform}:`);
      console.log(`  获取: ${stats.totalItems} 条`);
      console.log(`  保存: ${stats.savedItems} 条`);
      console.log(`  重复: ${stats.duplicateItems} 条`);
      console.log(`  错误: ${stats.errorItems} 条`);
    }
  }
}

main().catch(console.error);
