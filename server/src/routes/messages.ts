/**
 * 消息通知API路由
 */

import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

/**
 * 获取消息列表
 * Query参数：
 * - page: number (页码，默认1)
 * - pageSize: number (每页条数，默认20)
 * - type: string (消息类型：system/subscribe/alert)
 * - userId: number (用户ID)
 */
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const {
      page = 1,
      pageSize = 20,
      type,
      userId,
    } = req.query;

    const pageNum = Number(page);
    const sizeNum = Number(pageSize);
    const start = (pageNum - 1) * sizeNum;
    const end = start + sizeNum - 1;

    let query = client
      .from('messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 用户筛选
    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`);
    }

    // 类型筛选
    if (type && type !== 'all') {
      query = query.eq('type', type as string);
    }

    // 分页
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`查询消息列表失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: {
        list: data,
        total: count,
        page: pageNum,
        pageSize: sizeNum,
        totalPages: Math.ceil((count || 0) / sizeNum),
      },
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取消息列表失败',
    });
  }
});

/**
 * 获取未读消息数量
 * Query参数：
 * - userId: number (用户ID)
 */
router.get('/unread-count', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { userId } = req.query;

    let query = client
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);

    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`查询未读消息失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: { count: count || 0 },
    });
  } catch (error) {
    console.error('获取未读消息数量失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取未读消息数量失败',
    });
  }
});

/**
 * 标记单条消息已读
 * Path参数：
 * - id: number (消息ID)
 */
router.put('/:id/read', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;

    const { error } = await client
      .from('messages')
      .update({ is_read: true })
      .eq('id', Number(id));

    if (error) {
      throw new Error(`标记已读失败: ${error.message}`);
    }

    res.json({
      success: true,
      message: '标记成功',
    });
  } catch (error) {
    console.error('标记已读失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '标记已读失败',
    });
  }
});

/**
 * 标记所有消息已读
 * Query参数：
 * - userId: number (用户ID)
 */
router.put('/read-all', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { userId } = req.query;

    let query = client
      .from('messages')
      .update({ is_read: true })
      .eq('is_read', false);

    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`);
    }

    const { error } = await query;

    if (error) {
      throw new Error(`标记全部已读失败: ${error.message}`);
    }

    res.json({
      success: true,
      message: '全部标记已读成功',
    });
  } catch (error) {
    console.error('标记全部已读失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '标记全部已读失败',
    });
  }
});

/**
 * 删除消息
 * Path参数：
 * - id: number (消息ID)
 */
router.delete('/:id', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;

    const { error } = await client
      .from('messages')
      .delete()
      .eq('id', Number(id));

    if (error) {
      throw new Error(`删除消息失败: ${error.message}`);
    }

    res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除消息失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除消息失败',
    });
  }
});

export default router;
