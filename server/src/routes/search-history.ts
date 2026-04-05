import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

/**
 * 获取用户搜索历史数量
 * Query参数：
 * - userId: number (用户ID)
 */
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      });
    }

    const { count, error } = await client
      .from('search_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', Number(userId));

    if (error) {
      throw new Error(`查询搜索历史失败: ${error.message}`);
    }

    res.json({
      success: true,
      count: count || 0
    });
  } catch (error) {
    console.error('获取搜索历史数量失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取搜索历史数量失败'
    });
  }
});

/**
 * 清空用户搜索历史
 * Body参数：
 * - userId: number (用户ID)
 */
router.delete('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      });
    }

    const { error } = await client
      .from('search_history')
      .delete()
      .eq('user_id', Number(userId));

    if (error) {
      throw new Error(`清空搜索历史失败: ${error.message}`);
    }

    res.json({
      success: true,
      message: '搜索历史已清空'
    });
  } catch (error) {
    console.error('清空搜索历史失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '清空搜索历史失败'
    });
  }
});

export default router;
