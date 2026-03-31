/**
 * APISpace数据同步脚本
 * 
 * 使用说明：
 * 1. 确保已配置APISPACE_API_KEY环境变量
 * 2. 运行: npx tsx src/scripts/sync-apispace-data.ts
 * 
 * 功能：
 * - 从APISpace获取招标和中标数据
 * - 自动获取详情补充联系信息
 * - 去重后存入数据库
 * - 符合前端导入规则
 */

import 'dotenv/config';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// ==================== 配置 ====================

const APISPACE_CONFIG = {
  baseUrl: 'https://23330.o.apispace.com/project-info-upgrade',
  apiKey: process.env.APISPACE_API_KEY || '',
  
  // 请求限制（500次额度，保守使用）
  maxRequests: 450,  // 预留50次余量
  
  // 每次请求条数
  pageSize: 50,
  
  // 请求间隔（毫秒）
  requestInterval: 500,
};

// Supabase配置
const SUPABASE_CONFIG = {
  url: process.env.COZE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  anonKey: process.env.COZE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
};

// 省份代码映射
const PROVINCE_CODE_MAP: Record<string, string> = {
  '110000': '北京市', '120000': '天津市', '130000': '河北省', '140000': '山西省',
  '150000': '内蒙古自治区', '210000': '辽宁省', '220000': '吉林省', '230000': '黑龙江省',
  '310000': '上海市', '320000': '江苏省', '330000': '浙江省', '340000': '安徽省',
  '350000': '福建省', '360000': '江西省', '370000': '山东省', '410000': '河南省',
  '420000': '湖北省', '430000': '湖南省', '440000': '广东省', '450000': '广西壮族自治区',
  '460000': '海南省', '500000': '重庆市', '510000': '四川省', '520000': '贵州省',
  '530000': '云南省', '540000': '西藏自治区', '610000': '陕西省', '620000': '甘肃省',
  '630000': '青海省', '640000': '宁夏回族自治区', '650000': '新疆维吾尔自治区',
};

// ==================== 工具函数 ====================

let requestCount = 0;

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiSpaceRequest(endpoint: string, params: Record<string, unknown>): Promise<any> {
  if (requestCount >= APISPACE_CONFIG.maxRequests) {
    throw new Error(`已达到请求限制 (${APISPACE_CONFIG.maxRequests} 次)`);
  }
  
  requestCount++;
  console.log(`[APISpace] 请求 #${requestCount}: ${endpoint}`);
  
  const response = await axios.post(
    `${APISPACE_CONFIG.baseUrl}${endpoint}`,
    params,
    {
      headers: {
        'X-APISpace-Token': APISPACE_CONFIG.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );
  
  await delay(APISPACE_CONFIG.requestInterval);
  
  if (response.data.code !== 200) {
    throw new Error(response.data.msg);
  }
  
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

function getProvinceName(code?: string): string | undefined {
  if (!code) return undefined;
  return PROVINCE_CODE_MAP[code];
}

// ==================== 数据同步类 ====================

class APISpaceDataSync {
  private supabase: ReturnType<typeof createClient>;
  private savedBids = 0;
  private savedWinBids = 0;
  private duplicates = 0;
  private invalid = 0;
  private errors: string[] = [];
  
  constructor() {
    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
      throw new Error('请配置SUPABASE_URL和SUPABASE_ANON_KEY环境变量');
    }
    
    this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  }
  
  /**
   * 执行完整同步
   */
  async sync(): Promise<void> {
    console.log('====================================');
    console.log('APISpace 数据同步开始');
    console.log('====================================');
    console.log(`API Key: ${APISPACE_CONFIG.apiKey ? '已配置' : '未配置'}`);
    console.log(`最大请求数: ${APISPACE_CONFIG.maxRequests}`);
    console.log('====================================\n');
    
    if (!APISPACE_CONFIG.apiKey) {
      throw new Error('请配置APISPACE_API_KEY环境变量');
    }
    
    // 1. 同步招标数据
    await this.syncBids();
    
    // 2. 同步中标数据
    await this.syncWinBids();
    
    // 打印统计
    this.printStats();
  }
  
  /**
   * 同步招标数据
   */
  private async syncBids(): Promise<void> {
    console.log('\n[招标数据] 开始同步...');
    
    let page = 1;
    let hasMore = true;
    
    // 获取最近7天的数据
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`[招标数据] 时间范围: ${startDate} ~ ${endDate}`);
    
    while (hasMore && requestCount < APISPACE_CONFIG.maxRequests) {
      try {
        const result = await apiSpaceRequest('/project-list', {
          startDate,
          endDate,
          newsTypeID: 1, // 招标公告
          page,
          pageSize: APISPACE_CONFIG.pageSize,
        });
        
        const { data, total } = result;
        
        if (!data || data.length === 0) {
          console.log(`[招标数据] 第${page}页无数据`);
          break;
        }
        
        console.log(`[招标数据] 第${page}页: ${data.length}条 (共${total}条)`);
        
        // 处理每条数据
        for (const item of data) {
          await this.processBidItem(item);
        }
        
        hasMore = page * APISPACE_CONFIG.pageSize < total;
        page++;
        
      } catch (error) {
        console.error(`[招标数据] 第${page}页获取失败:`, error);
        break;
      }
    }
    
    console.log(`[招标数据] 同步完成: 保存${this.savedBids}条, 重复${this.duplicates}条, 无效${this.invalid}条`);
  }
  
  /**
   * 同步中标数据
   */
  private async syncWinBids(): Promise<void> {
    console.log('\n[中标数据] 开始同步...');
    
    let page = 1;
    let hasMore = true;
    
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`[中标数据] 时间范围: ${startDate} ~ ${endDate}`);
    
    while (hasMore && requestCount < APISPACE_CONFIG.maxRequests) {
      try {
        const result = await apiSpaceRequest('/project-list', {
          startDate,
          endDate,
          newsTypeID: 2, // 中标公告
          page,
          pageSize: APISPACE_CONFIG.pageSize,
        });
        
        const { data, total } = result;
        
        if (!data || data.length === 0) {
          console.log(`[中标数据] 第${page}页无数据`);
          break;
        }
        
        console.log(`[中标数据] 第${page}页: ${data.length}条 (共${total}条)`);
        
        // 处理每条数据
        for (const item of data) {
          await this.processWinBidItem(item);
        }
        
        hasMore = page * APISPACE_CONFIG.pageSize < total;
        page++;
        
      } catch (error) {
        console.error(`[中标数据] 第${page}页获取失败:`, error);
        break;
      }
    }
    
    console.log(`[中标数据] 同步完成: 保存${this.savedWinBids}条, 重复${this.duplicates}条, 无效${this.invalid}条`);
  }
  
  /**
   * 处理招标数据项
   */
  private async processBidItem(item: any): Promise<void> {
    try {
      // 获取详情补充联系信息
      let contactPerson = '';
      let contactPhone = '';
      let content = '';
      let deadline = '';
      
      if (requestCount < APISPACE_CONFIG.maxRequests) {
        try {
          const detail = await apiSpaceRequest('/project-detail', { id: item.id });
          
          if (detail) {
            contactPerson = detail.buyerContact || '';
            contactPhone = detail.buyerPhone || detail.buyerContact || '';
            content = detail.content || '';
            deadline = detail.deadline || '';
          }
        } catch (error) {
          console.log(`[招标数据] 详情获取失败: ${item.id}`);
        }
      }
      
      // 从标题提取联系人（如果详情中没有）
      if (!contactPerson && item.title) {
        const match = item.title.match(/[^\s]+(?=项目|采购)/);
        if (match) contactPerson = match[0];
      }
      
      // 数据质量检查：必须有联系电话和联系人
      if (!contactPhone || !contactPerson) {
        this.invalid++;
        return;
      }
      
      // 去重检查
      const { data: existing } = await this.supabase
        .from('bids')
        .select('id')
        .eq('source_platform', 'apispace')
        .eq('source_id', String(item.id))
        .limit(1);
      
      if (existing && existing.length > 0) {
        this.duplicates++;
        return;
      }
      
      // 插入数据
      const { error } = await this.supabase.from('bids').insert({
        title: item.title,
        content: content || '',
        budget: item.projectMoney ? parseBudget(item.projectMoney)?.toString() : null,
        province: getProvinceName(item.proviceCode),
        city: item.cityCode,
        industry: item.industryCodeList?.[0],
        bid_type: '公开招标',
        publish_date: item.publishTime ? new Date(item.publishTime).toISOString() : null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        contact_person: contactPerson,
        contact_phone: contactPhone,
        source_url: `https://apispace.com/project/${item.id}`,
        source_platform: 'apispace',
        source_id: String(item.id),
        data_type: 'api',
      });
      
      if (error) {
        this.errors.push(`招标[${item.id}]: ${error.message}`);
      } else {
        this.savedBids++;
      }
      
    } catch (error) {
      this.errors.push(`招标[${item.id}]: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 处理中标数据项
   */
  private async processWinBidItem(item: any): Promise<void> {
    try {
      // 获取详情
      let winCompany = item.partBNameList?.[0] || '';
      let winAmount = item.projectMoney;
      let content = '';
      let winCompanyPhone = '';
      
      if (requestCount < APISPACE_CONFIG.maxRequests) {
        try {
          const detail = await apiSpaceRequest('/project-detail', { id: item.id });
          
          if (detail) {
            winCompany = winCompany || detail.winCompany || '';
            winAmount = winAmount || detail.winAmount;
            content = detail.content || '';
            winCompanyPhone = detail.winCompanyPhone || '';
          }
        } catch (error) {
          console.log(`[中标数据] 详情获取失败: ${item.id}`);
        }
      }
      
      // 数据质量检查：必须有中标单位
      if (!winCompany) {
        this.invalid++;
        return;
      }
      
      // 去重检查
      const { data: existing } = await this.supabase
        .from('win_bids')
        .select('id')
        .eq('source_platform', 'apispace')
        .eq('source_id', String(item.id))
        .limit(1);
      
      if (existing && existing.length > 0) {
        this.duplicates++;
        return;
      }
      
      // 插入数据
      const { error } = await this.supabase.from('win_bids').insert({
        title: item.title,
        content: content || '',
        win_amount: winAmount ? parseBudget(winAmount)?.toString() : null,
        province: getProvinceName(item.proviceCode),
        city: item.cityCode,
        industry: item.industryCodeList?.[0],
        publish_date: item.publishTime ? new Date(item.publishTime).toISOString() : null,
        win_company: winCompany,
        win_company_phone: winCompanyPhone,
        source_url: `https://apispace.com/project/${item.id}`,
        source_platform: 'apispace',
        source_id: String(item.id),
        data_type: 'api',
      });
      
      if (error) {
        this.errors.push(`中标[${item.id}]: ${error.message}`);
      } else {
        this.savedWinBids++;
      }
      
    } catch (error) {
      this.errors.push(`中标[${item.id}]: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 打印统计信息
   */
  private printStats(): void {
    console.log('\n====================================');
    console.log('数据同步完成');
    console.log('====================================');
    console.log(`请求次数: ${requestCount}/${APISPACE_CONFIG.maxRequests}`);
    console.log(`招标数据: 保存 ${this.savedBids} 条`);
    console.log(`中标数据: 保存 ${this.savedWinBids} 条`);
    console.log(`重复跳过: ${this.duplicates} 条`);
    console.log(`无效数据: ${this.invalid} 条`);
    
    if (this.errors.length > 0) {
      console.log(`\n错误信息 (前10条):`);
      this.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
    }
    
    console.log('====================================\n');
  }
}

// ==================== 主函数 ====================

async function main(): Promise<void> {
  try {
    const sync = new APISpaceDataSync();
    await sync.sync();
    process.exit(0);
  } catch (error) {
    console.error('\n[错误]', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
