/**
 * 数据源管理 API 路由
 * 
 * 提供数据源状态查询、手动同步等接口
 */

import { Router } from 'express';
import {
  getSyncStatus,
  manualSync,
  getSyncLogs,
  getEnabledSources,
  apiSpaceService,
} from '../services/data-sources';
import type { OfficialDataSource } from '../services/data-sources/types';

const router = Router();

/**
 * 获取数据源状态
 * GET /api/v1/data-sources/status
 */
router.get('/status', async (req, res) => {
  try {
    const status = getSyncStatus();
    const sources = getEnabledSources();
    
    res.json({
      success: true,
      data: {
        isRunning: status.isRunning,
        activeTasks: status.activeTasks,
        enabledSources: sources.map(s => ({
          platform: s.platform,
          name: s.name,
          priority: s.priority,
          enabled: s.enabled,
        })),
      },
    });
  } catch (error) {
    console.error('[DataSources] Get status failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * 手动触发同步
 * POST /api/v1/data-sources/sync
 * Body: { platform?: string }
 */
router.post('/sync', async (req, res) => {
  try {
    const { platform } = req.body;
    
    console.log(`[DataSources] Manual sync triggered for: ${platform || 'all'}`);
    
    const result = await manualSync(platform);
    
    res.json({
      success: true,
      data: Array.isArray(result) ? result : [result],
    });
  } catch (error) {
    console.error('[DataSources] Manual sync failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYNC_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * 获取同步日志
 * GET /api/v1/data-sources/logs
 * Query: platform?, limit?, offset?
 */
router.get('/logs', async (req, res) => {
  try {
    const { platform, limit, offset } = req.query;
    
    const logs = await getSyncLogs({
      platform: platform as OfficialDataSource | undefined,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    });
    
    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('[DataSources] Get logs failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * 测试APISpace连接
 * GET /api/v1/data-sources/test-apispace
 */
router.get('/test-apispace', async (req, res) => {
  try {
    // 测试搜索功能
    const result = await apiSpaceService.searchBids({
      keyword: '采购',
      pageSize: 5,
    });
    
    res.json({
      success: result.success,
      data: {
        connected: result.success,
        sampleData: result.data?.slice(0, 3) || [],
        error: result.error,
      },
    });
  } catch (error) {
    console.error('[DataSources] Test APISpace failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TEST_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * 获取数据源配置列表
 * GET /api/v1/data-sources/configs
 */
router.get('/configs', async (req, res) => {
  try {
    const sources = getEnabledSources();
    
    res.json({
      success: true,
      data: sources.map(s => ({
        platform: s.platform,
        name: s.name,
        enabled: s.enabled,
        priority: s.priority,
        hasAuth: !!s.auth?.apiKey,
        rateLimit: s.rateLimit,
      })),
    });
  } catch (error) {
    console.error('[DataSources] Get configs failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
