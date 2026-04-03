import { Router } from 'express';
import { runJilinCollection } from '@/services/jilin-collector';

const router = Router();

/**
 * 采集吉林省政府采购网数据
 * POST /api/v1/jilin-collect/run
 * Body参数：
 * - maxResults?: number (每个查询最大结果数，默认12)
 */
router.post('/run', async (req, res) => {
  try {
    const { maxResults = 12 } = req.body;
    
    console.log(`[JilinCollect] 开始采集吉林省政府采购数据，每查询最多 ${maxResults} 条`);
    
    const stats = await runJilinCollection({ maxResults });
    
    res.json({
      success: true,
      data: stats,
      message: `采集完成，共保存 ${stats.saved} 条吉林省采购信息`,
    });
  } catch (error) {
    console.error('[JilinCollect] 采集失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '采集失败',
    });
  }
});

/**
 * 获取采集状态
 * GET /api/v1/jilin-collect/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ready',
      message: '吉林省政府采购网采集服务就绪',
      dataSource: '吉林省政府采购网 (公开信息)',
      method: '网络搜索 + 公开访问 + 豆包大模型提取',
      legal: '仅采集公开发布的政府采购公告信息',
      timeRange: '2025年1月至今',
    },
  });
});

export default router;
