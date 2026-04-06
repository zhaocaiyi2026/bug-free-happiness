/**
 * 消息通知API路由
 */

import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  generateDeadlineReminders,
  generateWinBidReminders,
  generateMatchReminders,
  generateAllMessages,
} from '@/services/message-service';

const router = Router();

/**
 * 获取消息列表
 * Query参数：
 * - page: number (页码，默认1)
 * - pageSize: number (每页条数，默认20)
 * - type: string (消息类型：system/subscribe/alert)
 * - subType: string (消息子类型：deadline/winbid/match)
 * - userId: number (用户ID)
 */
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const {
      page = 1,
      pageSize = 20,
      type,
      subType,
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

    // 子类型筛选（通过data字段中的subType匹配）
    if (subType) {
      query = query.contains('data', { subType: subType as string });
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
 * 按分类标记消息已读
 * Query参数：
 * - subType: string (消息子类型：deadline/winbid/match)
 * - userId: number (用户ID)
 */
router.put('/read-by-type', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { subType, userId } = req.query;

    if (!subType) {
      return res.status(400).json({
        success: false,
        message: 'subType参数不能为空',
      });
    }

    // 构建查询条件
    let query = client
      .from('messages')
      .update({ is_read: true })
      .eq('is_read', false);

    // 用户筛选
    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`);
    }

    // 按类型筛选
    if (subType === 'system') {
      query = query.eq('type', 'system');
    } else {
      // deadline, winbid, match
      query = query.contains('data', { subType: subType as string });
    }

    const { error } = await query;

    if (error) {
      throw new Error(`标记已读失败: ${error.message}`);
    }

    res.json({
      success: true,
      message: '标记已读成功',
    });
  } catch (error) {
    console.error('按类型标记已读失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '按类型标记已读失败',
    });
  }
});

/**
 * 获取各分类未读消息数量
 * Query参数：
 * - userId: number (用户ID)
 */
router.get('/unread-by-type', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { userId } = req.query;

    // 构建基础查询
    let baseQuery = client
      .from('messages')
      .select('id, type, data', { count: 'exact' })
      .eq('is_read', false);

    if (userId) {
      baseQuery = baseQuery.or(`user_id.is.null,user_id.eq.${userId}`);
    }

    const { data, error } = await baseQuery;

    if (error) {
      throw new Error(`查询未读消息失败: ${error.message}`);
    }

    // 统计各类型未读数量
    const counts = {
      deadline: 0,
      winbid: 0,
      match: 0,
      system: 0,
      total: data?.length || 0,
    };

    data?.forEach((msg: any) => {
      if (msg.type === 'system') {
        counts.system++;
      } else if (msg.data?.subType) {
        const st = msg.data.subType as string;
        if (st === 'deadline') counts.deadline++;
        else if (st === 'winbid') counts.winbid++;
        else if (st === 'match') counts.match++;
      }
    });

    res.json({
      success: true,
      data: counts,
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
 * 生成消息提醒（手动触发）
 * Query参数：
 * - type: string (消息类型：deadline/winbid/match/all，默认all)
 */
router.post('/generate', async (req, res) => {
  try {
    const { type = 'all' } = req.query;

    let result;
    switch (type) {
      case 'deadline':
        result = await generateDeadlineReminders();
        break;
      case 'winbid':
        result = await generateWinBidReminders();
        break;
      case 'match':
        result = await generateMatchReminders();
        break;
      case 'all':
      default:
        result = await generateAllMessages();
        break;
    }

    res.json({
      success: true,
      data: result,
      message: `消息生成完成`,
    });
  } catch (error) {
    console.error('生成消息失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '生成消息失败',
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
