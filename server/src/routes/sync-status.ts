/**
 * 数据同步状态路由
 * 
 * 供豆包等数据提供者更新同步进度
 */

import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client.js';

const router = Router();

/**
 * POST /api/v1/sync-status/update
 * 豆包调用此接口更新同步状态
 * 
 * Body:
 * - province: 省份名称（如"吉林省"）
 * - totalCount: 该省份数据总数（可选，如果知道）
 * - syncedCount: 已同步数量
 * - lastSyncId: 最后一条同步的数据ID（可选）
 * - status: 状态 - pending/in_progress/completed/failed
 * - message: 备注信息（可选）
 */
router.post('/update', async (req, res) => {
  try {
    const { province, totalCount, syncedCount, lastSyncId, status, message } = req.body;
    
    if (!province) {
      return res.status(400).json({
        success: false,
        error: '缺少省份参数',
      });
    }
    
    const supabase = getSupabaseClient();
    
    // 使用 upsert 更新或插入记录
    const updateData: Record<string, unknown> = {
      provider: 'doubao',
      province,
      status: status || 'in_progress',
      last_sync_time: new Date().toISOString(),
    };
    
    if (totalCount !== undefined) updateData.total_count = totalCount;
    if (syncedCount !== undefined) updateData.synced_count = syncedCount;
    if (lastSyncId !== undefined) updateData.last_sync_id = lastSyncId;
    if (message !== undefined) updateData.message = message;
    
    const { data, error } = await supabase
      .from('sync_status')
      .upsert(updateData, { onConflict: 'provider,province' })
      .select()
      .single();
    
    if (error) {
      console.error('[同步状态] 更新失败:', error);
      return res.status(500).json({
        success: false,
        error: '更新失败',
        details: error.message,
      });
    }
    
    console.log(`[同步状态] 更新成功: ${province} - ${status} - 已同步${syncedCount || 0}条`);
    
    res.json({
      success: true,
      message: '状态更新成功',
      data,
    });
    
  } catch (error) {
    console.error('[同步状态] 处理异常:', error);
    res.status(500).json({
      success: false,
      error: '处理异常',
      details: String(error),
    });
  }
});

/**
 * GET /api/v1/sync-status/list
 * 查询所有同步状态
 */
router.get('/list', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: '查询失败',
        details: error.message,
      });
    }
    
    res.json({
      success: true,
      count: data?.length || 0,
      data,
    });
    
  } catch (error) {
    console.error('[同步状态] 查询异常:', error);
    res.status(500).json({
      success: false,
      error: '查询异常',
      details: String(error),
    });
  }
});

/**
 * GET /api/v1/sync-status/province/:name
 * 查询指定省份的同步状态
 */
router.get('/province/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .eq('provider', 'doubao')
      .eq('province', name)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.json({
          success: true,
          exists: false,
          message: `未找到${name}的同步记录`,
        });
      }
      return res.status(500).json({
        success: false,
        error: '查询失败',
        details: error.message,
      });
    }
    
    res.json({
      success: true,
      exists: true,
      data,
    });
    
  } catch (error) {
    console.error('[同步状态] 查询异常:', error);
    res.status(500).json({
      success: false,
      error: '查询异常',
      details: String(error),
    });
  }
});

/**
 * POST /api/v1/sync-status/heartbeat
 * 豆包心跳接口，表示还在工作中
 * 
 * Body:
 * - province: 省份名称
 * - message: 可选的消息
 */
router.post('/heartbeat', async (req, res) => {
  try {
    const { province, message } = req.body;
    
    if (!province) {
      return res.status(400).json({
        success: false,
        error: '缺少省份参数',
      });
    }
    
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('sync_status')
      .upsert({
        provider: 'doubao',
        province,
        status: 'in_progress',
        last_sync_time: new Date().toISOString(),
        message: message || '采集中...',
      }, { onConflict: 'provider,province' })
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: '心跳更新失败',
        details: error.message,
      });
    }
    
    res.json({
      success: true,
      message: '心跳已记录',
      timestamp: data.last_sync_time,
    });
    
  } catch (error) {
    console.error('[同步状态] 心跳异常:', error);
    res.status(500).json({
      success: false,
      error: '心跳异常',
      details: String(error),
    });
  }
});

export default router;
