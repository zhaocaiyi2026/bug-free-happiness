import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

/**
 * 用户登录
 * Body参数：
 * - phone: string (手机号)
 * - password?: string (密码，可选)
 */
router.post('/login', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { phone, password } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: '手机号不能为空'
      });
    }

    // 查询用户
    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error) {
      throw new Error(`查询用户失败: ${error.message}`);
    }

    // 如果用户不存在，创建新用户
    if (!user) {
      const { data: newUser, error: createError } = await client
        .from('users')
        .insert({
          phone,
          nickname: `用户${phone.slice(-4)}`,
          vip_level: 0,
          points: 0
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`创建用户失败: ${createError.message}`);
      }

      return res.json({
        success: true,
        data: newUser,
        message: '注册成功'
      });
    }

    // 验证密码（如果设置了密码）
    if (user.password && user.password !== password) {
      return res.status(401).json({
        success: false,
        message: '密码错误'
      });
    }

    res.json({
      success: true,
      data: user,
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '登录失败'
    });
  }
});

/**
 * 更新用户信息
 * Body参数：
 * - nickname: string (昵称)
 * - avatar: string (头像URL)
 */
router.post('/profile', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { userId, nickname, avatar } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (nickname) updateData.nickname = nickname;
    if (avatar) updateData.avatar = avatar;

    const { data, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', Number(userId))
      .select()
      .single();

    if (error) {
      throw new Error(`更新用户信息失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: data,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新用户信息失败'
    });
  }
});

/**
 * VIP升级
 * Body参数：
 * - userId: number (用户ID)
 * - level: number (VIP等级 1-4)
 */
router.post('/vip/upgrade', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { userId, level } = req.body;

    if (!userId || !level) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      });
    }

    // 计算VIP到期时间（1年后）
    const expireAt = new Date();
    expireAt.setFullYear(expireAt.getFullYear() + 1);

    const { data, error } = await client
      .from('users')
      .update({
        vip_level: Number(level),
        vip_expire_at: expireAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', Number(userId))
      .select()
      .single();

    if (error) {
      throw new Error(`VIP升级失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: data,
      message: 'VIP升级成功'
    });
  } catch (error) {
    console.error('VIP升级失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'VIP升级失败'
    });
  }
});

export default router;
