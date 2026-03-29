/**
 * 潜在客户API路由
 * 从招标和中标信息中提取客户联系方式
 */

import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

/**
 * 获取潜在客户列表
 * Query参数：
 * - page: number (页码，默认1)
 * - pageSize: number (每页条数，默认20)
 * - industry: string (行业筛选)
 * - keyword: string (关键词搜索)
 * - customerType: string (客户类型：bidder-招标方, winner-中标方, all-全部)
 */
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const {
      page = 1,
      pageSize = 20,
      industry,
      keyword,
      customerType = 'all',
    } = req.query;

    const pageNum = Number(page);
    const sizeNum = Number(pageSize);
    const start = (pageNum - 1) * sizeNum;
    const end = start + sizeNum - 1;

    // 构建潜在客户列表
    const customers: any[] = [];

    // 1. 从招标信息中提取招标方信息
    if (customerType === 'all' || customerType === 'bidder') {
      let bidQuery = client
        .from('bids')
        .select('id, title, province, city, industry, contact_person, contact_phone, contact_address, project_location, publish_date')
        .not('contact_person', 'is', null)
        .not('contact_phone', 'is', null);

      if (industry) {
        bidQuery = bidQuery.eq('industry', industry as string);
      }
      if (keyword) {
        bidQuery = bidQuery.or(`title.ilike.%${keyword}%,contact_person.ilike.%${keyword}%,contact_address.ilike.%${keyword}%`);
      }

      const { data: bids, error: bidError } = await bidQuery.order('publish_date', { ascending: false });

      if (bidError) {
        throw new Error(`查询招标信息失败: ${bidError.message}`);
      }

      // 转换为客户格式
      bids?.forEach((bid: any) => {
        // 从contact_address或project_location提取公司名称
        const companyName = extractCompanyName(bid.contact_address) || extractCompanyName(bid.project_location) || bid.contact_address?.split('·')[0] || '招标单位';
        
        customers.push({
          id: `bidder_${bid.id}`,
          company_name: companyName,
          contact_person: bid.contact_person,
          contact_phone: bid.contact_phone,
          address: bid.contact_address || bid.project_location,
          province: bid.province,
          city: bid.city,
          industry: bid.industry,
          customer_type: 'bidder',
          source_type: '招标方',
          source_title: bid.title,
          source_date: bid.publish_date,
        });
      });
    }

    // 2. 从中标信息中提取中标方信息
    if (customerType === 'all' || customerType === 'winner') {
      let winBidQuery = client
        .from('win_bids')
        .select('id, title, province, city, industry, win_company, win_company_phone, win_company_address, win_date, publish_date')
        .not('win_company', 'is', null)
        .not('win_company_phone', 'is', null);

      if (industry) {
        winBidQuery = winBidQuery.eq('industry', industry as string);
      }
      if (keyword) {
        winBidQuery = winBidQuery.or(`title.ilike.%${keyword}%,win_company.ilike.%${keyword}%,win_company_address.ilike.%${keyword}%`);
      }

      const { data: winBids, error: winBidError } = await winBidQuery.order('publish_date', { ascending: false });

      if (winBidError) {
        throw new Error(`查询中标信息失败: ${winBidError.message}`);
      }

      // 转换为客户格式
      winBids?.forEach((winBid: any) => {
        customers.push({
          id: `winner_${winBid.id}`,
          company_name: winBid.win_company,
          contact_person: null,
          contact_phone: winBid.win_company_phone,
          address: winBid.win_company_address,
          province: winBid.province,
          city: winBid.city,
          industry: winBid.industry,
          customer_type: 'winner',
          source_type: '中标方',
          source_title: winBid.title,
          source_date: winBid.publish_date,
        });
      });
    }

    // 3. 去重（根据公司名称+电话）
    const uniqueCustomers = deduplicateCustomers(customers);

    // 4. 按日期排序
    uniqueCustomers.sort((a, b) => {
      const dateA = new Date(a.source_date || 0).getTime();
      const dateB = new Date(b.source_date || 0).getTime();
      return dateB - dateA;
    });

    // 5. 分页
    const total = uniqueCustomers.length;
    const totalPages = Math.ceil(total / sizeNum);
    const paginatedCustomers = uniqueCustomers.slice(start, end + 1);

    res.json({
      success: true,
      data: {
        list: paginatedCustomers,
        total,
        page: pageNum,
        pageSize: sizeNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error('获取潜在客户失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取潜在客户失败',
    });
  }
});

/**
 * 从地址中提取公司名称
 */
function extractCompanyName(address: string | null): string | null {
  if (!address) return null;
  
  // 常见的公司名称模式
  const patterns = [
    /(.{2,}(公司|集团|中心|院|所|局|处|部|委员会|协会|基金会|医院|学校|大学|研究院))/,
    /(.{2,}(有限|股份|责任))/,
  ];
  
  for (const pattern of patterns) {
    const match = address.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * 去重客户列表
 */
function deduplicateCustomers(customers: any[]): any[] {
  const seen = new Map<string, any>();
  
  for (const customer of customers) {
    // 使用公司名称+电话作为唯一标识
    const key = `${customer.company_name}_${customer.contact_phone}`;
    
    if (!seen.has(key)) {
      seen.set(key, customer);
    } else {
      // 如果已存在，保留信息更完整的记录
      const existing = seen.get(key);
      if (!existing.contact_person && customer.contact_person) {
        seen.set(key, customer);
      }
    }
  }
  
  return Array.from(seen.values());
}

export default router;
