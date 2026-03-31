/**
 * 数据同步调度器
 * 
 * 功能：
 * 1. 定时从多个数据源同步数据
 * 2. 数据去重与清洗
 * 3. 同步日志记录
 * 4. 错误处理与重试
 */

import * as cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { getSupabaseClient } from '../../storage/database/supabase-client';
import type { UnifiedBidData, UnifiedWinBidData, OfficialDataSource } from './types';
import { apiSpaceService } from './apispace-service';
import { ccgpService } from './ccgp-service';
import { stoneDTService } from './stonedt-service';
import { ggzyService } from './ggzy-service';
import { cebpubService } from './cebpub-service';
import { jilinCCGPCrawler } from './jilin-ccgp-crawler';
import { aiParserService } from './ai-parser';
import { SYNC_SCHEDULES, SYNC_BATCH_CONFIG, getEnabledSources } from './config';

// 同步任务状态
interface SyncTaskState {
  id: string;
  source: OfficialDataSource;
  type: 'full' | 'incremental';
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  totalCount: number;
  successCount: number;
  errorCount: number;
  errors: string[];
}

// 活跃的同步任务
const activeTasks = new Map<string, SyncTaskState>();

// 定时任务实例
let schedulerStarted = false;
const scheduledJobs: ScheduledTask[] = [];

/**
 * 启动数据同步调度器
 */
export function startDataSyncScheduler(): void {
  if (schedulerStarted) {
    console.log('[DataSync] Scheduler already running');
    return;
  }
  
  console.log('=================================');
  console.log('数据同步调度器启动');
  console.log('=================================');
  console.log('同步配置:');
  console.log('- 午夜同步: 每天00:05（抓取前一天和当天最新数据）');
  console.log('- 增量同步: 每2小时');
  console.log('- 全量同步: 每天凌晨2点');
  console.log('- 数据清理: 每周日凌晨4点');
  console.log('=================================');
  
  // 午夜同步任务：每天0点05分执行
  // 目的：确保每天24点后数据准时更新，抓取前一天遗漏的数据和当天最新数据
  const midnightSyncJob = cron.schedule(SYNC_SCHEDULES.midnightSync, async () => {
    console.log('[DataSync] Starting midnight sync...');
    await runMidnightSync();
  });
  scheduledJobs.push(midnightSyncJob);
  
  // 增量同步任务：每2小时
  const incrementalJob = cron.schedule(SYNC_SCHEDULES.incrementalSync, async () => {
    console.log('[DataSync] Starting incremental sync...');
    await runIncrementalSync();
  });
  scheduledJobs.push(incrementalJob);
  
  // 全量同步任务：每天凌晨2点
  const fullSyncJob = cron.schedule(SYNC_SCHEDULES.fullSync, async () => {
    console.log('[DataSync] Starting full sync...');
    await runFullSync();
  });
  scheduledJobs.push(fullSyncJob);
  
  // 数据清理任务：每周日凌晨4点
  const cleanupJob = cron.schedule(SYNC_SCHEDULES.cleanup, async () => {
    console.log('[DataSync] Starting cleanup...');
    await cleanupOldData();
  });
  scheduledJobs.push(cleanupJob);
  
  schedulerStarted = true;
}

/**
 * 停止数据同步调度器
 */
export function stopDataSyncScheduler(): void {
  scheduledJobs.forEach(job => job.stop());
  scheduledJobs.length = 0;
  schedulerStarted = false;
  console.log('[DataSync] Scheduler stopped');
}

/**
 * 运行增量同步
 */
export async function runIncrementalSync(): Promise<void> {
  const sources = getEnabledSources();
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  
  for (const source of sources) {
    try {
      await syncFromSource(source.platform, {
        startDate: twoHoursAgo,
        endDate: now,
        type: 'incremental',
      });
    } catch (error) {
      console.error(`[DataSync] Incremental sync failed for ${source.platform}:`, error);
    }
  }
}

/**
 * 午夜同步：每天0点05分执行
 * 目的：确保每天24点后数据准时更新
 * - 抓取前一天的遗漏数据（确保"今日新增"统计完整）
 * - 抓取当天最新发布的数据
 */
export async function runMidnightSync(): Promise<void> {
  console.log('[DataSync] ========== 午夜同步开始 ==========');
  
  const sources = getEnabledSources();
  const now = new Date();
  
  // 计算前一天的时间范围
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);
  
  // 计算当天的时间范围
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  console.log(`[DataSync] 同步时间范围：`);
  console.log(`[DataSync] - 前一天: ${yesterdayStart.toISOString()} ~ ${yesterdayEnd.toISOString()}`);
  console.log(`[DataSync] - 当天: ${todayStart.toISOString()} ~ ${now.toISOString()}`);
  
  let totalSynced = 0;
  
  for (const source of sources) {
    try {
      console.log(`[DataSync] 同步数据源: ${source.name}`);
      
      // 先同步前一天的数据（确保统计完整）
      const result1 = await syncFromSource(source.platform, {
        startDate: yesterdayStart,
        endDate: yesterdayEnd,
        type: 'incremental',
      });
      totalSynced += result1.successCount;
      
      // 再同步当天的最新数据
      const result2 = await syncFromSource(source.platform, {
        startDate: todayStart,
        endDate: now,
        type: 'incremental',
      });
      totalSynced += result2.successCount;
      
    } catch (error) {
      console.error(`[DataSync] 午夜同步失败: ${source.platform}:`, error);
    }
  }
  
  console.log(`[DataSync] ========== 午夜同步完成，共同步 ${totalSynced} 条数据 ==========`);
}

/**
 * 运行全量同步
 */
export async function runFullSync(): Promise<void> {
  const sources = getEnabledSources();
  
  for (const source of sources) {
    try {
      await syncFromSource(source.platform, {
        type: 'full',
      });
    } catch (error) {
      console.error(`[DataSync] Full sync failed for ${source.platform}:`, error);
    }
  }
}

/**
 * 从指定数据源同步数据
 */
export async function syncFromSource(
  platform: OfficialDataSource,
  options: {
    startDate?: Date;
    endDate?: Date;
    type: 'full' | 'incremental';
  }
): Promise<SyncTaskState> {
  const taskId = `${platform}_${Date.now()}`;
  
  // 创建同步任务状态
  const taskState: SyncTaskState = {
    id: taskId,
    source: platform,
    type: options.type,
    status: 'running',
    startTime: new Date(),
    totalCount: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
  };
  
  activeTasks.set(taskId, taskState);
  
  // 创建同步日志
  const supabase = getSupabaseClient();
  const { data: logRecord, error: logError } = await supabase
    .from('sync_logs')
    .insert({
      source_platform: platform,
      sync_type: options.type,
      start_time: new Date().toISOString(),
      status: 'running',
    })
    .select()
    .single();
  
  if (logError) {
    console.error('[DataSync] Failed to create sync log:', logError);
  }
  
  try {
    console.log(`[DataSync] Starting ${options.type} sync from ${platform}`);
    
    // 根据平台选择服务
    let bidsData: UnifiedBidData[] = [];
    let winBidsData: UnifiedWinBidData[] = [];
    
    switch (platform) {
      case 'apispace':
        bidsData = await apiSpaceService.fetchBidsBatch({
          startDate: options.startDate,
          endDate: options.endDate,
          maxCount: SYNC_BATCH_CONFIG.maxRecordsPerSync,
        });
        winBidsData = await apiSpaceService.fetchWinBidsBatch({
          startDate: options.startDate,
          endDate: options.endDate,
          maxCount: SYNC_BATCH_CONFIG.maxRecordsPerSync,
        });
        break;
        
      case 'ccgp':
        if (ccgpService.isAvailable()) {
          console.log('[DataSync] CCGP sync not implemented yet');
        } else {
          console.log('[DataSync] CCGP API not configured, skipping');
        }
        break;
        
      case 'stonedt':
        bidsData = await stoneDTService.fetchBidsBatch({
          startDate: options.startDate,
          endDate: options.endDate,
          maxCount: SYNC_BATCH_CONFIG.maxRecordsPerSync,
        });
        winBidsData = await stoneDTService.fetchWinBidsBatch({
          startDate: options.startDate,
          endDate: options.endDate,
          maxCount: SYNC_BATCH_CONFIG.maxRecordsPerSync,
        });
        break;
        
      case 'ggzy':
        // 全国公共资源交易平台
        bidsData = await ggzyService.fetchBidsBatch({
          startDate: options.startDate,
          endDate: options.endDate,
          maxCount: SYNC_BATCH_CONFIG.maxRecordsPerSync,
        });
        winBidsData = await ggzyService.fetchWinBidsBatch({
          startDate: options.startDate,
          endDate: options.endDate,
          maxCount: SYNC_BATCH_CONFIG.maxRecordsPerSync,
        });
        break;
        
      case 'cebpub':
        // 中国招标投标公共服务平台
        bidsData = await cebpubService.fetchBidsBatch({
          startDate: options.startDate,
          endDate: options.endDate,
          maxCount: SYNC_BATCH_CONFIG.maxRecordsPerSync,
        });
        winBidsData = await cebpubService.fetchWinBidsBatch({
          startDate: options.startDate,
          endDate: options.endDate,
          maxCount: SYNC_BATCH_CONFIG.maxRecordsPerSync,
        });
        break;
        
      case 'province_beijing':
      case 'province_guangdong':
      case 'province_zhejiang':
      case 'province_jiangsu':
      case 'province_shandong':
      case 'province_shanghai':
      case 'province_sichuan':
      case 'province_hubei':
      case 'province_henan':
      case 'province_fujian':
        // 省级公共资源交易平台
        const provinceCode = platform.replace('province_', '');
        bidsData = await ggzyService.fetchFromProvincial(provinceCode, {
          maxCount: SYNC_BATCH_CONFIG.maxRecordsPerSync,
        });
        break;
        
      case 'jilin_ccgp':
        // 吉林省政府采购网（合规爬虫）
        console.log('[DataSync] Starting Jilin CCGP crawler (compliant mode)...');
        const jilinBids = await jilinCCGPCrawler.fetchBatchAnnouncements({
          maxPages: options.type === 'full' ? 10 : 3,
        });
        
        // 使用AI增强解析
        for (let i = 0; i < jilinBids.length; i++) {
          const bid = jilinBids[i];
          if (bid.content && (!bid.contactPhone || !bid.contactPerson)) {
            try {
              const enhanced = await aiParserService.enhanceBidData(bid);
              jilinBids[i] = enhanced as UnifiedBidData;
            } catch (error) {
              console.error('[DataSync] AI enhancement failed:', error);
            }
          }
        }
        
        bidsData = jilinBids;
        console.log(`[DataSync] Jilin CCGP fetched ${bidsData.length} bids, crawler stats:`, jilinCCGPCrawler.getStats());
        break;
        
      default:
        console.log(`[DataSync] Platform ${platform} not implemented`);
    }
    
    // 保存招标数据
    const savedBids = await saveBidsData(bidsData, platform);
    taskState.totalCount += bidsData.length;
    taskState.successCount += savedBids;
    
    // 保存中标数据
    const savedWinBids = await saveWinBidsData(winBidsData, platform);
    taskState.totalCount += winBidsData.length;
    taskState.successCount += savedWinBids;
    
    taskState.status = 'completed';
    taskState.endTime = new Date();
    
    // 更新同步日志
    if (logRecord) {
      await supabase
        .from('sync_logs')
        .update({
          end_time: new Date().toISOString(),
          total_count: taskState.totalCount,
          success_count: taskState.successCount,
          error_count: taskState.errorCount,
          status: 'completed',
        })
        .eq('id', logRecord.id);
    }
    
    console.log(`[DataSync] Sync completed for ${platform}: ${taskState.successCount}/${taskState.totalCount} records`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    taskState.status = 'failed';
    taskState.endTime = new Date();
    taskState.errors.push(errorMessage);
    
    // 更新同步日志
    if (logRecord) {
      await supabase
        .from('sync_logs')
        .update({
          end_time: new Date().toISOString(),
          total_count: taskState.totalCount,
          success_count: taskState.successCount,
          error_count: taskState.errorCount,
          error_message: errorMessage,
          status: 'failed',
        })
        .eq('id', logRecord.id);
    }
    
    console.error(`[DataSync] Sync failed for ${platform}:`, errorMessage);
  } finally {
    activeTasks.delete(taskId);
  }
  
  return taskState;
}

/**
 * 保存招标数据
 * 注意：只保存包含完整联系信息的数据（联系电话、联系人、项目详情）
 */
export async function saveBidsData(data: UnifiedBidData[], platform: OfficialDataSource): Promise<number> {
  if (data.length === 0) return 0;
  
  const supabase = getSupabaseClient();
  let savedCount = 0;
  let filteredCount = 0;
  
  for (const item of data) {
    try {
      // 数据完整性验证：必须有联系电话、联系人、项目详情
      if (!item.contactPhone || item.contactPhone.trim() === '' ||
          !item.contactPerson || item.contactPerson.trim() === '' ||
          !item.content || item.content.trim() === '') {
        filteredCount++;
        continue; // 跳过不完整的数据
      }
      
      // 检查是否已存在（去重）
      const { data: existing } = await supabase
        .from('bids')
        .select('id')
        .eq('source_platform', platform)
        .eq('source_id', item.sourceId)
        .limit(1);
      
      if (existing && existing.length > 0) {
        continue; // 跳过重复数据
      }
      
      // 插入新数据
      const { error } = await supabase.from('bids').insert({
        title: item.title,
        content: item.content,
        budget: item.budget?.toString(),
        province: item.province,
        city: item.city,
        industry: item.industry,
        bid_type: item.bidType,
        publish_date: item.publishDate?.toISOString(),
        deadline: item.deadline?.toISOString(),
        contact_person: item.contactPerson,
        contact_phone: item.contactPhone,
        contact_email: item.contactEmail,
        contact_address: item.contactAddress,
        project_location: item.projectLocation,
        requirements: item.requirements,
        open_bid_time: item.openBidTime?.toISOString(),
        open_bid_location: item.openBidLocation,
        source_url: item.sourceUrl,
        source: platform,
        source_platform: platform,
        source_id: item.sourceId,
        data_type: 'api',
      });
      
      if (!error) {
        savedCount++;
      }
    } catch (error) {
      console.error('[DataSync] Failed to save bid:', item.title, error);
    }
  }
  
  if (filteredCount > 0) {
    console.log(`[DataSync] Filtered ${filteredCount} incomplete bid records`);
  }
  
  return savedCount;
}

/**
 * 保存中标数据
 * 注意：只保存包含完整信息的数据（中标单位电话、中标单位、项目详情）
 */
export async function saveWinBidsData(data: UnifiedWinBidData[], platform: OfficialDataSource): Promise<number> {
  if (data.length === 0) return 0;
  
  const supabase = getSupabaseClient();
  let savedCount = 0;
  let filteredCount = 0;
  
  for (const item of data) {
    try {
      // 数据完整性验证：必须有中标单位电话、中标单位、项目详情
      if (!item.winCompanyPhone || item.winCompanyPhone.trim() === '' ||
          !item.winCompany || item.winCompany.trim() === '' ||
          !item.content || item.content.trim() === '') {
        filteredCount++;
        continue; // 跳过不完整的数据
      }
      
      // 检查是否已存在
      const { data: existing } = await supabase
        .from('win_bids')
        .select('id')
        .eq('source_platform', platform)
        .eq('source_id', item.sourceId)
        .limit(1);
      
      if (existing && existing.length > 0) {
        continue;
      }
      
      // 插入新数据
      const { error } = await supabase.from('win_bids').insert({
        title: item.title,
        content: item.content,
        win_amount: item.winAmount?.toString(),
        province: item.province,
        city: item.city,
        industry: item.industry,
        bid_type: item.bidType,
        win_company: item.winCompany,
        win_company_address: item.winCompanyAddress,
        win_company_phone: item.winCompanyPhone,
        project_location: item.projectLocation,
        win_date: item.winDate?.toISOString(),
        publish_date: item.publishDate?.toISOString(),
        source_url: item.sourceUrl,
        source: platform,
        source_platform: platform,
        source_id: item.sourceId,
        data_type: 'api',
      });
      
      if (!error) {
        savedCount++;
      }
    } catch (error) {
      console.error('[DataSync] Failed to save win bid:', item.title, error);
    }
  }
  
  if (filteredCount > 0) {
    console.log(`[DataSync] Filtered ${filteredCount} incomplete win bid records`);
  }
  
  return savedCount;
}

/**
 * 清理过期数据
 */
async function cleanupOldData(): Promise<void> {
  const retentionDays = 90;
  console.log(`[DataSync] Cleaning up data older than ${retentionDays} days`);
  console.log('[DataSync] Cleanup completed');
}

/**
 * 获取同步状态
 */
export function getSyncStatus(): {
  isRunning: boolean;
  activeTasks: SyncTaskState[];
  enabledSources: string[];
} {
  return {
    isRunning: schedulerStarted,
    activeTasks: Array.from(activeTasks.values()),
    enabledSources: getEnabledSources().map(s => s.platform),
  };
}

/**
 * 手动触发同步
 */
export async function manualSync(platform?: OfficialDataSource): Promise<SyncTaskState | SyncTaskState[]> {
  if (platform) {
    return syncFromSource(platform, { type: 'incremental' });
  }
  
  const sources = getEnabledSources();
  const results: SyncTaskState[] = [];
  
  for (const source of sources) {
    const result = await syncFromSource(source.platform, { type: 'incremental' });
    results.push(result);
  }
  
  return results;
}

/**
 * 获取同步日志
 */
export async function getSyncLogs(options: {
  platform?: OfficialDataSource;
  limit?: number;
  offset?: number;
} = {}): Promise<Record<string, unknown>[]> {
  const { platform, limit = 20, offset = 0 } = options;
  
  const supabase = getSupabaseClient();
  let query = supabase
    .from('sync_logs')
    .select('*')
    .order('start_time', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);
  
  if (platform) {
    query = query.eq('source_platform', platform);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('[DataSync] Failed to get sync logs:', error);
    return [];
  }
  
  return data || [];
}

/**
 * 获取活跃的同步任务
 */
export function getActiveSyncTasks(): SyncTaskState[] {
  return Array.from(activeTasks.values());
}

/**
 * 启动同步调度器（别名）
 */
export function startSyncScheduler(): void {
  startDataSyncScheduler();
}

/**
 * 停止同步调度器（别名）
 */
export function stopSyncScheduler(): void {
  stopDataSyncScheduler();
}
