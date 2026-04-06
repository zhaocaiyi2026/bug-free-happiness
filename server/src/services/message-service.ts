/**
 * 消息生成服务
 * 负责生成各类提醒消息：
 * 1. 投标截止提醒 - 用户收藏的招标即将截止
 * 2. 中标公告提醒 - 用户收藏的招标发布了中标公告
 * 3. 新招标匹配 - 用户订阅条件匹配到新招标
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// 消息类型
export type MessageType = 'alert' | 'subscribe' | 'system';

// 消息子类型
export type MessageSubType = 'deadline' | 'winbid' | 'match';

interface CreateMessageParams {
  userId: number;
  type: MessageType;
  title: string;
  description: string;
  data?: Record<string, any>;
  subType?: MessageSubType;
}

/**
 * 创建消息
 */
async function createMessage(params: CreateMessageParams): Promise<void> {
  const client = getSupabaseClient();
  
  // 检查是否已存在相同消息（避免重复）
  const { data: existing } = await client
    .from('messages')
    .select('id')
    .eq('user_id', params.userId)
    .eq('title', params.title)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24小时内
    .maybeSingle();

  if (existing) {
    return; // 已存在，不重复创建
  }

  await client.from('messages').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    description: params.description,
    data: params.data || {},
    is_read: false,
  });
}

/**
 * 生成投标截止提醒
 * 查询用户收藏的招标中，截止日期在未来7天内到期的
 */
export async function generateDeadlineReminders(): Promise<{ count: number; details: string[] }> {
  const client = getSupabaseClient();
  const details: string[] = [];
  let totalCreated = 0;

  try {
    // 获取所有收藏记录，关联招标信息
    const { data: favorites, error } = await client
      .from('favorites')
      .select(`
        id,
        user_id,
        bid_id,
        bids (
          id,
          title,
          deadline,
          province,
          city
        )
      `)
      .not('bid_id', 'is', null);

    if (error || !favorites) {
      console.error('查询收藏失败:', error);
      return { count: 0, details: [] };
    }

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const favorite of favorites) {
      const bid = favorite.bids as any;
      if (!bid || !bid.deadline) continue;

      const deadline = new Date(bid.deadline);
      
      // 检查截止日期在未来7天内
      if (deadline > now && deadline <= sevenDaysLater) {
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        const title = `投标截止提醒：${bid.title?.substring(0, 20) || '招标项目'}...`;
        const description = `您收藏的「${bid.title?.substring(0, 30) || '招标项目'}」将在${daysLeft}天后截止投标（${bid.province || ''}${bid.city || ''}），请及时处理。`;

        await createMessage({
          userId: favorite.user_id,
          type: 'alert',
          title,
          description,
          data: {
            bidId: bid.id,
            deadline: bid.deadline,
            daysLeft,
            subType: 'deadline',
          },
        });

        totalCreated++;
        details.push(`用户${favorite.user_id}: ${bid.title?.substring(0, 15)}... 还剩${daysLeft}天`);
      }
    }

    console.log(`[消息服务] 生成投标截止提醒 ${totalCreated} 条`);
    return { count: totalCreated, details };
  } catch (error) {
    console.error('生成投标截止提醒失败:', error);
    return { count: 0, details: [] };
  }
}

/**
 * 生成中标公告提醒
 * 查询用户收藏的招标中，有对应中标公告的
 */
export async function generateWinBidReminders(): Promise<{ count: number; details: string[] }> {
  const client = getSupabaseClient();
  const details: string[] = [];
  let totalCreated = 0;

  try {
    // 获取所有收藏记录
    const { data: favorites, error } = await client
      .from('favorites')
      .select(`
        id,
        user_id,
        bid_id,
        bids (
          id,
          title,
          province,
          city
        )
      `)
      .not('bid_id', 'is', null);

    if (error || !favorites) {
      console.error('查询收藏失败:', error);
      return { count: 0, details: [] };
    }

    for (const favorite of favorites) {
      const bid = favorite.bids as any;
      if (!bid || !bid.id) continue;

      // 查询该招标是否有中标公告（通过标题匹配）
      const { data: winBids } = await client
        .from('win_bids')
        .select('id, title, win_company, win_amount, publish_date')
        .ilike('title', `%${bid.title?.substring(0, 20) || ''}%`)
        .gte('publish_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7天内发布
        .limit(1);

      if (winBids && winBids.length > 0) {
        const winBid = winBids[0];
        
        // 检查是否已经发送过该中标公告的通知
        const { data: existingMsg } = await client
          .from('messages')
          .select('id')
          .eq('user_id', favorite.user_id)
          .eq('type', 'alert')
          .contains('data', { winBidId: winBid.id })
          .maybeSingle();

        if (existingMsg) continue; // 已通知过

        const title = `中标公告：${winBid.title?.substring(0, 20) || '项目'}...`;
        const description = `您关注的「${bid.title?.substring(0, 25) || '项目'}」已发布中标公告，中标单位：${winBid.win_company || '未知'}，金额：${winBid.win_amount ? (winBid.win_amount / 10000).toFixed(0) + '万' : '未公布'}元。`;

        await createMessage({
          userId: favorite.user_id,
          type: 'alert',
          title,
          description,
          data: {
            bidId: bid.id,
            winBidId: winBid.id,
            winCompany: winBid.win_company,
            winAmount: winBid.win_amount,
            subType: 'winbid',
          },
        });

        totalCreated++;
        details.push(`用户${favorite.user_id}: ${winBid.title?.substring(0, 15)}... 中标单位: ${winBid.win_company}`);
      }
    }

    console.log(`[消息服务] 生成中标公告提醒 ${totalCreated} 条`);
    return { count: totalCreated, details };
  } catch (error) {
    console.error('生成中标公告提醒失败:', error);
    return { count: 0, details: [] };
  }
}

/**
 * 生成新招标匹配提醒
 * 根据用户订阅条件匹配新招标
 */
export async function generateMatchReminders(): Promise<{ count: number; details: string[] }> {
  const client = getSupabaseClient();
  const details: string[] = [];
  let totalCreated = 0;

  try {
    // 获取所有启用的订阅
    const { data: subscriptions, error } = await client
      .from('subscriptions')
      .select('id, user_id, type, value')
      .eq('enabled', true);

    if (error || !subscriptions) {
      console.error('查询订阅失败:', error);
      return { count: 0, details: [] };
    }

    // 24小时内的新招标
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    for (const sub of subscriptions) {
      let matchedBids: any[] = [];

      switch (sub.type) {
        case 'industry': {
          // 行业订阅：匹配招标标题
          const { data } = await client
            .from('bids')
            .select('id, title, budget, province, city, deadline')
            .ilike('title', `%${sub.value}%`)
            .gte('created_at', oneDayAgo)
            .limit(10);
          matchedBids = data || [];
          break;
        }
        case 'keyword': {
          // 关键词订阅：匹配招标标题
          const { data } = await client
            .from('bids')
            .select('id, title, budget, province, city, deadline')
            .ilike('title', `%${sub.value}%`)
            .gte('created_at', oneDayAgo)
            .limit(10);
          matchedBids = data || [];
          break;
        }
        case 'region': {
          // 地区订阅：匹配省份
          const { data } = await client
            .from('bids')
            .select('id, title, budget, province, city, deadline')
            .eq('province', sub.value)
            .gte('created_at', oneDayAgo)
            .limit(10);
          matchedBids = data || [];
          break;
        }
      }

      if (matchedBids.length > 0) {
        // 批量创建消息（最多取前3条）
        const topBids = matchedBids.slice(0, 3);
        
        for (const bid of topBids) {
          // 检查是否已通知过
          const { data: existingMsg } = await client
            .from('messages')
            .select('id')
            .eq('user_id', sub.user_id)
            .eq('type', 'subscribe')
            .contains('data', { bidId: bid.id, subscriptionId: sub.id })
            .maybeSingle();

          if (existingMsg) continue;

          const title = `新招标匹配：${bid.title?.substring(0, 20) || '项目'}...`;
          const description = `根据您的订阅「${sub.value}」，发现新招标「${bid.title?.substring(0, 30) || '项目'}」，预算${bid.budget ? (bid.budget / 10000).toFixed(0) + '万' : '未知'}元，截止日期：${bid.deadline ? new Date(bid.deadline).toLocaleDateString() : '未知'}。`;

          await createMessage({
            userId: sub.user_id,
            type: 'subscribe',
            title,
            description,
            data: {
              bidId: bid.id,
              subscriptionId: sub.id,
              subscriptionType: sub.type,
              subscriptionValue: sub.value,
              subType: 'match',
            },
          });

          totalCreated++;
        }

        details.push(`用户${sub.user_id}: 订阅「${sub.value}」匹配到${matchedBids.length}条新招标`);
      }
    }

    console.log(`[消息服务] 生成新招标匹配提醒 ${totalCreated} 条`);
    return { count: totalCreated, details };
  } catch (error) {
    console.error('生成新招标匹配提醒失败:', error);
    return { count: 0, details: [] };
  }
}

/**
 * 生成所有类型的消息
 */
export async function generateAllMessages(): Promise<{
  deadline: { count: number; details: string[] };
  winbid: { count: number; details: string[] };
  match: { count: number; details: string[] };
  total: number;
}> {
  console.log('[消息服务] 开始生成所有消息...');
  
  const deadline = await generateDeadlineReminders();
  const winbid = await generateWinBidReminders();
  const match = await generateMatchReminders();

  const total = deadline.count + winbid.count + match.count;
  
  console.log(`[消息服务] 完成，共生成 ${total} 条消息`);
  
  return { deadline, winbid, match, total };
}
