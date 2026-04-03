/**
 * 吉林省2026年政府采购数据采集路由 V3
 */

import { Router } from 'express';
import { collectJilin2026 } from '@/services/jilin-collector-v3';

const router = Router();

/**
 * POST /api/v1/jilin-collect-v3
 * 执行吉林省2026年政府采购数据采集
 * 
 * 改进：
 * 1. 访问详情页获取完整公告正文
 * 2. 从正文中提取联系人、电话等完整信息
 * 3. 只保存有完整联系信息的数据
 * 
 * 返回：
 * - success: boolean
 * - data: {
 *     total: number,
 *     saved: number,
 *     skipped: number,
 *     errors: number,
 *     details: string[]
 *   }
 */
router.post('/', async (req, res) => {
  try {
    console.log('[API] 开始执行吉林省2026年数据采集V3');
    
    const stats = await collectJilin2026();
    
    res.json({
      success: true,
      data: stats,
      message: `采集完成：共处理 ${stats.total} 条，成功保存 ${stats.saved} 条（含完整联系信息）`,
    });
  } catch (error) {
    console.error('[API] 采集失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '采集失败',
    });
  }
});

export default router;
