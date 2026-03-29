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
 * - includeExpired: boolean (是否包含已过期招标，默认false。搜索页面可设为true)
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
      publishDateTo,
      includeExpired = 'false'
    } = req.query;

    const pageNum = Number(page);
    const sizeNum = Number(pageSize);
    const start = (pageNum - 1) * sizeNum;
    const end = start + sizeNum - 1;

    // 当前时间
    const now = new Date();

    let query = client
      .from('bids')
      .select('id, title, content, budget, province, city, industry, bid_type, publish_date, deadline, source, source_platform, contact_person, contact_phone, contact_address, is_urgent, status, view_count, created_at', { count: 'exact' })
      // 按发布日期倒序排列
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

    // 核心过滤条件：
    // 1. 必须包含联系电话（完整联系信息）
    // 2. 必须包含项目详情
    // 3. 必须包含截止日期
    query = query
      .not('contact_phone', 'is', null)
      .neq('contact_phone', '')
      .not('content', 'is', null)
      .neq('content', '')
      .not('deadline', 'is', null);

    // 过滤过期招标（默认不包含，搜索页面可设置includeExpired=true）
    if (includeExpired !== 'true') {
      query = query.gt('deadline', now.toISOString());
    }

    // 分页
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`查询招标列表失败: ${error.message}`);
    }

    // 动态计算紧急状态：投标截止日期在4天内的项目为紧急
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

    // 当前时间
    const now = new Date();

    // 计算紧急招标截止时间（4天内）
    const fourDaysLater = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    // 并行查询三个统计数据
    const [todayBidsResult, urgentBidsResult, todayWinBidsResult] = await Promise.all([
      // 今日新增招标数量（必须包含联系电话、项目详情、截止日期，且未过期）
      client
        .from('bids')
        .select('id', { count: 'exact', head: true })
        .not('contact_phone', 'is', null)
        .neq('contact_phone', '')
        .not('content', 'is', null)
        .neq('content', '')
        .not('deadline', 'is', null)
        .gt('deadline', now.toISOString()) // 未过期
        .gte('publish_date', todayStart)
        .lt('publish_date', todayEnd),

      // 紧急招标数量（投标截止日期在4天内且未截止，必须包含联系电话、项目详情、截止日期）
      client
        .from('bids')
        .select('id', { count: 'exact', head: true })
        .not('contact_phone', 'is', null)
        .neq('contact_phone', '')
        .not('content', 'is', null)
        .neq('content', '')
        .not('deadline', 'is', null)
        .gt('deadline', now.toISOString())
        .lte('deadline', fourDaysLater.toISOString()),

      // 今日中标数量（必须有中标单位和中标金额）
      client
        .from('win_bids')
        .select('id', { count: 'exact', head: true })
        .not('win_company', 'is', null)
        .neq('win_company', '')
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

    // 获取招标详情
    const { data: bid, error } = await client
      .from('bids')
      .select('*')
      .eq('id', Number(id))
      .maybeSingle();

    if (error) {
      throw new Error(`查询招标详情失败: ${error.message}`);
    }

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: '招标信息不存在'
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
    const now = new Date();
    const fourDaysLater = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    // 必须包含：联系电话、项目详情、截止日期，且未过期
    const { data, error } = await client
      .from('bids')
      .select('id, title, budget, province, city, industry, deadline, publish_date, contact_phone, contact_person')
      .not('contact_phone', 'is', null)
      .neq('contact_phone', '')
      .not('content', 'is', null)
      .neq('content', '')
      .not('deadline', 'is', null)
      .gt('deadline', now.toISOString()) // 未过期
      .lte('deadline', fourDaysLater.toISOString()) // 4天内
      .order('deadline', { ascending: true })
      .limit(10);

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
