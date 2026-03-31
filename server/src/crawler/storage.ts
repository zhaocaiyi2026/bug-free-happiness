/**
 * 数据存储模块
 */

import { createClient } from '@supabase/supabase-js';
import type { BidData, CrawlerStats } from './types.js';

export class DataStorage {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    const url = process.env.COZE_SUPABASE_URL;
    const key = process.env.COZE_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error('Supabase配置缺失');
    }
    
    this.supabase = createClient(url, key);
  }

  /**
   * 批量保存招标数据
   */
  async saveBatch(
    dataList: BidData[],
    stats: CrawlerStats
  ): Promise<{ saved: number; duplicates: number; errors: string[] }> {
    const errors: string[] = [];
    let saved = 0;
    let duplicates = 0;

    for (const data of dataList) {
      try {
        // 去重检查
        const { data: existing } = await this.supabase
          .from('bids')
          .select('id')
          .eq('source_platform', data.source_platform)
          .eq('source_id', data.source_id)
          .limit(1);

        if (existing && existing.length > 0) {
          duplicates++;
          continue;
        }

        // 插入数据
        const { error } = await this.supabase
          .from('bids')
          .insert({
            title: data.title,
            content: data.content,
            announcement_type: data.announcement_type,
            project_code: data.project_code,
            budget: data.budget,
            procurement_method: data.procurement_method,
            province: data.province,
            city: data.city,
            region_code: data.region_code,
            project_location: data.project_location,
            industry: data.industry,
            category_code: data.category_code,
            publish_date: data.publish_date,
            deadline: data.deadline,
            open_bid_time: data.open_bid_time,
            open_bid_location: data.open_bid_location,
            purchaser_name: data.purchaser_name,
            purchaser_contact: data.purchaser_contact,
            purchaser_phone: data.purchaser_phone,
            purchaser_address: data.purchaser_address,
            agency_name: data.agency_name,
            agency_contact: data.agency_contact,
            agency_phone: data.agency_phone,
            winning_bidder: data.winning_bidder,
            winning_amount: data.winning_amount,
            contact_person: data.contact_person,
            contact_phone: data.contact_phone,
            contact_email: data.contact_email,
            contact_address: data.contact_address,
            requirements: data.requirements,
            source_url: data.source_url,
            source_platform: data.source_platform,
            source_id: data.source_id,
            data_type: data.data_type,
            status: data.status || 'active',
          });

        if (error) {
          errors.push(`[${data.source_id}] ${error.message}`);
        } else {
          saved++;
        }

      } catch (error: any) {
        errors.push(`[${data.source_id}] ${error.message}`);
      }
    }

    stats.savedItems += saved;
    stats.duplicateItems += duplicates;
    stats.errorItems += dataList.length - saved - duplicates;
    stats.errors.push(...errors);

    return { saved, duplicates, errors };
  }

  /**
   * 获取统计数据
   */
  async getStats(): Promise<{
    total: number;
    byPlatform: Record<string, number>;
    byType: Record<string, number>;
    byProvince: Record<string, number>;
  }> {
    // 总数
    const { count: total } = await this.supabase
      .from('bids')
      .select('*', { count: 'exact', head: true });

    // 按平台统计
    const { data: platformData } = await this.supabase
      .from('bids')
      .select('source_platform');

    const byPlatform: Record<string, number> = {};
    platformData?.forEach(item => {
      const platform = item.source_platform || 'unknown';
      byPlatform[platform] = (byPlatform[platform] || 0) + 1;
    });

    // 按类型统计
    const { data: typeData } = await this.supabase
      .from('bids')
      .select('announcement_type');

    const byType: Record<string, number> = {};
    typeData?.forEach(item => {
      const type = item.announcement_type || '招标公告';
      byType[type] = (byType[type] || 0) + 1;
    });

    // 按省份统计
    const { data: provinceData } = await this.supabase
      .from('bids')
      .select('province');

    const byProvince: Record<string, number> = {};
    provinceData?.forEach(item => {
      const province = item.province || '未知';
      byProvince[province] = (byProvince[province] || 0) + 1;
    });

    return {
      total: total || 0,
      byPlatform,
      byType,
      byProvince,
    };
  }

  /**
   * 清理过期数据
   */
  async cleanup(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await this.supabase
      .from('bids')
      .delete()
      .lt('publish_date', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('清理数据失败:', error);
      return 0;
    }

    return data?.length || 0;
  }
}
