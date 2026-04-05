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
 * 格式化招标公告内容
 * POST /api/v1/format-bid/:id
 * 
 * 流程：
 * 1. 获取指定ID的招标公告
 * 2. 调用豆包大模型格式化内容
 * 3. 更新数据库
 * 4. 返回格式化后的结果
 */
router.post('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();
    const llm = getLLMClient();

    // 1. 获取数据
    const { data: bid, error: fetchError } = await supabase
      .from('bids')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !bid) {
      return res.status(404).json({
        success: false,
        error: '未找到该招标公告'
      });
    }

    console.log(`[格式化] 开始处理: ${bid.title}`);

    // 2. 调用豆包大模型格式化
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
  "project_name": "项目名称",
  "purchaser": "采购人",
  "budget": "预算金额（数字，单位元）",
  "contact_person": "联系人",
  "contact_phone": "联系电话",
  "deadline": "投标截止时间",
  "project_code": "项目编号"
}`
      }
    ];

    console.log('[格式化] 调用豆包大模型...');
    
    const response = await llm.invoke(messages, {
      model: 'doubao-seed-1-6-lite-251015',
      temperature: 0.3
    });
    
    const formatResult = response.content;
    
    // 解析返回结果
    let parsedResult: any = {};
    try {
      // 尝试提取JSON
      const jsonMatch = formatResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('[格式化] JSON解析失败，使用原始内容');
      parsedResult.formatted_content = formatResult;
    }

    // 3. 更新数据库
    const updateData: any = {
      formatted_content: parsedResult.formatted_content || bid.content,
      updated_at: new Date()
    };

    // 更新提取的字段（如果存在且原字段为空）
    if (parsedResult.purchaser && !bid.purchaser_name) {
      updateData.purchaser_name = parsedResult.purchaser;
    }
    if (parsedResult.budget && !bid.budget) {
      const budgetNum = parseFloat(parsedResult.budget);
      if (!isNaN(budgetNum)) {
        updateData.budget = budgetNum;
      }
    }
    if (parsedResult.contact_person && !bid.contact_person) {
      updateData.contact_person = parsedResult.contact_person;
    }
    if (parsedResult.contact_phone && !bid.contact_phone) {
      updateData.contact_phone = parsedResult.contact_phone;
    }
    if (parsedResult.deadline && !bid.deadline) {
      // 验证时间格式
      const deadline = parsedResult.deadline;
      if (deadline && deadline !== '未提及' && !deadline.includes('未')) {
        // 尝试解析日期
        const dateMatch = deadline.match(/(\d{4})[-年](\d{1,2})[-月](\d{1,2})/);
        if (dateMatch) {
          updateData.deadline = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
        }
      }
    }
    if (parsedResult.project_code && !bid.project_code) {
      updateData.project_code = parsedResult.project_code;
    }

    const { error: updateError } = await supabase
      .from('bids')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('[格式化] 更新失败:', updateError);
      return res.status(500).json({
        success: false,
        error: '更新数据库失败'
      });
    }

    console.log(`[格式化] 完成: ${bid.title}`);

    // 4. 返回结果
    return res.json({
      success: true,
      data: {
        id: bid.id,
        title: bid.title,
        original_content: bid.content?.substring(0, 500) + '...',
        formatted_content: updateData.formatted_content,
        extracted: {
          purchaser: updateData.purchaser_name,
          budget: updateData.budget,
          contact_person: updateData.contact_person,
          contact_phone: updateData.contact_phone,
          deadline: updateData.deadline,
          project_code: updateData.project_code
        }
      }
    });

  } catch (error: any) {
    console.error('[格式化] 错误:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 批量格式化最近的招标公告
 * POST /api/v1/format-bid/recent/:count
 */
router.post('/recent/:count', async (req: Request, res: Response) => {
  try {
    const count = parseInt(req.params.count) || 5;
    const supabase = getSupabaseClient();

    // 获取最近的数据（未格式化的）
    const { data: bids, error: fetchError } = await supabase
      .from('bids')
      .select('id, title')
      .is('formatted_content', null)
      .order('created_at', { ascending: false })
      .limit(count);

    if (fetchError || !bids || bids.length === 0) {
      return res.json({
        success: true,
        data: {
          total: 0,
          formatted: 0,
          message: '没有需要格式化的数据'
        }
      });
    }

    // 逐个格式化
    const results = [];
    for (const bid of bids) {
      try {
        // 直接调用格式化函数而不是通过HTTP请求
        const { data, error } = await supabase
          .from('bids')
          .select('*')
          .eq('id', bid.id)
          .single();

        if (error || !data) {
          results.push({
            id: bid.id,
            title: bid.title,
            success: false,
            error: '获取数据失败'
          });
          continue;
        }

        const llm = getLLMClient();
        const messages = [
          {
            role: 'system' as const,
            content: '你是一个专业的招标公告格式化助手。'
          },
          {
            role: 'user' as const,
            content: `格式化以下招标公告，提取关键信息（项目名称、采购人、预算、联系人、电话、截止时间），返回JSON格式：
{"formatted_content":"格式化内容","project_name":"","purchaser":"","budget":"","contact_person":"","contact_phone":"","deadline":""}

标题：${data.title}
内容：${data.content?.substring(0, 5000)}`
          }
        ];

        const response = await llm.invoke(messages, {
          model: 'doubao-seed-1-6-lite-251015',
          temperature: 0.3
        });

        let parsed: any = {};
        try {
          const jsonMatch = response.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        } catch (e) {
          parsed.formatted_content = response.content;
        }

        await supabase
          .from('bids')
          .update({
            formatted_content: parsed.formatted_content || data.content,
            contact_person: parsed.contact_person || data.contact_person,
            contact_phone: parsed.contact_phone || data.contact_phone,
            updated_at: new Date()
          })
          .eq('id', bid.id);

        results.push({
          id: bid.id,
          title: bid.title,
          success: true
        });

      } catch (e: any) {
        results.push({
          id: bid.id,
          title: bid.title,
          success: false,
          error: e.message
        });
      }
    }

    return res.json({
      success: true,
      data: {
        total: bids.length,
        formatted: results.filter(r => r.success).length,
        results
      }
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
