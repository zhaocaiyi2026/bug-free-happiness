/**
 * 爬虫管理API路由
 * 
 * 提供爬虫状态查询、手动触发等功能
 */

import { Router } from 'express';
import {
  startCrawler,
  stopCrawlerService,
  manualCrawl,
  getCrawlerStatus,
  getCrawlerStats,
  getCrawlLogs,
  getAvailableParsers,
} from '@/crawler';

const router = Router();

/**
 * 获取爬虫状态
 * GET /api/v1/crawler/status
 */
router.get('/status', (req, res) => {
  try {
    const status = getCrawlerStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取状态失败',
    });
  }
});

/**
 * 获取爬虫统计
 * GET /api/v1/crawler/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getCrawlerStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取统计失败',
    });
  }
});

/**
 * 获取爬取日志
 * GET /api/v1/crawler/logs
 * Query参数：limit (可选，默认20)
 */
router.get('/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const logs = getCrawlLogs(limit);
    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取日志失败',
    });
  }
});

/**
 * 获取可用数据源
 * GET /api/v1/crawler/sources
 */
router.get('/sources', (req, res) => {
  try {
    const sources = getAvailableParsers();
    res.json({
      success: true,
      data: sources,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取数据源失败',
    });
  }
});

/**
 * 启动爬虫服务
 * POST /api/v1/crawler/start
 */
router.post('/start', (req, res) => {
  try {
    startCrawler();
    res.json({
      success: true,
      message: '爬虫服务已启动',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '启动失败',
    });
  }
});

/**
 * 停止爬虫服务
 * POST /api/v1/crawler/stop
 */
router.post('/stop', (req, res) => {
  try {
    stopCrawlerService();
    res.json({
      success: true,
      message: '爬虫服务已停止',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '停止失败',
    });
  }
});

/**
 * 手动触发爬取
 * POST /api/v1/crawler/run
 * Body参数：source (可选，指定数据源)
 */
router.post('/run', async (req, res) => {
  try {
    const { source } = req.body;
    
    // 检查是否正在运行
    const status = getCrawlerStatus();
    if (status.isRunning) {
      return res.status(400).json({
        success: false,
        message: '爬虫正在运行中，请稍后再试',
      });
    }
    
    const result = await manualCrawl(source);
    
    res.json({
      success: true,
      data: result,
      message: source ? `${source} 爬取完成` : '全量爬取已触发',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '触发爬取失败',
    });
  }
});

export default router;
