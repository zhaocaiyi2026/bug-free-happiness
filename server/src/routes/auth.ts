import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

// 验证码存储（生产环境应使用Redis）
const smsCodeStore: Record<string, { code: string; expireAt: number }> = {};

/**
 * 发送短信验证码
 * Body参数：
 * - phone: string (手机号)
 */
router.post('/send-sms', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入正确的手机号'
      });
    }

    // 检查是否频繁发送（60秒内）
    const existing = smsCodeStore[phone];
    if (existing && existing.expireAt > Date.now() + 240000) {
      return res.status(400).json({
        success: false,
        message: '验证码发送过于频繁，请稍后再试'
      });
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 存储5分钟有效
    smsCodeStore[phone] = {
      code,
      expireAt: Date.now() + 300000
    };

    // 生产环境应该调用短信服务商API发送验证码
    console.log(`[SMS] 发送验证码到 ${phone}: ${code}`);

    // 开发环境：返回验证码方便调试
    const isDev = process.env.NODE_ENV !== 'production';
    
    res.json({
      success: true,
      message: '验证码发送成功',
      // 开发环境返回验证码，方便测试
      ...(isDev && { code })
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({
      success: false,
      message: '发送验证码失败'
    });
  }
});

/**
 * 用户注册
 * Body参数：
 * - phone: string (手机号)
 * - password: string (密码)
 * - smsCode?: string (验证码)
 * - nickname?: string (昵称)
 */
router.post('/register', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { phone, password, smsCode, nickname } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入正确的手机号'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码至少6位'
      });
    }

    // 验证短信验证码（如果有）
    if (smsCode) {
      const stored = smsCodeStore[phone];
      if (!stored || stored.code !== smsCode || stored.expireAt < Date.now()) {
        return res.status(400).json({
          success: false,
          message: '验证码错误或已过期'
        });
      }
      // 删除已使用的验证码
      delete smsCodeStore[phone];
    }

    // 检查用户是否已存在
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该手机号已注册'
      });
    }

    // 创建用户
    const { data: newUser, error: createError } = await client
      .from('users')
      .insert({
        phone,
        password,
        nickname: nickname || `用户${phone.slice(-4)}`,
        vip_level: 0,
        points: 0
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`创建用户失败: ${createError.message}`);
    }

    res.json({
      success: true,
      data: newUser,
      message: '注册成功'
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '注册失败'
    });
  }
});

/**
 * 用户登录
 * Body参数：
 * - phone: string (手机号)
 * - password?: string (密码)
 * - smsCode?: string (验证码)
 */
router.post('/login', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { phone, password, smsCode } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: '手机号不能为空'
      });
    }

    // 短信验证码登录
    if (smsCode && !password) {
      const stored = smsCodeStore[phone];
      if (!stored || stored.code !== smsCode || stored.expireAt < Date.now()) {
        return res.status(400).json({
          success: false,
          message: '验证码错误或已过期'
        });
      }
      // 删除已使用的验证码
      delete smsCodeStore[phone];
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

    // 如果用户不存在，创建新用户（短信登录时自动注册）
    if (!user) {
      if (password) {
        return res.status(401).json({
          success: false,
          message: '用户不存在，请先注册'
        });
      }

      // 短信登录自动注册
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

    // 验证密码（如果设置了密码且通过密码登录）
    if (password && user.password && user.password !== password) {
      return res.status(401).json({
        success: false,
        message: '密码错误'
      });
    }

    // 如果用户设置了密码但未提供密码（短信登录时）
    if (user.password && !smsCode && !password) {
      return res.status(400).json({
        success: false,
        message: '请输入密码'
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
 * - userId: number (用户ID)
 * - nickname?: string (昵称)
 * - avatar?: string (头像URL)
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
