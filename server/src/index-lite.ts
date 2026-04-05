/**
 * 精简版API入口 - 用于阿里云函数计算部署
 * 只保留核心API路由，移除爬虫相关功能
 */

import 'dotenv/config';
import express from "express";
import cors from "cors";
import serverless from 'serverless-http';

// 核心API路由
import bidsRouter from './routes/bids';
import winBidsRouter from './routes/win-bids';
import commonRouter from './routes/common';
import authRouter from './routes/auth';
import favoritesRouter from './routes/favorites';
import messagesRouter from './routes/messages';
import subscriptionsRouter from './routes/subscriptions';
import potentialCustomersRouter from './routes/potential-customers';
import adminRouter from './routes/admin';
import syncStatusRouter from './routes/sync-status';
import bidFormatRouter from './routes/bid-format';

const app = express();
const port = process.env.FC_SERVER_PORT || process.env.PORT || 9000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 全局禁用缓存
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', mode: 'lite' });
});

// 核心API路由
app.use('/api/v1/bids', bidsRouter);
app.use('/api/v1/win-bids', winBidsRouter);
app.use('/api/v1/common', commonRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/favorites', favoritesRouter);
app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/subscriptions', subscriptionsRouter);
app.use('/api/v1/potential-customers', potentialCustomersRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/sync-status', syncStatusRouter);
app.use('/api/v1', bidFormatRouter);

// 爬虫相关API返回禁用提示
const disabledRoutes = [
  '/api/v1/crawler',
  '/api/v1/ai-extract',
  '/api/v1/collector',
  '/api/v1/import',
  '/api/v1/jilin',
  '/api/v1/doubao-extract',
  '/api/v1/bid-collect',
  '/api/v1/jilin-collect',
  '/api/v1/jilin-collect-v2',
  '/api/v1/jilin-collect-v3',
  '/api/v1/jilin-collect-v4',
  '/api/v1/jilin-collect-v5',
  '/api/v1/jilin-auto-collect',
  '/api/v1/bids/clean',
  '/api/v1/bids/llm-clean',
  '/api/v1/jilin-intelligent',
  '/api/v1/doubao-search',
  '/api/v1/python-collect',
  '/api/v1/data-sources',
  '/api/v1/bid-auto-fetch',
];

disabledRoutes.forEach(route => {
  app.all(`${route}*`, (req, res) => {
    res.status(503).json({
      error: 'Service Unavailable',
      message: '此功能在Lite模式下不可用，请使用完整版服务',
      route: route
    });
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// 启动服务器（仅在非函数计算环境中）
if (!process.env.FC_FUNCTION_NAME) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server (lite) listening at http://0.0.0.0:${port}/`);
  });
}

// 导出app供测试使用
export default app;

// 阿里云函数计算HTTP Handler
export const handler = serverless(app);
