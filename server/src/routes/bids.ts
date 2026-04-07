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
 * - keyword: string (关键词搜索，搜索项目名称和项目详情)
 * - isUrgent: boolean (是否紧急)
 * - bidType: string (招标类型)
 * - publishDateFrom: string (发布日期起始，格式：YYYY-MM-DD)
 * - publishDateTo: string (发布日期结束)
 * - includeExpired: boolean (是否包含已过期招标，默认false。搜索页面可设为true)
 * - isSearch: boolean (是否为搜索模式，搜索模式下放宽过滤条件)
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
      includeExpired = 'false',
      isSearch = 'false'
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
      // 按发布日期倒序排列，null值排在最后
      .order('publish_date', { ascending: false, nullsFirst: false })
      // 再按创建时间倒序，确保新数据排在前面
      .order('created_at', { ascending: false });

    // 应用筛选条件
    if (province) {
      query = query.eq('province', province as string);
    }
    if (city) {
      query = query.eq('city', city as string);
    }
    // 行业筛选：由于数据库中 industry 字段大多为空，改为模糊匹配标题
    if (industry) {
      query = query.ilike('title', `%${industry as string}%`);
    }
    if (bidType) {
      query = query.eq('bid_type', bidType as string);
    }
    // 紧急招标筛选：发布日期为今天 + 投标截止日期在4天内且未过期
    if (isUrgent === 'true') {
      const fourDaysLater = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
      query = query.gt('deadline', now.toISOString()); // 未过期
      query = query.lte('deadline', fourDaysLater.toISOString()); // 4天内
      
      // 发布日期为今天
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      query = query.gte('publish_date', todayStart);
      query = query.lt('publish_date', todayEnd);
    }
    if (minBudget) {
      query = query.gte('budget', Number(minBudget));
    }
    if (maxBudget) {
      query = query.lte('budget', Number(maxBudget));
    }
    
    // 关键词搜索：智能分词匹配
    // 1. 先识别地名（省/市），转为精确筛选条件
    // 2. 剩余关键词保持完整，多个关键词用空格分隔，需要全部匹配（AND逻辑）
    if (keyword) {
      const keywordStr = keyword as string;
      
      // 常见省份和城市列表（部分常用）
      const provinces = [
        '北京市', '天津市', '上海市', '重庆市', '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
        '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省',
        '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省', '台湾省',
        '内蒙古', '广西', '西藏', '宁夏', '新疆', '香港', '澳门',
        // 简称
        '北京', '天津', '上海', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江',
        '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南',
        '广东', '海南', '四川', '贵州', '云南', '陕西', '甘肃', '青海', '台湾',
        '香港', '澳门'
      ];
      
      const cities = [
        '深圳市', '广州市', '成都市', '杭州市', '武汉市', '西安市', '南京市', '苏州市',
        '青岛市', '大连市', '宁波市', '厦门市', '福州市', '长沙市', '郑州市', '济南市',
        '合肥市', '昆明市', '南昌市', '贵阳市', '太原市', '石家庄', '哈尔滨', '沈阳市',
        '长春市', '南宁市', '海口市', '兰州市', '西宁市', '银川市', '乌鲁木齐',
        // 简称
        '深圳', '广州', '成都', '杭州', '武汉', '西安', '南京', '苏州',
        '青岛', '大连', '宁波', '厦门', '福州', '长沙', '郑州', '济南',
        '合肥', '昆明', '南昌', '贵阳', '太原', '石家庄', '哈尔滨', '沈阳',
        '长春', '南宁', '海口', '兰州', '西宁', '银川', '乌鲁木齐'
      ];
      
      // 提取地名
      let extractedProvince = '';
      let extractedCity = '';
      let remainingKeyword = keywordStr;
      
      // 优先匹配城市（因为城市更具体）
      for (const city of cities) {
        if (remainingKeyword.includes(city)) {
          extractedCity = city;
          const cityWithoutSuffix = city.endsWith('市') ? city.slice(0, -1) : city;
          remainingKeyword = remainingKeyword.replace(city, '').trim();
          remainingKeyword = remainingKeyword.replace(cityWithoutSuffix, '').trim();
          break;
        }
      }
      
      // 匹配省份
      for (const prov of provinces) {
        if (remainingKeyword.includes(prov)) {
          extractedProvince = prov;
          const provWithoutSuffix = prov.endsWith('省') ? prov.slice(0, -1) : prov;
          remainingKeyword = remainingKeyword.replace(prov, '').trim();
          remainingKeyword = remainingKeyword.replace(provWithoutSuffix, '').trim();
          break;
        }
      }
      
      // 如果提取到了地名，添加到筛选条件（精确匹配）
      if (extractedProvince && !province) {
        query = query.eq('province', extractedProvince);
      }
      if (extractedCity && !city) {
        query = query.eq('city', extractedCity);
      }
      
      // 剩余关键词处理：提取核心关键词，过滤通用词
      // 多个关键词之间是AND关系（所有关键词都必须匹配）
      const keywords = remainingKeyword.split(/\s+/).filter(k => k.length > 0);
      
      // 通用词列表（这些词太常见，不适合作为搜索关键词）
      const commonWords = ['项目', '工程', '采购', '建设', '公告', '中标', '招标', '采购项目', '建设项目', '工程项目'];
      
      // 提取核心关键词
      const extractCoreKeywords = (text: string): string[] => {
        const coreWords: string[] = [];
        
        // 先检查是否包含通用词，如果有则拆分
        let processedText = text;
        for (const cw of commonWords) {
          if (processedText.includes(cw)) {
            processedText = processedText.replace(cw, ' ');
          }
        }
        
        // 按空格分割，过滤掉通用词和空字符串
        const parts = processedText.split(/\s+/).filter(p => p.length > 0 && !commonWords.includes(p));
        
        if (parts.length > 0) {
          coreWords.push(...parts);
        } else {
          // 如果拆分后没有有效词，检查原始词是否是通用词
          if (!commonWords.includes(text)) {
            coreWords.push(text);
          }
        }
        
        // 去重
        return [...new Set(coreWords)];
      };
      
      // 提取所有核心关键词
      const coreKeywords: string[] = [];
      for (const kw of keywords) {
        coreKeywords.push(...extractCoreKeywords(kw));
      }
      
      if (coreKeywords.length > 0) {
        // 对每个核心关键词，都需要匹配 title 或 content（AND逻辑）
        for (const kw of coreKeywords) {
          query = query.or(`title.ilike.%${kw}%,content.ilike.%${kw}%`);
        }
      }
    }
    
    // 发布日期过滤：使用严格的日期范围
    // publishDateFrom >= 该日期的 00:00:00
    // publishDateTo < 该日期的 00:00:00（使用 lt 排除当天，因为我们要的是"到该日期之前"）
    if (publishDateFrom) {
      query = query.gte('publish_date', publishDateFrom as string);
    }
    if (publishDateTo) {
      // 使用 lt 而不是 lte，确保不包含 publishDateTo 当天的数据
      // 例如：publishDateTo=2026-03-30 时，只包含 2026-03-29 及之前的数据
      query = query.lt('publish_date', publishDateTo as string);
    }

    // 核心过滤条件：
    // 必须包含完整信息：项目名称、联系电话、联系人、项目详情
    if (isSearch === 'true') {
      // 搜索模式：必须有完整信息
      query = query
        .not('title', 'is', null)
        .neq('title', '')
        .not('contact_phone', 'is', null)
        .neq('contact_phone', '')
        .not('contact_person', 'is', null)
        .neq('contact_person', '')
        .not('content', 'is', null)
        .neq('content', '');
      
      // 过期过滤（搜索时也可选择包含）
      if (includeExpired !== 'true') {
        query = query.or(`deadline.is.null,deadline.gt.${now.toISOString()}`);
      }
    } else {
      // 主页模式：必须有完整信息
      query = query
        .not('title', 'is', null)
        .neq('title', '')
        .not('contact_phone', 'is', null)
        .neq('contact_phone', '')
        .not('contact_person', 'is', null)
        .neq('contact_person', '')
        .not('content', 'is', null)
        .neq('content', '');

      // 主页不显示过期招标
      query = query.or(`deadline.is.null,deadline.gt.${now.toISOString()}`);
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
      
      // 智能分类公告类型（根据标题判断）
      const { classifiedType } = classifyBidType(item.title, item.content, item.bid_type);
      
      // 智能分类行业（根据正文内容分析）
      const classifiedIndustry = classifyIndustryFromContent(item.content) || item.industry;
      
      return {
        ...item,
        is_urgent: isUrgent,
        classifiedType,
        classifiedIndustry
      };
    }) || [];

    // 添加缓存控制响应头，禁止缓存
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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

    // 获取今日日期范围（使用 UTC 时间，因为数据库存储的是 UTC）
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();

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

      // 紧急招标数量（发布日期为今天 + 投标截止日期在4天内且未截止，必须包含联系电话、项目详情、截止日期）
      client
        .from('bids')
        .select('id', { count: 'exact', head: true })
        .not('contact_phone', 'is', null)
        .neq('contact_phone', '')
        .not('content', 'is', null)
        .neq('content', '')
        .not('deadline', 'is', null)
        .gt('deadline', now.toISOString())
        .lte('deadline', fourDaysLater.toISOString())
        .gte('publish_date', todayStart)
        .lt('publish_date', todayEnd),

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
 * 行业智能分类映射 - 根据正文内容分析
 */
const INDUSTRY_CLASSIFICATIONS: Record<string, { keywords: string[]; label: string }> = {
  'IT服务': {
    keywords: ['计算机', '软件', '网络', '信息化', '系统集成', 'IT', '信息安全', '服务器', '数据库', '云计算', '大数据', '人工智能', '智能化', '智慧', '电子', '网络设备', '办公设备', '多媒体', '视频会议', '监控', '安防'],
    label: 'IT服务'
  },
  '医疗设备': {
    keywords: ['医疗', '医院', '药品', '医药', '器械', '保健', '防疫', '核酸检测', '疫苗', '诊疗', '手术', '病床', '监护', '影像', '超声', '检验', '体检'],
    label: '医疗设备'
  },
  '建筑工程': {
    keywords: ['建筑', '装修', '装饰', '工程', '施工', '监理', '设计', '勘察', '造价', '园林', '绿化', '市政', '道路', '桥梁', '隧道', '钢结构', '消防', '空调', '电梯'],
    label: '建筑工程'
  },
  '办公家具': {
    keywords: ['家具', '办公桌', '椅子', '柜子', '书架', '会议桌', '沙发', '课桌椅', '实验室家具', '学校家具'],
    label: '办公家具'
  },
  '车辆': {
    keywords: ['车辆', '汽车', '客车', '货车', '特种车', '救护车', '消防车', '环卫车', '校车', '班车', '出租车', '新能源汽车', '电动车', '充电桩'],
    label: '车辆'
  },
  '物业': {
    keywords: ['物业', '保洁', '保安', '绿化', '维修', '停车', '物业服务', '后勤'],
    label: '物业服务'
  },
  '食材': {
    keywords: ['食材', '蔬菜', '肉类', '粮油', '副食品', '食品', '农产品', '生鲜', '水果', '牛奶', '饮料', '食堂', '餐饮'],
    label: '食材配送'
  },
  '印刷': {
    keywords: ['印刷', '纸张', '文具', '办公用品', '硒鼓', '墨盒', '打印', '复印', '制版', '宣传品', '画册', '包装'],
    label: '印刷服务'
  }
};

/**
 * 根据正文内容智能分析行业类别
 */
function classifyIndustryFromContent(content: string): string | null {
  if (!content) return null;
  
  const text = content.toLowerCase();
  let bestMatch: { name: string; score: number } | null = null;
  
  for (const [, config] of Object.entries(INDUSTRY_CLASSIFICATIONS)) {
    let score = 0;
    for (const keyword of config.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score++;
      }
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { name: config.label, score };
    }
  }
  
  return bestMatch?.name || null;
}

/**
 * 招标类型智能分类映射 - 根据标题判断
 */
const BID_TYPE_CLASSIFICATIONS: Record<string, { keywords: string[]; label: string; priority: number }> = {
  // 一、采购前/采购启动
  procurementStart: {
    keywords: ['意向公告', '意向公示', '采购意向', '需求公示', '采购需求'],
    label: '采购启动',
    priority: 10
  },
  prequalification: {
    keywords: ['资格预审', '资格预审公告', '供应商资格审查'],
    label: '资格预审',
    priority: 11
  },
  openBid: {
    keywords: ['公开招标', '公开招标公告', '招标公告'],
    label: '公开招标',
    priority: 12
  },
  inviteBid: {
    keywords: ['邀请招标', '邀请招标公告', '竞争性邀请'],
    label: '邀请招标',
    priority: 13
  },
  competitiveNegotiation: {
    keywords: ['竞争性谈判', '竞争性谈判公告', '谈判公告'],
    label: '竞争性谈判',
    priority: 14
  },
  competitiveConsultation: {
    keywords: ['竞争性磋商', '竞争性磋商公告', '磋商公告'],
    label: '竞争性磋商',
    priority: 15
  },
  inquiry: {
    keywords: ['询价公告', '询价采购', '询价公告'],
    label: '询价采购',
    priority: 16
  },
  singleSource: {
    keywords: ['单一来源', '单一来源公示', '单一来源采购公示', '单一来源公告'],
    label: '单一来源',
    priority: 17
  },
  
  // 二、采购过程/变更
  correction: {
    keywords: ['更正公告', '澄清公告', '变更公告', '补充公告', '修改公告'],
    label: '更正澄清',
    priority: 20
  },
  termination: {
    keywords: ['终止公告', '废标公告', '项目终止', '流标公告', '招标终止'],
    label: '终止废标',
    priority: 21
  },
  
  // 三、采购结果（中标/成交）
  winBid: {
    keywords: ['中标公告', '中标结果', '中标候选人', '中标公示', '中标通知书'],
    label: '中标公告',
    priority: 30
  },
  dealResult: {
    keywords: ['成交公告', '成交结果', '成交公示', '成交候选人', '成交供应商'],
    label: '成交公告',
    priority: 31
  },
  
  // 四、采购后
  contract: {
    keywords: ['合同公告', '合同公示', '采购合同', '合同结果'],
    label: '合同公告',
    priority: 40
  },
  acceptance: {
    keywords: ['验收公告', '验收结果', '验收公示', '履约验收'],
    label: '验收公告',
    priority: 41
  }
};

/**
 * 根据标题和内容智能判断招标类型
 */
function classifyBidType(title: string, content: string, existingType: string): { classifiedType: string; typeCategory: string } {
  const text = `${title || ''} ${content || ''}`.toLowerCase();
  
  // 按优先级排序（从高到低）
  const sortedTypes = Object.entries(BID_TYPE_CLASSIFICATIONS)
    .sort((a, b) => b[1].priority - a[1].priority);
  
  for (const [, config] of sortedTypes) {
    for (const keyword of config.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return {
          classifiedType: config.label,
          typeCategory: getTypeCategory(config.priority)
        };
      }
    }
  }
  
  // 如果没有匹配到关键词，使用现有类型或默认类型
  return {
    classifiedType: existingType || '招标公告',
    typeCategory: 'procurementStart'
  };
}

/**
 * 根据优先级获取类型分类
 */
function getTypeCategory(priority: number): string {
  if (priority >= 10 && priority < 20) return '采购启动';
  if (priority >= 20 && priority < 30) return '采购变更';
  if (priority >= 30 && priority < 40) return '采购结果';
  if (priority >= 40) return '采购后';
  return '其他';
}

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

    // 智能判断招标类型
    const { classifiedType, typeCategory } = classifyBidType(
      bid.title,
      bid.content || bid.formatted_content,
      bid.bid_type || bid.announcement_type
    );

    // 增加浏览次数
    await client
      .from('bids')
      .update({ view_count: (bid.view_count || 0) + 1 })
      .eq('id', Number(id));

    res.json({
      success: true,
      data: {
        ...bid,
        classifiedType,      // 智能分类后的类型
        typeCategory,        // 类型分类：采购启动/采购变更/采购结果/采购后
      }
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
