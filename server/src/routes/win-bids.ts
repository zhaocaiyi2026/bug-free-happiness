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
    const todayEnd = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 1).toISOString();

    let query = client
      .from('win_bids')
      .select('*', { count: 'exact' })
      // 按发布日期倒序排列
      .order('publish_date', { ascending: false });

    // 今日中标筛选：发布日期在今天范围内
    if (today === 'true') {
      query = query.gte('publish_date', todayStart);
      query = query.lt('publish_date', todayEnd);
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
        // 构建条件：每个关键词匹配 title 或 win_company 或 content
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
