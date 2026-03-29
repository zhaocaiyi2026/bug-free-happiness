/**
 * 按日期分段同步服务
 * 
 * 由于APISpace API分页有问题，采用按日期分段的方式获取更多数据
 */

import { apiSpaceService } from './apispace-service';
import { saveBidsData, saveWinBidsData } from './sync-scheduler';

// 同步配置
const DAYS_TO_SYNC = 30; // 同步最近30天
const CALLS_PER_DAY = 7; // 每天调用次数（招标+中标）
const SYNC_INTERVAL = 1000; // 请求间隔（毫秒）

// 同步状态
interface DateSyncStatus {
  totalSaved: number;
  completedDays: number;
  totalDays: number;
  lastError?: string;
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 格式化日期
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 按日期分段同步数据
 */
export async function syncByDateRange(
  apiKey: string,
  options: {
    days?: number;
    onProgress?: (status: DateSyncStatus) => void;
  } = {}
): Promise<DateSyncStatus> {
  const days = options.days || DAYS_TO_SYNC;
  const status: DateSyncStatus = {
    totalSaved: 0,
    completedDays: 0,
    totalDays: days,
  };
  
  apiSpaceService.setApiKey(apiKey);
  
  console.log(`[DateSync] 开始按日期同步，共 ${days} 天`);
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    
    console.log(`[DateSync] 同步 ${dateStr} 的数据...`);
    
    try {
      // 同步招标数据
      const bidsResult = await apiSpaceService.searchBids({
        publishDateStart: date,
        publishDateEnd: date,
        page: 1,
        pageSize: 50,
      });
      
      if (bidsResult.success && bidsResult.data && bidsResult.data.length > 0) {
        const saved = await saveBidsData(bidsResult.data, 'apispace');
        status.totalSaved += saved;
        console.log(`[DateSync] ${dateStr} 招标: 获取 ${bidsResult.data.length} 条, 保存 ${saved} 条`);
      }
      
      await delay(SYNC_INTERVAL);
      
      // 同步中标数据
      const winBidsResult = await apiSpaceService.searchWinBids({
        publishDateStart: date,
        publishDateEnd: date,
        page: 1,
        pageSize: 50,
      });
      
      if (winBidsResult.success && winBidsResult.data && winBidsResult.data.length > 0) {
        const saved = await saveWinBidsData(winBidsResult.data, 'apispace');
        status.totalSaved += saved;
        console.log(`[DateSync] ${dateStr} 中标: 获取 ${winBidsResult.data.length} 条, 保存 ${saved} 条`);
      }
      
      await delay(SYNC_INTERVAL);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[DateSync] ${dateStr} 同步失败:`, errorMsg);
      status.lastError = errorMsg;
    }
    
    status.completedDays++;
    options.onProgress?.(status);
  }
  
  console.log(`[DateSync] 同步完成，共保存 ${status.totalSaved} 条数据`);
  return status;
}

/**
 * 快速同步最近数据（一次性同步多天）
 */
export async function quickSyncRecent(
  apiKey: string,
  days: number = 30
): Promise<{
  success: boolean;
  message: string;
  data: DateSyncStatus;
}> {
  try {
    const status = await syncByDateRange(apiKey, { days });
    
    return {
      success: true,
      message: `同步完成，共保存 ${status.totalSaved} 条数据`,
      data: status,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `同步失败: ${errorMsg}`,
      data: {
        totalSaved: 0,
        completedDays: 0,
        totalDays: days,
        lastError: errorMsg,
      },
    };
  }
}
