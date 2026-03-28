/**
 * 招标信息爬虫系统 - 数据存储模块
 * 
 * 功能：
 * 1. 数据去重（基于标题+来源URL）
 * 2. 批量插入
 * 3. 数据更新
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { BidInfo, WinBidInfo } from './types';
import { CRAWLER_CONFIG, INDUSTRY_MAPPING, PROVINCE_MAPPING } from './config';

// 去重缓存（运行时内存缓存）
const dedupCache = new Set<string>();
const winBidDedupCache = new Set<string>();

/**
 * 生成去重键
 */
function generateDedupKey(bid: BidInfo): string {
  // 使用标题的hash作为去重键
  const normalizedTitle = bid.title
    .toLowerCase()
    .replace(/[\s\-_]/g, '')
    .slice(0, 100);
  
  return `${bid.source}:${normalizedTitle}`;
}

/**
 * 检查是否已存在（数据库查询）
 */
async function existsInDatabase(bid: BidInfo): Promise<boolean> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('bids')
    .select('id')
    .eq('title', bid.title)
    .eq('source_url', bid.sourceUrl)
    .maybeSingle();
  
  if (error) {
    console.error('[Storage] Error checking existence:', error);
    return false;
  }
  
  return !!data;
}

/**
 * 批量保存招标信息
 */
export async function saveBids(bids: BidInfo[]): Promise<{
  total: number;
  saved: number;
  duplicates: number;
  errors: number;
}> {
  const client = getSupabaseClient();
  const result = {
    total: bids.length,
    saved: 0,
    duplicates: 0,
    errors: 0,
  };

  if (bids.length === 0) {
    return result;
  }

  // 去重过滤
  const uniqueBids: BidInfo[] = [];
  
  for (const bid of bids) {
    const key = generateDedupKey(bid);
    
    // 内存缓存去重
    if (dedupCache.has(key)) {
      result.duplicates++;
      continue;
    }
    
    // 数据库去重
    const exists = await existsInDatabase(bid);
    if (exists) {
      dedupCache.add(key);
      result.duplicates++;
      continue;
    }
    
    uniqueBids.push(bid);
    dedupCache.add(key);
  }

  console.log(`[Storage] Unique bids: ${uniqueBids.length}, Duplicates: ${result.duplicates}`);

  // 批量插入
  const batchSize = CRAWLER_CONFIG.data.batchSize;
  
  for (let i = 0; i < uniqueBids.length; i += batchSize) {
    const batch = uniqueBids.slice(i, i + batchSize);
    
    const records = batch.map(bid => ({
      title: bid.title,
      content: bid.content || null,
      budget: bid.budget || null,
      province: bid.province || null,
      city: bid.city || null,
      industry: normalizeIndustry(bid.industry) || null,
      bid_type: bid.bidType || null,
      publish_date: bid.publishDate || null,
      deadline: bid.deadline || null,
      source: bid.source,
      source_url: bid.sourceUrl,
      is_urgent: bid.isUrgent || false,
      status: 'active',
      view_count: 0,
      // 新增联系人字段
      contact_person: bid.contactPerson || null,
      contact_phone: bid.contactPhone || null,
      contact_email: bid.contactEmail || null,
      contact_address: bid.contactAddress || null,
      // 新增详细信息字段
      project_location: bid.projectLocation || null,
      requirements: bid.requirements || null,
      open_bid_time: bid.openBidTime || null,
      open_bid_location: bid.openBidLocation || null,
    }));

    const { error } = await client
      .from('bids')
      .insert(records);

    if (error) {
      console.error('[Storage] Batch insert error:', error);
      result.errors += batch.length;
    } else {
      result.saved += batch.length;
    }
  }

  // 更新统计数据
  console.log(`[Storage] Saved: ${result.saved}, Errors: ${result.errors}`);

  return result;
}

/**
 * 规范化行业分类
 */
function normalizeIndustry(industry?: string): string | undefined {
  if (!industry) return undefined;
  
  // 尝试匹配映射表
  for (const [keyword, mapped] of Object.entries(INDUSTRY_MAPPING)) {
    if (industry.includes(keyword) || keyword.includes(industry)) {
      return mapped;
    }
  }
  
  return industry;
}

/**
 * 规范化省份
 */
function normalizeProvince(province?: string): string | undefined {
  if (!province) return undefined;
  
  for (const [keyword, mapped] of Object.entries(PROVINCE_MAPPING)) {
    if (province.includes(keyword)) {
      return mapped;
    }
  }
  
  return province;
}

/**
 * 清理过期数据
 */
export async function cleanupOldData(): Promise<number> {
  const client = getSupabaseClient();
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - CRAWLER_CONFIG.data.retentionDays);
  
  const { data, error } = await client
    .from('bids')
    .delete()
    .lt('created_at', retentionDate.toISOString())
    .select('id');
  
  if (error) {
    console.error('[Storage] Cleanup error:', error);
    return 0;
  }
  
  const deletedCount = data?.length || 0;
  console.log(`[Storage] Cleaned up ${deletedCount} old records`);
  
  return deletedCount;
}

/**
 * 获取爬虫统计
 */
export async function getCrawlerStats(): Promise<{
  totalBids: number;
  todayBids: number;
  urgentBids: number;
  sourceStats: Array<{ source: string; count: number }>;
}> {
  const client = getSupabaseClient();
  const today = new Date().toISOString().split('T')[0];
  
  // 总数
  const { count: totalBids } = await client
    .from('bids')
    .select('*', { count: 'exact', head: true });
  
  // 今日新增
  const { count: todayBids } = await client
    .from('bids')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today);
  
  // 紧急招标
  const { count: urgentBids } = await client
    .from('bids')
    .select('*', { count: 'exact', head: true })
    .eq('is_urgent', true)
    .eq('status', 'active');
  
  // 按来源统计
  const { data: sourceData } = await client
    .from('bids')
    .select('source');
  
  const sourceStats = new Map<string, number>();
  sourceData?.forEach(item => {
    const count = sourceStats.get(item.source) || 0;
    sourceStats.set(item.source, count + 1);
  });
  
  return {
    totalBids: totalBids || 0,
    todayBids: todayBids || 0,
    urgentBids: urgentBids || 0,
    sourceStats: Array.from(sourceStats.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/**
 * 清空去重缓存（重启后调用）
 */
export function clearDedupCache(): void {
  dedupCache.clear();
  winBidDedupCache.clear();
  console.log('[Storage] Dedup cache cleared');
}

// ============== 中标信息存储 ==============

/**
 * 生成中标信息去重键
 */
function generateWinBidDedupKey(winBid: WinBidInfo): string {
  const normalizedTitle = winBid.title
    .toLowerCase()
    .replace(/[\s\-_]/g, '')
    .slice(0, 100);
  
  return `${winBid.source}:${normalizedTitle}:${winBid.winCompany || ''}`;
}

/**
 * 检查中标信息是否已存在
 */
async function winBidExistsInDatabase(winBid: WinBidInfo): Promise<boolean> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('win_bids')
    .select('id')
    .eq('title', winBid.title)
    .eq('win_company', winBid.winCompany || '')
    .maybeSingle();
  
  if (error) {
    console.error('[Storage] Error checking win_bid existence:', error);
    return false;
  }
  
  return !!data;
}

/**
 * 批量保存中标信息
 */
export async function saveWinBids(winBids: WinBidInfo[]): Promise<{
  total: number;
  saved: number;
  duplicates: number;
  errors: number;
}> {
  const client = getSupabaseClient();
  const result = {
    total: winBids.length,
    saved: 0,
    duplicates: 0,
    errors: 0,
  };

  if (winBids.length === 0) {
    return result;
  }

  // 去重过滤
  const uniqueWinBids: WinBidInfo[] = [];
  
  for (const winBid of winBids) {
    const key = generateWinBidDedupKey(winBid);
    
    // 内存缓存去重
    if (winBidDedupCache.has(key)) {
      result.duplicates++;
      continue;
    }
    
    // 数据库去重
    const exists = await winBidExistsInDatabase(winBid);
    if (exists) {
      winBidDedupCache.add(key);
      result.duplicates++;
      continue;
    }
    
    uniqueWinBids.push(winBid);
    winBidDedupCache.add(key);
  }

  console.log(`[Storage] Unique win_bids: ${uniqueWinBids.length}, Duplicates: ${result.duplicates}`);

  // 批量插入
  const batchSize = CRAWLER_CONFIG.data.batchSize;
  
  for (let i = 0; i < uniqueWinBids.length; i += batchSize) {
    const batch = uniqueWinBids.slice(i, i + batchSize);
    
    const records = batch.map(winBid => ({
      title: winBid.title,
      content: winBid.content || null,
      win_amount: winBid.winAmount || null,
      province: winBid.province || null,
      city: winBid.city || null,
      industry: normalizeIndustry(winBid.industry) || null,
      bid_type: winBid.bidType || null,
      // 中标单位信息
      win_company: winBid.winCompany || null,
      win_company_address: winBid.winCompanyAddress || null,
      win_company_phone: winBid.winCompanyPhone || null,
      // 项目信息
      project_location: winBid.projectLocation || null,
      // 日期
      win_date: winBid.winDate || null,
      publish_date: winBid.publishDate || null,
      // 来源
      source: winBid.source,
      source_url: winBid.sourceUrl,
      view_count: 0,
    }));

    const { error } = await client
      .from('win_bids')
      .insert(records);

    if (error) {
      console.error('[Storage] Win bid batch insert error:', error);
      result.errors += batch.length;
    } else {
      result.saved += batch.length;
    }
  }

  console.log(`[Storage] Win bids saved: ${result.saved}, Errors: ${result.errors}`);

  return result;
}

/**
 * 获取中标信息统计
 */
export async function getWinBidStats(): Promise<{
  total: number;
  todayCount: number;
  topCompanies: Array<{ company: string; count: number }>;
}> {
  const client = getSupabaseClient();
  const today = new Date().toISOString().split('T')[0];
  
  // 总数
  const { count: total } = await client
    .from('win_bids')
    .select('*', { count: 'exact', head: true });
  
  // 今日新增
  const { count: todayCount } = await client
    .from('win_bids')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today);
  
  // 按中标单位统计
  const { data: companyData } = await client
    .from('win_bids')
    .select('win_company');
  
  const companyStats = new Map<string, number>();
  companyData?.forEach(item => {
    if (item.win_company) {
      const count = companyStats.get(item.win_company) || 0;
      companyStats.set(item.win_company, count + 1);
    }
  });
  
  const topCompanies = Array.from(companyStats.entries())
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    total: total || 0,
    todayCount: todayCount || 0,
    topCompanies,
  };
}
