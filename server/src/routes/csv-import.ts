import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

const router = Router();

// 豆包 LLM 客户端
let llmClient: LLMClient | null = null;

function getLLMClient(): LLMClient {
  if (!llmClient) {
    llmClient = new LLMClient(new Config());
  }
  return llmClient;
}

/**
 * CSV 数据导入接口
 * POST /api/v1/csv-import
 * 
 * 流程：
 * 1. 接收 JSON 数据（从 CSV 转换而来）
 * 2. 查重（基于 source_url 或标题）
 * 3. 从内容中提取联系人和电话
 * 4. 入库
 * 5. 自动调用豆包大模型格式化
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { data: items } = req.body;
    const supabase = getSupabaseClient();

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的数据数组'
      });
    }

    console.log(`[CSV导入] 开始处理 ${items.length} 条数据`);

    const results = {
      total: items.length,
      duplicate: 0,
      extracted: 0,
      imported: 0,
      formatted: 0,
      failed: 0,
      errors: [] as string[],
      importedIds: [] as number[]
    };

    for (const item of items) {
      try {
        // 清理字段名（移除 \r 等特殊字符）
        const cleanItem: any = {};
        for (const key in item) {
          const cleanKey = key.replace(/[\r\n]/g, '').trim();
          cleanItem[cleanKey] = item[key];
        }

        // 1. 基础字段校验
        if (!cleanItem['标题'] || !cleanItem['完整内容']) {
          results.failed++;
          results.errors.push(`跳过：缺少标题或内容 - ${cleanItem['标题']?.substring(0, 30) || '未知'}`);
          continue;
        }

        const title = cleanItem['标题'].trim();
        const sourceUrl = cleanItem['详情链接']?.trim() || '';
        const content = cleanItem['完整内容'];

        // 2. 查重机制（双重校验）
        // 优先级：source_url > 标题
        let isDuplicate = false;
        let duplicateReason = '';

        // 2.1 如果有 sourceUrl，用 URL 精确查重
        if (sourceUrl && sourceUrl.length > 10) {
          const { data: existingByUrl } = await supabase
            .from('bids')
            .select('id, title')
            .eq('source_url', sourceUrl)
            .maybeSingle();
          
          if (existingByUrl) {
            isDuplicate = true;
            duplicateReason = 'URL相同';
          }
        }

        // 2.2 用标题查重（标题完全相同视为重复）
        if (!isDuplicate && title.length > 5) {
          const { data: existingByTitle } = await supabase
            .from('bids')
            .select('id, title, source')
            .eq('title', title)
            .maybeSingle();
          
          if (existingByTitle) {
            isDuplicate = true;
            duplicateReason = '标题相同';
          }
        }

        if (isDuplicate) {
          results.duplicate++;
          console.log(`[CSV导入] 重复数据跳过 (${duplicateReason}): ${title.substring(0, 50)}...`);
          continue;
        }

        // 3. 从内容中提取联系人、电话等信息
        const extractedData = extractInfo(content);
        results.extracted++;

        // 4. 构建入库数据
        const bidData = {
          title: title,
          content: content,
          budget: extractedData.budget || parseBudget(cleanItem['预算金额']),
          province: cleanItem['省份'] || '吉林省',
          city: extractedData.city || '长春市',
          industry: extractedData.industry || '',
          bid_type: cleanItem['类型'] || '招标公告',
          announcement_type: cleanItem['类型'] || '招标公告',
          publish_date: parseDate(cleanItem['发布时间']) || new Date(),
          deadline: extractedData.deadline,
          source: cleanItem['来源'] || '吉林省公共资源交易中心',
          source_url: sourceUrl,
          source_platform: cleanItem['来源'] || '吉林省公共资源交易中心',
          contact_person: extractedData.contact_person || '',
          contact_phone: extractedData.contact_phone || '',
          contact_email: extractedData.contact_email || '',
          contact_address: extractedData.contact_address || '',
          project_location: extractedData.project_location || '',
          project_code: extractedData.project_code || '',
          purchaser_name: extractedData.purchaser_name || '',
          purchaser_contact: extractedData.purchaser_contact || '',
          purchaser_phone: extractedData.purchaser_phone || '',
          agency_name: extractedData.agency_name || '',
          agency_contact: extractedData.agency_contact || '',
          agency_phone: extractedData.agency_phone || '',
          data_type: 'bidding',
          status: 'active',
          is_urgent: false,
          view_count: 0
        };

        // 5. 入库
        const { data: insertedBid, error: insertError } = await supabase
          .from('bids')
          .insert(bidData)
          .select('id')
          .single();

        if (insertError) {
          results.failed++;
          results.errors.push(`入库失败: ${title.substring(0, 30)} - ${insertError.message}`);
          console.error('[CSV导入] 入库失败:', insertError);
        } else {
          results.imported++;
          results.importedIds.push(insertedBid.id);
          console.log(`[CSV导入] 成功入库: ${title.substring(0, 50)}... ID: ${insertedBid.id}`);
        }

      } catch (error: any) {
        results.failed++;
        results.errors.push(`处理失败: ${error.message}`);
        console.error('[CSV导入] 处理错误:', error);
      }
    }

    // 6. 后台异步格式化（不阻塞响应）
    if (results.importedIds.length > 0) {
      // 异步执行格式化，不等待结果
      formatBidsAsync(results.importedIds).catch(err => {
        console.error('[CSV导入] 后台格式化错误:', err);
      });
    }

    console.log(`[CSV导入] 完成: 总计=${results.total}, 重复=${results.duplicate}, 入库=${results.imported}, 失败=${results.failed}`);

    return res.json({
      success: true,
      data: results
    });

  } catch (error: any) {
    console.error('[CSV导入] 接口错误:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 异步格式化多条招标公告
 */
async function formatBidsAsync(ids: number[]): Promise<void> {
  const supabase = getSupabaseClient();
  const llm = getLLMClient();

  console.log(`[格式化] 开始后台格式化 ${ids.length} 条数据`);

  for (const id of ids) {
    try {
      // 获取数据
      const { data: bid, error: fetchError } = await supabase
        .from('bids')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !bid) {
        console.error(`[格式化] 获取数据失败: ${id}`);
        continue;
      }

      console.log(`[格式化] 处理: ${bid.title}`);

      // 调用豆包大模型格式化
      const messages = [
        {
          role: 'system' as const,
          content: `你是一个专业的招标公告格式化助手。请将招标公告内容整理成清晰的结构化格式。`
        },
        {
          role: 'user' as const,
          content: `请将以下招标公告内容格式化为标准的结构化格式。

要求：
1. 按章节整理内容（项目概况、供应商资格要求、获取招标文件、投标截止时间、联系方式等）
2. 提取关键信息（项目名称、采购人、预算金额、联系人、联系电话等）
3. 清理HTML标签、多余空格和换行
4. 保持原文核心信息不变

原文标题：${bid.title}

原文内容：
${bid.content?.substring(0, 8000) || '无内容'}

请以以下JSON格式返回：
{
  "formatted_content": "格式化后的内容（使用换行分隔章节）",
  "purchaser": "采购人",
  "budget": "预算金额（数字，单位元）",
  "contact_person": "联系人",
  "contact_phone": "联系电话",
  "deadline": "投标截止时间（格式：YYYY-MM-DD HH:mm:ss）",
  "project_code": "项目编号"
}`
        }
      ];

      const response = await llm.invoke(messages, {
        model: 'doubao-seed-1-6-lite-251015',
        temperature: 0.3
      });

      const formatResult = response.content;

      // 解析返回结果
      let parsedResult: any = {};
      try {
        const jsonMatch = formatResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('[格式化] JSON解析失败');
      }

      // 更新数据库
      const updateData: any = {};
      if (parsedResult.formatted_content) {
        updateData.formatted_content = parsedResult.formatted_content;
      }
      if (parsedResult.purchaser) {
        updateData.purchaser_name = parsedResult.purchaser;
      }
      if (parsedResult.budget && !isNaN(Number(parsedResult.budget))) {
        updateData.budget = Number(parsedResult.budget);
      }
      if (parsedResult.contact_person) {
        updateData.contact_person = parsedResult.contact_person;
      }
      if (parsedResult.contact_phone) {
        updateData.contact_phone = parsedResult.contact_phone;
      }
      if (parsedResult.project_code) {
        updateData.project_code = parsedResult.project_code;
      }
      
      // 处理deadline - 验证时间格式
      if (parsedResult.deadline) {
        const deadlineDate = new Date(parsedResult.deadline);
        if (!isNaN(deadlineDate.getTime())) {
          updateData.deadline = parsedResult.deadline;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('bids')
          .update(updateData)
          .eq('id', id);
        
        console.log(`[格式化] 完成: ${bid.title.substring(0, 30)}...`);
      }

    } catch (error: any) {
      console.error(`[格式化] 失败 ID ${id}:`, error.message);
    }
  }

  console.log(`[格式化] 后台格式化完成`);
}

/**
 * 从内容中提取联系人和电话等信息
 */
function extractInfo(content: string): any {
  const result: any = {};

  // 提取联系人
  const contactPersonMatch = content.match(/联系人[：:]\s*([^\s\n]+(?:先生|女士|工|经理|主任|长)?)/);
  if (contactPersonMatch) {
    result.contact_person = contactPersonMatch[1].trim();
  }

  // 提取联系电话
  const phoneMatch = content.match(/联系电话[：:]\s*([\d\-]+)/);
  if (phoneMatch) {
    result.contact_phone = phoneMatch[1].trim();
  }

  // 提取预算金额
  const budgetMatch = content.match(/预算金额[：:（(元）)]*\s*(\d+(?:\.\d+)?)\s*(万元|元)?/);
  if (budgetMatch) {
    const num = parseFloat(budgetMatch[1]);
    const unit = budgetMatch[2];
    result.budget = unit === '万元' ? num * 10000 : num;
  }

  // 提取截止时间
  const deadlineMatch = content.match(/截止时间[：:]\s*(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})日?(?:\s*(\d{1,2})[：:时](\d{2})分?)?/);
  if (deadlineMatch) {
    const year = deadlineMatch[1];
    const month = deadlineMatch[2].padStart(2, '0');
    const day = deadlineMatch[3].padStart(2, '0');
    const hour = (deadlineMatch[4] || '09').padStart(2, '0');
    const minute = (deadlineMatch[5] || '00').padStart(2, '0');
    result.deadline = `${year}-${month}-${day} ${hour}:${minute}:00`;
  }

  // 提取项目编号
  const projectCodeMatch = content.match(/项目编号[：:]\s*([^\s\n]+)/);
  if (projectCodeMatch) {
    result.project_code = projectCodeMatch[1].trim();
  }

  // 提取城市
  const cityMatch = content.match(/地址[：:][^省]*省([^\s市]+市)/);
  if (cityMatch) {
    result.city = cityMatch[1].trim();
  }

  // 提取采购人名称
  const purchaserMatch = content.match(/采购人[信息]*[名称]*[：:]\s*([^\n]+)/);
  if (purchaserMatch) {
    result.purchaser_name = purchaserMatch[1].trim();
  }

  // 提取代理机构名称
  const agencyMatch = content.match(/代理机构[信息]*[名称]*[：:]\s*([^\n]+)/);
  if (agencyMatch) {
    result.agency_name = agencyMatch[1].trim();
  }

  // 提取代理机构电话
  const agencyPhoneMatch = content.match(/代理机构[^电]*电话[：:]\s*([\d\-]+)/);
  if (agencyPhoneMatch) {
    result.agency_phone = agencyPhoneMatch[1].trim();
  }

  return result;
}

/**
 * POST /api/v1/csv-import/extract-contacts
 * 批量从 content 中提取联系人和电话（用于处理已有数据）
 */
router.post('/extract-contacts', async (req: Request, res: Response) => {
  try {
    const { limit = 100 } = req.body;
    const supabase = getSupabaseClient();

    console.log(`[联系人提取] 开始处理，限制 ${limit} 条`);

    // 查询缺少联系人的数据
    const { data: bids, error: queryError } = await supabase
      .from('bids')
      .select('id, title, content')
      .or('contact_person.is.null,contact_phone.is.null')
      .not('content', 'is', null)
      .limit(limit);

    if (queryError) {
      return res.status(500).json({ success: false, error: queryError.message });
    }

    if (!bids || bids.length === 0) {
      return res.json({ success: true, message: '没有需要处理的数据' });
    }

    console.log(`[联系人提取] 找到 ${bids.length} 条数据`);

    const results = {
      total: bids.length,
      updated: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const bid of bids) {
      try {
        const extracted = extractInfo(bid.content || '');

        if (extracted.contact_person || extracted.contact_phone || extracted.budget || extracted.deadline) {
          const updateData: any = {};
          if (extracted.contact_person) updateData.contact_person = extracted.contact_person;
          if (extracted.contact_phone) updateData.contact_phone = extracted.contact_phone;
          if (extracted.budget) updateData.budget = extracted.budget;
          if (extracted.deadline) updateData.deadline = extracted.deadline;

          const { error: updateError } = await supabase
            .from('bids')
            .update(updateData)
            .eq('id', bid.id);

          if (updateError) {
            results.failed++;
            results.errors.push(`更新失败: ${bid.title.substring(0, 30)}`);
          } else {
            results.updated++;
            console.log(`[联系人提取] 更新成功: ${bid.title.substring(0, 40)}...`);
          }
        } else {
          results.failed++;
        }

      } catch (error: any) {
        results.failed++;
        results.errors.push(`处理失败: ${error.message}`);
      }
    }

    console.log(`[联系人提取] 完成: 更新=${results.updated}, 失败=${results.failed}`);

    return res.json({
      success: true,
      data: results
    });

  } catch (error: any) {
    console.error('[联系人提取] 接口错误:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 解析预算金额
 */
function parseBudget(value: any): number | null {
  if (!value) return null;
  
  if (typeof value === 'number') return value;
  
  const str = String(value);
  const match = str.match(/(\d+\.?\d*)\s*(万元|元|万)?/);
  
  if (match) {
    const num = parseFloat(match[1]);
    const unit = match[2];
    
    if (unit === '万元' || unit === '万') {
      return num * 10000;
    }
    return num;
  }
  
  return null;
}

/**
 * 解析日期
 */
function parseDate(value: any): Date | null {
  if (!value) return null;
  
  if (value instanceof Date) return value;
  
  const str = String(value).trim();
  
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
    /^(\d{4})\/(\d{2})\/(\d{2})$/
  ];
  
  for (const format of formats) {
    const match = str.match(format);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const day = parseInt(match[3]);
      return new Date(year, month, day);
    }
  }
  
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return null;
}

export default router;
