/**
 * 豆包智能搜索路由
 * 
 * 流程：我向豆包发出搜索指令 → 豆包搜索/整理 → 回传给我 → 我审核入库 → 前端展示
 */

import { Router } from 'express';
import { doubaoSearchJilinBids, reviewAndSaveData, doubaoSearchAndSave } from '../services/doubao-search.js';

const router = Router();

/**
 * POST /api/v1/doubao-search/search
 * 让豆包搜索吉林省政府采购网信息
 * 
 * Body:
 * - types: 公告类型数组，如 ['招标公告', '中标公告']
 * - countPerType: 每种类型搜索数量（默认5）
 */
router.post('/search', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { types, countPerType = 5 } = req.body;
    
    const searchTypes = types || ['招标公告', '中标公告', '竞争性磋商'];
    
    console.log(`[豆包搜索API] 开始搜索，类型: ${searchTypes.join(', ')}`);
    
    const result = await doubaoSearchJilinBids(searchTypes, countPerType);
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: result.success,
      message: result.message,
      dataCount: result.data?.length || 0,
      duration: `${(duration / 1000).toFixed(1)}秒`,
      data: result.data,
      raw: result.raw?.substring(0, 5000), // 截断原始响应
    });
    
  } catch (error) {
    console.error('[豆包搜索API] 搜索失败:', error);
    res.status(500).json({
      success: false,
      error: '搜索失败',
      details: String(error),
    });
  }
});

/**
 * POST /api/v1/doubao-search/save
 * 审核并保存豆包返回的数据
 * 
 * Body:
 * - data: 豆包返回的数据数组
 */
router.post('/save', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的数据数组',
      });
    }
    
    console.log(`[豆包搜索API] 开始审核入库，数据量: ${data.length}`);
    
    const result = await reviewAndSaveData(data);
    
    res.json({
      success: result.success,
      saved: result.saved,
      skipped: result.skipped,
      errors: result.errors,
      details: result.details,
    });
    
  } catch (error) {
    console.error('[豆包搜索API] 入库失败:', error);
    res.status(500).json({
      success: false,
      error: '入库失败',
      details: String(error),
    });
  }
});

/**
 * POST /api/v1/doubao-search/execute
 * 完整流程：搜索 → 审核 → 入库
 * 
 * Body:
 * - types: 公告类型数组
 * - countPerType: 每种类型搜索数量
 */
router.post('/execute', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { types, countPerType = 5 } = req.body;
    
    const searchTypes = types || ['招标公告', '中标公告', '竞争性磋商'];
    
    console.log(`[豆包搜索API] 执行完整流程，类型: ${searchTypes.join(', ')}`);
    
    const result = await doubaoSearchAndSave(searchTypes, countPerType);
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: result.searchResult.success && result.saveResult?.success,
      search: {
        success: result.searchResult.success,
        message: result.searchResult.message,
        dataCount: result.searchResult.data?.length || 0,
      },
      save: result.saveResult ? {
        saved: result.saveResult.saved,
        skipped: result.saveResult.skipped,
        errors: result.saveResult.errors,
        details: result.saveResult.details.slice(0, 20),
      } : undefined,
      duration: `${(duration / 1000).toFixed(1)}秒`,
    });
    
  } catch (error) {
    console.error('[豆包搜索API] 执行失败:', error);
    res.status(500).json({
      success: false,
      error: '执行失败',
      details: String(error),
    });
  }
});

export default router;
