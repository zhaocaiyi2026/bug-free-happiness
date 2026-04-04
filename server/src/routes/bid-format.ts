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
 * 格式化招标详情
 * 
 * Params:
 * - id: 招标信息ID
 * 
 * Query:
 * - useProModel: 是否使用Pro模型（默认false）
 */
router.get('/bids/:id/format', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const useProModel = req.query.useProModel === 'true';
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: '缺少招标信息ID',
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
    
    // 获取内容
    const content = bid.content || '';
    
    if (!content || content.length < 50) {
      res.json({
        success: true,
        data: {
          id: bid.id,
          title: bid.title,
          formattedContent: '暂无详细信息',
          projectOverview: '',
          basicInfo: '',
          qualificationRequirements: '',
          getBidDocuments: '',
          bidSubmission: '',
          announcementPeriod: '',
          otherMatters: '',
          contactInfo: '',
          rawContent: content,
        },
      });
      return;
    }
    
    // 格式化内容
    const formatted = await formatBidDetail(content, useProModel);
    
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
    
    res.json({
      success: true,
      data: {
        id: bid.id,
        title: bid.title,
        ...formatted,
        rawContent: content,
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
 * 格式化中标详情
 * 
 * Params:
 * - id: 中标信息ID
 * 
 * Query:
 * - useProModel: 是否使用Pro模型（默认false）
 */
router.get('/win-bids/:id/format', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const useProModel = req.query.useProModel === 'true';
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: '缺少中标信息ID',
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
    
    // 获取内容
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
    
    // 格式化内容
    const formattedContent = await formatWinBidDetail(content, useProModel);
    
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
    
    res.json({
      success: true,
      data: {
        id: winBid.id,
        title: winBid.title,
        formattedContent,
        rawContent: content,
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
 * POST /api/v1/format/preview
 * 预览格式化效果（不保存）
 * 
 * Body:
 * - content: 原始内容
 * - type: 类型 'bid' | 'win_bid'
 * - useProModel: 是否使用Pro模型（默认false）
 */
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { content, type = 'bid', useProModel = false } = req.body;
    
    if (!content || content.length < 50) {
      res.status(400).json({
        success: false,
        message: '内容过短或为空',
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
    let result;
    if (type === 'win_bid') {
      const formattedContent = await formatWinBidDetail(content, useProModel);
      result = { formattedContent };
    } else {
      result = await formatBidDetail(content, useProModel);
    }
    
    if (!result) {
      res.json({
        success: true,
        data: {
          formattedContent: content,
        },
      });
      return;
    }
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[FormatPreview] 格式化失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '格式化失败',
    });
  }
});

export default router;
