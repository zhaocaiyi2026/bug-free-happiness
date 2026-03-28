import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

/**
 * 获取订阅列表
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

    const { data, error } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', Number(userId))
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`查询订阅列表失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('获取订阅列表失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取订阅列表失败'
    });
  }
});

/**
 * 添加订阅
 * Body参数：
 * - userId: number (用户ID)
 * - type: 'industry' | 'keyword' | 'region' (订阅类型)
 * - value: string (订阅值)
 */
router.post('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { userId, type, value } = req.body;

    if (!userId || !type || !value) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      });
    }

    // 检查是否已存在
    const { data: existing } = await client
      .from('subscriptions')
      .select('id')
      .eq('user_id', Number(userId))
      .eq('type', type)
      .eq('value', value)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: '该订阅已存在'
      });
    }

    const { data, error } = await client
      .from('subscriptions')
      .insert({
        user_id: Number(userId),
        type: type,
        value: value,
        enabled: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`添加订阅失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: data,
      message: '添加订阅成功'
    });
  } catch (error) {
    console.error('添加订阅失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '添加订阅失败'
    });
  }
});

/**
 * 更新订阅状态
 * Path参数：
 * - id: number (订阅ID)
 * Body参数：
 * - enabled: boolean (是否启用)
 */
router.patch('/:id', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;
    const { enabled } = req.body;

    if (enabled === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少enabled参数'
      });
    }

    const { error } = await client
      .from('subscriptions')
      .update({ enabled: enabled })
      .eq('id', Number(id));

    if (error) {
      throw new Error(`更新订阅状态失败: ${error.message}`);
    }

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新订阅状态失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新订阅状态失败'
    });
  }
});

/**
 * 删除订阅
 * Path参数：
 * - id: number (订阅ID)
 */
router.delete('/:id', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;

    const { error } = await client
      .from('subscriptions')
      .delete()
      .eq('id', Number(id));

    if (error) {
      throw new Error(`删除订阅失败: ${error.message}`);
    }

    res.json({
      success: true,
      message: '删除订阅成功'
    });
  } catch (error) {
    console.error('删除订阅失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除订阅失败'
    });
  }
});

export default router;
