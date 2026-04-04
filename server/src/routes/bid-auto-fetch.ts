/**
 * 自动采集招标信息接口
 * 
 * 完整流程：
 * 1. 使用SearchClient搜索招标信息
 * 2. 使用FetchClient获取详情页内容
 * 3. 使用LLMClient（豆包）提取结构化数据
 * 4. 调用入库接口保存数据
 */

import { Router } from 'express';
import { SearchClient, FetchClient, LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client.js';

const router = Router();

// 招标数据提取Prompt
const EXTRACT_BID_INFO_PROMPT = `你是一个招标信息提取专家。请从以下网页内容中提取招标信息，以JSON格式返回。

【必须提取的字段】
- type: 公告类型（招标公告/中标公告/采购意向/变更公告/废标公告）
- title: 项目名称
- area: 地区（省市，如"吉林省长春市"）
- publish_time: 发布时间（格式：YYYY-MM-DD）
- content: 项目概况（至少50字，包含项目内容、数量、技术要求等）
- contact_person: 联系人姓名
- contact_phone: 联系电话

【可选字段】
- budget: 预算金额（数字，单位万元）
- deadline: 报名截止时间

【注意事项】
1. 如果找不到某个字段，设为null
2. contact_person和contact_phone是必填项，必须在正文中找到
3. 如果无法提取到联系人和电话，返回null表示该数据无效
4. 只返回JSON，不要有其他说明文字

【网页内容】
`;

/**
 * POST /api/v1/bid-auto-fetch
 * 自动采集招标信息
 * 
 * Body:
 * - keyword: 搜索关键词（如"吉林省政府采购 招标公告"）
 * - count: 搜索数量（默认5，最多10）
 * - timeRange: 时间范围（1d/1w/1m，默认1w）
 */
router.post('/', async (req, res) => {
  const { keyword, count = 5, timeRange = '1w' } = req.body;
  
  if (!keyword) {
    return res.status(400).json({
      success: false,
      error: '请提供搜索关键词',
    });
  }
  
  const actualCount = Math.min(count, 10);
  const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
  const config = new Config();
  
  const results: Array<{
    url: string;
    title: string;
    status: 'success' | 'failed' | 'skipped';
    message?: string;
    data?: Record<string, unknown>;
  }> = [];
  
  try {
    console.log(`[自动采集] 开始搜索: ${keyword}, 数量: ${actualCount}`);
    
    // Step 1: 搜索招标信息
    const searchClient = new SearchClient(config, customHeaders);
    const searchResponse = await searchClient.advancedSearch(keyword, {
      searchType: 'web',
      count: actualCount,
      timeRange,
      needContent: false,
    });
    
    if (!searchResponse.web_items || searchResponse.web_items.length === 0) {
      return res.json({
        success: true,
        message: '未找到相关招标信息',
        results: [],
      });
    }
    
    console.log(`[自动采集] 找到 ${searchResponse.web_items.length} 条搜索结果`);
    
    // Step 2: 逐个获取详情并提取数据
    const fetchClient = new FetchClient(config, customHeaders);
    const llmClient = new LLMClient(config, customHeaders);
    
    for (const item of searchResponse.web_items) {
      if (!item.url) {
        results.push({
          url: '',
          title: item.title || '未知标题',
          status: 'skipped',
          message: '无有效URL',
        });
        continue;
      }
      
      try {
        console.log(`[自动采集] 获取详情: ${item.url}`);
        
        // 获取详情页内容
        const fetchResponse = await fetchClient.fetch(item.url);
        
        if (fetchResponse.status_code !== 0) {
          results.push({
            url: item.url,
            title: item.title || fetchResponse.title || '未知标题',
            status: 'failed',
            message: `获取详情失败: ${fetchResponse.status_message}`,
          });
          continue;
        }
        
        // 提取文本内容
        const textContent = fetchResponse.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join('\n');
        
        if (textContent.length < 100) {
          results.push({
            url: item.url,
            title: fetchResponse.title || item.title || '未知标题',
            status: 'skipped',
            message: '内容太短，无法提取有效信息',
          });
          continue;
        }
        
        // 使用大模型提取结构化数据
        console.log(`[自动采集] 提取数据: ${item.title}`);
        const extractPrompt = EXTRACT_BID_INFO_PROMPT + `\n标题: ${fetchResponse.title || item.title}\n\n${textContent.substring(0, 8000)}`;
        
        const llmResponse = await llmClient.invoke(
          [{ role: 'user', content: extractPrompt }],
          { model: 'doubao-seed-2-0-lite-260215', temperature: 0.3 }
        );
        
        // 解析JSON响应
        let extractedData: Record<string, unknown> | null = null;
        try {
          // 尝试提取JSON
          const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.error('[自动采集] JSON解析失败:', parseError);
          results.push({
            url: item.url,
            title: fetchResponse.title || item.title || '未知标题',
            status: 'failed',
            message: '数据提取失败：无法解析JSON',
          });
          continue;
        }
        
        if (!extractedData) {
          results.push({
            url: item.url,
            title: fetchResponse.title || item.title || '未知标题',
            status: 'failed',
            message: '数据提取失败：未返回有效JSON',
          });
          continue;
        }
        
        // 验证必填字段
        if (!extractedData.contact_person || !extractedData.contact_phone) {
          results.push({
            url: item.url,
            title: extractedData.title as string || fetchResponse.title || '未知标题',
            status: 'skipped',
            message: '缺少联系人或电话，不入库',
            data: extractedData,
          });
          continue;
        }
        
        // 入库
        const supabase = getSupabaseClient();
        const dbRecord = {
          title: extractedData.title as string,
          content: extractedData.content as string,
          province: (extractedData.area as string)?.split('省')[0] + '省' || '',
          city: (extractedData.area as string)?.split('省')[1]?.trim() || '',
          bid_type: (extractedData.type as string) || '招标公告',
          publish_date: extractedData.publish_time as string || new Date().toISOString().split('T')[0],
          source_url: item.url,
          source: fetchResponse.title || item.site_name || '自动采集',
          contact_person: extractedData.contact_person as string,
          contact_phone: extractedData.contact_phone as string,
          budget: extractedData.budget as number || null,
          deadline: extractedData.deadline as string || null,
          data_type: '招标公告',
        };
        
        const { error: insertError } = await supabase
          .from('bids')
          .insert(dbRecord);
        
        if (insertError) {
          console.error('[自动采集] 入库失败:', insertError);
          results.push({
            url: item.url,
            title: dbRecord.title,
            status: 'failed',
            message: `入库失败: ${insertError.message}`,
            data: extractedData,
          });
        } else {
          console.log(`[自动采集] 入库成功: ${dbRecord.title}`);
          results.push({
            url: item.url,
            title: dbRecord.title,
            status: 'success',
            message: '入库成功',
            data: extractedData,
          });
        }
        
        // 延迟，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (err) {
        console.error(`[自动采集] 处理失败: ${item.url}`, err);
        results.push({
          url: item.url,
          title: item.title || '未知标题',
          status: 'failed',
          message: `处理异常: ${err instanceof Error ? err.message : '未知错误'}`,
        });
      }
    }
    
    // 统计结果
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    
    res.json({
      success: true,
      message: `采集完成: 成功${successCount}条, 失败${failedCount}条, 跳过${skippedCount}条`,
      summary: { successCount, failedCount, skippedCount, total: results.length },
      results,
    });
    
  } catch (error) {
    console.error('[自动采集] 执行失败:', error);
    res.status(500).json({
      success: false,
      error: `采集失败: ${error instanceof Error ? error.message : '未知错误'}`,
      results,
    });
  }
});

/**
 * GET /api/v1/bid-auto-fetch/search
 * 仅搜索，不入库（用于测试）
 */
router.get('/search', async (req, res) => {
  const { keyword, count = 5, timeRange = '1w' } = req.query;
  
  if (!keyword) {
    return res.status(400).json({
      success: false,
      error: '请提供搜索关键词',
    });
  }
  
  try {
    const config = new Config();
    const searchClient = new SearchClient(config);
    
    const response = await searchClient.advancedSearch(keyword as string, {
      searchType: 'web',
      count: Math.min(Number(count), 10),
      timeRange: timeRange as string,
    });
    
    res.json({
      success: true,
      count: response.web_items?.length || 0,
      results: response.web_items?.map(item => ({
        title: item.title,
        url: item.url,
        site: item.site_name,
        snippet: item.snippet?.substring(0, 200),
        publishTime: item.publish_time,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `搜索失败: ${error instanceof Error ? error.message : '未知错误'}`,
    });
  }
});

export default router;
