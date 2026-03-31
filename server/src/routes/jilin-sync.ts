/**
 * 吉林省数据同步路由
 * 
 * 提供吉林省政府采购网数据的获取和管理接口
 * 
 * 重要说明：
 * 吉林省政府采购网使用Vue.js动态加载，无法直接爬取。
 * 请使用以下方式获取数据：
 * 1. 现有数据源（全国公共资源交易平台已包含吉林省数据）
 * 2. 八爪鱼手动采集后通过 /api/v1/import/bids 导入
 * 3. 向财政部申请官方API（电话：010-63819308）
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { aiParserService } from '../services/data-sources/ai-parser';
import { getSupabaseClient } from '../storage/database/supabase-client';

const router = Router();

/**
 * GET /api/v1/jilin/info
 * 获取吉林省数据获取方式说明
 */
router.get('/info', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: '吉林省政府采购数据获取方式',
      website: 'http://www.ccgp-jilin.gov.cn',
      status: '动态加载网站，无法直接爬取',
      solutions: [
        {
          method: '现有数据源',
          description: '全国公共资源交易平台已包含吉林省数据',
          cost: '免费',
          recommendation: '★★★★★ 推荐使用',
          apiEndpoint: '/api/v1/bids?province=吉林省',
        },
        {
          method: '八爪鱼导入',
          description: '使用八爪鱼等工具采集后手动导入',
          cost: '免费（八爪鱼基础版）',
          recommendation: '★★★★☆ 适合特定需求',
          apiEndpoint: '/api/v1/import/bids',
          guide: {
            step1: '使用八爪鱼采集吉林省政府采购网数据',
            step2: '导出为JSON格式',
            step3: '调用导入接口入库',
          },
        },
        {
          method: '申请官方API',
          description: '向财政部申请数据接口权限',
          cost: '免费（需公函申请）',
          recommendation: '★★★☆☆ 流程较长',
          contact: {
            phone: '010-63819308 / 4008101996',
            address: '北京市丰台区西四环南路27号',
            document: '《中国政府采购网数据接口规范(V1.0)》',
          },
        },
      ],
      legal: {
        basis: '《招标公告和公示信息发布管理办法》第十二条、第十五条',
        note: '发布媒介应免费提供信息，其他媒介可依法全文转载',
      },
    },
  });
});

/**
 * GET /api/v1/jilin/categories
 * 获取支持的公告类型列表
 */
router.get('/categories', (req: Request, res: Response) => {
  const categories = [
    { code: 'ZcyAnnouncement1', name: '公开招标公告' },
    { code: 'ZcyAnnouncement2', name: '资格预审公告' },
    { code: 'ZcyAnnouncement3', name: '邀请招标公告' },
    { code: 'ZcyAnnouncement4', name: '竞争性谈判公告' },
    { code: 'ZcyAnnouncement5', name: '竞争性磋商公告' },
    { code: 'ZcyAnnouncement6', name: '询价公告' },
    { code: 'ZcyAnnouncement7', name: '采购意向公告' },
    { code: 'ZcyAnnouncement8', name: '更正公告' },
    { code: 'ZcyAnnouncement9', name: '中标结果公告' },
    { code: 'ZcyAnnouncement10', name: '废标公告' },
    { code: 'ZcyAnnouncement11', name: '终止公告' },
    { code: 'ZcyAnnouncement12', name: '采购结果变更公告' },
  ];
  
  res.json({
    success: true,
    data: categories,
  });
});

/**
 * POST /api/v1/jilin/parse
 * AI解析测试接口
 * 
 * Body 参数：
 * - content: string - 公告内容
 * - title: string - 公告标题（可选）
 */
router.post('/parse', async (req: Request, res: Response) => {
  try {
    const { content, title } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CONTENT',
          message: '请提供content参数',
        },
      });
    }
    
    const result = await aiParserService.parseBidContent(content, title);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[JilinSync] Parse failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/v1/jilin/data
 * 查询已同步的吉林省数据
 * 
 * Query 参数：
 * - page: number - 页码
 * - pageSize: number - 每页条数
 * - bidType: string - 公告类型
 */
router.get('/data', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, bidType } = req.query;
    
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('bids')
      .select('*', { count: 'exact' })
      .or(`province.eq.吉林省,province.eq.吉林,city.ilike.%吉林%`)
      .order('publish_date', { ascending: false })
      .range(
        (Number(page) - 1) * Number(pageSize),
        Number(page) * Number(pageSize) - 1
      );
    
    if (bidType) {
      query = query.eq('bid_type', bidType);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: count || 0,
        hasMore: Number(page) * Number(pageSize) < (count || 0),
      },
    });
  } catch (error) {
    console.error('[JilinSync] Query failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
