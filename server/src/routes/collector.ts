/**
 * 招标数据采集路由
 */

import { Router } from 'express';
import { runCollector } from '@/services/bid-collector';

const router = Router();

/**
 * POST /api/v1/collector/run
 * 手动触发数据采集
 */
router.post('/run', async (req, res) => {
  try {
    console.log('[CollectorAPI] 开始执行数据采集任务...');
    
    const stats = await runCollector();
    
    res.json({
      success: true,
      message: '采集任务完成',
      data: stats,
    });
  } catch (error) {
    console.error('[CollectorAPI] 采集任务失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '采集任务失败',
    });
  }
});

/**
 * GET /api/v1/collector/status
 * 获取采集状态
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: '采集服务运行正常',
    data: {
      lastRun: null, // 可以扩展为从数据库读取
      nextRun: null,
    },
  });
});

export default router;
