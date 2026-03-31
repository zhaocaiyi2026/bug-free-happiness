/**
 * 八爪鱼数据导入接口
 * 
 * 用于接收八爪鱼采集器导出的数据，进行清洗、去重后保存到数据库
 * 
 * 合规说明：
 * 1. 必须保留原始数据来源信息（source_url, source_platform）
 * 2. 数据不得篡改，保持原始内容
 * 3. 采集行为需符合目标网站的 robots.txt 规则
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';

const router = Router();

/**
 * 八爪鱼招标数据字段映射
 * 
 * 八爪鱼导出字段 → 系统数据库字段
 */
interface OctopusImportBid {
  // 必填字段
  标题?: string;
  项目名称?: string;
  title?: string;
  
  // 内容
  内容?: string;
  项目详情?: string;
  content?: string;
  
  // 金额
  预算金额?: string | number;
  采购预算?: string | number;
  项目预算?: string | number;
  budget?: string | number;
  
  // 地区
  省份?: string;
  地区?: string;
  province?: string;
  
  城市?: string;
  city?: string;
  
  // 行业
  行业?: string;
  采购类型?: string;
  industry?: string;
  
  // 日期
  发布时间?: string;
  发布日期?: string;
  publish_date?: string;
  
  截止时间?: string;
  报名截止?: string;
  deadline?: string;
  
  // 联系信息（必填，用于数据质量过滤）
  联系人?: string;
  联系人姓名?: string;
  contact_person?: string;
  
  联系电话?: string;
  电话?: string;
  联系方式?: string;
  contact_phone?: string;
  
  联系地址?: string;
  地址?: string;
  contact_address?: string;
  
  联系邮箱?: string;
  邮箱?: string;
  contact_email?: string;
  
  // 来源信息（必填，用于合规）
  来源网址?: string;
  原文链接?: string;
  来源链接?: string;
  source_url?: string;
  
  来源平台?: string;
  数据来源?: string;
  source_platform?: string;
  
  // 其他
  招标类型?: string;
  采购方式?: string;
  bid_type?: string;
  
  项目编号?: string;
  项目编号?: string;
  source_id?: string;
}

/**
 * 八爪鱼中标数据字段映射
 */
interface OctopusImportWinBid {
  // 必填字段
  标题?: string;
  项目名称?: string;
  title?: string;
  
  // 内容
  内容?: string;
  公告内容?: string;
  content?: string;
  
  // 中标金额
  中标金额?: string | number;
  成交金额?: string | number;
  win_amount?: string | number;
  
  // 地区
  省份?: string;
  province?: string;
  城市?: string;
  city?: string;
  
  // 行业
  行业?: string;
  industry?: string;
  
  // 中标单位（必填）
  中标单位?: string;
  中标供应商?: string;
  成交供应商?: string;
  win_company?: string;
  
  中标单位地址?: string;
  win_company_address?: string;
  
  中标单位电话?: string;
  win_company_phone?: string;
  
  // 日期
  发布时间?: string;
  发布日期?: string;
  publish_date?: string;
  
  中标日期?: string;
  定标日期?: string;
  win_date?: string;
  
  // 来源信息
  来源网址?: string;
  source_url?: string;
  来源平台?: string;
  source_platform?: string;
  
  项目编号?: string;
  source_id?: string;
}

/**
 * 数据清洗：提取字段值
 */
function extractField(data: Record<string, unknown>, possibleKeys: string[]): string | undefined {
  for (const key of possibleKeys) {
    const value = data[key];
    if (value !== undefined && value !== null && value !== '') {
      return String(value).trim();
    }
  }
  return undefined;
}

/**
 * 数据清洗：提取金额
 */
function extractBudget(data: Record<string, unknown>, possibleKeys: string[]): number | null {
  const value = extractField(data, possibleKeys);
  if (!value) return null;
  
  // 移除货币符号和单位，提取数字
  const numStr = value.replace(/[￥¥$元,，万元亿元]/g, '');
  const num = parseFloat(numStr);
  
  if (isNaN(num)) return null;
  
  // 如果原值包含"万"，乘以10000
  if (value.includes('万')) {
    return num * 10000;
  }
  // 如果原值包含"亿"，乘以100000000
  if (value.includes('亿')) {
    return num * 100000000;
  }
  
  return num;
}

/**
 * 数据清洗：提取日期
 */
function extractDate(data: Record<string, unknown>, possibleKeys: string[]): string | null {
  const value = extractField(data, possibleKeys);
  if (!value) return null;
  
  try {
    // 尝试解析各种日期格式
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch {
    // 忽略解析错误
  }
  
  return null;
}

/**
 * 导入招标数据
 * POST /api/v1/import/bids
 * 
 * Body 参数：
 * - data: OctopusImportBid[] (八爪鱼导出的数据数组)
 * - source_platform: string (可选，默认为 'octopus')
 * 
 * 返回：
 * - total: 总数
 * - saved: 成功保存数
 * - duplicates: 重复跳过数
 * - invalid: 无效数据数（缺少必填字段）
 * - errors: 错误信息数组
 */
router.post('/bids', async (req: Request, res: Response) => {
  try {
    const { data, source_platform = 'octopus' } = req.body;
    
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供数据数组 (data)',
      });
    }
    
    const supabase = getSupabaseClient();
    
    let saved = 0;
    let duplicates = 0;
    let invalid = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < data.length; i++) {
      try {
        const item = data[i] as Record<string, unknown>;
        
        // 提取字段
        const title = extractField(item, ['标题', '项目名称', 'title']);
        const content = extractField(item, ['内容', '项目详情', 'content']);
        const budget = extractBudget(item, ['预算金额', '采购预算', '项目预算', 'budget']);
        const province = extractField(item, ['省份', '地区', 'province']);
        const city = extractField(item, ['城市', 'city']);
        const industry = extractField(item, ['行业', '采购类型', 'industry']);
        const publishDate = extractDate(item, ['发布时间', '发布日期', 'publish_date']);
        const deadline = extractDate(item, ['截止时间', '报名截止', 'deadline']);
        const contactPerson = extractField(item, ['联系人', '联系人姓名', 'contact_person']);
        const contactPhone = extractField(item, ['联系电话', '电话', '联系方式', 'contact_phone']);
        const contactAddress = extractField(item, ['联系地址', '地址', 'contact_address']);
        const contactEmail = extractField(item, ['联系邮箱', '邮箱', 'contact_email']);
        const sourceUrl = extractField(item, ['来源网址', '原文链接', '来源链接', 'source_url']);
        const bidType = extractField(item, ['招标类型', '采购方式', 'bid_type']);
        const sourceId = extractField(item, ['项目编号', '项目编号', 'source_id']);
        
        // 必填字段验证
        if (!title) {
          invalid++;
          errors.push(`第${i + 1}条: 缺少标题`);
          continue;
        }
        
        // 数据质量验证：必须有联系电话和联系人（符合项目要求）
        if (!contactPhone || !contactPerson) {
          invalid++;
          errors.push(`第${i + 1}条: 缺少联系电话或联系人，已跳过`);
          continue;
        }
        
        // 去重检查：根据来源URL或标题+发布日期
        let existingQuery = supabase
          .from('bids')
          .select('id')
          .limit(1);
        
        if (sourceUrl) {
          existingQuery = existingQuery.eq('source_url', sourceUrl);
        } else if (sourceId && source_platform) {
          existingQuery = existingQuery
            .eq('source_platform', source_platform)
            .eq('source_id', sourceId);
        } else {
          existingQuery = existingQuery
            .eq('title', title)
            .gte('publish_date', publishDate || new Date().toISOString());
        }
        
        const { data: existing } = await existingQuery;
        
        if (existing && existing.length > 0) {
          duplicates++;
          continue;
        }
        
        // 插入数据
        const { error } = await supabase.from('bids').insert({
          title,
          content: content || '',
          budget: budget ? budget.toString() : null,
          province,
          city,
          industry,
          bid_type: bidType || '公开招标',
          publish_date: publishDate,
          deadline,
          contact_person: contactPerson,
          contact_phone: contactPhone,
          contact_address: contactAddress,
          contact_email: contactEmail,
          source_url: sourceUrl,
          source_platform,
          source_id: sourceId || `octopus_${Date.now()}_${i}`,
          data_type: 'import',
        });
        
        if (error) {
          errors.push(`第${i + 1}条: ${error.message}`);
        } else {
          saved++;
        }
        
      } catch (err) {
        errors.push(`第${i + 1}条: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    }
    
    console.log(`[Import] 招标数据导入完成: 总数=${data.length}, 保存=${saved}, 重复=${duplicates}, 无效=${invalid}`);
    
    res.json({
      success: true,
      message: '数据导入完成',
      data: {
        total: data.length,
        saved,
        duplicates,
        invalid,
        errors: errors.slice(0, 20), // 最多返回20条错误
      },
    });
    
  } catch (error) {
    console.error('[Import] 导入招标数据失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '导入失败',
    });
  }
});

/**
 * 导入中标数据
 * POST /api/v1/import/win-bids
 * 
 * Body 参数：
 * - data: OctopusImportWinBid[] (八爪鱼导出的中标数据数组)
 * - source_platform: string (可选，默认为 'octopus')
 */
router.post('/win-bids', async (req: Request, res: Response) => {
  try {
    const { data, source_platform = 'octopus' } = req.body;
    
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供数据数组 (data)',
      });
    }
    
    const supabase = getSupabaseClient();
    
    let saved = 0;
    let duplicates = 0;
    let invalid = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < data.length; i++) {
      try {
        const item = data[i] as Record<string, unknown>;
        
        // 提取字段
        const title = extractField(item, ['标题', '项目名称', 'title']);
        const content = extractField(item, ['内容', '公告内容', 'content']);
        const winAmount = extractBudget(item, ['中标金额', '成交金额', 'win_amount']);
        const province = extractField(item, ['省份', 'province']);
        const city = extractField(item, ['城市', 'city']);
        const industry = extractField(item, ['行业', 'industry']);
        const publishDate = extractDate(item, ['发布时间', '发布日期', 'publish_date']);
        const winDate = extractDate(item, ['中标日期', '定标日期', 'win_date']);
        const winCompany = extractField(item, ['中标单位', '中标供应商', '成交供应商', 'win_company']);
        const winCompanyAddress = extractField(item, ['中标单位地址', 'win_company_address']);
        const winCompanyPhone = extractField(item, ['中标单位电话', 'win_company_phone']);
        const sourceUrl = extractField(item, ['来源网址', 'source_url']);
        const sourceId = extractField(item, ['项目编号', 'source_id']);
        
        // 必填字段验证
        if (!title) {
          invalid++;
          errors.push(`第${i + 1}条: 缺少标题`);
          continue;
        }
        
        // 数据质量验证：必须有中标单位
        if (!winCompany) {
          invalid++;
          errors.push(`第${i + 1}条: 缺少中标单位，已跳过`);
          continue;
        }
        
        // 去重检查
        let existingQuery = supabase
          .from('win_bids')
          .select('id')
          .limit(1);
        
        if (sourceUrl) {
          existingQuery = existingQuery.eq('source_url', sourceUrl);
        } else if (sourceId && source_platform) {
          existingQuery = existingQuery
            .eq('source_platform', source_platform)
            .eq('source_id', sourceId);
        } else {
          existingQuery = existingQuery
            .eq('title', title)
            .eq('win_company', winCompany);
        }
        
        const { data: existing } = await existingQuery;
        
        if (existing && existing.length > 0) {
          duplicates++;
          continue;
        }
        
        // 插入数据
        const { error } = await supabase.from('win_bids').insert({
          title,
          content: content || '',
          win_amount: winAmount ? winAmount.toString() : null,
          province,
          city,
          industry,
          publish_date: publishDate,
          win_date: winDate,
          win_company: winCompany,
          win_company_address: winCompanyAddress,
          win_company_phone: winCompanyPhone,
          source_url: sourceUrl,
          source_platform,
          source_id: sourceId || `octopus_${Date.now()}_${i}`,
          data_type: 'import',
        });
        
        if (error) {
          errors.push(`第${i + 1}条: ${error.message}`);
        } else {
          saved++;
        }
        
      } catch (err) {
        errors.push(`第${i + 1}条: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    }
    
    console.log(`[Import] 中标数据导入完成: 总数=${data.length}, 保存=${saved}, 重复=${duplicates}, 无效=${invalid}`);
    
    res.json({
      success: true,
      message: '数据导入完成',
      data: {
        total: data.length,
        saved,
        duplicates,
        invalid,
        errors: errors.slice(0, 20),
      },
    });
    
  } catch (error) {
    console.error('[Import] 导入中标数据失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '导入失败',
    });
  }
});

/**
 * 批量导入（招标+中标）
 * POST /api/v1/import/batch
 * 
 * Body 参数：
 * - bids: OctopusImportBid[] (可选)
 * - winBids: OctopusImportWinBid[] (可选)
 * - source_platform: string (可选)
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { bids, winBids, source_platform = 'octopus' } = req.body;
    
    const results = {
      bids: { total: 0, saved: 0, duplicates: 0, invalid: 0 },
      winBids: { total: 0, saved: 0, duplicates: 0, invalid: 0 },
    };
    
    // 导入招标数据
    if (Array.isArray(bids) && bids.length > 0) {
      const bidResult = await fetch(`${req.protocol}://${req.get('host')}/api/v1/import/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: bids, source_platform }),
      });
      const bidData = await bidResult.json();
      if (bidData.success) {
        results.bids = bidData.data;
      }
    }
    
    // 导入中标数据
    if (Array.isArray(winBids) && winBids.length > 0) {
      const winBidResult = await fetch(`${req.protocol}://${req.get('host')}/api/v1/import/win-bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: winBids, source_platform }),
      });
      const winBidData = await winBidResult.json();
      if (winBidData.success) {
        results.winBids = winBidData.data;
      }
    }
    
    res.json({
      success: true,
      message: '批量导入完成',
      data: results,
    });
    
  } catch (error) {
    console.error('[Import] 批量导入失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '导入失败',
    });
  }
});

/**
 * 获取导入字段映射说明
 * GET /api/v1/import/field-mapping
 */
router.get('/field-mapping', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      bids: {
        requiredFields: ['标题/项目名称/title', '联系电话/电话/联系方式/contact_phone', '联系人/联系人姓名/contact_person'],
        optionalFields: {
          '内容/项目详情/content': '项目详情',
          '预算金额/采购预算/budget': '预算金额',
          '省份/地区/province': '省份',
          '城市/city': '城市',
          '行业/采购类型/industry': '行业分类',
          '发布时间/发布日期/publish_date': '发布日期',
          '截止时间/报名截止/deadline': '投标截止时间',
          '联系地址/地址/contact_address': '联系地址',
          '来源网址/原文链接/source_url': '原文链接（必填，用于合规）',
          '招标类型/采购方式/bid_type': '招标类型',
          '项目编号/source_id': '项目编号',
        },
      },
      winBids: {
        requiredFields: ['标题/项目名称/title', '中标单位/中标供应商/win_company'],
        optionalFields: {
          '内容/公告内容/content': '公告详情',
          '中标金额/成交金额/win_amount': '中标金额',
          '省份/province': '省份',
          '城市/city': '城市',
          '行业/industry': '行业分类',
          '发布时间/发布日期/publish_date': '发布日期',
          '中标日期/定标日期/win_date': '中标日期',
          '中标单位地址/win_company_address': '中标单位地址',
          '中标单位电话/win_company_phone': '中标单位电话',
          '来源网址/source_url': '原文链接',
          '项目编号/source_id': '项目编号',
        },
      },
      note: '八爪鱼导出的字段名可能与上述不完全一致，系统会自动匹配相似字段名。建议在八爪鱼中配置导出字段时使用上述标准字段名。',
    },
  });
});

export default router;
