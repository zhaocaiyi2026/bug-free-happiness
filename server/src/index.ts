// globalThis polyfill for older Node.js versions
if (typeof globalThis === 'undefined') {
  (global as any).globalThis = global;
}

import 'dotenv/config'; // 加载.env环境变量
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bidsRouter from './routes/bids';

// ES 模块兼容：定义 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import winBidsRouter from './routes/win-bids';
import commonRouter from './routes/common';
import authRouter from './routes/auth';
import favoritesRouter from './routes/favorites';
import crawlerRouter from './routes/crawler';
import messagesRouter from './routes/messages';
import subscriptionsRouter from './routes/subscriptions';
import dataSourcesRouter from './routes/data-sources';
import potentialCustomersRouter from './routes/potential-customers';
import aiExtractRouter from './routes/ai-extract';
import collectorRouter from './routes/collector';
import importRouter from './routes/import';
import jilinSyncRouter from './routes/jilin-sync';
import doubaoExtractRouter from './routes/doubao-extract';
import bidCollectRouter from './routes/bid-collect';
import jilinCollectRouter from './routes/jilin-collect';
import jilinCollectV2Router from './routes/jilin-collect-v2';
import jilinCollectV3Router from './routes/jilin-collect-v3';
import jilinCollectV4Router from './routes/jilin-collect-v4';
import jilinCollectV5Router from './routes/jilin-collect-v5';
import jilinAutoCollectRouter from './routes/jilin-auto-collect';
import bidCleanRouter from './routes/bid-clean';
import bidLLMCleanRouter from './routes/bid-llm-clean';
import jilinIntelligentRouter from './routes/jilin-intelligent';
import doubaoSearchRouter from './routes/doubao-search';
import pythonCollectRouter from './routes/python-collect';
import adminRouter from './routes/admin';
import bidFormatRouter from './routes/bid-format';
import syncStatusRouter from './routes/sync-status';
import bidAutoFetchRouter from './routes/bid-auto-fetch';
import csvImportRouter from './routes/csv-import';
import formatBidRouter from './routes/format-bid';
import searchHistoryRouter from './routes/search-history';
import browseHistoryRouter from './routes/browse-history';
import bookingRouter from './routes/booking';
import { createCollector, collectAndSave } from './services/compliant-collector';
import { startDataSyncScheduler } from './services/data-sources';

const app = express();
// 阿里云函数计算Custom Runtime端口，默认9000
const port = process.env.FC_SERVER_PORT || process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 全局禁用缓存 - 确保手机端实时刷新
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Health check
app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// API路由
app.use('/api/v1/bids', bidsRouter);
app.use('/api/v1/win-bids', winBidsRouter);
app.use('/api/v1/common', commonRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/favorites', favoritesRouter);
app.use('/api/v1/crawler', crawlerRouter);
app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/subscriptions', subscriptionsRouter);
app.use('/api/v1/data-sources', dataSourcesRouter);
app.use('/api/v1/potential-customers', potentialCustomersRouter);
app.use('/api/v1/ai-extract', aiExtractRouter);
app.use('/api/v1/collector', collectorRouter);
app.use('/api/v1/import', importRouter);
app.use('/api/v1/jilin', jilinSyncRouter);
app.use('/api/v1/doubao-extract', doubaoExtractRouter);
app.use('/api/v1/bid-collect', bidCollectRouter);
app.use('/api/v1/jilin-collect', jilinCollectRouter);
app.use('/api/v1/jilin-collect-v2', jilinCollectV2Router);
app.use('/api/v1/jilin-collect-v3', jilinCollectV3Router);
app.use('/api/v1/jilin-collect-v4', jilinCollectV4Router);
app.use('/api/v1/jilin-collect-v5', jilinCollectV5Router);
app.use('/api/v1/jilin-auto-collect', jilinAutoCollectRouter);
app.use('/api/v1/bids/clean', bidCleanRouter);
app.use('/api/v1/bids/llm-clean', bidLLMCleanRouter);
app.use('/api/v1/jilin-intelligent', jilinIntelligentRouter);
app.use('/api/v1/doubao-search', doubaoSearchRouter);
app.use('/api/v1/python-collect', pythonCollectRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1', bidFormatRouter);
app.use('/api/v1/sync-status', syncStatusRouter);
app.use('/api/v1/bid-auto-fetch', bidAutoFetchRouter);
app.use('/api/v1/csv-import', csvImportRouter);
app.use('/api/v1/format-bid', formatBidRouter);
app.use('/api/v1/search-history', searchHistoryRouter);
app.use('/api/v1/browse-history', browseHistoryRouter);
app.use('/api/v1/booking', bookingRouter);

// 合规采集器路由
app.post('/api/v1/compliant-collect', async (req, res) => {
  try {
    const { startDate = '2026-01-01', endDate, maxPages = 5 } = req.body;
    const end = endDate || new Date().toISOString().split('T')[0];
    
    console.log(`[合规采集API] 开始采集: ${startDate} 至 ${end}, 最多 ${maxPages} 页`);
    
    const result = await collectAndSave(startDate, end, maxPages);
    
    res.json({
      success: result.success,
      collected: result.collected,
      saved: result.saved,
      message: result.message,
    });
  } catch (error) {
    console.error('[合规采集API] 采集失败:', error);
    res.status(500).json({
      success: false,
      error: '采集失败',
      details: String(error),
    });
  }
});

// APK 下载路由 - 使用 /api/v1 路径避免被前端路由拦截
app.get('/api/v1/download/apk', (req, res) => {
  const apkPath = path.join(__dirname, '..', 'public', 'zcy.apk');
  res.download(apkPath, 'zcy.apk', (err) => {
    if (err) {
      console.error('APK下载失败:', err);
      res.status(404).json({ error: 'APK文件不存在' });
    }
  });
});

// 生产环境：提供前端静态文件
if (process.env.NODE_ENV === 'production') {
  // 前端构建文件的路径：../../client/dist (相对于 server/dist/index.js)
  const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
  
  // 提供静态文件
  app.use(express.static(clientDistPath));
  
  // 所有非 API 路由返回 index.html (SPA 支持)
  app.get('*', (req, res, next) => {
    // 跳过 API 路由和下载路由
    if (req.path.startsWith('/api/') || req.path.startsWith('/download/')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 启动服务器
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening at http://0.0.0.0:${port}/`);
  
  // 启动数据同步调度器（官方数据源）
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DATA_SYNC === 'true') {
    console.log('Auto-starting data sync scheduler...');
    startDataSyncScheduler();
  }
});

// 导出app供测试使用
export default app;
