/**
 * 吉林省2026年政府采购数据采集路由 V5
 * 
 * 核心改进：使用 Web Search 搜索详情页URL，然后访问获取完整内容
 */

import { Router } from 'express';
import { collectJilin2026V5, quickCollectFromUrls, JILIN_CONFIG } from '@/services/jilin-collector-v5';

const router = Router();

/**
 * POST /api/v1/jilin-collect-v5
 * 执行吉林省2026年政府采购数据采集（Web Search模式）
 * 
 * 请求体（可选）：
 * {
 *   "maxQueries": 10,        // 最大搜索次数
 *   "resultsPerQuery": 20    // 每次搜索结果数
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
    console.log('[API] 开始执行吉林省数据采集V5（Web Search模式）');
    
    const options = {
      maxQueries: req.body?.maxQueries || 14,
      resultsPerQuery: req.body?.resultsPerQuery || 20,
    };
    
    console.log(`[API] 配置: maxQueries=${options.maxQueries}, resultsPerQuery=${options.resultsPerQuery}`);
    
    const stats = await collectJilin2026V5(options);
    
    res.json({
      success: true,
      data: stats,
      message: `采集完成：共处理 ${stats.total} 条，成功保存 ${stats.saved} 条（含完整联系信息）`,
      config: {
        searchQueries: JILIN_CONFIG.searchQueries.length,
        ...options,
      },
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
 * POST /api/v1/jilin-collect-v5/quick
 * 快速采集模式 - 从指定URL列表采集
 * 
 * 请求体：
 * {
 *   "urls": ["url1", "url2", ...]  // 详情页URL列表
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
 * GET /api/v1/jilin-collect-v5/config
 * 获取采集配置
 */
router.get('/config', (_req, res) => {
  res.json({
    success: true,
    data: {
      baseUrl: JILIN_CONFIG.baseUrl,
      searchQueries: JILIN_CONFIG.searchQueries,
      requestDelay: JILIN_CONFIG.requestDelay,
    },
  });
});

export default router;
