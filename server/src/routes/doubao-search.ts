/**
 * 豆包智能搜索路由
 * 
 * 流程：我向豆包发出搜索指令 → 豆包搜索/整理 → 回传给我 → 我审核入库 → 前端展示
 */

import { Router } from 'express';
import { doubaoSearchJilinBids, reviewAndSaveData, doubaoSearchAndSave } from '../services/doubao-search.js';
import { 
  startScheduledSearch, 
  stopScheduledSearch, 
  getScheduleStatus,
  triggerManualSearch 
} from '../services/doubao-schedule.js';

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
 * POST /api/v1/doubao-search/approve
 * 审核并保存豆包返回的数据（别名接口，前端调用）
 * 
 * Body:
 * - data: 豆包返回的数据数组
 */
router.post('/approve', async (req, res) => {
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

/**
 * POST /api/v1/doubao-search/schedule/start
 * 启动定时搜索任务
 * 
 * Body:
 * - cronExpression: cron表达式（可选，默认每4小时）
 */
router.post('/schedule/start', (req, res) => {
  try {
    const { cronExpression } = req.body;
    startScheduledSearch(cronExpression);
    
    res.json({
      success: true,
      message: '定时任务已启动',
      status: getScheduleStatus(),
    });
  } catch (error) {
    console.error('[豆包搜索API] 启动定时任务失败:', error);
    res.status(500).json({
      success: false,
      error: '启动失败',
      details: String(error),
    });
  }
});

/**
 * POST /api/v1/doubao-search/schedule/stop
 * 停止定时搜索任务
 */
router.post('/schedule/stop', (req, res) => {
  try {
    stopScheduledSearch();
    
    res.json({
      success: true,
      message: '定时任务已停止',
    });
  } catch (error) {
    console.error('[豆包搜索API] 停止定时任务失败:', error);
    res.status(500).json({
      success: false,
      error: '停止失败',
      details: String(error),
    });
  }
});

/**
 * GET /api/v1/doubao-search/schedule/status
 * 获取定时任务状态
 */
router.get('/schedule/status', (req, res) => {
  try {
    res.json({
      success: true,
      status: getScheduleStatus(),
    });
  } catch (error) {
    console.error('[豆包搜索API] 获取状态失败:', error);
    res.status(500).json({
      success: false,
      error: '获取状态失败',
      details: String(error),
    });
  }
});

/**
 * POST /api/v1/doubao-search/schedule/trigger
 * 手动触发一次搜索
 */
router.post('/schedule/trigger', async (req, res) => {
  try {
    const result = await triggerManualSearch();
    
    res.json({
      success: result.success,
      message: result.message,
      result: result.result,
    });
  } catch (error) {
    console.error('[豆包搜索API] 手动触发失败:', error);
    res.status(500).json({
      success: false,
      error: '触发失败',
      details: String(error),
    });
  }
});

export default router;
