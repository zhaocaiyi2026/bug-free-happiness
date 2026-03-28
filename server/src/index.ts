import express from "express";
import cors from "cors";
import bidsRouter from './routes/bids';
import commonRouter from './routes/common';
import authRouter from './routes/auth';
import favoritesRouter from './routes/favorites';

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
app.use('/api/v1/common', commonRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/favorites', favoritesRouter);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
