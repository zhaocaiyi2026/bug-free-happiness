import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

/**
 * 获取收藏列表
 * Query参数：
 * - userId: number (用户ID)
 * - page: number (页码，默认1)
 * - pageSize: number (每页条数，默认20)
 */
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { userId, page = 1, pageSize = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      });
    }

    const pageNum = Number(page);
    const sizeNum = Number(pageSize);
    const start = (pageNum - 1) * sizeNum;
    const end = start + sizeNum - 1;

    const { data, error, count } = await client
      .from('favorites')
      .select('id, created_at, bids(id, title, budget, province, city, industry, deadline, is_urgent, status)', { count: 'exact' })
      .eq('user_id', Number(userId))
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) {
      throw new Error(`查询收藏列表失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: {
        list: data,
        total: count,
        page: pageNum,
        pageSize: sizeNum,
        totalPages: Math.ceil((count || 0) / sizeNum)
      }
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取收藏列表失败'
    });
  }
});

/**
 * 添加收藏
 * Body参数：
 * - userId: number (用户ID)
 * - bidId: number (招标ID)
 */
router.post('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { userId, bidId } = req.body;

    if (!userId || !bidId) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      });
    }

    const { data, error } = await client
      .from('favorites')
      .insert({
        user_id: Number(userId),
        bid_id: Number(bidId)
      })
      .select()
      .single();

    if (error) {
      // 唯一约束冲突，表示已收藏
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: '已收藏该招标信息'
        });
      }
      throw new Error(`添加收藏失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: data,
      message: '收藏成功'
    });
  } catch (error) {
    console.error('添加收藏失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '添加收藏失败'
    });
  }
});

/**
 * 取消收藏
 * Path参数：
 * - id: number (收藏记录ID)
 * Query参数：
 * - userId: number (用户ID)
 */
router.delete('/:bidId', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { bidId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      });
    }

    const { error } = await client
      .from('favorites')
      .delete()
      .eq('user_id', Number(userId))
      .eq('bid_id', Number(bidId));

    if (error) {
      throw new Error(`取消收藏失败: ${error.message}`);
    }

    res.json({
      success: true,
      message: '取消收藏成功'
    });
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '取消收藏失败'
    });
  }
});

/**
 * 检查是否已收藏
 * Query参数：
 * - userId: number (用户ID)
 * - bidId: number (招标ID)
 */
router.get('/check', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { userId, bidId } = req.query;

    if (!userId || !bidId) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      });
    }

    const { data, error } = await client
      .from('favorites')
      .select('id')
      .eq('user_id', Number(userId))
      .eq('bid_id', Number(bidId))
      .maybeSingle();

    if (error) {
      throw new Error(`检查收藏状态失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: {
        isFavorite: !!data
      }
    });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '检查收藏状态失败'
    });
  }
});

export default router;
