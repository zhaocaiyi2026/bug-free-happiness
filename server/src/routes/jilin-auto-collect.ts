/**
 * 吉林省政府采购网自动化采集路由
 */

import { Router } from 'express';
import { collectJilinAuto, getListPageInfo, CONFIG } from '@/services/jilin-auto-collector';

const router = Router();

/**
 * POST /api/v1/jilin-auto-collect
 * 执行吉林省政府采购网自动化采集
 * 
 * 请求体（可选）：
 * {
 *   "maxItems": 100,      // 最大采集数量
 *   "filter2026": true    // 是否只采集2026年数据
 * }
 * 
 * 返回：
 * {
 *   success: boolean,
 *   data: {
 *     total: number,
 *     saved: number,
 *     skipped: number,
 *     errors: number,
 *     details: string[]
 *   }
 * }
 */
router.post('/', async (req, res) => {
  try {
    console.log('[API] 开始执行吉林省政府采购网自动化采集');
    
    const options = {
      maxItems: req.body?.maxItems || 50,
      filter2026: req.body?.filter2026 !== false,
    };
    
    console.log(`[API] 配置: maxItems=${options.maxItems}, filter2026=${options.filter2026}`);
    
    const stats = await collectJilinAuto(options);
    
    res.json({
      success: true,
      data: stats,
      message: `采集完成：共处理 ${stats.total} 条，成功保存 ${stats.saved} 条`,
    });
  } catch (error) {
    console.error('[API] 采集失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '采集失败',
    });
  }
});

/**
 * GET /api/v1/jilin-auto-collect/info
 * 获取列表页信息（不执行采集）
 */
router.get('/info', async (_req, res) => {
  try {
    console.log('[API] 获取吉林省政府采购网列表页信息');
    
    const info = await getListPageInfo();
    
    res.json({
      success: true,
      data: {
        total: info.total,
        currentPageItems: info.items.length,
        sampleItems: info.items.slice(0, 5).map(item => ({
          title: item.title,
          region: item.region,
          publishDate: item.publishDate,
          articleId: item.articleId,
        })),
      },
    });
  } catch (error) {
    console.error('[API] 获取信息失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取信息失败',
    });
  }
});

/**
 * GET /api/v1/jilin-auto-collect/config
 * 获取采集配置
 */
router.get('/config', (_req, res) => {
  res.json({
    success: true,
    data: CONFIG,
  });
});

export default router;
