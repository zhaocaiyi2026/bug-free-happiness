import express from "express";
import cors from "cors";
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
import { startCrawler } from './crawler';
import { startDataSyncScheduler } from './services/data-sources';

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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
  
  // 自动启动爬虫服务（生产环境）
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRAWLER === 'true') {
    console.log('Auto-starting crawler service...');
    startCrawler();
  }
  
  // 启动数据同步调度器（官方数据源）
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DATA_SYNC === 'true') {
    console.log('Auto-starting data sync scheduler...');
    startDataSyncScheduler();
  }
});
