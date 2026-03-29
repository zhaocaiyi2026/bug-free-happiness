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
      .select('id, title, budget, province, city, industry, bid_type, publish_date, deadline, source, source_platform, is_urgent, status, view_count, created_at', { count: 'exact' })
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
    // 紧急招标筛选：投标截止日期在4天内
    if (isUrgent === 'true') {
      const now = new Date();
      const fourDaysLater = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
      query = query.lte('deadline', fourDaysLater.toISOString());
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

    // 动态计算紧急状态：投标截止日期在4天内的项目为紧急
    const now = new Date();
    const fourDaysLater = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    
    const processedData = data?.map(item => {
      const deadline = item.deadline ? new Date(item.deadline) : null;
      // 如果截止日期存在且在4天内，标记为紧急
      const isUrgent = deadline && deadline <= fourDaysLater && deadline > now;
      return {
        ...item,
        is_urgent: isUrgent
      };
    }) || [];

    res.json({
      success: true,
      data: {
        list: processedData,
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
 * 获取首页统计数据
 * 返回：今日新增、紧急招标、今日中标的数量
 */
router.get('/stats', async (req, res) => {
  try {
    const client = getSupabaseClient();

    // 获取今日日期范围（UTC）
    const todayDate = new Date();
    const todayStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).toISOString();
    const todayEnd = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 1).toISOString();

    // 计算紧急招标截止时间（4天内）
    const now = new Date();
    const fourDaysLater = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    // 并行查询三个统计数据
    const [todayBidsResult, urgentBidsResult, todayWinBidsResult] = await Promise.all([
      // 今日新增招标数量
      client
        .from('bids')
        .select('id', { count: 'exact', head: true })
        .not('contact_person', 'is', null)
        .not('contact_phone', 'is', null)
        .not('project_location', 'is', null)
        .gte('publish_date', todayStart)
        .lt('publish_date', todayEnd),

      // 紧急招标数量（投标截止日期在4天内且未截止）
      client
        .from('bids')
        .select('id', { count: 'exact', head: true })
        .not('contact_person', 'is', null)
        .not('contact_phone', 'is', null)
        .not('project_location', 'is', null)
        .gt('deadline', now.toISOString())
        .lte('deadline', fourDaysLater.toISOString()),

      // 今日中标数量
      client
        .from('win_bids')
        .select('id', { count: 'exact', head: true })
        .not('win_company', 'is', null)
        .not('win_amount', 'is', null)
        .gt('win_amount', 0)
        .gte('publish_date', todayStart)
        .lt('publish_date', todayEnd)
    ]);

    res.json({
      success: true,
      data: {
        todayBids: todayBidsResult.count || 0,
        urgentBids: urgentBidsResult.count || 0,
        todayWinBids: todayWinBidsResult.count || 0
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取统计数据失败'
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
