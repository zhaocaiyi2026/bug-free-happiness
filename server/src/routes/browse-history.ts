/**
 * 浏览历史API路由
 */

import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

/**
 * 获取浏览历史列表
 * Query参数：
 * - userId: number (用户ID，必填)
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
      .from('browse_history')
      .select(`
        id,
        viewed_at,
        bids (
          id,
          title,
          budget,
          province,
          city,
          industry,
          deadline,
          is_urgent
        )
      `, { count: 'exact' })
      .eq('user_id', Number(userId))
      .order('viewed_at', { ascending: false })
      .range(start, end);

    if (error) {
      throw new Error(`查询浏览历史失败: ${error.message}`);
    }

    // 过滤掉bid为null的记录（招标可能已被删除）
    const validData = (data || []).filter(item => item.bids);

    res.json({
      success: true,
      data: {
        list: validData,
        total: count,
        page: pageNum,
        pageSize: sizeNum,
        totalPages: Math.ceil((count || 0) / sizeNum)
      }
    });
  } catch (error) {
    console.error('获取浏览历史失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取浏览历史失败'
    });
  }
});

/**
 * 添加浏览记录（或更新浏览时间）
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

    // 使用 upsert 实现：存在则更新时间，不存在则插入
    const { data, error } = await client
      .from('browse_history')
      .upsert({
        user_id: Number(userId),
        bid_id: Number(bidId),
        viewed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,bid_id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`添加浏览记录失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: data,
      message: '浏览记录已保存'
    });
  } catch (error) {
    console.error('添加浏览记录失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '添加浏览记录失败'
    });
  }
});

/**
 * 删除单条浏览记录
 * Path参数：
 * - bidId: number (招标ID)
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
      .from('browse_history')
      .delete()
      .eq('user_id', Number(userId))
      .eq('bid_id', Number(bidId));

    if (error) {
      throw new Error(`删除浏览记录失败: ${error.message}`);
    }

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除浏览记录失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除浏览记录失败'
    });
  }
});

/**
 * 清空浏览历史
 * Query参数：
 * - userId: number (用户ID)
 */
router.delete('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      });
    }

    const { error } = await client
      .from('browse_history')
      .delete()
      .eq('user_id', Number(userId));

    if (error) {
      throw new Error(`清空浏览历史失败: ${error.message}`);
    }

    res.json({
      success: true,
      message: '清空成功'
    });
  } catch (error) {
    console.error('清空浏览历史失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '清空浏览历史失败'
    });
  }
});

/**
 * 获取浏览历史数量
 * Query参数：
 * - userId: number (用户ID)
 */
router.get('/count', async (req, res) => {
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
      .from('browse_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', Number(userId));

    if (error) {
      throw new Error(`获取浏览历史数量失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: { count: count || 0 }
    });
  } catch (error) {
    console.error('获取浏览历史数量失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取浏览历史数量失败'
    });
  }
});

export default router;
