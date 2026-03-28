import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

/**
 * 获取招标列表
 * Query参数：
 * - page: number (页码，默认1)
 * - pageSize: number (每页条数，默认20)
 * - province: string (省份筛选)
 * - city: string (城市筛选)
 * - industry: string (行业筛选)
 * - minBudget: number (最小预算)
 * - maxBudget: number (最大预算)
 * - keyword: string (关键词搜索)
 * - isUrgent: boolean (是否紧急)
 * - bidType: string (招标类型)
 * - publishDateFrom: string (发布日期起始，格式：YYYY-MM-DD)
 * - publishDateTo: string (发布日期结束)
 */
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const {
      page = 1,
      pageSize = 20,
      province,
      city,
      industry,
      minBudget,
      maxBudget,
      keyword,
      isUrgent,
      bidType,
      publishDateFrom,
      publishDateTo
    } = req.query;

    const pageNum = Number(page);
    const sizeNum = Number(pageSize);
    const start = (pageNum - 1) * sizeNum;
    const end = start + sizeNum - 1;

    let query = client
      .from('bids')
      .select('id, title, budget, province, city, industry, bid_type, publish_date, deadline, source, is_urgent, status, view_count, created_at', { count: 'exact' })
      // 只返回有完整联系人和项目信息的数据
      .not('contact_person', 'is', null)
      .not('contact_phone', 'is', null)
      .not('project_location', 'is', null)
      .order('is_urgent', { ascending: false })
      .order('publish_date', { ascending: false });

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
    if (bidType) {
      query = query.eq('bid_type', bidType as string);
    }
    if (isUrgent !== undefined) {
      query = query.eq('is_urgent', isUrgent === 'true');
    }
    if (minBudget) {
      query = query.gte('budget', Number(minBudget));
    }
    if (maxBudget) {
      query = query.lte('budget', Number(maxBudget));
    }
    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);
    }
    if (publishDateFrom) {
      query = query.gte('publish_date', publishDateFrom as string);
    }
    if (publishDateTo) {
      query = query.lte('publish_date', publishDateTo as string);
    }

    // 分页
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`查询招标列表失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: {
        list: data,
        total: count,
        page: pageNum,
        pageSize: sizeNum,
        totalPages: Math.ceil((count || 0) / sizeNum)
      }
    });
  } catch (error) {
    console.error('获取招标列表失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取招标列表失败'
    });
  }
});

/**
 * 获取招标详情
 * Path参数：
 * - id: number (招标ID)
 */
router.get('/:id', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;

    // 获取招标详情（必须有完整联系人和项目信息）
    const { data: bid, error } = await client
      .from('bids')
      .select('*')
      .eq('id', Number(id))
      .not('contact_person', 'is', null)
      .not('contact_phone', 'is', null)
      .not('project_location', 'is', null)
      .maybeSingle();

    if (error) {
      throw new Error(`查询招标详情失败: ${error.message}`);
    }

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: '招标信息不存在或信息不完整'
      });
    }

    // 增加浏览次数
    await client
      .from('bids')
      .update({ view_count: (bid.view_count || 0) + 1 })
      .eq('id', Number(id));

    res.json({
      success: true,
      data: bid
    });
  } catch (error) {
    console.error('获取招标详情失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取招标详情失败'
    });
  }
});

/**
 * 获取紧急招标列表
 */
router.get('/urgent/list', async (req, res) => {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('bids')
      .select('id, title, budget, province, city, industry, deadline, publish_date')
      .eq('is_urgent', true)
      .eq('status', 'active')
      // 只返回有完整联系人和项目信息的数据
      .not('contact_person', 'is', null)
      .not('contact_phone', 'is', null)
      .not('project_location', 'is', null)
      .order('deadline', { ascending: true })
      .limit(5);

    if (error) {
      throw new Error(`查询紧急招标失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('获取紧急招标失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取紧急招标失败'
    });
  }
});

export default router;
