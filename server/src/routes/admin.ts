/**
 * 用户管理路由
 * 
 * 仅管理员可访问，提供用户列表、升级会员等功能
 */

import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

/**
 * 验证管理员权限中间件
 */
const requireAdmin = async (req: any, res: any, next: any) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '未登录'
    });
  }
  
  try {
    const client = getSupabaseClient();
    const { data: user, error } = await client
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('[用户管理] 权限验证失败:', error);
    res.status(500).json({
      success: false,
      message: '权限验证失败'
    });
  }
};

/**
 * GET /api/v1/admin/users
 * 获取用户列表（分页）
 * Query参数：
 * - page: number (页码，默认1)
 * - pageSize: number (每页数量，默认20)
 * - role: string (筛选角色：admin/user/all)
 * - vipLevel: number (筛选会员等级)
 * - keyword: string (搜索关键词：手机号/昵称)
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { page = 1, pageSize = 20, role, vipLevel, keyword } = req.query;
    
    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = Math.min(parseInt(pageSize as string) || 20, 100);
    const offset = (pageNum - 1) * pageSizeNum;
    
    // 构建查询
    let query = client
      .from('users')
      .select('id, phone, nickname, role, vip_level, vip_expire_at, points, created_at, avatar', { count: 'exact' });
    
    // 筛选条件
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }
    
    if (vipLevel !== undefined && vipLevel !== '') {
      query = query.eq('vip_level', parseInt(vipLevel as string));
    }
    
    if (keyword) {
      query = query.or(`phone.ilike.%${keyword}%,nickname.ilike.%${keyword}%`);
    }
    
    // 分页
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSizeNum - 1);
    
    const { data: users, error, count } = await query;
    
    if (error) {
      throw new Error(`查询用户失败: ${error.message}`);
    }
    
    res.json({
      success: true,
      data: {
        list: users,
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil((count || 0) / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('[用户管理] 获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取用户列表失败'
    });
  }
});

/**
 * GET /api/v1/admin/users/:id
 * 获取用户详情
 */
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;
    
    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 隐藏敏感信息
    delete user.password;
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('[用户管理] 获取用户详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户详情失败'
    });
  }
});

/**
 * PUT /api/v1/admin/users/:id/vip
 * 升级/降级用户会员等级
 * Body参数：
 * - vipLevel: number (会员等级：0=普通用户，1=月度会员，2=年度会员，999=永久会员)
 * - vipExpireAt?: string (会员过期时间，ISO格式)
 */
router.put('/users/:id/vip', requireAdmin, async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;
    const { vipLevel, vipExpireAt } = req.body;
    
    if (vipLevel === undefined || vipLevel === null) {
      return res.status(400).json({
        success: false,
        message: '请提供会员等级'
      });
    }
    
    const updateData: any = {
      vip_level: vipLevel
    };
    
    // 如果设置了过期时间
    if (vipExpireAt) {
      updateData.vip_expire_at = vipExpireAt;
    } else if (vipLevel === 0) {
      // 降级为普通用户时清空过期时间
      updateData.vip_expire_at = null;
    } else if (vipLevel > 0 && vipLevel < 999) {
      // 非永久会员，自动设置过期时间
      const now = new Date();
      if (vipLevel === 1) {
        // 月度会员：30天后过期
        updateData.vip_expire_at = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (vipLevel === 2) {
        // 年度会员：365天后过期
        updateData.vip_expire_at = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
      }
    }
    
    const { data: user, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, phone, nickname, role, vip_level, vip_expire_at')
      .single();
    
    if (error) {
      throw new Error(`更新会员等级失败: ${error.message}`);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    console.log(`[用户管理] 管理员更新用户 ${user.phone} 会员等级为 ${vipLevel}`);
    
    res.json({
      success: true,
      data: user,
      message: '会员等级更新成功'
    });
  } catch (error) {
    console.error('[用户管理] 更新会员等级失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新会员等级失败'
    });
  }
});

/**
 * PUT /api/v1/admin/users/:id/role
 * 设置用户角色
 * Body参数：
 * - role: string (角色：admin/user)
 */
router.put('/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: '角色只能是 admin 或 user'
      });
    }
    
    const { data: user, error } = await client
      .from('users')
      .update({ role })
      .eq('id', id)
      .select('id, phone, nickname, role')
      .single();
    
    if (error) {
      throw new Error(`更新角色失败: ${error.message}`);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    console.log(`[用户管理] 管理员更新用户 ${user.phone} 角色为 ${role}`);
    
    res.json({
      success: true,
      data: user,
      message: '角色更新成功'
    });
  } catch (error) {
    console.error('[用户管理] 更新角色失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新角色失败'
    });
  }
});

/**
 * GET /api/v1/admin/stats
 * 获取用户统计数据
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const client = getSupabaseClient();
    
    // 并行查询统计数据
    const [
      totalResult,
      adminResult,
      vipResult,
      todayResult
    ] = await Promise.all([
      // 总用户数
      client.from('users').select('id', { count: 'exact', head: true }),
      // 管理员数
      client.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
      // 会员数（vip_level > 0）
      client.from('users').select('id', { count: 'exact', head: true }).gt('vip_level', 0),
      // 今日新增
      client.from('users').select('id', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0])
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalResult.count || 0,
        admins: adminResult.count || 0,
        vips: vipResult.count || 0,
        todayNew: todayResult.count || 0
      }
    });
  } catch (error) {
    console.error('[用户管理] 获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

export default router;
