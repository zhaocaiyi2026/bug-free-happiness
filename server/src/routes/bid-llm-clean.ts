/**
 * 招标信息内容清理路由
 * 使用豆包大模型智能整理内容格式
 */

import { Router } from 'express';
import { cleanBidContentWithLLM, cleanBidContentsWithLLM } from '@/services/bid-content-cleaner';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

/**
 * POST /api/v1/bids/llm-clean
 * 批量使用LLM清理招标信息内容
 * 
 * Body: { limit?: number, ids?: number[] }
 */
router.post('/', async (req, res) => {
  try {
    const { limit = 10, ids } = req.body;
    
    console.log(`[LLMClean] 开始批量清理，limit: ${limit}, ids: ${ids?.join(',') || 'all'}`);
    
    const supabase = getSupabaseClient();
    
    // 查询需要清理的数据
    let query = supabase
      .from('bids')
      .select('id, title, content')
      .not('content', 'is', null)
      .order('id', { ascending: false });
    
    if (ids && ids.length > 0) {
      query = query.in('id', ids);
    } else {
      query = query.limit(limit);
    }
    
    const { data: bids, error: fetchError } = await query;
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!bids || bids.length === 0) {
      return res.json({
        success: true,
        data: { processed: 0, updated: 0, failed: 0, details: [] }
      });
    }
    
    console.log(`[LLMClean] 找到 ${bids.length} 条记录待处理`);
    
    // 批量处理
    const details: string[] = [];
    let updated = 0;
    let failed = 0;
    
    const results = await cleanBidContentsWithLLM(bids, (id, success, result) => {
      if (success && result) {
        console.log(`[LLMClean] ✓ ID ${id}: 处理成功`);
      } else {
        console.log(`[LLMClean] ✗ ID ${id}: 处理失败`);
      }
    });
    
    // 更新数据库
    for (const { id, result } of results) {
      try {
        // 只更新content字段
        const { error: updateError } = await supabase
          .from('bids')
          .update({
            content: result.content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        
        if (updateError) {
          failed++;
          details.push(`✗ ID ${id}: 更新失败 - ${updateError.message}`);
        } else {
          updated++;
          details.push(`✓ ID ${id}: 已更新 (${result.content.length}字)`);
        }
      } catch (err) {
        failed++;
        details.push(`✗ ID ${id}: 更新异常 - ${err}`);
      }
    }
    
    console.log(`[LLMClean] 批量清理完成: 成功 ${updated}, 失败 ${failed}`);
    
    res.json({
      success: true,
      data: {
        processed: bids.length,
        updated,
        failed,
        details: details.slice(0, 20),
      }
    });
  } catch (error) {
    console.error('[LLMClean] 批量清理失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
});

/**
 * POST /api/v1/bids/llm-clean/:id
 * 使用LLM清理单条招标信息内容
 */
router.post('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: '无效的ID' });
    }
    
    console.log(`[LLMClean] 开始清理 ID: ${id}`);
    
    const supabase = getSupabaseClient();
    
    // 查询原始数据
    const { data: bid, error: fetchError } = await supabase
      .from('bids')
      .select('id, title, content')
      .eq('id', id)
      .single();
    
    if (fetchError || !bid) {
      return res.status(404).json({ success: false, error: '未找到记录' });
    }
    
    const beforeLength = bid.content?.length || 0;
    
    // 使用LLM清理
    const result = await cleanBidContentWithLLM(bid.title, bid.content);
    
    // 只更新content字段
    const { error: updateError } = await supabase
      .from('bids')
      .update({
        content: result.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (updateError) {
      throw updateError;
    }
    
    console.log(`[LLMClean] ID ${id} 清理完成`);
    
    res.json({
      success: true,
      data: {
        id,
        title: result.title,
        before: { contentLength: beforeLength },
        after: { contentLength: result.content.length },
        content: result.content.substring(0, 500) + '...', // 返回前500字符预览
      }
    });
  } catch (error) {
    console.error('[LLMClean] 清理失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
});

export default router;
