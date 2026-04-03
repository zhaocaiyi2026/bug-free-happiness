import { Router } from 'express';
import { runCollection, quickCollection } from '@/services/bid-collection';

const router = Router();

/**
 * 执行招标信息采集
 * POST /api/v1/bid-collect/run
 * Body参数：
 * - maxResults?: number (每个查询最大结果数，默认10)
 */
router.post('/run', async (req, res) => {
  try {
    const { maxResults = 10 } = req.body;
    
    console.log(`[BidCollect] 开始采集，每查询最多 ${maxResults} 条`);
    
    // 异步执行采集
    const stats = await runCollection({ maxResults });
    
    res.json({
      success: true,
      data: stats,
      message: `采集完成，共保存 ${stats.saved} 条信息`,
    });
  } catch (error) {
    console.error('[BidCollect] 采集失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '采集失败',
    });
  }
});

/**
 * 快速采集（使用搜索摘要）
 * POST /api/v1/bid-collect/quick
 */
router.post('/quick', async (req, res) => {
  try {
    console.log('[BidCollect] 开始快速采集...');
    
    const stats = await quickCollection();
    
    res.json({
      success: true,
      data: stats,
      message: `快速采集完成，共保存 ${stats.saved} 条信息`,
    });
  } catch (error) {
    console.error('[BidCollect] 快速采集失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '快速采集失败',
    });
  }
});

/**
 * 获取采集状态
 * GET /api/v1/bid-collect/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ready',
      message: '招标信息采集服务就绪',
      dataSource: '公开的政府采购网站',
      method: '网络搜索 + 豆包大模型提取',
      legal: '仅采集公开发布的招标公告信息',
    },
  });
});

export default router;
