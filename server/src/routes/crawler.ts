/**
 * 爬虫管理API路由（简化版）
 * 
 * 提供爬虫状态查询、手动触发等功能
 */

import { Router } from 'express';

const router = Router();

// 简单的内存状态
let crawlerStatus = {
  isRunning: false,
  lastRunTime: null as Date | null,
  totalCrawled: 0,
};

/**
 * 获取爬虫状态
 * GET /api/v1/crawler/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: crawlerStatus,
  });
});

/**
 * 获取爬虫统计
 * GET /api/v1/crawler/stats
 */
router.get('/stats', async (req, res) => {
  res.json({
    success: true,
    data: {
      totalBids: 0,
      totalWinBids: 0,
      lastSync: null,
    },
  });
});

/**
 * 获取爬取日志
 * GET /api/v1/crawler/logs
 */
router.get('/logs', (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

/**
 * 获取可用数据源
 * GET /api/v1/crawler/sources
 */
router.get('/sources', (req, res) => {
  res.json({
    success: true,
    data: ['ccgp', 'ggzy', 'jilin-ccgp'],
  });
});

/**
 * 启动爬虫服务
 * POST /api/v1/crawler/start
 */
router.post('/start', (req, res) => {
  crawlerStatus.isRunning = true;
  res.json({
    success: true,
    message: '爬虫服务已启动（模拟）',
  });
});

/**
 * 停止爬虫服务
 * POST /api/v1/crawler/stop
 */
router.post('/stop', (req, res) => {
  crawlerStatus.isRunning = false;
  res.json({
    success: true,
    message: '爬虫服务已停止（模拟）',
  });
});

/**
 * 手动触发爬取
 * POST /api/v1/crawler/run
 */
router.post('/run', async (req, res) => {
  crawlerStatus.lastRunTime = new Date();
  res.json({
    success: true,
    data: { crawled: 0 },
    message: '爬取已触发（模拟）',
  });
});

/**
 * 生成模拟数据（开发测试用）
 * POST /api/v1/crawler/generate
 */
router.post('/generate', async (req, res) => {
  res.json({
    success: false,
    message: '模拟数据生成功能已禁用',
  });
});

/**
 * 生成中标信息数据（开发测试用）
 * POST /api/v1/crawler/generate-win-bids
 */
router.post('/generate-win-bids', async (req, res) => {
  res.json({
    success: false,
    message: '模拟数据生成功能已禁用',
  });
});

export default router;
