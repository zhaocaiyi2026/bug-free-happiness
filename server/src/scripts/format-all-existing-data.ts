/**
 * 批量格式化所有现有数据
 * 只处理现有数据，后续新数据不处理
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import { formatBidDetail, formatWinBidDetail, isServiceAvailable } from '../services/bid-detail-formatter.js';

const BATCH_SIZE = 10; // 每批处理数量
const DELAY_BETWEEN_ITEMS = 300; // 每条数据间隔(ms)
const DELAY_BETWEEN_BATCHES = 1000; // 每批间隔(ms)

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function formatAllBids() {
  console.log('\n========== 开始格式化招标数据 ==========\n');
  
  const supabase = getSupabaseClient();
  
  // 获取需要格式化的记录
  const { data: items, error } = await supabase
    .from('bids')
    .select('id, title, content')
    .not('content', 'is', null)
    .is('formatted_content', null)
    .order('id', { ascending: true });
  
  if (error) {
    console.error('查询失败:', error);
    return { processed: 0, failed: 0 };
  }
  
  if (!items || items.length === 0) {
    console.log('没有需要格式化的招标数据');
    return { processed: 0, failed: 0 };
  }
  
  console.log(`共有 ${items.length} 条招标数据需要格式化\n`);
  
  let processed = 0;
  let failed = 0;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`[${i + 1}/${items.length}] 处理招标 #${item.id}: ${item.title?.substring(0, 30)}...`);
    
    try {
      const formatted = await formatBidDetail(item.content);
      
      if (formatted && formatted.formattedContent) {
        await supabase
          .from('bids')
          .update({ formatted_content: formatted.formattedContent })
          .eq('id', item.id);
        
        processed++;
        console.log(`  ✅ 成功`);
      } else {
        failed++;
        console.log(`  ⚠️ 格式化结果为空`);
      }
    } catch (e) {
      failed++;
      console.error(`  ❌ 失败:`, e instanceof Error ? e.message : e);
    }
    
    // 延迟避免API限流
    if (i < items.length - 1) {
      await sleep(DELAY_BETWEEN_ITEMS);
    }
    
    // 每批之后休息
    if ((i + 1) % BATCH_SIZE === 0) {
      console.log(`\n--- 已处理 ${i + 1} 条，休息 ${DELAY_BETWEEN_BATCHES}ms ---\n`);
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }
  
  console.log(`\n招标数据处理完成: 成功 ${processed}, 失败 ${failed}\n`);
  return { processed, failed };
}

async function formatAllWinBids() {
  console.log('\n========== 开始格式化中标数据 ==========\n');
  
  const supabase = getSupabaseClient();
  
  // 获取需要格式化的记录
  const { data: items, error } = await supabase
    .from('win_bids')
    .select('id, title, content')
    .not('content', 'is', null)
    .is('formatted_content', null)
    .order('id', { ascending: true });
  
  if (error) {
    console.error('查询失败:', error);
    return { processed: 0, failed: 0 };
  }
  
  if (!items || items.length === 0) {
    console.log('没有需要格式化的中标数据');
    return { processed: 0, failed: 0 };
  }
  
  console.log(`共有 ${items.length} 条中标数据需要格式化\n`);
  
  let processed = 0;
  let failed = 0;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`[${i + 1}/${items.length}] 处理中标 #${item.id}: ${item.title?.substring(0, 30)}...`);
    
    try {
      const formatted = await formatWinBidDetail(item.content);
      
      if (formatted) {
        await supabase
          .from('win_bids')
          .update({ formatted_content: formatted })
          .eq('id', item.id);
        
        processed++;
        console.log(`  ✅ 成功`);
      } else {
        failed++;
        console.log(`  ⚠️ 格式化结果为空`);
      }
    } catch (e) {
      failed++;
      console.error(`  ❌ 失败:`, e instanceof Error ? e.message : e);
    }
    
    // 延迟避免API限流
    if (i < items.length - 1) {
      await sleep(DELAY_BETWEEN_ITEMS);
    }
    
    // 每批之后休息
    if ((i + 1) % BATCH_SIZE === 0) {
      console.log(`\n--- 已处理 ${i + 1} 条，休息 ${DELAY_BETWEEN_BATCHES}ms ---\n`);
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }
  
  console.log(`\n中标数据处理完成: 成功 ${processed}, 失败 ${failed}\n`);
  return { processed, failed };
}

async function main() {
  console.log('========================================');
  console.log('   批量格式化现有数据脚本');
  console.log('   只处理现有数据，后续新数据不处理');
  console.log('========================================');
  
  // 检查服务是否可用
  if (!isServiceAvailable()) {
    console.error('错误: 豆包大模型服务不可用');
    process.exit(1);
  }
  
  console.log('豆包大模型服务可用，开始处理...\n');
  
  // 先处理招标数据
  const bidsResult = await formatAllBids();
  
  // 再处理中标数据
  const winBidsResult = await formatAllWinBids();
  
  console.log('\n========================================');
  console.log('   全部处理完成');
  console.log(`   招标: 成功 ${bidsResult.processed}, 失败 ${bidsResult.failed}`);
  console.log(`   中标: 成功 ${winBidsResult.processed}, 失败 ${winBidsResult.failed}`);
  console.log('========================================\n');
}

main().catch(console.error);
