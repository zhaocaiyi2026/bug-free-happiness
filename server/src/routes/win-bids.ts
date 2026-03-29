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
 * - keyword: string (关键词搜索，搜索项目名称和中标单位)
 * - today: boolean (仅返回今日中标)
 * - isSearch: boolean (是否为搜索模式，搜索模式下放宽过滤条件)
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
      isSearch = 'false'
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
    
    // 关键词搜索：支持分词匹配，搜索项目名称(title)、中标单位(win_company)和项目详情(content)
    // 例如搜索"能源环保"，会拆分为"能源"和"环保"，只要包含任意一个词即可匹配
    if (keyword) {
      const keywordStr = keyword as string;
      
      // 分词函数：支持空格分隔和中文自动分词
      const tokenize = (text: string): string[] => {
        // 1. 先按空格分词
        const spaceTokens = text.split(/\s+/).filter(k => k.length > 0);
        const allTokens: string[] = [];
        
        for (const token of spaceTokens) {
          // 如果是纯中文且长度>2，尝试按2-4字分词（滑动窗口）
          if (/^[\u4e00-\u9fa5]+$/.test(token) && token.length > 2) {
            // 使用滑动窗口提取所有可能的2-4字词组
            for (let len = 2; len <= Math.min(4, token.length); len++) {
              for (let i = 0; i <= token.length - len; i++) {
                const subToken = token.substring(i, i + len);
                allTokens.push(subToken);
              }
            }
          } else {
            // 非中文或长度<=2，直接使用
            allTokens.push(token);
          }
        }
        
        // 去重
        return [...new Set(allTokens)];
      };
      
      const keywords = tokenize(keywordStr);
      
      if (keywords.length === 1) {
        // 单个关键词：直接匹配
        query = query.or(`title.ilike.%${keywords[0]}%,win_company.ilike.%${keywords[0]}%,content.ilike.%${keywords[0]}%`);
      } else if (keywords.length > 1) {
        // 多个关键词：构建OR条件，匹配任意一个词
        const conditions = keywords.map(k => 
          `title.ilike.%${k}%,win_company.ilike.%${k}%,content.ilike.%${k}%`
        ).join(',');
        query = query.or(conditions);
      }
    }

    // 核心过滤条件：
    // 所有模式：必须包含完整信息（中标单位电话、中标单位、项目详情）
    if (isSearch === 'true') {
      // 搜索模式：必须有完整的信息
      query = query
        .not('win_company_phone', 'is', null)
        .neq('win_company_phone', '')
        .not('win_company', 'is', null)
        .neq('win_company', '')
        .not('content', 'is', null)
        .neq('content', '');
    } else {
      // 主页模式：必须有中标单位和中标金额
      query = query
        .not('win_company_phone', 'is', null)
        .neq('win_company_phone', '')
        .not('win_company', 'is', null)
        .neq('win_company', '')
        .not('content', 'is', null)
        .neq('content', '')
        .not('win_amount', 'is', null)
        .gt('win_amount', 0);
    }

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
