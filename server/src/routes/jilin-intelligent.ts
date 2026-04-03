/**
 * 吉林省智能采集路由
 * 
 * @module jilin-intelligent
 * @description 提供合规的智能采集API接口
 * 
 * 合规措施：
 * - 每日最大采集次数限制
 * - 单次最大采集数量限制
 * - 请求间隔 >= 2秒
 * - 使用合理的User-Agent
 */

import { Router } from 'express';
import { 
  runIntelligentCollection, 
  getSupportedTypes, 
  getComplianceConfig 
} from '../services/jilin-intelligent-collector.js';

const router = Router();

/**
 * GET /api/v1/jilin-intelligent/types
 * 获取支持的公告类型列表
 */
router.get('/types', (req, res) => {
  const types = getSupportedTypes();
  const config = getComplianceConfig();
  
  res.json({
    success: true,
    types,
    compliance: {
      maxItemsPerRun: config.maxItemsPerRun,
      requestDelay: `${config.requestDelay / 1000}秒`,
      maxRunsPerDay: config.maxRunsPerDay,
    },
  });
});

/**
 * GET /api/v1/jilin-intelligent/config
 * 获取合规配置
 */
router.get('/config', (req, res) => {
  const config = getComplianceConfig();
  
  res.json({
    success: true,
    config: {
      requestDelay: `${config.requestDelay / 1000}秒`,
      maxItemsPerRun: config.maxItemsPerRun,
      requestTimeout: `${config.requestTimeout / 1000}秒`,
      maxRunsPerDay: config.maxRunsPerDay,
    },
  });
});

/**
 * POST /api/v1/jilin-intelligent/collect
 * 执行智能采集
 * 
 * Body:
 * - types: 公告类型数组，如 ['招标公告', '中标公告']
 * - maxItems: 每种类型最大采集数量（默认10，最大20）
 * 
 * @example
 * curl -X POST http://localhost:9091/api/v1/jilin-intelligent/collect \
 *   -H "Content-Type: application/json" \
 *   -d '{"types": ["招标公告", "中标公告"], "maxItems": 10}'
 */
router.post('/collect', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { types, maxItems = 10 } = req.body;
    
    // 验证参数
    const supportedTypes = getSupportedTypes();
    let targetTypes: string[] = [];
    
    if (types && Array.isArray(types)) {
      // 过滤出支持的类型
      targetTypes = types.filter(t => supportedTypes.includes(t));
    } else {
      // 默认采集招标公告和中标公告
      targetTypes = ['招标公告', '中标公告'];
    }
    
    if (targetTypes.length === 0) {
      return res.status(400).json({
        success: false,
        error: '未指定有效的公告类型',
        supportedTypes,
      });
    }
    
    // 限制最大数量
    const maxItemsPerType = Math.min(maxItems, 20);
    
    console.log(`[智能采集API] 开始采集，类型: ${targetTypes.join(', ')}，每类最多: ${maxItemsPerType}`);
    
    // 执行采集
    const result = await runIntelligentCollection(targetTypes, maxItemsPerType);
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: result.success,
      message: result.message,
      stats: {
        total: result.total,
        saved: result.saved,
        skipped: result.skipped,
        errors: result.errors,
      },
      duration: `${(duration / 1000).toFixed(1)}秒`,
      details: result.details.slice(0, 20), // 只返回前20条详情
    });
    
  } catch (error) {
    console.error('[智能采集API] 采集失败:', error);
    res.status(500).json({
      success: false,
      error: '采集失败',
      details: String(error),
    });
  }
});

/**
 * POST /api/v1/jilin-intelligent/collect/framework
 * 专门采集框架协议相关公告
 * 
 * 采集类型：
 * - 框架协议交易公告
 * - 单笔交易结果公告
 * - 汇总交易结果公告
 * - 中小企业预留执行公告
 */
router.post('/collect/framework', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { maxItems = 5 } = req.body;
    
    // 框架协议相关类型
    const frameworkTypes = [
      '框架协议交易公告',
      '单笔交易结果公告',
      '汇总交易结果公告',
      '中小企业预留执行公告',
    ];
    
    console.log(`[智能采集API] 开始采集框架协议公告`);
    
    // 执行采集
    const result = await runIntelligentCollection(frameworkTypes, Math.min(maxItems, 10));
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: result.success,
      message: result.message,
      stats: {
        total: result.total,
        saved: result.saved,
        skipped: result.skipped,
        errors: result.errors,
      },
      duration: `${(duration / 1000).toFixed(1)}秒`,
      details: result.details.slice(0, 20),
    });
    
  } catch (error) {
    console.error('[智能采集API] 框架协议采集失败:', error);
    res.status(500).json({
      success: false,
      error: '采集失败',
      details: String(error),
    });
  }
});

/**
 * POST /api/v1/jilin-intelligent/collect/all
 * 采集所有类型的公告（谨慎使用）
 * 
 * 注意：此接口会采集大量数据，请确保合规使用
 */
router.post('/collect/all', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { maxItems = 5 } = req.body;
    
    // 所有支持的类型
    const allTypes = getSupportedTypes();
    
    console.log(`[智能采集API] 开始全量采集，类型数量: ${allTypes.length}`);
    
    // 执行采集（限制每类最多5条）
    const result = await runIntelligentCollection(allTypes, Math.min(maxItems, 5));
    
    const duration = Date.now() - startTime;
    
    res.json({
      success: result.success,
      message: result.message,
      stats: {
        total: result.total,
        saved: result.saved,
        skipped: result.skipped,
        errors: result.errors,
      },
      duration: `${(duration / 1000).toFixed(1)}秒`,
      typesCollected: allTypes,
      details: result.details.slice(0, 30),
    });
    
  } catch (error) {
    console.error('[智能采集API] 全量采集失败:', error);
    res.status(500).json({
      success: false,
      error: '采集失败',
      details: String(error),
    });
  }
});

export default router;
