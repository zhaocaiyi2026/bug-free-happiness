/**
 * 中标信息API路由
 */

import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

/**
 * 获取中标信息列表
 * Query参数：
 * - page: number (页码，默认1)
 * - pageSize: number (每页条数，默认10)
 * - province: string (省份筛选)
 * - city: string (城市筛选)
 * - industry: string (行业筛选)
 * - keyword: string (关键词搜索)
 * - today: boolean (仅返回今日中标)
 */
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const {
      page = 1,
      pageSize = 10,
      province,
      city,
      industry,
      keyword,
      today,
    } = req.query;

    const pageNum = Number(page);
    const sizeNum = Number(pageSize);
    const start = (pageNum - 1) * sizeNum;
    const end = start + sizeNum - 1;

    // 获取今日日期（UTC）
    const todayDate = new Date();
    const todayStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).toISOString();

    let query = client
      .from('win_bids')
      .select('*', { count: 'exact' })
      // 按发布日期倒序排列
      .order('publish_date', { ascending: false });

    // 今日中标筛选
    if (today === 'true') {
      query = query.gte('publish_date', todayStart);
    }

    // 应用筛选条件
    if (province) {
      query = query.eq('province', province as string);
    }
    if (city) {
      query = query.eq('city', city as string);
    }
    if (industry) {
      query = query.eq('industry', industry as string);
    }
    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,win_company.ilike.%${keyword}%`);
    }

    // 核心过滤条件：
    // 1. 必须有中标单位
    // 2. 必须有中标金额
    query = query
      .not('win_company', 'is', null)
      .neq('win_company', '')
      .not('win_amount', 'is', null)
      .gt('win_amount', 0);

    // 分页
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`查询中标列表失败: ${error.message}`);
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
    console.error('获取中标列表失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取中标列表失败',
    });
  }
});

/**
 * 获取中标详情
 * Path参数：
 * - id: number (中标ID)
 */
router.get('/:id', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;

    const { data: winBid, error } = await client
      .from('win_bids')
      .select('*')
      .eq('id', Number(id))
      .maybeSingle();

    if (error) {
      throw new Error(`查询中标详情失败: ${error.message}`);
    }

    if (!winBid) {
      return res.status(404).json({
        success: false,
        message: '中标信息不存在',
      });
    }

    // 增加浏览次数
    await client
      .from('win_bids')
      .update({ view_count: (winBid.view_count || 0) + 1 })
      .eq('id', Number(id));

    res.json({
      success: true,
      data: winBid,
    });
  } catch (error) {
    console.error('获取中标详情失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取中标详情失败',
    });
  }
});

export default router;
