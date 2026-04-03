import 'dotenv/config'; // 加载.env环境变量
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bidsRouter from './routes/bids';
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
import { createCollector, collectAndSave } from './services/compliant-collector';
import { startDataSyncScheduler } from './services/data-sources';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// 生产环境：提供前端静态文件
if (process.env.NODE_ENV === 'production') {
  // 前端构建文件的路径：../../client/dist (相对于 server/dist/index.js)
  const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
  
  // 提供静态文件
  app.use(express.static(clientDistPath));
  
  // 所有非 API 路由返回 index.html (SPA 支持)
  app.get('*', (req, res, next) => {
    // 跳过 API 路由
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
  
  // 启动数据同步调度器（官方数据源）
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DATA_SYNC === 'true') {
    console.log('Auto-starting data sync scheduler...');
    startDataSyncScheduler();
  }
});
