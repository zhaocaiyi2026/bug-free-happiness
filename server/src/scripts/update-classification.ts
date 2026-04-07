/**
 * 批量更新旧数据的分类信息
 * 每次处理少量数据，避免API限流
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import { classifyBidTitle } from '@/services/classify-bid.js';

const BATCH_SIZE = 10;  // 每批处理数量
const DELAY_MS = 1000;  // 每批间隔时间

async function updateClassification() {
  const supabase = getSupabaseClient();
  
  console.log('[批量分类更新] 开始更新旧数据...');
  
  let totalUpdated = 0;
  let totalProcessed = 0;
  let hasMore = true;
  
  while (hasMore) {
    // 获取未分类的数据
    const { data: bids, error } = await supabase
      .from('bids')
      .select('id, title')
      .is('classified_type', null)
      .limit(BATCH_SIZE);
    
    if (error) {
      console.error('[批量分类更新] 查询失败:', error);
      break;
    }
    
    if (!bids || bids.length === 0) {
      hasMore = false;
      console.log('[批量分类更新] 没有更多需要分类的数据');
      break;
    }
    
    console.log(`[批量分类更新] 批次处理: ${bids.length} 条数据`);
    
    for (const bid of bids) {
      try {
        const result = await classifyBidTitle(bid.title);
        
        await supabase
          .from('bids')
          .update({
            classified_type: result.classifiedType,
            classified_industry: result.classifiedIndustry,
          })
          .eq('id', bid.id);
        
        totalUpdated++;
        console.log(`[更新] ID=${bid.id}: ${result.classifiedType} | ${result.classifiedIndustry}`);
      } catch (err) {
        console.error(`[更新失败] ID=${bid.id}:`, err);
      }
      
      totalProcessed++;
      
      // 每条数据间隔一小段时间
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 每批次间隔
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    
    console.log(`[批量分类更新] 进度: 已更新 ${totalUpdated}/${totalProcessed} 条`);
  }
  
  console.log(`[批量分类更新] 完成! 共更新 ${totalUpdated} 条数据`);
}

// 运行
updateClassification().catch(console.error);
