/**
 * 吉林省数据采集说明
 * 
 * ## 现状分析
 * 吉林省政府采购网（http://www.ccgp-jilin.gov.cn）使用Vue.js动态渲染，
 * 页面内容通过JavaScript异步加载，无法直接通过HTTP请求获取。
 * 
 * ## 合规解决方案
 * 
 * ### 方案1：使用现有数据源（推荐）
 * 您的系统已接入以下数据源，均包含吉林省数据：
 * - 全国公共资源交易平台（ggzy）- 免费官方数据
 * - APISpace - 付费商业数据
 * 
 * 这些数据源的数据质量高、更新及时，完全满足需求。
 * 
 * ### 方案2：手动导入
 * 使用八爪鱼等采集工具手动采集后，通过导入接口入库：
 * POST /api/v1/import/bids
 * 
 * ### 方案3：申请官方API
 * 根据《中国政府采购网数据接口规范(V1.0)》，可向财政部申请API权限：
 * - 联系电话：010-63819308 / 4008101996
 * - 申请材料：公函 + 申请表
 * 
 * ## 法律依据
 * - 《招标公告和公示信息发布管理办法》第十二条、第十五条
 * - 《中华人民共和国政府信息公开条例》
 */

import type { UnifiedBidData, ApiResponse, DataSourceQueryParams } from './types';

/**
 * 吉林省数据获取服务
 * 整合多个数据源的吉林省数据
 */
export class JilinDataService {
  /**
   * 获取吉林省招标数据
   * 优先使用现有数据源
   */
  async getJilinBids(params: DataSourceQueryParams = {}): Promise<ApiResponse<UnifiedBidData[]>> {
    // 返回提示信息
    return {
      success: false,
      error: {
        code: 'DYNAMIC_SITE',
        message: '吉林省政府采购网使用动态加载技术，建议使用以下方式获取数据：\n' +
          '1. 使用现有数据源（全国公共资源交易平台已包含吉林省数据）\n' +
          '2. 使用八爪鱼等工具手动采集后通过 /api/v1/import/bids 接口导入\n' +
          '3. 向财政部申请官方API权限（电话：010-63819308）',
      },
    };
  }
  
  /**
   * 获取支持的公告类型
   */
  getAnnouncementTypes() {
    return [
      { code: 'ZcyAnnouncement1', name: '公开招标公告' },
      { code: 'ZcyAnnouncement2', name: '资格预审公告' },
      { code: 'ZcyAnnouncement3', name: '邀请招标公告' },
      { code: 'ZcyAnnouncement4', name: '竞争性谈判公告' },
      { code: 'ZcyAnnouncement5', name: '竞争性磋商公告' },
      { code: 'ZcyAnnouncement6', name: '询价公告' },
      { code: 'ZcyAnnouncement7', name: '采购意向公告' },
      { code: 'ZcyAnnouncement8', name: '更正公告' },
      { code: 'ZcyAnnouncement9', name: '中标结果公告' },
      { code: 'ZcyAnnouncement10', name: '废标公告' },
      { code: 'ZcyAnnouncement11', name: '终止公告' },
      { code: 'ZcyAnnouncement12', name: '采购结果变更公告' },
    ];
  }
}

export const jilinDataService = new JilinDataService();
