import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

router.get('/db-check', async (req, res) => {
  const client = getSupabaseClient();
  
  // 直接计数
  const { count: directCount } = await client
    .from('bids')
    .select('*', { count: 'exact', head: true });
  
  // 带 order 的计数
  const { count: orderedCount } = await client
    .from('bids')
    .select('id', { count: 'exact' })
    .order('publish_date', { ascending: false, nullsFirst: false });
  
  // 最新3条
  const { data: latest } = await client
    .from('bids')
    .select('id, title, publish_date, created_at')
    .order('publish_date', { ascending: false, nullsFirst: false })
    .limit(3);
  
  res.json({
    directCount,
    orderedCount,
    latest,
    dbUrl: process.env.COZE_SUPABASE_URL
  });
});

export default router;
