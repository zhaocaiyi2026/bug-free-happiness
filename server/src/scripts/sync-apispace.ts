/**
 * APISpace数据同步脚本（优化版）
 * 
 * 特点：
 * 1. 使用列表数据直接入库（不依赖详情接口）
 * 2. 联系信息使用采购单位名称作为联系人
 * 3. 符合前端展示需求
 */

import 'dotenv/config';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

  // ==================== 配置 ====================

const CONFIG = {
  // APISpace配置
  apispace: {
    baseUrl: 'https://23330.o.apispace.com/project-info-upgrade',
    apiKey: process.env.APISPACE_API_KEY || '',
    maxRequests: 450,  // 500次额度，预留50次
    pageSize: 50,
    requestInterval: 400,  // 加快请求速度
  },
  
  // Supabase配置
  supabase: {
    url: process.env.COZE_SUPABASE_URL || '',
    anonKey: process.env.COZE_SUPABASE_ANON_KEY || '',
  },
  
  // 数据获取配置
  data: {
    // 时间范围：2025-2026年（分段获取）
    periods: [
      { label: '2025年', start: '2025-01-01', end: '2025-12-31' },
      { label: '2026年', start: '2026-01-01', end: '2026-03-31' },
    ],
    // 每个时间段每种类型最大获取条数
    maxPerPeriod: 100,
  },
};

// 省份代码映射
const PROVINCE_MAP: Record<string, string> = {
  '110000': '北京市', '120000': '天津市', '130000': '河北省', '140000': '山西省',
  '150000': '内蒙古自治区', '210000': '辽宁省', '220000': '吉林省', '230000': '黑龙江省',
  '310000': '上海市', '320000': '江苏省', '330000': '浙江省', '340000': '安徽省',
  '350000': '福建省', '360000': '江西省', '370000': '山东省', '410000': '河南省',
  '420000': '湖北省', '430000': '湖南省', '440000': '广东省', '450000': '广西壮族自治区',
  '460000': '海南省', '500000': '重庆市', '510000': '四川省', '520000': '贵州省',
  '530000': '云南省', '540000': '西藏自治区', '610000': '陕西省', '620000': '甘肃省',
  '630000': '青海省', '640000': '宁夏回族自治区', '650000': '新疆维吾尔自治区',
};

// 信息类型映射
const NEWS_TYPE_MAP: Record<number, { bidType: string; table: string }> = {
  1: { bidType: '招标公告', table: 'bids' },
  2: { bidType: '中标公告', table: 'win_bids' },
  3: { bidType: '采购合同', table: 'win_bids' },
  4: { bidType: '采购意向', table: 'bids' },
  5: { bidType: '其他公告', table: 'bids' },
};

let requestCount = 0;

// ==================== 工具函数 ====================

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchProjectList(params: Record<string, unknown>): Promise<any> {
  if (requestCount >= CONFIG.apispace.maxRequests) {
    throw new Error(`已达到请求限制 (${CONFIG.apispace.maxRequests} 次)`);
  }
  
  requestCount++;
  
  const response = await axios.post(
    `${CONFIG.apispace.baseUrl}/project-list`,
    params,
    {
      headers: {
        'X-APISpace-Token': CONFIG.apispace.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );
  
  if (response.data.code !== 200) {
    throw new Error(response.data.msg);
  }
  
  await delay(CONFIG.apispace.requestInterval);
  return response.data.data;
}

function parseBudget(money?: string): number | null {
  if (!money) return null;
  const numStr = money.replace(/[￥¥$元,，]/g, '');
  const num = parseFloat(numStr);
  if (isNaN(num)) return null;
  if (money.includes('万')) return num * 10000;
  if (money.includes('亿')) return num * 100000000;
  return num;
}

function getProvince(code?: string): string {
  return code ? (PROVINCE_MAP[code] || '未知') : '未知';
}

// ==================== 主同步类 ====================

class DataSync {
  private supabase: ReturnType<typeof createClient>;
  private stats = { bids: 0, winBids: 0, duplicates: 0, errors: [] as string[] };
  
  constructor() {
    this.supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
  }
  
  async run(): Promise<void> {
    console.log('====================================');
    console.log('APISpace 数据同步');
    console.log('====================================\n');
    
    if (!CONFIG.apispace.apiKey) {
      throw new Error('请配置APISPACE_API_KEY');
    }
    
    // 分段同步2025-2026年数据（API限制单次查询不超过1年）
    for (const period of CONFIG.data.periods) {
      if (requestCount >= CONFIG.apispace.maxRequests - 50) {
        console.log('\n已接近请求限制，停止同步');
        break;
      }
      
      console.log(`\n========== ${period.label}数据 ==========`);
      
      // 同步招标公告
      await this.syncType(1, period.start, period.end, CONFIG.data.maxPerPeriod);
      
      // 同步中标公告
      await this.syncType(2, period.start, period.end, CONFIG.data.maxPerPeriod);
    }
    
    this.printStats();
  }
  
  private async syncType(newsTypeID: number, startDate: string, endDate: string, maxCount: number): Promise<void> {
    const typeInfo = NEWS_TYPE_MAP[newsTypeID];
    if (!typeInfo) return;
    
    console.log(`\n[${typeInfo.bidType}] 开始同步...`);
    
    let page = 1;
    let hasMore = true;
    const startCount = typeInfo.table === 'bids' ? this.stats.bids : this.stats.winBids;
    
    while (hasMore && requestCount < CONFIG.apispace.maxRequests) {
      // 检查是否达到数量限制
      const currentCount = typeInfo.table === 'bids' ? this.stats.bids : this.stats.winBids;
      if (currentCount - startCount >= maxCount) {
        console.log(`  已达到本期最大条数限制 (${maxCount}条)`);
        break;
      }
      
      try {
        const result = await fetchProjectList({
          startDate,
          endDate,
          newsTypeID,
          page,
          pageSize: CONFIG.apispace.pageSize,
        });
        
        if (!result.data?.length) break;
        
        for (const item of result.data) {
          // 再次检查数量限制
          const count = typeInfo.table === 'bids' ? this.stats.bids : this.stats.winBids;
          if (count - startCount >= maxCount) break;
          
          if (typeInfo.table === 'bids') {
            await this.saveBid(item);
          } else {
            await this.saveWinBid(item);
          }
        }
        
        hasMore = result.hasNext;
        page++;
        
        const currentSaved = typeInfo.table === 'bids' ? this.stats.bids : this.stats.winBids;
        console.log(`  第${page-1}页完成 (本期: ${currentSaved - startCount}条, 累计: ${currentSaved}条)`);
        
      } catch (error) {
        console.error(`  第${page}页失败:`, error);
        break;
      }
    }
  }
  
  private async saveBid(item: any): Promise<void> {
    try {
      // 去重
      const { data: existing } = await this.supabase
        .from('bids')
        .select('id')
        .eq('source_platform', 'apispace')
        .eq('source_id', String(item.id))
        .limit(1);
      
      if (existing?.length) {
        this.stats.duplicates++;
        return;
      }
      
      // 插入数据
      const { error } = await this.supabase.from('bids').insert({
        title: item.title,
        content: item.content || `项目编号: ${item.id}`,
        budget: parseBudget(item.projectMoney)?.toString() || null,
        province: getProvince(item.proviceCode),
        city: item.cityCode || null,
        industry: item.industryCodeList?.[0] || null,
        bid_type: NEWS_TYPE_MAP[item.newsTypeID]?.bidType || '招标公告',
        publish_date: item.publishTime || null,
        contact_person: item.partANameList?.[0] || '详见原文',
        contact_phone: '详见原文',
        source_url: `https://apispace.com/project/${item.id}`,
        source_platform: 'apispace',
        source_id: String(item.id),
        data_type: 'api',
      });
      
      if (!error) this.stats.bids++;
      
    } catch (error) {
      this.stats.errors.push(`招标[${item.id}]: ${error}`);
    }
  }
  
  private async saveWinBid(item: any): Promise<void> {
    try {
      // 去重
      const { data: existing } = await this.supabase
        .from('win_bids')
        .select('id')
        .eq('source_platform', 'apispace')
        .eq('source_id', String(item.id))
        .limit(1);
      
      if (existing?.length) {
        this.stats.duplicates++;
        return;
      }
      
      // 插入数据
      const { error } = await this.supabase.from('win_bids').insert({
        title: item.title,
        content: item.content || `项目编号: ${item.id}`,
        win_amount: parseBudget(item.projectMoney)?.toString() || null,
        province: getProvince(item.proviceCode),
        city: item.cityCode || null,
        industry: item.industryCodeList?.[0] || null,
        publish_date: item.publishTime || null,
        win_company: item.partBNameList?.[0] || item.partANameList?.[0] || '详见原文',
        source_url: `https://apispace.com/project/${item.id}`,
        source_platform: 'apispace',
        source_id: String(item.id),
        data_type: 'api',
      });
      
      if (!error) this.stats.winBids++;
      
    } catch (error) {
      this.stats.errors.push(`中标[${item.id}]: ${error}`);
    }
  }
  
  private printStats(): void {
    console.log('\n====================================');
    console.log('同步完成');
    console.log('====================================');
    console.log(`请求次数: ${requestCount}/${CONFIG.apispace.maxRequests}`);
    console.log(`招标数据: ${this.stats.bids} 条`);
    console.log(`中标数据: ${this.stats.winBids} 条`);
    console.log(`重复跳过: ${this.stats.duplicates} 条`);
    console.log('====================================\n');
  }
}

// ==================== 执行 ====================

async function main(): Promise<void> {
  try {
    const sync = new DataSync();
    await sync.run();
    process.exit(0);
  } catch (error) {
    console.error('\n[错误]', error);
    process.exit(1);
  }
}

main();
