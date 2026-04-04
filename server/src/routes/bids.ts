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
    if (industry) {
      query = query.eq('industry', industry as string);
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
    // 2. 剩余关键词使用模糊匹配（OR逻辑，匹配任意一个关键词）
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
          // 保持原样，不去掉"市"后缀，因为数据库存储格式可能是"深圳市"
          extractedCity = city;
          // 同时生成不带"市"的版本用于匹配
          const cityWithoutSuffix = city.endsWith('市') ? city.slice(0, -1) : city;
          remainingKeyword = remainingKeyword.replace(city, '').trim();
          // 如果剩余关键词中还有不带"市"的版本，也去掉
          remainingKeyword = remainingKeyword.replace(cityWithoutSuffix, '').trim();
          break;
        }
      }
      
      // 匹配省份
      for (const prov of provinces) {
        if (remainingKeyword.includes(prov)) {
          // 保持原样
          extractedProvince = prov;
          // 同时生成不带"省"的版本用于匹配
          const provWithoutSuffix = prov.endsWith('省') ? prov.slice(0, -1) : prov;
          remainingKeyword = remainingKeyword.replace(prov, '').trim();
          // 如果剩余关键词中还有不带"省"的版本，也去掉
          remainingKeyword = remainingKeyword.replace(provWithoutSuffix, '').trim();
          break;
        }
      }
      
      // 如果提取到了地名，添加到筛选条件
      if (extractedProvince && !province) {
        query = query.eq('province', extractedProvince);
      }
      if (extractedCity && !city) {
        query = query.eq('city', extractedCity);
      }
      
      // 对剩余关键词进行分词处理
      // 如果没有空格分隔，对中文进行智能分词（提取有意义的词汇）
      const tokenizeKeyword = (text: string): string[] => {
        // 先按空格分词
        const spaceTokens = text.split(/\s+/).filter(k => k.length > 0);
        const result: string[] = [];
        
        for (const token of spaceTokens) {
          if (/^[\u4e00-\u9fa5]+$/.test(token)) {
            // 纯中文：提取2-4字的有意义词汇
            // 但保留完整的词（如果长度<=4）
            if (token.length <= 4) {
              result.push(token);
            } else {
              // 较长的词，提取主要词汇
              // 例如"实验室项目" -> "实验室"、"项目"
              for (let len = 2; len <= Math.min(4, token.length); len++) {
                for (let i = 0; i <= token.length - len; i++) {
                  const subToken = token.substring(i, i + len);
                  // 只添加有意义的词（避免添加无意义的字组合）
                  if (subToken.length >= 2) {
                    result.push(subToken);
                  }
                }
              }
            }
          } else {
            // 非中文或混合，直接使用
            result.push(token);
          }
        }
        
        // 去重
        return [...new Set(result)];
      };
      
      const keywords = tokenizeKeyword(remainingKeyword);
      
      // 使用单个 OR 条件匹配所有关键词
      if (keywords.length > 0) {
        // 构建条件：每个关键词匹配 title 或 content
        const conditions = keywords.map(k => 
          `title.ilike.%${k}%,content.ilike.%${k}%`
        ).join(',');
        query = query.or(conditions);
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
    // 必须包含完整联系信息（联系电话、联系人、项目详情）
    if (isSearch === 'true') {
      // 搜索模式：必须有完整的联系信息
      query = query
        .not('contact_phone', 'is', null)
        .neq('contact_phone', '')
        .not('contact_person', 'is', null)
        .neq('contact_person', '')
        .not('content', 'is', null)
        .neq('content', '');
      
      // 过滤过期招标（搜索时也可以选择是否包含）
      if (includeExpired !== 'true') {
        query = query.gt('deadline', now.toISOString());
      }
    } else {
      // 主页模式：必须包含完整联系信息
      query = query
        .not('contact_phone', 'is', null)
        .neq('contact_phone', '')
        .not('contact_person', 'is', null)
        .neq('contact_person', '')
        .not('content', 'is', null)
        .neq('content', '')
        .not('deadline', 'is', null);

      // 主页不显示过期招标
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
