/**
 * 招标详情格式化路由
 * 使用豆包大模型将原始内容格式化成标准的招标公告格式
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { formatBidDetail, formatWinBidDetail, isServiceAvailable } from '../services/bid-detail-formatter.js';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

/**
 * GET /api/v1/bids/:id/format
 * 格式化招标详情并保存到数据库
 * 
 * Params:
 * - id: 招标信息ID
 * 
 * Query:
 * - force: 是否强制重新格式化（默认false，已有格式化内容则直接返回）
 */
router.get('/bids/:id/format', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const force = req.query.force === 'true';
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: '缺少招标信息ID',
      });
      return;
    }
    
    // 获取招标信息
    const supabase = getSupabaseClient();
    const { data: bid, error } = await supabase
      .from('bids')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !bid) {
      res.status(404).json({
        success: false,
        message: '招标信息不存在',
      });
      return;
    }
    
    // 如果已有格式化内容且不强制刷新，直接返回
    if (bid.formatted_content && !force) {
      res.json({
        success: true,
        data: {
          id: bid.id,
          title: bid.title,
          formattedContent: bid.formatted_content,
          rawContent: bid.content,
          fromCache: true,
        },
      });
      return;
    }
    
    // 获取原始内容
    const content = bid.content || '';
    
    if (!content || content.length < 50) {
      res.json({
        success: true,
        data: {
          id: bid.id,
          title: bid.title,
          formattedContent: '暂无详细信息',
          rawContent: content,
        },
      });
      return;
    }
    
    // 检查服务是否可用
    if (!isServiceAvailable()) {
      res.status(503).json({
        success: false,
        message: '格式化服务不可用',
      });
      return;
    }
    
    // 格式化内容
    const formatted = await formatBidDetail(content);
    
    if (!formatted) {
      res.json({
        success: true,
        data: {
          id: bid.id,
          title: bid.title,
          formattedContent: content,
          rawContent: content,
        },
      });
      return;
    }
    
    // 保存格式化内容到数据库
    await supabase
      .from('bids')
      .update({ formatted_content: formatted.formattedContent })
      .eq('id', id);
    
    res.json({
      success: true,
      data: {
        id: bid.id,
        title: bid.title,
        formattedContent: formatted.formattedContent,
        rawContent: content,
        fromCache: false,
      },
    });
  } catch (error) {
    console.error('[FormatBidDetail] 格式化失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '格式化失败',
    });
  }
});

/**
 * GET /api/v1/win-bids/:id/format
 * 格式化中标详情并保存到数据库
 * 
 * Params:
 * - id: 中标信息ID
 * 
 * Query:
 * - force: 是否强制重新格式化（默认false）
 */
router.get('/win-bids/:id/format', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const force = req.query.force === 'true';
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: '缺少中标信息ID',
      });
      return;
    }
    
    // 获取中标信息
    const supabase = getSupabaseClient();
    const { data: winBid, error } = await supabase
      .from('win_bids')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !winBid) {
      res.status(404).json({
        success: false,
        message: '中标信息不存在',
      });
      return;
    }
    
    // 如果已有格式化内容且不强制刷新，直接返回
    if (winBid.formatted_content && !force) {
      res.json({
        success: true,
        data: {
          id: winBid.id,
          title: winBid.title,
          formattedContent: winBid.formatted_content,
          rawContent: winBid.content,
          fromCache: true,
        },
      });
      return;
    }
    
    // 获取原始内容
    const content = winBid.content || '';
    
    if (!content || content.length < 50) {
      res.json({
        success: true,
        data: {
          id: winBid.id,
          title: winBid.title,
          formattedContent: '暂无详细信息',
          rawContent: content,
        },
      });
      return;
    }
    
    // 检查服务是否可用
    if (!isServiceAvailable()) {
      res.status(503).json({
        success: false,
        message: '格式化服务不可用',
      });
      return;
    }
    
    // 格式化内容
    const formattedContent = await formatWinBidDetail(content);
    
    if (!formattedContent) {
      res.json({
        success: true,
        data: {
          id: winBid.id,
          title: winBid.title,
          formattedContent: content,
          rawContent: content,
        },
      });
      return;
    }
    
    // 保存格式化内容到数据库
    await supabase
      .from('win_bids')
      .update({ formatted_content: formattedContent })
      .eq('id', id);
    
    res.json({
      success: true,
      data: {
        id: winBid.id,
        title: winBid.title,
        formattedContent,
        rawContent: content,
        fromCache: false,
      },
    });
  } catch (error) {
    console.error('[FormatWinBidDetail] 格式化失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '格式化失败',
    });
  }
});

/**
 * POST /api/v1/format/batch
 * 批量格式化招标/中标信息
 * 
 * Body:
 * - type: 'bid' | 'win_bid' (类型)
 * - limit: number (数量限制，默认50)
 * - force: boolean (是否强制重新格式化，默认false)
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { type = 'bid', limit = 50, force = false } = req.body;
    const supabase = getSupabaseClient();
    
    // 检查服务是否可用
    if (!isServiceAvailable()) {
      res.status(503).json({
        success: false,
        message: '格式化服务不可用',
      });
      return;
    }
    
    const table = type === 'win_bid' ? 'win_bids' : 'bids';
    
    // 查询需要格式化的记录
    let query = supabase
      .from(table)
      .select('id, title, content')
      .not('content', 'is', null)
      .limit(limit);
    
    // 如果不强制刷新，只查询未格式化的
    if (!force) {
      query = query.is('formatted_content', null);
    }
    
    const { data: items, error } = await query;
    
    if (error) {
      throw new Error(`查询失败: ${error.message}`);
    }
    
    if (!items || items.length === 0) {
      res.json({
        success: true,
        data: {
          total: 0,
          processed: 0,
          message: '没有需要格式化的记录',
        },
      });
      return;
    }
    
    // 批量格式化
    let processed = 0;
    let failed = 0;
    
    for (const item of items) {
      try {
        if (type === 'win_bid') {
          const formatted = await formatWinBidDetail(item.content);
          if (formatted) {
            await supabase
              .from(table)
              .update({ formatted_content: formatted })
              .eq('id', item.id);
            processed++;
          } else {
            failed++;
          }
        } else {
          const formatted = await formatBidDetail(item.content);
          if (formatted) {
            await supabase
              .from(table)
              .update({ formatted_content: formatted.formattedContent })
              .eq('id', item.id);
            processed++;
          } else {
            failed++;
          }
        }
        
        // 延迟避免API限流
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (e) {
        console.error(`格式化失败 [${item.id}]:`, e);
        failed++;
      }
    }
    
    res.json({
      success: true,
      data: {
        total: items.length,
        processed,
        failed,
      },
    });
  } catch (error) {
    console.error('[BatchFormat] 批量格式化失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '批量格式化失败',
    });
  }
});

export default router;
