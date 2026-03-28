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
} from '../services/data-sources/sync-scheduler';

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
 * 测试思通数据API连接
 * GET /api/v1/data-sources/test/stonedt
 */
router.get('/test/stonedt', async (req: Request, res: Response) => {
  try {
    const isAvailable = stoneDTService.isAvailable();
    
    if (!isAvailable) {
      res.json({
        success: false,
        message: 'StoneDT API is not configured',
        hint: 'Please set STONEDT_API_URL in environment variables',
      });
      return;
    }
    
    // 尝试获取少量数据测试连接
    const testData = await stoneDTService.fetchBidsBatch({
      maxCount: 5,
    });
    
    res.json({
      success: true,
      message: 'StoneDT API connection successful',
      data: {
        testRecordCount: testData.length,
        sampleData: testData.slice(0, 2),
      },
    });
  } catch (error) {
    console.error('[DataSources] Error testing StoneDT API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test StoneDT API',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
