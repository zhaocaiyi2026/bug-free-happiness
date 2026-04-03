import { Router } from 'express';
import { runCollection, quickCollection, collectFromUrl } from '@/services/bid-collection';

const router = Router();

/**
 * 执行招标信息采集（获取详情页完整内容）
 * POST /api/v1/bid-collect/run
 * Body参数：
 * - maxResults?: number (每个查询最大结果数，默认8)
 */
router.post('/run', async (req, res) => {
  try {
    const { maxResults = 8 } = req.body;
    
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
 * 快速采集（使用搜索摘要，不获取详情页）
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
 * 采集指定URL的招标信息
 * POST /api/v1/bid-collect/url
 * Body参数：
 * - url: string (招标公告详情页URL)
 * - type?: 'bid' | 'win_bid' (默认bid)
 */
router.post('/url', async (req, res) => {
  try {
    const { url, type = 'bid' } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: '请提供招标公告URL (url)',
      });
    }
    
    // 验证URL格式
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'URL格式无效',
      });
    }
    
    console.log(`[BidCollect] 采集指定URL: ${url}`);
    
    const result = await collectFromUrl(url, type);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        content: result.content,
        message: result.message,
      });
    } else {
      res.status(422).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('[BidCollect] 采集URL失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '采集失败',
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
      method: '网络搜索 + 详情页获取 + 豆包大模型提取',
      legal: '仅采集公开发布的招标公告信息',
      features: [
        '获取详情页完整公告正文',
        '智能提取项目信息、联系方式、截止日期等',
        '自动识别省份、城市、行业',
        '预算金额自动解析',
      ],
    },
  });
});

export default router;
