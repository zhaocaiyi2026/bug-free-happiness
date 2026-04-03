#!/usr/bin/env node

/**
 * 招标信息内容清理脚本
 * 
 * 使用方式：
 * npm run clean              # 清理最近10条数据
 * npm run clean -- 20        # 清理最近20条数据
 * npm run clean -- auto      # 自动清理模式
 * npm run clean -- --id 123  # 清理指定ID
 */

import { getSupabaseClient } from '../src/storage/database/supabase-client.js';
import { cleanBidContentWithLLM, cleanBidContentsWithLLM } from '../src/services/bid-content-cleaner.js';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function cleanSingle(id: number) {
  log('blue', `\n=== 开始清理 ID: ${id} ===\n`);
  
  try {
    const client = getSupabaseClient();
    
    // 查询数据
    const { data: bid, error } = await client
      .from('bids')
      .select('id, title, content')
      .eq('id', id)
      .single();
    
    if (error || !bid) {
      log('red', `❌ 数据不存在: ${id}`);
      return false;
    }
    
    // 执行清理
    const result = await cleanBidContentWithLLM(bid.title, bid.content);
    
    // 更新数据库
    const updateData: Record<string, unknown> = {
      content: result.content,
      updated_at: new Date().toISOString(),
    };
    
    if (result.projectName) updateData.title = result.projectName;
    if (result.budget) updateData.budget = result.budget;
    if (result.publishDate) updateData.publish_date = result.publishDate;
    if (result.deadline) updateData.deadline = result.deadline;
    if (result.contactPerson) updateData.contact_person = result.contactPerson;
    if (result.contactPhone) updateData.contact_phone = result.contactPhone;
    
    const { error: updateError } = await client
      .from('bids')
      .update(updateData)
      .eq('id', id);
    
    if (updateError) {
      log('red', `❌ 更新失败: ${updateError.message}`);
      return false;
    }
    
    log('green', `\n✅ 清理完成!\n`);
    log('cyan', `标题: ${result.projectName || result.title}`);
    if (result.budget) log('cyan', `预算: ${result.budget} 元`);
    if (result.contactPerson) log('cyan', `联系人: ${result.contactPerson}`);
    if (result.contactPhone) log('cyan', `电话: ${result.contactPhone}`);
    
    return true;
    
  } catch (error) {
    log('red', `❌ 清理失败: ${error}`);
    return false;
  }
}

async function cleanBatch(limit: number) {
  log('blue', `\n=== 开始批量清理 (最近 ${limit} 条) ===\n`);
  
  const startTime = Date.now();
  
  try {
    const client = getSupabaseClient();
    
    // 查询数据
    const { data: bids, error } = await client
      .from('bids')
      .select('id, title, content')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error || !bids || bids.length === 0) {
      log('yellow', '没有需要清理的数据');
      return;
    }
    
    log('cyan', `找到 ${bids.length} 条数据需要清理\n`);
    
    let success = 0;
    let failed = 0;
    
    // 批量清理
    const results = await cleanBidContentsWithLLM(bids, (id, isSuccess) => {
      if (isSuccess) {
        success++;
        log('green', `✅ ${id} 清理成功`);
      } else {
        failed++;
        log('red', `❌ ${id} 清理失败`);
      }
    });
    
    // 更新数据库
    for (const item of results) {
      const updateData: Record<string, unknown> = {
        content: item.result.content,
        updated_at: new Date().toISOString(),
      };
      
      if (item.result.projectName) updateData.title = item.result.projectName;
      if (item.result.budget) updateData.budget = item.result.budget;
      if (item.result.publishDate) updateData.publish_date = item.result.publishDate;
      if (item.result.deadline) updateData.deadline = item.result.deadline;
      if (item.result.contactPerson) updateData.contact_person = item.result.contactPerson;
      if (item.result.contactPhone) updateData.contact_phone = item.result.contactPhone;
      
      await client
        .from('bids')
        .update(updateData)
        .eq('id', item.id);
    }
    
    const duration = Date.now() - startTime;
    
    log('blue', `\n=== 清理完成 ===`);
    log('green', `成功: ${success} 条`);
    if (failed > 0) log('red', `失败: ${failed} 条`);
    log('cyan', `耗时: ${(duration / 1000).toFixed(1)} 秒\n`);
    
  } catch (error) {
    log('red', `❌ 批量清理失败: ${error}`);
  }
}

async function cleanAuto() {
  log('blue', '\n=== 自动清理模式 ===\n');
  
  try {
    const client = getSupabaseClient();
    
    // 查找包含HTML标签的内容
    const { data: bids, error } = await client
      .from('bids')
      .select('id, title, content')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error || !bids || bids.length === 0) {
      log('yellow', '没有需要清理的数据');
      return;
    }
    
    // 筛选包含HTML的内容
    const needsCleaning = bids.filter(bid => 
      bid.content && bid.content.includes('<')
    );
    
    if (needsCleaning.length === 0) {
      log('green', '✅ 所有数据已经清理完成');
      return;
    }
    
    log('cyan', `找到 ${needsCleaning.length} 条需要清理的数据\n`);
    
    await cleanBatch(needsCleaning.length);
    
  } catch (error) {
    log('red', `❌ 自动清理失败: ${error}`);
  }
}

async function showStats() {
  log('blue', '\n=== 清理统计 ===\n');
  
  try {
    const client = getSupabaseClient();
    
    // 统计总数
    const { count: total } = await client
      .from('bids')
      .select('*', { count: 'exact', head: true });
    
    // 统计已清理
    const { data: allBids } = await client
      .from('bids')
      .select('id, content');
    
    const cleaned = allBids?.filter(bid => 
      bid.content && !bid.content.includes('<')
    ).length || 0;
    
    const pending = (total || 0) - cleaned;
    
    log('cyan', `总数据: ${total} 条`);
    log('green', `已清理: ${cleaned} 条`);
    if (pending > 0) {
      log('yellow', `待清理: ${pending} 条`);
    } else {
      log('green', `待清理: 0 条`);
    }
    
    const percentage = total ? ((cleaned / total) * 100).toFixed(1) : '0';
    log('blue', `\n清理进度: ${percentage}%\n`);
    
  } catch (error) {
    log('red', `❌ 获取统计失败: ${error}`);
  }
}

// 解析命令行参数
const args = process.argv.slice(2);

async function main() {
  if (args.length === 0) {
    // 默认清理10条
    await cleanBatch(10);
  } else if (args[0] === 'auto') {
    await cleanAuto();
  } else if (args[0] === 'stats') {
    await showStats();
  } else if (args[0] === '--id' && args[1]) {
    await cleanSingle(parseInt(args[1]));
  } else {
    const limit = parseInt(args[0]);
    if (!isNaN(limit)) {
      await cleanBatch(limit);
    } else {
      log('red', '无效的参数');
      console.log('\n使用方式:');
      console.log('  npm run clean              # 清理最近10条');
      console.log('  npm run clean -- 20        # 清理最近20条');
      console.log('  npm run clean -- auto      # 自动清理模式');
      console.log('  npm run clean -- stats     # 查看统计');
      console.log('  npm run clean -- --id 123  # 清理指定ID');
    }
  }
}

main().then(() => process.exit(0)).catch((err) => {
  log('red', `❌ 执行失败: ${err}`);
  process.exit(1);
});
