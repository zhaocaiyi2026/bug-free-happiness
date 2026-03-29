/**
 * 批量数据同步服务
 * 
 * 支持大量数据同步，包含进度跟踪和断点续传
 */

import { apiSpaceService } from './apispace-service';
import { saveBidsData, saveWinBidsData } from './sync-scheduler';

// 同步任务状态
interface SyncTask {
  id: string;
  type: 'bids' | 'winBids';
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  progress: {
    currentPage: number;
    totalFetched: number;
    totalSaved: number;
    totalPages: number;
    percentage: number;
  };
  config: {
    apiKey: string;
    startDate: Date;
    endDate: Date;
    pageSize: number;
    maxPages: number;
  };
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

// 活跃的同步任务
const activeTasks: Map<string, SyncTask> = new Map();

// 同步间隔（毫秒）- 增加间隔避免触发API限流
const SYNC_INTERVAL = 1000;
const PAGE_SIZE = 50;

/**
 * 创建同步任务ID
 */
function generateTaskId(): string {
  return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建批量同步任务
 */
export function createBatchSyncTask(config: {
  apiKey: string;
  type: 'bids' | 'winBids';
  startDate?: Date;
  endDate?: Date;
  maxPages?: number;
}): SyncTask {
  const taskId = generateTaskId();
  const endDate = config.endDate || new Date();
  const startDate = config.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 默认最近1年
  
  const task: SyncTask = {
    id: taskId,
    type: config.type,
    status: 'pending',
    progress: {
      currentPage: 0,
      totalFetched: 0,
      totalSaved: 0,
      totalPages: config.maxPages || 0,
      percentage: 0,
    },
    config: {
      apiKey: config.apiKey,
      startDate,
      endDate,
      pageSize: PAGE_SIZE,
      maxPages: config.maxPages || 0,
    },
  };
  
  activeTasks.set(taskId, task);
  return task;
}

/**
 * 获取任务状态
 */
export function getTaskStatus(taskId: string): SyncTask | undefined {
  return activeTasks.get(taskId);
}

/**
 * 获取所有任务
 */
export function getAllTasks(): SyncTask[] {
  return Array.from(activeTasks.values());
}

/**
 * 暂停任务
 */
export function pauseTask(taskId: string): boolean {
  const task = activeTasks.get(taskId);
  if (task && task.status === 'running') {
    task.status = 'paused';
    return true;
  }
  return false;
}

/**
 * 恢复任务
 */
export function resumeTask(taskId: string): boolean {
  const task = activeTasks.get(taskId);
  if (task && task.status === 'paused') {
    task.status = 'pending';
    runTask(taskId);
    return true;
  }
  return false;
}

/**
 * 取消任务
 */
export function cancelTask(taskId: string): boolean {
  const task = activeTasks.get(taskId);
  if (task && (task.status === 'running' || task.status === 'paused' || task.status === 'pending')) {
    task.status = 'failed';
    task.error = '用户取消';
    return true;
  }
  return false;
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 执行同步任务
 */
export async function runTask(taskId: string): Promise<void> {
  const task = activeTasks.get(taskId);
  if (!task) {
    console.error(`[BatchSync] Task ${taskId} not found`);
    return;
  }
  
  if (task.status !== 'pending' && task.status !== 'paused') {
    console.error(`[BatchSync] Task ${taskId} is not in runnable state: ${task.status}`);
    return;
  }
  
  task.status = 'running';
  task.startedAt = task.startedAt || new Date();
  
  console.log(`[BatchSync] Starting task ${taskId}, type: ${task.type}`);
  
  // 设置API密钥
  apiSpaceService.setApiKey(task.config.apiKey);
  
  let page = task.progress.currentPage + 1;
  let hasMore = true;
  
  try {
    while (hasMore) {
      // 检查任务状态
      if (task.status === 'paused' || task.status === 'failed') {
        console.log(`[BatchSync] Task ${taskId} stopped: ${task.status}`);
        return;
      }
      
      // 检查是否达到最大页数限制
      if (task.config.maxPages > 0 && page > task.config.maxPages) {
        console.log(`[BatchSync] Task ${taskId} reached max pages: ${task.config.maxPages}`);
        break;
      }
      
      // 获取数据
      console.log(`[BatchSync] Fetching page ${page} for task ${taskId}`);
      
      const response = task.type === 'bids' 
        ? await apiSpaceService.searchBids({
            publishDateStart: task.config.startDate,
            publishDateEnd: task.config.endDate,
            page,
            pageSize: task.config.pageSize,
          })
        : await apiSpaceService.searchWinBids({
            publishDateStart: task.config.startDate,
            publishDateEnd: task.config.endDate,
            page,
            pageSize: task.config.pageSize,
          });
      
      if (!response.success || !response.data) {
        console.error(`[BatchSync] Failed to fetch page ${page}:`, response.error);
        // 继续尝试下一页
        page++;
        await delay(1000);
        continue;
      }
      
      // 首次获取时更新总页数
      if (task.progress.totalPages === 0 && response.pagination?.total) {
        const estimatedPages = Math.ceil(response.pagination.total / task.config.pageSize);
        task.progress.totalPages = task.config.maxPages > 0 
          ? Math.min(estimatedPages, task.config.maxPages)
          : estimatedPages;
        console.log(`[BatchSync] Total pages estimated: ${task.progress.totalPages}`);
      }
      
      // 保存数据
      if (response.data.length > 0) {
        const saved = task.type === 'bids'
          ? await saveBidsData(response.data, 'apispace')
          : await saveWinBidsData(response.data, 'apispace');
        
        task.progress.totalSaved += saved;
        task.progress.totalFetched += response.data.length;
      }
      
      // 更新进度
      task.progress.currentPage = page;
      task.progress.percentage = task.progress.totalPages > 0
        ? Math.round((page / task.progress.totalPages) * 100)
        : 0;
      
      console.log(`[BatchSync] Task ${taskId} progress: ${task.progress.percentage}%, saved: ${task.progress.totalSaved}`);
      
      // 检查是否还有更多数据
      hasMore = response.pagination?.hasMore || false;
      
      // 如果没有更多数据，但当前页有数据，继续请求下一页（确保获取所有数据）
      if (!hasMore && response.data.length === task.config.pageSize) {
        hasMore = true;
      }
      
      page++;
      
      // 延迟避免请求过快
      await delay(SYNC_INTERVAL);
    }
    
    task.status = 'completed';
    task.completedAt = new Date();
    console.log(`[BatchSync] Task ${taskId} completed. Total saved: ${task.progress.totalSaved}`);
    
  } catch (error) {
    task.status = 'failed';
    task.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[BatchSync] Task ${taskId} failed:`, task.error);
  }
}

/**
 * 启动批量同步（后台运行）
 */
export async function startBatchSync(config: {
  apiKey: string;
  maxPages?: number;
  syncBids?: boolean;
  syncWinBids?: boolean;
}): Promise<{ bidTaskId?: string; winBidTaskId?: string }> {
  const result: { bidTaskId?: string; winBidTaskId?: string } = {};
  
  if (config.syncBids !== false) {
    const bidTask = createBatchSyncTask({
      apiKey: config.apiKey,
      type: 'bids',
      maxPages: config.maxPages,
    });
    result.bidTaskId = bidTask.id;
    
    // 异步启动任务
    runTask(bidTask.id).catch(console.error);
  }
  
  if (config.syncWinBids !== false) {
    const winBidTask = createBatchSyncTask({
      apiKey: config.apiKey,
      type: 'winBids',
      maxPages: config.maxPages ? Math.floor(config.maxPages / 2) : undefined,
    });
    result.winBidTaskId = winBidTask.id;
    
    // 异步启动任务
    runTask(winBidTask.id).catch(console.error);
  }
  
  return result;
}
