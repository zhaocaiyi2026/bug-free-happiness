/**
 * 数据源管理路由
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getEnabledSources, SYNC_BATCH_CONFIG } from '../services/data-sources/config';
import { apiSpaceService } from '../services/data-sources/apispace-service';
import { ccgpService } from '../services/data-sources/ccgp-service';
import { stoneDTService } from '../services/data-sources/stonedt-service';
import {
  startSyncScheduler,
  stopSyncScheduler,
  runIncrementalSync,
  runFullSync,
  getActiveSyncTasks,
  saveBidsData,
  saveWinBidsData,
} from '../services/data-sources/sync-scheduler';
import {
  startBatchSync,
  getTaskStatus,
  getAllTasks,
  pauseTask,
  resumeTask,
  cancelTask,
} from '../services/data-sources/batch-sync';
import { quickSyncRecent } from '../services/data-sources/date-range-sync';

const router = Router();

/**
 * 获取所有可用数据源状态
 * GET /api/v1/data-sources/status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const enabledSources = getEnabledSources();
    
    const sourcesStatus = enabledSources.map(source => {
      let isAvailable = false;
      
      switch (source.platform) {
        case 'apispace':
          isAvailable = apiSpaceService.isAvailable();
          break;
        case 'ccgp':
          isAvailable = ccgpService.isAvailable();
          break;
        case 'stonedt':
          isAvailable = stoneDTService.isAvailable();
          break;
      }
      
      return {
        platform: source.platform,
        name: source.name,
        priority: source.priority,
        isAvailable,
        isEnabled: source.enabled,
        apiType: source.auth?.type || 'none',
      };
    });
    
    res.json({
      success: true,
      data: {
        sources: sourcesStatus,
        config: {
          maxRecordsPerSync: SYNC_BATCH_CONFIG.maxRecordsPerSync,
          batchSize: SYNC_BATCH_CONFIG.batchSize,
        },
      },
    });
  } catch (error) {
    console.error('[DataSources] Error getting status:', error);
    console.error('[DataSources] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      success: false,
      error: 'Failed to get data sources status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 手动触发同步（增量）
 * POST /api/v1/data-sources/sync/incremental
 */
router.post('/sync/incremental', async (req: Request, res: Response) => {
  try {
    const { platform } = req.body;
    
    if (platform) {
      // 同步指定平台
      const result = await runIncrementalSync(platform);
      res.json({
        success: true,
        data: result,
        message: `Incremental sync triggered for ${platform}`,
      });
    } else {
      // 同步所有启用的平台
      await runIncrementalSync();
      res.json({
        success: true,
        message: 'Incremental sync triggered for all enabled sources',
      });
    }
  } catch (error) {
    console.error('[DataSources] Error triggering incremental sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger incremental sync',
    });
  }
});

/**
 * 手动触发同步（全量）
 * POST /api/v1/data-sources/sync/full
 */
router.post('/sync/full', async (req: Request, res: Response) => {
  try {
    await runFullSync();
    res.json({
      success: true,
      message: 'Full sync triggered for all enabled sources',
    });
  } catch (error) {
    console.error('[DataSources] Error triggering full sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger full sync',
    });
  }
});

/**
 * 获取当前活跃的同步任务
 * GET /api/v1/data-sources/sync/tasks
 */
router.get('/sync/tasks', async (req: Request, res: Response) => {
  try {
    const tasks = getActiveSyncTasks();
    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('[DataSources] Error getting sync tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync tasks',
    });
  }
});

/**
 * 启动定时同步调度器
 * POST /api/v1/data-sources/scheduler/start
 */
router.post('/scheduler/start', async (req: Request, res: Response) => {
  try {
    startSyncScheduler();
    res.json({
      success: true,
      message: 'Sync scheduler started',
    });
  } catch (error) {
    console.error('[DataSources] Error starting scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start sync scheduler',
    });
  }
});

/**
 * 停止定时同步调度器
 * POST /api/v1/data-sources/scheduler/stop
 */
router.post('/scheduler/stop', async (req: Request, res: Response) => {
  try {
    stopSyncScheduler();
    res.json({
      success: true,
      message: 'Sync scheduler stopped',
    });
  } catch (error) {
    console.error('[DataSources] Error stopping scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop sync scheduler',
    });
  }
});

/**
 * 测试 APISpace API 连接
 * POST /api/v1/data-sources/test/apispace
 * Body参数：apiKey (可选，不传则使用环境变量)
 */
router.post('/test/apispace', async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    
    // 如果传入了密钥，临时设置
    if (apiKey) {
      apiSpaceService.setApiKey(apiKey);
    }
    
    if (!apiSpaceService.isAvailable()) {
      res.json({
        success: false,
        message: 'APISpace API未配置',
        hint: '请提供 X-APISpace-Token',
      });
      return;
    }
    
    // 测试获取少量数据
    const testData = await apiSpaceService.searchBids({
      page: 1,
      pageSize: 5,
    });
    
    if (testData.success) {
      res.json({
        success: true,
        message: 'APISpace API连接成功',
        data: {
          totalRecords: testData.pagination?.total || 0,
          testRecordCount: testData.data?.length || 0,
          sampleData: testData.data?.slice(0, 3),
        },
      });
    } else {
      res.json({
        success: false,
        message: 'APISpace API连接失败',
        error: testData.error?.message || '未知错误',
      });
    }
  } catch (error) {
    console.error('[DataSources] Error testing APISpace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test APISpace API',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 从 APISpace 同步数据
 * POST /api/v1/data-sources/sync/apispace
 * Body参数：apiKey, maxCount (可选), syncWinBids (可选，是否同步中标)
 */
router.post('/sync/apispace', async (req: Request, res: Response) => {
  try {
    const { apiKey, maxCount = 100, syncWinBids = true } = req.body;
    
    // 如果传入了密钥，临时设置
    if (apiKey) {
      apiSpaceService.setApiKey(apiKey);
    }
    
    if (!apiSpaceService.isAvailable()) {
      res.json({
        success: false,
        message: 'APISpace API未配置，请提供apiKey',
      });
      return;
    }
    
    console.log(`[DataSources] 开始从APISpace同步，最大条数: ${maxCount}`);
    
    // 获取招标数据
    const bidsData = await apiSpaceService.fetchBidsBatch({ maxCount });
    console.log(`[DataSources] 获取到 ${bidsData.length} 条招标数据`);
    
    // 保存招标数据
    const savedBids = await saveBidsData(bidsData, 'apispace');
    
    let savedWinBids = 0;
    let winBidsData: any[] = [];
    
    // 同步中标数据
    if (syncWinBids) {
      winBidsData = await apiSpaceService.fetchWinBidsBatch({ maxCount: Math.floor(maxCount / 2) });
      console.log(`[DataSources] 获取到 ${winBidsData.length} 条中标数据`);
      savedWinBids = await saveWinBidsData(winBidsData, 'apispace');
    }
    
    res.json({
      success: true,
      message: '数据同步完成',
      data: {
        bids: {
          fetched: bidsData.length,
          saved: savedBids,
        },
        winBids: {
          fetched: winBidsData.length,
          saved: savedWinBids,
        },
      },
    });
  } catch (error) {
    console.error('[DataSources] Error syncing from APISpace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync from APISpace',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 测试思通数据API连接（支持动态传入凭证）
 * POST /api/v1/data-sources/test/stonedt
 * Body参数：appId, appSecret (可选，不传则使用环境变量)
 */
router.post('/test/stonedt', async (req: Request, res: Response) => {
  try {
    const { appId, appSecret } = req.body;
    
    // 如果传入了凭证，临时设置
    if (appId && appSecret) {
      stoneDTService.setCredentials(appId, appSecret);
    }
    
    const isAvailable = stoneDTService.isAvailable();
    
    if (!isAvailable) {
      res.json({
        success: false,
        message: '思通数据API未配置',
        hint: '请关注微信公众号"思通数据"，点击菜单"数据工具"-"获取授权"获取appId和appSecret',
        configGuide: {
          step1: '关注微信公众号"思通数据"',
          step2: '点击菜单"数据工具"-"获取授权"',
          step3: '复制返回的appId和appSecret',
          step4: '在环境变量中配置 STONEDT_APP_ID 和 STONEDT_APP_SECRET',
        },
      });
      return;
    }
    
    // 尝试获取Token测试连接
    try {
      // 尝试获取少量数据测试连接
      const testData = await stoneDTService.searchBids({
        keyword: '招标',
        page: 1,
        pageSize: 5,
      });
      
      if (testData.success) {
        // 获取配额信息
        const quota = await stoneDTService.getQuota();
        
        res.json({
          success: true,
          message: '思通数据API连接成功',
          data: {
            testRecordCount: testData.data?.length || 0,
            totalRecords: testData.pagination?.total || 0,
            quota: quota ? {
              todayQuota: quota.todayQuota,
              appQuota: quota.appQuota,
              concurrentIp: quota.concurrentIp,
            } : null,
            sampleData: testData.data?.slice(0, 2),
          },
        });
      } else {
        res.json({
          success: false,
          message: '思通数据API连接失败',
          error: testData.error?.message || '未知错误',
        });
      }
    } catch (apiError) {
      res.json({
        success: false,
        message: '思通数据API连接失败',
        error: apiError instanceof Error ? apiError.message : '未知错误',
        hint: '请检查appId和appSecret是否正确',
      });
    }
  } catch (error) {
    console.error('[DataSources] Error testing StoneDT API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test StoneDT API',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 从思通数据同步招标数据
 * POST /api/v1/data-sources/sync/stonedt
 * Body参数：appId, appSecret, maxCount (可选)
 */
router.post('/sync/stonedt', async (req: Request, res: Response) => {
  try {
    const { appId, appSecret, maxCount = 100 } = req.body;
    
    // 如果传入了凭证，临时设置
    if (appId && appSecret) {
      stoneDTService.setCredentials(appId, appSecret);
    }
    
    if (!stoneDTService.isAvailable()) {
      res.json({
        success: false,
        message: '思通数据API未配置，请提供appId和appSecret',
      });
      return;
    }
    
    // 获取招标数据
    console.log(`[DataSources] 开始从思通数据同步，最大条数: ${maxCount}`);
    const bidsData = await stoneDTService.fetchBidsBatch({ maxCount });
    console.log(`[DataSources] 获取到 ${bidsData.length} 条招标数据`);
    
    // 获取中标数据
    const winBidsData = await stoneDTService.fetchWinBidsBatch({ maxCount: Math.floor(maxCount / 2) });
    console.log(`[DataSources] 获取到 ${winBidsData.length} 条中标数据`);
    
    // 保存到数据库
    const savedBids = await saveBidsData(bidsData, 'stonedt');
    const savedWinBids = await saveWinBidsData(winBidsData, 'stonedt');
    
    res.json({
      success: true,
      message: '数据同步完成',
      data: {
        bids: {
          fetched: bidsData.length,
          saved: savedBids,
        },
        winBids: {
          fetched: winBidsData.length,
          saved: savedWinBids,
        },
      },
    });
  } catch (error) {
    console.error('[DataSources] Error syncing from StoneDT:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync from StoneDT',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== 批量同步接口 ====================

/**
 * 启动批量同步任务
 * POST /api/v1/data-sources/batch-sync/start
 * Body参数：apiKey, maxPages (可选，0表示不限制), syncBids (可选), syncWinBids (可选)
 */
router.post('/batch-sync/start', async (req: Request, res: Response) => {
  try {
    const { apiKey, maxPages = 0, syncBids = true, syncWinBids = true } = req.body;
    
    if (!apiKey) {
      res.json({
        success: false,
        message: '请提供apiKey',
      });
      return;
    }
    
    const taskIds = await startBatchSync({
      apiKey,
      maxPages,
      syncBids,
      syncWinBids,
    });
    
    res.json({
      success: true,
      message: '批量同步任务已启动',
      data: {
        bidTaskId: taskIds.bidTaskId,
        winBidTaskId: taskIds.winBidTaskId,
        hint: '使用 GET /api/v1/data-sources/batch-sync/status/:taskId 查询进度',
      },
    });
  } catch (error) {
    console.error('[DataSources] Error starting batch sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start batch sync',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 获取所有批量同步任务状态
 * GET /api/v1/data-sources/batch-sync/tasks
 */
router.get('/batch-sync/tasks', async (req: Request, res: Response) => {
  try {
    const tasks = getAllTasks();
    
    res.json({
      success: true,
      data: tasks.map(task => ({
        id: task.id,
        type: task.type,
        status: task.status,
        progress: task.progress,
        error: task.error,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
      })),
    });
  } catch (error) {
    console.error('[DataSources] Error getting batch sync tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batch sync tasks',
    });
  }
});

/**
 * 获取指定任务状态
 * GET /api/v1/data-sources/batch-sync/status/:taskId
 */
router.get('/batch-sync/status/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const task = getTaskStatus(taskId);
    
    if (!task) {
      res.json({
        success: false,
        message: '任务不存在',
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        id: task.id,
        type: task.type,
        status: task.status,
        progress: task.progress,
        error: task.error,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
      },
    });
  } catch (error) {
    console.error('[DataSources] Error getting task status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get task status',
    });
  }
});

/**
 * 暂停批量同步任务
 * POST /api/v1/data-sources/batch-sync/pause/:taskId
 */
router.post('/batch-sync/pause/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const success = pauseTask(taskId);
    
    res.json({
      success,
      message: success ? '任务已暂停' : '暂停失败（任务可能不在运行状态）',
    });
  } catch (error) {
    console.error('[DataSources] Error pausing task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause task',
    });
  }
});

/**
 * 恢复批量同步任务
 * POST /api/v1/data-sources/batch-sync/resume/:taskId
 */
router.post('/batch-sync/resume/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const success = resumeTask(taskId);
    
    res.json({
      success,
      message: success ? '任务已恢复' : '恢复失败（任务可能不在暂停状态）',
    });
  } catch (error) {
    console.error('[DataSources] Error resuming task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume task',
    });
  }
});

/**
 * 取消批量同步任务
 * POST /api/v1/data-sources/batch-sync/cancel/:taskId
 */
router.post('/batch-sync/cancel/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const success = cancelTask(taskId);
    
    res.json({
      success,
      message: success ? '任务已取消' : '取消失败',
    });
  } catch (error) {
    console.error('[DataSources] Error canceling task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel task',
    });
  }
});

// ==================== 日期分段同步接口 ====================

/**
 * 按日期分段同步数据（推荐）
 * POST /api/v1/data-sources/sync/by-date
 * Body参数：apiKey, days (可选，默认30天)
 * 
 * 说明：由于APISpace API分页有问题，此接口按日期分段获取数据，
 * 每天调用一次招标API和一次中标API，确保获取不同的数据。
 */
router.post('/sync/by-date', async (req: Request, res: Response) => {
  try {
    const { apiKey, days = 30 } = req.body;
    
    if (!apiKey) {
      res.json({
        success: false,
        message: '请提供apiKey',
      });
      return;
    }
    
    console.log(`[DataSources] 开始按日期分段同步，共 ${days} 天`);
    
    const result = await quickSyncRecent(apiKey, days);
    
    res.json({
      success: result.success,
      message: result.message,
      data: {
        days: result.data.totalDays,
        completedDays: result.data.completedDays,
        totalSaved: result.data.totalSaved,
        error: result.data.lastError,
      },
    });
  } catch (error) {
    console.error('[DataSources] Error in date-range sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync by date range',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
