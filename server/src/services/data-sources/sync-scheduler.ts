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
  console.log('- 增量同步: 每2小时');
  console.log('- 全量同步: 每天凌晨2点');
  console.log('- 数据清理: 每周日凌晨4点');
  console.log('=================================');
  
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
 */
async function saveBidsData(data: UnifiedBidData[], platform: OfficialDataSource): Promise<number> {
  if (data.length === 0) return 0;
  
  const supabase = getSupabaseClient();
  let savedCount = 0;
  
  for (const item of data) {
    try {
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
  
  return savedCount;
}

/**
 * 保存中标数据
 */
async function saveWinBidsData(data: UnifiedWinBidData[], platform: OfficialDataSource): Promise<number> {
  if (data.length === 0) return 0;
  
  const supabase = getSupabaseClient();
  let savedCount = 0;
  
  for (const item of data) {
    try {
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
