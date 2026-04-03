/**
 * 吉林省2026年政府采购数据采集路由 V4
 * 
 * 核心改进：直接从吉林省政府采购网采集，不再依赖Web Search
 */

import { Router } from 'express';
import { collectJilin2026V4, quickCollectFromUrls, JILIN_CONFIG } from '@/services/jilin-collector-v4';

const router = Router();

/**
 * POST /api/v1/jilin-collect-v4
 * 执行吉林省2026年政府采购数据采集（直接从网站采集）
 * 
 * 请求体（可选）：
 * {
 *   "maxPages": 10,        // 最大采集页数
 *   "filter2026": true     // 是否只采集2026年数据
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
    console.log('[API] 开始执行吉林省数据采集V4（直接采集模式）');
    
    const options = {
      maxPages: req.body?.maxPages || 5,
      filter2026: req.body?.filter2026 !== false,
    };
    
    console.log(`[API] 配置: maxPages=${options.maxPages}, filter2026=${options.filter2026}`);
    
    const stats = await collectJilin2026V4(options);
    
    res.json({
      success: true,
      data: stats,
      message: `采集完成：共处理 ${stats.total} 条，成功保存 ${stats.saved} 条`,
      config: JILIN_CONFIG,
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
 * POST /api/v1/jilin-collect-v4/quick
 * 快速采集模式 - 从指定URL列表采集
 * 
 * 请求体：
 * {
 *   "urls": ["url1", "url2", ...]  // 详情页URL列表
 * }
 * 
 * 返回：
 * {
 *   success: boolean,
 *   data: {
 *     total: number,
 *     saved: number,
 *     ...
 *   }
 * }
 */
router.post('/quick', async (req, res) => {
  try {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      res.status(400).json({
        success: false,
        message: '请提供有效的URL列表',
      });
      return;
    }
    
    console.log(`[API] 快速采集模式: ${urls.length} 个URL`);
    
    const stats = await quickCollectFromUrls(urls);
    
    res.json({
      success: true,
      data: stats,
      message: `快速采集完成：成功保存 ${stats.saved} 条`,
    });
  } catch (error) {
    console.error('[API] 快速采集失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '采集失败',
    });
  }
});

/**
 * GET /api/v1/jilin-collect-v4/config
 * 获取采集配置
 */
router.get('/config', (_req, res) => {
  res.json({
    success: true,
    data: JILIN_CONFIG,
  });
});

export default router;
