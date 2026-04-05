/**
 * 豆包搜索定时任务服务
 * 
 * 使用node-cron定期触发豆包智能搜索
 */

import cron from 'node-cron';
import { doubaoSearchAndSave } from './doubao-search.js';

// 定时任务状态
interface ScheduleStatus {
  isRunning: boolean;
  lastRunTime: Date | null;
  lastRunResult: {
    success: boolean;
    saved: number;
    skipped: number;
    errors: number;
  } | null;
  nextRunTime: Date | null;
}

const status: ScheduleStatus = {
  isRunning: false,
  lastRunTime: null,
  lastRunResult: null,
  nextRunTime: null,
};

// 定时任务实例
let scheduledTask: ReturnType<typeof cron.schedule> | null = null;

/**
 * 执行搜索任务
 */
async function executeSearchTask(): Promise<void> {
  if (status.isRunning) {
    console.log('[定时任务] 上一次任务仍在执行中，跳过本次');
    return;
  }

  status.isRunning = true;
  status.lastRunTime = new Date();
  console.log('[定时任务] 开始执行豆包搜索任务...');

  try {
    // 执行搜索并入库
    const result = await doubaoSearchAndSave(
      ['招标公告', '中标公告', '竞争性磋商'],
      3
    );

    status.lastRunResult = {
      success: result.searchResult.success && (result.saveResult?.success ?? false),
      saved: result.saveResult?.saved ?? 0,
      skipped: result.saveResult?.skipped ?? 0,
      errors: result.saveResult?.errors ?? 0,
    };

    console.log('[定时任务] 执行完成:', status.lastRunResult);

  } catch (error) {
    console.error('[定时任务] 执行失败:', error);
    status.lastRunResult = {
      success: false,
      saved: 0,
      skipped: 0,
      errors: 1,
    };
  } finally {
    status.isRunning = false;
    updateNextRunTime();
  }
}

/**
 * 更新下次运行时间
 */
function updateNextRunTime(): void {
  if (scheduledTask) {
    // 获取下次运行时间（大约）
    const now = new Date();
    // 假设每4小时运行一次
    const next = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    status.nextRunTime = next;
  }
}

/**
 * 启动定时任务
 * @param cronExpression - cron表达式，默认每4小时执行一次
 */
export function startScheduledSearch(cronExpression: string = '0 */4 * * *'): void {
  if (scheduledTask) {
    console.log('[定时任务] 任务已在运行中');
    return;
  }

  console.log(`[定时任务] 启动定时搜索，cron表达式: ${cronExpression}`);
  
  // 验证cron表达式
  if (!cron.validate(cronExpression)) {
    console.error('[定时任务] 无效的cron表达式:', cronExpression);
    return;
  }

  scheduledTask = cron.schedule(cronExpression, executeSearchTask, {
    timezone: 'Asia/Shanghai',
  });

  updateNextRunTime();
  console.log('[定时任务] 定时任务已启动');
}

/**
 * 停止定时任务
 */
export function stopScheduledSearch(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    status.nextRunTime = null;
    console.log('[定时任务] 定时任务已停止');
  }
}

/**
 * 获取定时任务状态
 */
export function getScheduleStatus(): ScheduleStatus {
  return { ...status };
}

/**
 * 手动触发一次搜索
 */
export async function triggerManualSearch(): Promise<{
  success: boolean;
  message: string;
  result?: Status['lastRunResult'];
}> {
  if (status.isRunning) {
    return {
      success: false,
      message: '任务正在执行中，请稍后再试',
    };
  }

  await executeSearchTask();

  return {
    success: status.lastRunResult?.success ?? false,
    message: status.lastRunResult?.success ? '搜索完成' : '搜索失败',
    result: status.lastRunResult ?? undefined,
  };
}

// 定义Status类型
interface Status {
  isRunning: boolean;
  lastRunTime: Date | null;
  lastRunResult: {
    success: boolean;
    saved: number;
    skipped: number;
    errors: number;
  } | null;
  nextRunTime: Date | null;
}
