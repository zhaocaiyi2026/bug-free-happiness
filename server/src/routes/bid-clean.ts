/**
 * 数据清理路由
 * 
 * POST /api/v1/bids/clean - 批量清理招标信息内容
 * POST /api/v1/bids/clean/:id - 清理单条招标信息
 */

import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { cleanBidContent } from '@/services/bid-content-cleaner';

const router = Router();

/**
 * POST /api/v1/bids/clean
 * 批量清理招标信息内容
 * 
 * Body参数:
 * - province?: string  指定省份
 * - limit?: number     限制处理数量（默认100）
 */
router.post('/', async (req, res) => {
  try {
    const { province, limit = 100 } = req.body;
    const client = getSupabaseClient();
    
    // 查询需要清理的数据
    let query = client
      .from('bids')
      .select('id, title, content, publish_date, deadline, contact_person, contact_phone, budget, bid_type')
      .order('id', { ascending: false })
      .limit(limit);
    
    if (province) {
      query = query.eq('province', province);
    }
    
    const { data: bids, error: fetchError } = await query;
    
    if (fetchError) {
      return res.status(500).json({ success: false, error: fetchError.message });
    }
    
    if (!bids || bids.length === 0) {
      return res.json({ success: true, data: { processed: 0, updated: 0 } });
    }
    
    let updated = 0;
    let failed = 0;
    const details: string[] = [];
    
    // 逐条处理
    for (const bid of bids) {
      try {
        // 清理内容
        const cleaned = cleanBidContent(bid.title, bid.content || '');
        
        // 构建更新数据
        const updateData: Record<string, unknown> = {
          content: cleaned.content,
        };
        
        // 如果提取到了新的关键信息，则更新（只更新表中存在的字段）
        if (cleaned.budget && !bid.budget) {
          updateData.budget = cleaned.budget;
        }
        if (cleaned.bidType && cleaned.bidType !== '公开招标' && cleaned.bidType.length <= 50) {
          updateData.bid_type = cleaned.bidType;
        }
        if (cleaned.publishDate && !bid.publish_date) {
          updateData.publish_date = cleaned.publishDate;
        }
        if (cleaned.deadline && !bid.deadline) {
          updateData.deadline = cleaned.deadline;
        }
        if (cleaned.contactPerson && !bid.contact_person && cleaned.contactPerson.length <= 100) {
          updateData.contact_person = cleaned.contactPerson;
        }
        if (cleaned.contactPhone && !bid.contact_phone && cleaned.contactPhone.length <= 100) {
          updateData.contact_phone = cleaned.contactPhone;
        }
        if (cleaned.contactAddress && !bid.contact_address && cleaned.contactAddress.length <= 255) {
          updateData.contact_address = cleaned.contactAddress;
        }
        
        // 执行更新
        const { error: updateError } = await client
          .from('bids')
          .update(updateData)
          .eq('id', bid.id);
        
        if (updateError) {
          failed++;
          details.push(`✗ ID ${bid.id}: ${updateError.message}`);
        } else {
          updated++;
          details.push(`✓ ID ${bid.id}: 内容已清理 (${cleaned.content.length}字)`);
        }
      } catch (err) {
        failed++;
        const error = err as Error;
        details.push(`✗ ID ${bid.id}: ${error.message}`);
      }
    }
    
    res.json({
      success: true,
      data: {
        processed: bids.length,
        updated,
        failed,
        details: details.slice(0, 20), // 只返回前20条详情
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/bids/clean/:id
 * 清理单条招标信息
 */
router.post('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    
    // 查询数据
    const { data: bid, error: fetchError } = await client
      .from('bids')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !bid) {
      return res.status(404).json({ success: false, error: '未找到该招标信息' });
    }
    
    // 清理内容
    const cleaned = cleanBidContent(bid.title, bid.content || '');
    
    // 构建更新数据（只更新表中存在的字段）
    const updateData: Record<string, unknown> = {
      content: cleaned.content,
    };
    
    if (cleaned.budget) updateData.budget = cleaned.budget;
    if (cleaned.bidType && cleaned.bidType.length <= 50) updateData.bid_type = cleaned.bidType;
    if (cleaned.publishDate) updateData.publish_date = cleaned.publishDate;
    if (cleaned.deadline) updateData.deadline = cleaned.deadline;
    if (cleaned.contactPerson && cleaned.contactPerson.length <= 100) updateData.contact_person = cleaned.contactPerson;
    if (cleaned.contactPhone && cleaned.contactPhone.length <= 100) updateData.contact_phone = cleaned.contactPhone;
    if (cleaned.contactAddress && cleaned.contactAddress.length <= 255) updateData.contact_address = cleaned.contactAddress;
    
    // 执行更新
    const { error: updateError } = await client
      .from('bids')
      .update(updateData)
      .eq('id', id);
    
    if (updateError) {
      return res.status(500).json({ success: false, error: updateError.message });
    }
    
    res.json({
      success: true,
      data: {
        id: bid.id,
        title: bid.title,
        before: {
          contentLength: bid.content?.length || 0,
        },
        after: {
          contentLength: cleaned.content.length,
          content: cleaned.content.substring(0, 500) + '...',
        },
        extracted: {
          projectNumber: cleaned.projectNumber,
          projectName: cleaned.projectName,
          budget: cleaned.budget,
          bidType: cleaned.bidType,
          publishDate: cleaned.publishDate,
          deadline: cleaned.deadline,
          contactPerson: cleaned.contactPerson,
          contactPhone: cleaned.contactPhone,
        },
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
