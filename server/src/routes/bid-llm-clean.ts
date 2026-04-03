/**
 * 招标信息LLM清理路由
 * 
 * @module bid-llm-clean
 * @description 提供招标信息内容清理的API接口
 * 
 * @example
 * // 单条清理
 * POST /api/v1/bids/llm-clean/:id
 * 
 * // 批量清理
 * POST /api/v1/bids/llm-clean
 * Body: { limit?: number, source?: string }
 * 
 * // 自动清理新数据
 * POST /api/v1/bids/llm-clean/auto
 */

import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { 
  cleanBidContentWithLLM, 
  cleanBidContentsWithLLM,
  type CleanedBidContent,
  type CleanerStats 
} from '../services/bid-content-cleaner.js';

const router = Router();

/**
 * POST /api/v1/bids/llm-clean/:id
 * 清理单条招标信息
 * 
 * @param id - 招标信息ID
 * @returns 清理结果
 */
router.post('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[LLM-Clean] 开始清理单条数据: ${id}`);
    
    const client = getSupabaseClient();
    
    // 查询数据
    const { data: bid, error } = await client
      .from('bids')
      .select('id, title, content')
      .eq('id', id)
      .single();
    
    if (error || !bid) {
      return res.status(404).json({ error: '数据不存在' });
    }
    
    // 执行清理
    const result = await cleanBidContentWithLLM(bid.title, bid.content);
    
    // 更新数据库
    const updateData: Record<string, unknown> = {
      content: result.content,
      updated_at: new Date().toISOString(),
    };
    
    // 如果提取到了关键信息，也更新到数据库
    if (result.projectName) {
      updateData.title = result.projectName;
    }
    if (result.budget) {
      updateData.budget = result.budget;
    }
    if (result.publishDate) {
      updateData.publish_date = result.publishDate;
    }
    if (result.deadline) {
      updateData.deadline = result.deadline;
    }
    if (result.contactPerson) {
      updateData.contact_person = result.contactPerson;
    }
    if (result.contactPhone) {
      updateData.contact_phone = result.contactPhone;
    }
    
    const { error: updateError } = await client
      .from('bids')
      .update(updateData)
      .eq('id', id);
    
    if (updateError) {
      console.error(`[LLM-Clean] 更新失败:`, updateError);
      return res.status(500).json({ error: '更新失败', details: updateError });
    }
    
    console.log(`[LLM-Clean] 清理完成: ${id}`);
    
    res.json({ 
      success: true, 
      id: parseInt(id), 
      result 
    });
    
  } catch (error) {
    console.error('[LLM-Clean] 清理失败:', error);
    res.status(500).json({ error: '清理失败', details: String(error) });
  }
});

/**
 * POST /api/v1/bids/llm-clean
 * 批量清理招标信息
 * 
 * Body:
 * - limit: 清理数量限制（默认10条）
 * - source: 数据来源过滤（可选）
 * - force: 是否强制清理已清理过的数据（默认false）
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  const stats: CleanerStats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
  };
  
  try {
    const { limit = 10, source, force = false } = req.body;
    
    console.log(`[LLM-Clean] 开始批量清理, limit=${limit}, source=${source || '全部'}, force=${force}`);
    
    const client = getSupabaseClient();
    
    // 构建查询
    let query = client
      .from('bids')
      .select('id, title, content')
      .order('created_at', { ascending: false });
    
    // 数据源过滤
    if (source) {
      query = query.eq('source', source);
    }
    
    // 限制数量
    query = query.limit(limit);
    
    const { data: bids, error } = await query;
    
    if (error || !bids || bids.length === 0) {
      return res.json({ 
        success: true, 
        message: '没有需要清理的数据',
        stats: { ...stats, total: 0 }
      });
    }
    
    stats.total = bids.length;
    
    // 批量清理
    const results: Array<{ id: number; success: boolean; result?: CleanedBidContent }> = [];
    
    for (const bid of bids) {
      try {
        const result = await cleanBidContentWithLLM(bid.title, bid.content);
        
        // 更新数据库
        const updateData: Record<string, unknown> = {
          content: result.content,
          updated_at: new Date().toISOString(),
        };
        
        // 更新提取到的关键信息
        if (result.projectName) updateData.title = result.projectName;
        if (result.budget) updateData.budget = result.budget;
        if (result.publishDate) updateData.publish_date = result.publishDate;
        if (result.deadline) updateData.deadline = result.deadline;
        if (result.contactPerson) updateData.contact_person = result.contactPerson;
        if (result.contactPhone) updateData.contact_phone = result.contactPhone;
        
        const { error: updateError } = await client
          .from('bids')
          .update(updateData)
          .eq('id', bid.id);
        
        if (updateError) {
          console.error(`[LLM-Clean] 更新失败 ${bid.id}:`, updateError);
          stats.failed++;
          results.push({ id: bid.id, success: false });
        } else {
          stats.success++;
          results.push({ id: bid.id, success: true, result });
        }
        
      } catch (error) {
        console.error(`[LLM-Clean] 清理失败 ${bid.id}:`, error);
        stats.failed++;
        results.push({ id: bid.id, success: false });
      }
    }
    
    stats.duration = Date.now() - startTime;
    
    console.log(`[LLM-Clean] 批量清理完成: 成功${stats.success}, 失败${stats.failed}, 耗时${stats.duration}ms`);
    
    res.json({ 
      success: true, 
      stats,
      results 
    });
    
  } catch (error) {
    stats.duration = Date.now() - startTime;
    console.error('[LLM-Clean] 批量清理失败:', error);
    res.status(500).json({ error: '批量清理失败', details: String(error), stats });
  }
});

/**
 * POST /api/v1/bids/llm-clean/auto
 * 自动清理新数据（定时任务调用）
 * 
 * 自动查找 content_raw 不为空但 content 为空的数据进行清理
 */
router.post('/auto', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('[LLM-Clean] 开始自动清理新数据');
    
    const client = getSupabaseClient();
    
    // 查找包含HTML标签的内容（需要清理的）
    const { data: bids, error } = await client
      .from('bids')
      .select('id, title, content')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      return res.status(500).json({ error: '查询失败', details: error });
    }
    
    if (!bids || bids.length === 0) {
      return res.json({ success: true, message: '没有需要清理的数据' });
    }
    
    // 筛选包含 HTML 标签的内容
    const needsCleaning = bids.filter(bid => 
      bid.content && bid.content.includes('<')
    );
    
    if (needsCleaning.length === 0) {
      return res.json({ success: true, message: '所有数据已经清理完成' });
    }
    
    // 执行清理
    const results = await cleanBidContentsWithLLM(needsCleaning);
    
    // 更新数据库
    for (const item of results) {
      const updateData: Record<string, unknown> = {
        content: item.result.content,
        updated_at: new Date().toISOString(),
      };
      
      if (item.result.projectName) updateData.title = item.result.projectName;
      if (item.result.budget) updateData.budget = item.result.budget;
      if (item.result.publishDate) updateData.publish_date = item.result.publishDate;
      if (item.result.deadline) updateData.deadline = item.result.deadline;
      if (item.result.contactPerson) updateData.contact_person = item.result.contactPerson;
      if (item.result.contactPhone) updateData.contact_phone = item.result.contactPhone;
      
      await client
        .from('bids')
        .update(updateData)
        .eq('id', item.id);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[LLM-Clean] 自动清理完成: ${results.length}条, 耗时${duration}ms`);
    
    res.json({ 
      success: true, 
      cleaned: results.length,
      duration 
    });
    
  } catch (error) {
    console.error('[LLM-Clean] 自动清理失败:', error);
    res.status(500).json({ error: '自动清理失败', details: String(error) });
  }
});

/**
 * GET /api/v1/bids/llm-clean/stats
 * 获取清理统计信息
 */
router.get('/stats', async (req, res) => {
  try {
    const client = getSupabaseClient();
    
    // 统计总数
    const { count: total } = await client
      .from('bids')
      .select('*', { count: 'exact', head: true });
    
    // 统计已清理（content不包含HTML标签的）
    const { data: cleanedBids } = await client
      .from('bids')
      .select('id, content')
      .limit(1000);
    
    const cleaned = cleanedBids?.filter(bid => 
      bid.content && !bid.content.includes('<')
    ).length || 0;
    
    res.json({
      total: total || 0,
      cleaned,
      pending: (total || 0) - cleaned,
    });
    
  } catch (error) {
    console.error('[LLM-Clean] 获取统计失败:', error);
    res.status(500).json({ error: '获取统计失败', details: String(error) });
  }
});

export default router;
