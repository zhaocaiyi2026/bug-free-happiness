import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

/**
 * 获取省份列表
 */
router.get('/provinces', async (req, res) => {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('provinces')
      .select('id, name, code')
      .order('name');

    if (error) {
      throw new Error(`查询省份失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('获取省份失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取省份失败'
    });
  }
});

/**
 * 获取城市列表
 * Query参数：
 * - provinceId: number (省份ID)
 */
router.get('/cities', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { provinceId } = req.query;

    let query = client
      .from('cities')
      .select('id, province_id, name, code')
      .order('name');

    if (provinceId) {
      query = query.eq('province_id', Number(provinceId));
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`查询城市失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('获取城市失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取城市失败'
    });
  }
});

/**
 * 获取行业列表
 */
router.get('/industries', async (req, res) => {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('industries')
      .select('id, name, code')
      .order('name');

    if (error) {
      throw new Error(`查询行业失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('获取行业失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取行业失败'
    });
  }
});

export default router;
