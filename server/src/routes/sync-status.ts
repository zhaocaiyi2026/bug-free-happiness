/**
 * 数据同步状态路由
 * 
 * 供豆包等数据提供者更新同步进度
 * 
 * 工作流程：
 * 1. 豆包推送数据
 * 2. 我进行分析，检查是否符合入库要求（联系人、电话、详情页、地址、项目信息等）
 * 3. 确认好后 → 发送给豆包大模型进行格式化处理
 * 4. 豆包大模型格式化处理完成 → 回传给我
 * 5. 我存入数据库并展示在前端
 */

import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client.js';
import {
  reviewPushedData,
  formatBidData,
  formatWinBidData,
  isServiceAvailable as isProcessorAvailable,
  extractContactInfo,
  type PushedBidData,
} from '@/services/push-data-processor.js';

const router = Router();

/**
 * POST /api/v1/sync-status/update
 * 豆包调用此接口更新同步状态
 * 
 * Body:
 * - province: 省份名称（如"吉林省"）
 * - totalCount: 该省份数据总数（可选，如果知道）
 * - syncedCount: 已同步数量
 * - lastSyncId: 最后一条同步的数据ID（可选）
 * - status: 状态 - pending/in_progress/completed/failed
 * - message: 备注信息（可选）
 */
router.post('/update', async (req, res) => {
  try {
    const { province, totalCount, syncedCount, lastSyncId, status, message } = req.body;
    
    if (!province) {
      return res.status(400).json({
        success: false,
        error: '缺少省份参数',
      });
    }
    
    const supabase = getSupabaseClient();
    
    // 使用 upsert 更新或插入记录
    const updateData: Record<string, unknown> = {
      provider: 'doubao',
      province,
      status: status || 'in_progress',
      last_sync_time: new Date().toISOString(),
    };
    
    if (totalCount !== undefined) updateData.total_count = totalCount;
    if (syncedCount !== undefined) updateData.synced_count = syncedCount;
    if (lastSyncId !== undefined) updateData.last_sync_id = lastSyncId;
    if (message !== undefined) updateData.message = message;
    
    const { data, error } = await supabase
      .from('sync_status')
      .upsert(updateData, { onConflict: 'provider,province' })
      .select()
      .single();
    
    if (error) {
      console.error('[同步状态] 更新失败:', error);
      return res.status(500).json({
        success: false,
        error: '更新失败',
        details: error.message,
      });
    }
    
    console.log(`[同步状态] 更新成功: ${province} - ${status} - 已同步${syncedCount || 0}条`);
    
    res.json({
      success: true,
      message: '状态更新成功',
      data,
    });
    
  } catch (error) {
    console.error('[同步状态] 处理异常:', error);
    res.status(500).json({
      success: false,
      error: '处理异常',
      details: String(error),
    });
  }
});

/**
 * GET /api/v1/sync-status/list
 * 查询所有同步状态
 */
router.get('/list', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: '查询失败',
        details: error.message,
      });
    }
    
    res.json({
      success: true,
      count: data?.length || 0,
      data,
    });
    
  } catch (error) {
    console.error('[同步状态] 查询异常:', error);
    res.status(500).json({
      success: false,
      error: '查询异常',
      details: String(error),
    });
  }
});

/**
 * GET /api/v1/sync-status/province/:name
 * 查询指定省份的同步状态
 */
router.get('/province/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .eq('provider', 'doubao')
      .eq('province', name)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.json({
          success: true,
          exists: false,
          message: `未找到${name}的同步记录`,
        });
      }
      return res.status(500).json({
        success: false,
        error: '查询失败',
        details: error.message,
      });
    }
    
    res.json({
      success: true,
      exists: true,
      data,
    });
    
  } catch (error) {
    console.error('[同步状态] 查询异常:', error);
    res.status(500).json({
      success: false,
      error: '查询异常',
      details: String(error),
    });
  }
});

/**
 * POST /api/v1/sync-status/heartbeat
 * 豆包心跳接口，表示还在工作中
 * 
 * Body:
 * - province: 省份名称
 * - message: 可选的消息
 */
router.post('/heartbeat', async (req, res) => {
  try {
    const { province, message } = req.body;
    
    if (!province) {
      return res.status(400).json({
        success: false,
        error: '缺少省份参数',
      });
    }
    
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('sync_status')
      .upsert({
        provider: 'doubao',
        province,
        status: 'in_progress',
        last_sync_time: new Date().toISOString(),
        message: message || '采集中...',
      }, { onConflict: 'provider,province' })
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: '心跳更新失败',
        details: error.message,
      });
    }
    
    res.json({
      success: true,
      message: '心跳已记录',
      timestamp: data.last_sync_time,
    });
    
  } catch (error) {
    console.error('[同步状态] 心跳异常:', error);
    res.status(500).json({
      success: false,
      error: '心跳异常',
      details: String(error),
    });
  }
});

/**
 * POST /api/v1/sync-status/push-bid
 * 豆包实时推送单条招标数据
 * 
 * 豆包每采集到一条数据，调用此接口进行审核入库
 * 实现：豆包推送一条 → 审核一条 → 前端展示一条
 * 
 * Body:
 * - bidData: 招标数据对象
 * - province: 省份名称（用于更新同步状态）
 */
router.post('/push-bid', async (req, res) => {
  try {
    const { bidData, province } = req.body;
    
    if (!bidData) {
      return res.status(400).json({
        success: false,
        error: '缺少招标数据',
      });
    }
    
    console.log(`[实时推送] 收到招标数据: ${bidData.title || '未知标题'}`);
    
    const supabase = getSupabaseClient();
    
    // ========== 数据审核 ==========
    const reviewResult = {
      passed: true,
      reason: '',
    };
    
    // 1. 必须有标题和来源URL
    if (!bidData.title || !bidData.sourceUrl) {
      reviewResult.passed = false;
      reviewResult.reason = '缺少标题或来源URL';
    }
    
    // 2. 必须有联系人或电话
    if (reviewResult.passed && !bidData.contactPerson && !bidData.contactPhone) {
      reviewResult.passed = false;
      reviewResult.reason = '缺少联系信息（联系人和电话都为空）';
    }
    
    // 3. 必须有完整正文（至少500字符）
    const contentStr = typeof bidData.content === 'string' ? bidData.content : '';
    if (reviewResult.passed && (!bidData.content || contentStr.length < 500)) {
      reviewResult.passed = false;
      reviewResult.reason = `正文内容不完整（仅${contentStr.length}字符，需至少500字符）`;
    }
    
    if (!reviewResult.passed) {
      console.log(`[实时推送] 审核不通过: ${reviewResult.reason}`);
      return res.json({
        success: false,
        action: 'rejected',
        reason: reviewResult.reason,
        title: bidData.title,
      });
    }
    
    // ========== 去重检查 ==========
    let isDuplicate = false;
    let duplicateReason = '';
    
    // 1. 根据sourceUrl去重
    const { data: existingByUrl } = await supabase
      .from('bids')
      .select('id, title')
      .eq('source_url', bidData.sourceUrl)
      .maybeSingle();
    
    if (existingByUrl) {
      isDuplicate = true;
      duplicateReason = 'URL已存在';
    }
    
    // 2. 根据项目编号去重
    if (!isDuplicate && bidData.projectNumber) {
      const { data: existingByCode } = await supabase
        .from('bids')
        .select('id, title')
        .eq('project_code', bidData.projectNumber)
        .maybeSingle();
      
      if (existingByCode) {
        isDuplicate = true;
        duplicateReason = '项目编号已存在';
      }
    }
    
    // 3. 根据标题模糊匹配去重
    if (!isDuplicate && bidData.title) {
      const titleKeywords = (bidData.title as string).substring(0, 30);
      const { data: existingByTitle } = await supabase
        .from('bids')
        .select('id, title')
        .ilike('title', `%${titleKeywords}%`)
        .limit(5);
      
      if (existingByTitle && existingByTitle.length > 0) {
        isDuplicate = true;
        duplicateReason = '标题相似数据已存在';
      }
    }
    
    if (isDuplicate) {
      console.log(`[实时推送] 去重跳过: ${duplicateReason}`);
      return res.json({
        success: false,
        action: 'duplicate',
        reason: duplicateReason,
        title: bidData.title,
      });
    }
    
    // ========== 入库保存 ==========
    const insertData = {
      title: bidData.title,
      project_code: bidData.projectNumber || null,
      budget: bidData.budget || null,
      province: bidData.province || province || '未知',
      city: bidData.city || null,
      industry: bidData.industry || null,
      bid_type: bidData.bidType || '招标公告',
      publish_date: bidData.publishDate || null,
      deadline: bidData.deadline || null,
      contact_person: bidData.contactPerson || null,
      contact_phone: bidData.contactPhone || null,
      source_url: bidData.sourceUrl,
      content: bidData.content,
      formatted_content: null, // 后续按需格式化
      source_platform: bidData.sourcePlatform || '豆包采集',
    };
    
    const { data: savedBid, error: saveError } = await supabase
      .from('bids')
      .insert(insertData)
      .select()
      .single();
    
    if (saveError) {
      console.error('[实时推送] 入库失败:', saveError);
      return res.status(500).json({
        success: false,
        action: 'error',
        reason: '入库失败',
        details: saveError.message,
        title: bidData.title,
      });
    }
    
    console.log(`[实时推送] 入库成功: ID=${savedBid.id}, 标题=${savedBid.title}`);
    
    // ========== 更新同步状态 ==========
    if (province) {
      await supabase
        .from('sync_status')
        .upsert({
          provider: 'doubao',
          province,
          status: 'in_progress',
          last_sync_time: new Date().toISOString(),
          last_sync_id: savedBid.id,
        }, { onConflict: 'provider,province' });
    }
    
    // 返回成功结果
    res.json({
      success: true,
      action: 'saved',
      data: {
        id: savedBid.id,
        title: savedBid.title,
        province: savedBid.province,
        city: savedBid.city,
        bidType: savedBid.bid_type,
        publishDate: savedBid.publish_date,
      },
    });
    
  } catch (error) {
    console.error('[实时推送] 处理异常:', error);
    res.status(500).json({
      success: false,
      error: '处理异常',
      details: String(error),
    });
  }
});

/**
 * POST /api/v1/sync-status/push-winbid
 * 豆包实时推送单条中标数据
 * 
 * Body:
 * - winbidData: 中标数据对象
 * - province: 省份名称
 */
router.post('/push-winbid', async (req, res) => {
  try {
    const { winbidData, province } = req.body;
    
    if (!winbidData) {
      return res.status(400).json({
        success: false,
        error: '缺少中标数据',
      });
    }
    
    console.log(`[实时推送] 收到中标数据: ${winbidData.title || '未知标题'}`);
    
    const supabase = getSupabaseClient();
    
    // ========== 数据审核 ==========
    const reviewResult = {
      passed: true,
      reason: '',
    };
    
    // 1. 必须有标题和来源URL
    if (!winbidData.title || !winbidData.sourceUrl) {
      reviewResult.passed = false;
      reviewResult.reason = '缺少标题或来源URL';
    }
    
    // 2. 必须有中标单位
    if (reviewResult.passed && !winbidData.winner) {
      reviewResult.passed = false;
      reviewResult.reason = '缺少中标单位';
    }
    
    // 3. 必须有完整正文
    const contentStr = typeof winbidData.content === 'string' ? winbidData.content : '';
    if (reviewResult.passed && (!winbidData.content || contentStr.length < 300)) {
      reviewResult.passed = false;
      reviewResult.reason = `正文内容不完整（仅${contentStr.length}字符）`;
    }
    
    if (!reviewResult.passed) {
      console.log(`[实时推送] 审核不通过: ${reviewResult.reason}`);
      return res.json({
        success: false,
        action: 'rejected',
        reason: reviewResult.reason,
        title: winbidData.title,
      });
    }
    
    // ========== 去重检查 ==========
    let isDuplicate = false;
    let duplicateReason = '';
    
    // 根据sourceUrl去重
    const { data: existingByUrl } = await supabase
      .from('win_bids')
      .select('id, title')
      .eq('source_url', winbidData.sourceUrl)
      .maybeSingle();
    
    if (existingByUrl) {
      isDuplicate = true;
      duplicateReason = 'URL已存在';
    }
    
    // 根据项目编号去重（使用source_id字段）
    if (!isDuplicate && winbidData.projectNumber) {
      const { data: existingByCode } = await supabase
        .from('win_bids')
        .select('id, title')
        .eq('source_id', winbidData.projectNumber)
        .maybeSingle();
      
      if (existingByCode) {
        isDuplicate = true;
        duplicateReason = '项目编号已存在';
      }
    }
    
    if (isDuplicate) {
      console.log(`[实时推送] 去重跳过: ${duplicateReason}`);
      return res.json({
        success: false,
        action: 'duplicate',
        reason: duplicateReason,
        title: winbidData.title,
      });
    }
    
    // ========== 入库保存 ==========
    // win_bids表字段：win_company(中标单位), win_company_address, win_company_phone, project_location, win_date
    const insertData = {
      title: winbidData.title,
      source_id: winbidData.projectNumber || null,
      win_company: winbidData.winner,
      win_amount: winbidData.winAmount || null,
      province: winbidData.province || province || '未知',
      city: winbidData.city || null,
      industry: winbidData.industry || null,
      publish_date: winbidData.publishDate || null,
      win_date: winbidData.winDate || null,
      project_location: winbidData.projectLocation || null,
      win_company_address: winbidData.winnerAddress || null,
      win_company_phone: winbidData.winnerPhone || null,
      source_url: winbidData.sourceUrl,
      content: winbidData.content,
      formatted_content: null,
      source_platform: winbidData.sourcePlatform || '豆包采集',
    };
    
    const { data: savedWinbid, error: saveError } = await supabase
      .from('win_bids')
      .insert(insertData)
      .select()
      .single();
    
    if (saveError) {
      console.error('[实时推送] 入库失败:', saveError);
      return res.status(500).json({
        success: false,
        action: 'error',
        reason: '入库失败',
        details: saveError.message,
        title: winbidData.title,
      });
    }
    
    console.log(`[实时推送] 中标入库成功: ID=${savedWinbid.id}, 标题=${savedWinbid.title}`);
    
    // 更新同步状态
    if (province) {
      await supabase
        .from('sync_status')
        .upsert({
          provider: 'doubao',
          province,
          status: 'in_progress',
          last_sync_time: new Date().toISOString(),
          last_sync_id: savedWinbid.id,
        }, { onConflict: 'provider,province' });
    }
    
    res.json({
      success: true,
      action: 'saved',
      data: {
        id: savedWinbid.id,
        title: savedWinbid.title,
        winner: savedWinbid.winner,
        province: savedWinbid.province,
        city: savedWinbid.city,
        publishDate: savedWinbid.publish_date,
      },
    });
    
  } catch (error) {
    console.error('[实时推送] 处理异常:', error);
    res.status(500).json({
      success: false,
      error: '处理异常',
      details: String(error),
    });
  }
});

/**
 * POST /api/v1/sync-status/complete
 * 豆包完成采集后调用此接口标记完成
 * 
 * Body:
 * - province: 省份名称
 * - totalCount: 总共采集数量
 * - savedCount: 成功入库数量
 */
router.post('/complete', async (req, res) => {
  try {
    const { province, totalCount, savedCount, message } = req.body;
    
    if (!province) {
      return res.status(400).json({
        success: false,
        error: '缺少省份参数',
      });
    }
    
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('sync_status')
      .upsert({
        provider: 'doubao',
        province,
        status: 'completed',
        total_count: totalCount || 0,
        synced_count: savedCount || 0,
        last_sync_time: new Date().toISOString(),
        message: message || '采集完成',
      }, { onConflict: 'provider,province' })
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: '状态更新失败',
        details: error.message,
      });
    }
    
    console.log(`[同步完成] ${province}: 共采集${totalCount || 0}条, 成功入库${savedCount || 0}条`);
    
    res.json({
      success: true,
      message: '采集完成状态已更新',
      data,
    });
    
  } catch (error) {
    console.error('[同步完成] 处理异常:', error);
    res.status(500).json({
      success: false,
      error: '处理异常',
      details: String(error),
    });
  }
});

/**
 * POST /api/v1/sync-status/push
 * 豆包通用推送接口 - 接收所有类型的公告数据
 * 
 * 工作流程：
 * 1. 豆包推送数据
 * 2. 我进行分析，检查是否符合入库要求（联系人、电话、详情页、地址、项目信息等）
 * 3. 确认好后 → 发送给豆包大模型进行格式化处理
 * 4. 豆包大模型格式化处理完成 → 回传给我
 * 5. 我存入数据库并展示在前端
 * 
 * Body 格式：
 * {
 *   "type": "招标",
 *   "title": "XX项目公开招标公告",
 *   "area": "吉林省",
 *   "publish_time": "2026-04-04 12:00:00",
 *   "url": "https://xxx.gov.cn/xxx.html",
 *   "content": "公告正文摘要...",
 *   "source": "吉林政府采购网",
 *   "push_time": "2026-04-04 12:00:05"
 * }
 */
router.post('/push', async (req, res) => {
  try {
    const { type, title, area, publish_time, url, content, source, push_time } = req.body;
    
    // 构建推送数据对象
    const pushedData: PushedBidData = {
      type: type || '招标',
      title: title || '',
      area: area || '',
      publish_time: publish_time || '',
      url: url || '',
      content: content || '',
      source: source || '豆包采集',
      push_time: push_time || new Date().toISOString(),
    };
    
    console.log(`[通用推送] 收到数据: type=${pushedData.type}, title=${pushedData.title}`);
    
    // ========== 步骤1：数据审核 ==========
    console.log('[数据处理] 步骤1：开始数据审核...');
    const reviewResult = reviewPushedData(pushedData);
    
    // 审核失败：返回 400 错误，不入库，不更新状态表
    if (!reviewResult.passed) {
      console.log(`[数据处理] 审核不通过: ${reviewResult.reason}`);
      return res.status(400).json({
        success: false,
        action: 'rejected',
        reason: reviewResult.reason,
        missingFields: reviewResult.missingFields,
        title: pushedData.title,
      });
    }
    
    console.log('[数据处理] 审核通过 ✓');
    
    // ========== 步骤2：去重检查 ==========
    const supabase = getSupabaseClient();
    
    const { data: existingByUrl } = await supabase
      .from('bids')
      .select('id, title')
      .eq('source_url', pushedData.url)
      .maybeSingle();
    
    if (existingByUrl) {
      console.log(`[数据处理] 去重跳过: URL已存在`);
      return res.json({
        success: false,
        action: 'duplicate',
        reason: 'URL已存在',
        title: pushedData.title,
      });
    }
    
    // ========== 步骤3：调用豆包大模型格式化处理 ==========
    console.log('[数据处理] 步骤2：调用豆包大模型格式化处理...');
    
    let dataType = normalizeAnnouncementType(pushedData.type);
    if (dataType === '单一来源采购') {
      dataType = '单一来源公告';
    }
    
    // 判断是否属于中标数据类型
    const isWinBidType = (typeStr: string): boolean => {
      const winBidTypes = [
        '中标', '中标公告', '中标结果公告', '中标（成交）结果公告',
        '成交公告', '成交结果公告', '废标公告', '终止公告',
        '采购结果变更公告', '合同公告', '合同变更公告', '履约验收公告',
        '其它公告', '其他公告',
      ];
      return winBidTypes.includes(typeStr);
    };
    
    let formattedData: any = null;
    let formatError: string | null = null;
    
    // 检查格式化服务是否可用
    if (!isProcessorAvailable()) {
      console.warn('[数据处理] 格式化服务不可用，使用原始数据入库');
    } else {
      try {
        if (isWinBidType(dataType)) {
          // 中标数据
          formattedData = await formatWinBidData(pushedData, false);
        } else {
          // 招标数据
          formattedData = await formatBidData(pushedData, false);
        }
        
        if (formattedData) {
          console.log('[数据处理] 格式化完成 ✓');
        } else {
          formatError = '格式化返回空结果';
          console.warn(`[数据处理] 格式化失败: ${formatError}`);
        }
      } catch (err) {
        formatError = String(err);
        console.error(`[数据处理] 格式化异常: ${err}`);
      }
    }
    
    // ========== 步骤4：存入数据库 ==========
    console.log('[数据处理] 步骤3：存入数据库...');
    
    if (isWinBidType(dataType)) {
      // 辅助函数：确保时间戳字段有效（空字符串转为null）
      const safeTimestamp = (value: string | undefined | null): string | null => {
        if (!value || value.trim() === '') return null;
        return value;
      };
      
      // 存入 win_bids 表
      const insertData = formattedData ? {
        title: formattedData.title,
        source_url: formattedData.source_url,
        content: formattedData.content,
        formatted_content: formattedData.formatted_content,
        province: formattedData.province || pushedData.area,
        city: formattedData.city,
        source: formattedData.source_platform || pushedData.source,
        source_platform: formattedData.source_platform || pushedData.source,
        publish_date: safeTimestamp(formattedData.publish_date) || safeTimestamp(pushedData.publish_time),
        win_date: safeTimestamp(formattedData.win_date),
        bid_type: dataType,
        data_type: dataType,
        win_company: formattedData.win_company || '',
        win_amount: formattedData.win_amount,
        win_company_phone: formattedData.contact_phone,
      } : {
        // 格式化失败时的兜底数据
        title: pushedData.title,
        source_url: pushedData.url,
        content: pushedData.content,
        province: pushedData.area,
        source: pushedData.source,
        source_platform: pushedData.source,
        publish_date: safeTimestamp(pushedData.publish_time),
        bid_type: dataType,
        data_type: dataType,
        win_company: '',
      };
      
      const { data: savedData, error: saveError } = await supabase
        .from('win_bids')
        .insert(insertData)
        .select()
        .single();
      
      if (saveError) {
        console.error('[数据处理] 中标入库失败:', saveError);
        return res.status(500).json({
          success: false,
          action: 'error',
          reason: '入库失败',
          details: saveError.message,
          title: pushedData.title,
        });
      }
      
      console.log(`[数据处理] 中标入库成功: ID=${savedData.id}`);
      
      // 更新同步状态
      await updateSyncStatus(insertData.province || '吉林省', savedData.id);
      
      return res.json({
        success: true,
        action: 'saved',
        type: dataType,
        table: 'win_bids',
        formatted: !!formattedData,
        formatError,
        data: {
          id: savedData.id,
          title: savedData.title,
          province: savedData.province,
          announcement_type: dataType,
          contact_person: formattedData?.contact_person,
          contact_phone: formattedData?.contact_phone,
        },
      });
      
    } else {
      // 存入 bids 表（招标、变更、废标等）
      // 辅助函数：确保时间戳字段有效（空字符串转为null，无值时使用当前时间）
      const safeTimestamp = (value: string | undefined | null, useDefault = false): string | null => {
        if (!value || value.trim() === '') {
          // 如果需要默认值，返回当前时间
          return useDefault ? new Date().toISOString() : null;
        }
        return value;
      };
      
      const insertData = formattedData ? {
        title: formattedData.title,
        source_url: formattedData.source_url,
        content: formattedData.content,
        formatted_content: formattedData.formatted_content,
        province: formattedData.province || pushedData.area,
        city: formattedData.city,
        industry: formattedData.industry,
        source: formattedData.source_platform || pushedData.source,
        source_platform: formattedData.source_platform || pushedData.source,
        // 优先使用格式化后的日期，其次使用推送的发布时间，最后使用当前时间
        publish_date: safeTimestamp(formattedData.publish_date) || safeTimestamp(pushedData.publish_time) || new Date().toISOString(),
        deadline: safeTimestamp(formattedData.deadline),
        bid_type: getBidType(dataType),
        announcement_type: dataType,
        data_type: dataType,
        project_code: formattedData.project_code,
        budget: formattedData.budget,
        contact_person: formattedData.contact_person,
        contact_phone: formattedData.contact_phone,
        contact_address: formattedData.contact_address,
        requirements: formattedData.requirements,
      } : {
        // 格式化失败时的兜底数据（从content提取联系信息）
        title: pushedData.title,
        source_url: pushedData.url,
        content: pushedData.content,
        province: pushedData.area,
        source: pushedData.source,
        source_platform: pushedData.source,
        // 使用推送的发布时间，如果没有则使用当前时间
        publish_date: safeTimestamp(pushedData.publish_time) || new Date().toISOString(),
        bid_type: getBidType(dataType),
        announcement_type: dataType,
        data_type: dataType,
        contact_person: extractContactInfo(pushedData.content).contactPerson,
        contact_phone: extractContactInfo(pushedData.content).contactPhone,
      };
      
      const { data: savedData, error: saveError } = await supabase
        .from('bids')
        .insert(insertData)
        .select()
        .single();
      
      if (saveError) {
        console.error('[数据处理] 入库失败:', saveError);
        return res.status(500).json({
          success: false,
          action: 'error',
          reason: '入库失败',
          details: saveError.message,
          title: pushedData.title,
        });
      }
      
      console.log(`[数据处理] 入库成功: ID=${savedData.id}`);
      
      // 更新同步状态
      await updateSyncStatus(insertData.province || '吉林省', savedData.id);
      
      return res.json({
        success: true,
        action: 'saved',
        type: dataType,
        formatted: !!formattedData,
        formatError,
        data: {
          id: savedData.id,
          title: savedData.title,
          province: savedData.province,
          city: savedData.city,
          bid_type: savedData.bid_type,
          contact_person: savedData.contact_person,
          contact_phone: savedData.contact_phone,
          project_name: formattedData?.project_name,
          budget: formattedData?.budget,
        },
      });
    }
    
  } catch (error) {
    console.error('[通用推送] 处理异常:', error);
    res.status(500).json({
      success: false,
      error: '处理异常',
      details: String(error),
    });
  }
});

/**
 * 规范化公告类型名称
 * 1. 去掉金额等后缀（如"竞争性谈判290万元" -> "竞争性谈判"）
 * 2. 统一名称格式
 */
function normalizeAnnouncementType(typeName: string): string {
  if (!typeName) return '招标';
  
  let normalized = typeName.trim();
  
  // 去掉金额等后缀（如"竞争性谈判290万元"）
  normalized = normalized.replace(/[\d,.]+万元?$/i, '');
  normalized = normalized.replace(/[\d,.]+亿元?$/i, '');
  normalized = normalized.replace(/[\d,.]+元$/i, '');
  
  // 去掉多余的空格
  normalized = normalized.trim();
  
  return normalized || '招标';
}

/**
 * POST /api/v1/sync-status/fix-contact-info
 * 批量修复招标数据的联系信息
 * 从content字段中提取联系人和联系电话
 */
router.post('/fix-contact-info', async (req, res) => {
  try {
    const { limit = 100, dryRun = false } = req.body;
    
    const supabase = getSupabaseClient();
    
    // 查询缺少联系信息的数据
    const { data: bidsWithoutContact, error: queryError } = await supabase
      .from('bids')
      .select('id, title, content, contact_person, contact_phone')
      .or('contact_person.is.null,contact_phone.is.null')
      .not('content', 'is', null)
      .limit(limit);
    
    if (queryError) {
      return res.status(500).json({
        success: false,
        error: '查询失败',
        details: queryError.message,
      });
    }
    
    if (!bidsWithoutContact || bidsWithoutContact.length === 0) {
      return res.json({
        success: true,
        message: '没有需要修复的数据',
        fixedCount: 0,
      });
    }
    
    console.log(`[批量修复] 发现 ${bidsWithoutContact.length} 条需要修复的数据`);
    
    // 统计结果
    const results = {
      total: bidsWithoutContact.length,
      fixed: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{ id: number; title: string; action: string; contactPerson?: string; contactPhone?: string }>,
    };
    
    // 逐条处理
    for (const bid of bidsWithoutContact) {
      try {
        const { contactPerson, contactPhone } = extractContactInfo(bid.content || '');
        
        // 如果没有提取到任何联系信息，跳过
        if (!contactPerson && !contactPhone) {
          results.skipped++;
          results.details.push({
            id: bid.id,
            title: bid.title,
            action: 'skipped',
          });
          continue;
        }
        
        // 是否是模拟运行
        if (dryRun) {
          results.fixed++;
          results.details.push({
            id: bid.id,
            title: bid.title,
            action: 'would_fix',
            contactPerson,
            contactPhone,
          });
          continue;
        }
        
        // 更新数据库
        const updateData: Record<string, string | null> = {};
        if (contactPerson && !bid.contact_person) {
          updateData.contact_person = contactPerson;
        }
        if (contactPhone && !bid.contact_phone) {
          updateData.contact_phone = contactPhone;
        }
        
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('bids')
            .update(updateData)
            .eq('id', bid.id);
          
          if (updateError) {
            console.error(`[批量修复] 更新失败 ID=${bid.id}:`, updateError);
            results.errors++;
            results.details.push({
              id: bid.id,
              title: bid.title,
              action: 'error',
            });
          } else {
            results.fixed++;
            results.details.push({
              id: bid.id,
              title: bid.title,
              action: 'fixed',
              contactPerson,
              contactPhone,
            });
            console.log(`[批量修复] 成功 ID=${bid.id}: 联系人=${contactPerson}, 电话=${contactPhone}`);
          }
        } else {
          results.skipped++;
        }
      } catch (err) {
        console.error(`[批量修复] 处理异常 ID=${bid.id}:`, err);
        results.errors++;
      }
    }
    
    res.json({
      success: true,
      dryRun,
      ...results,
      details: results.details.slice(0, 20),  // 只返回前20条详情
    });
    
  } catch (error) {
    console.error('[批量修复] 处理异常:', error);
    res.status(500).json({
      success: false,
      error: '处理异常',
      details: String(error),
    });
  }
});

/**
 * 更新同步状态表
 * 每次成功入库后调用，更新 synced_count 和 last_sync_time
 */
async function updateSyncStatus(province: string, savedId: number): Promise<void> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  
  // 默认省份处理
  const provinceName = province || '吉林省';
  
  try {
    // 先查询当前记录
    const { data: existing, error: queryError } = await supabase
      .from('sync_status')
      .select('*')
      .eq('provider', 'doubao')
      .eq('province', provinceName)
      .maybeSingle();
    
    if (queryError) {
      console.error('[更新同步状态] 查询失败:', queryError);
      return;
    }
    
    if (existing) {
      // 更新现有记录：递增计数
      const newSyncedCount = (existing.synced_count || 0) + 1;
      const newTotalCount = (existing.total_count || 0) + 1;
      
      const { error: updateError } = await supabase
        .from('sync_status')
        .update({
          total_count: newTotalCount,
          synced_count: newSyncedCount,
          status: 'in_progress',
          last_sync_time: now,
          last_sync_id: savedId,
          message: '采集中...',
          updated_at: now,
        })
        .eq('id', existing.id);
      
      if (updateError) {
        console.error('[更新同步状态] 更新失败:', updateError);
      } else {
        console.log(`[更新同步状态] 成功: province=${provinceName}, synced_count=${newSyncedCount}, last_id=${savedId}`);
      }
    } else {
      // 创建新记录
      const { error: insertError } = await supabase
        .from('sync_status')
        .insert({
          provider: 'doubao',
          province: provinceName,
          total_count: 1,
          synced_count: 1,
          status: 'in_progress',
          last_sync_time: now,
          last_sync_id: savedId,
          message: '采集中...',
        });
      
      if (insertError) {
        console.error('[更新同步状态] 创建失败:', insertError);
      } else {
        console.log(`[更新同步状态] 创建新记录: province=${provinceName}, id=${savedId}`);
      }
    }
  } catch (err) {
    console.error('[更新同步状态] 异常:', err);
  }
}

/**
 * 根据公告类型获取招标类型（用于 bid_type 字段）
 * announcement_type 保存原始公告类型名称
 */
function getBidType(announcementType: string): string {
  // 先规范化
  const normalized = normalizeAnnouncementType(announcementType);
  
  const typeMap: Record<string, string> = {
    // 招标类
    '公开招标公告': '公开招标',
    '资格预审公告': '资格预审',
    '邀请招标公告': '邀请招标',
    '竞争性谈判公告': '竞争性谈判',
    '竞争性磋商公告': '竞争性磋商',
    '询价公告': '询价',
    '采购意向公告': '采购意向',
    '允许采购进口产品公示': '进口产品公示',
    '采购文件需求公告': '采购文件需求',
    '公共服务项目需求意见公告': '需求意见公告',
    '更正公告': '更正公告',
    '询价/竞价公告': '询价/竞价',
    '封闭式征集公告': '封闭式征集',
    '开放式征集公告': '开放式征集',
    '单一来源公告': '单一来源',
    // 简称映射
    '招标': '公开招标',
    '变更': '更正公告',
    '废标': '废标公告',
    '废标公告': '废标公告',
    '终止公告': '终止公告',
    '采购结果变更公告': '采购结果变更',
    '采购意向': '采购意向',
    '竞争性磋商': '竞争性磋商',
    '竞争性谈判': '竞争性谈判',
    '询价': '询价',
    '单一来源采购': '单一来源',  // 旧名称兼容
  };
  return typeMap[normalized] || normalized || '招标公告';
}

export default router;
