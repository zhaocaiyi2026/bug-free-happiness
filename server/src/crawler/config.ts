/**
 * 爬虫配置
 */

import type { ProvinceConfig, CrawlerConfig, AnnouncementTypeMap } from './types.js';
import { AnnouncementType } from './types.js';

// 省份配置（31个省市自治区）
export const PROVINCES: ProvinceConfig[] = [
  // 华北地区
  { code: '110000', name: '北京市', shortName: '北京', baseUrl: 'https://www.ggzyfw.beijing.gov.cn', enabled: true },
  { code: '120000', name: '天津市', shortName: '天津', baseUrl: 'https://www.tjggzy.cn', enabled: true },
  { code: '130000', name: '河北省', shortName: '河北', baseUrl: 'http://www.hebpr.cn', enabled: true },
  { code: '140000', name: '山西省', shortName: '山西', baseUrl: 'https://www.sxggzy.cn', enabled: true },
  { code: '150000', name: '内蒙古自治区', shortName: '内蒙古', baseUrl: 'https://www.nmgggzyjy.cn', enabled: true },
  
  // 东北地区
  { code: '210000', name: '辽宁省', shortName: '辽宁', baseUrl: 'https://www.lnggzy.com', enabled: true },
  { code: '220000', name: '吉林省', shortName: '吉林', baseUrl: 'http://www.ggzy.jl.gov.cn', enabled: true },
  { code: '230000', name: '黑龙江省', shortName: '黑龙江', baseUrl: 'https://www.hljggzyjy.org.cn', enabled: true },
  
  // 华东地区
  { code: '310000', name: '上海市', shortName: '上海', baseUrl: 'https://www.shggzy.com', enabled: true },
  { code: '320000', name: '江苏省', shortName: '江苏', baseUrl: 'http://www.jszbtb.com', enabled: true },
  { code: '330000', name: '浙江省', shortName: '浙江', baseUrl: 'https://www.zjpubservice.com', enabled: true },
  { code: '340000', name: '安徽省', shortName: '安徽', baseUrl: 'https://www.ahggzyjy.cn', enabled: true },
  { code: '350000', name: '福建省', shortName: '福建', baseUrl: 'https://www.fjggzyjy.com', enabled: true },
  { code: '360000', name: '江西省', shortName: '江西', baseUrl: 'https://www.jxsggzy.cn', enabled: true },
  { code: '370000', name: '山东省', shortName: '山东', baseUrl: 'http://ggzyjy.shandong.gov.cn', enabled: true },
  
  // 华中地区
  { code: '410000', name: '河南省', shortName: '河南', baseUrl: 'http://www.hnggzyjy.cn', enabled: true },
  { code: '420000', name: '湖北省', shortName: '湖北', baseUrl: 'https://www.hbggzyfwzh.cn', enabled: true },
  { code: '430000', name: '湖南省', shortName: '湖南', baseUrl: 'https://www.hnggzy.com', enabled: true },
  
  // 华南地区
  { code: '440000', name: '广东省', shortName: '广东', baseUrl: 'https://www.gdggzy.org.cn', enabled: true },
  { code: '450000', name: '广西壮族自治区', shortName: '广西', baseUrl: 'https://www.gxggzy.cn', enabled: true },
  { code: '460000', name: '海南省', shortName: '海南', baseUrl: 'https://www.hnggzy.com', enabled: true },
  
  // 西南地区
  { code: '500000', name: '重庆市', shortName: '重庆', baseUrl: 'https://www.cqggzy.com', enabled: true },
  { code: '510000', name: '四川省', shortName: '四川', baseUrl: 'http://ggzyjy.sc.gov.cn', enabled: true },
  { code: '520000', name: '贵州省', shortName: '贵州', baseUrl: 'https://www.ggzy.guizhou.gov.cn', enabled: true },
  { code: '530000', name: '云南省', shortName: '云南', baseUrl: 'https://www.ynggzy.com', enabled: true },
  { code: '540000', name: '西藏自治区', shortName: '西藏', baseUrl: 'https://www.xzggzy.gov.cn', enabled: false },
  
  // 西北地区
  { code: '610000', name: '陕西省', shortName: '陕西', baseUrl: 'https://www.sxggzyjy.cn', enabled: true },
  { code: '620000', name: '甘肃省', shortName: '甘肃', baseUrl: 'https://www.gsggzyjy.cn', enabled: true },
  { code: '630000', name: '青海省', shortName: '青海', baseUrl: 'https://www.qhggzyjy.com', enabled: true },
  { code: '640000', name: '宁夏回族自治区', shortName: '宁夏', baseUrl: 'https://www.nxggzyjy.org', enabled: true },
  { code: '650000', name: '新疆维吾尔自治区', shortName: '新疆', baseUrl: 'https://www.xjggzy.com', enabled: true },
  
  // 港澳台（暂不启用）
  { code: '810000', name: '香港特别行政区', shortName: '香港', baseUrl: '', enabled: false },
  { code: '820000', name: '澳门特别行政区', shortName: '澳门', baseUrl: '', enabled: false },
  { code: '710000', name: '台湾省', shortName: '台湾', baseUrl: '', enabled: false },
];

// 平台配置
export const PLATFORMS: Record<string, CrawlerConfig> = {
  // 全国公共资源交易平台
  ggzy: {
    name: '全国公共资源交易平台',
    baseUrl: 'https://www.ggzy.gov.cn',
    enabled: true,
    requestInterval: 1000,
    timeout: 30000,
    maxRetries: 3,
    maxPages: 100,
  },
  
  // 中国政府采购网
  ccgp: {
    name: '中国政府采购网',
    baseUrl: 'http://www.ccgp.gov.cn',
    enabled: true,
    requestInterval: 1000,
    timeout: 30000,
    maxRetries: 3,
    maxPages: 100,
  },
  
  // 中国招标投标公共服务平台
  cebpubservice: {
    name: '中国招标投标公共服务平台',
    baseUrl: 'https://www.cebpubservice.com',
    enabled: true,
    requestInterval: 1000,
    timeout: 30000,
    maxRetries: 3,
    maxPages: 100,
  },
};

// 公告类型映射 - 全国公共资源交易平台
export const GGZY_TYPE_MAP: AnnouncementTypeMap = {
  '1': AnnouncementType.BID_ANNOUNCEMENT,           // 招标公告
  '2': AnnouncementType.WIN_RESULT,                 // 中标结果
  '3': AnnouncementType.CORRECTION,                 // 更正公告
  '4': AnnouncementType.TERMINATION,                // 终止公告
  '5': AnnouncementType.ABANDONED_BID,              // 废标公告
  '6': AnnouncementType.PRE_QUALIFICATION,          // 资格预审公告
  '7': AnnouncementType.COMPETITIVE_NEGOTIATION,    // 竞争性谈判
  '8': AnnouncementType.COMPETITIVE_CONSULTATION,   // 竞争性磋商
  '9': AnnouncementType.INQUIRY,                    // 询价公告
  '10': AnnouncementType.PROCUREMENT_INTENTION,     // 采购意向
  '11': AnnouncementType.INVITATION_BID,            // 邀请招标
  '12': AnnouncementType.RESULT_CHANGE,             // 结果变更
};

// 公告类型映射 - 中国政府采购网
export const CCGP_TYPE_MAP: AnnouncementTypeMap = {
  '1': AnnouncementType.BID_ANNOUNCEMENT,           // 招标公告
  '2': AnnouncementType.COMPETITIVE_NEGOTIATION,    // 竞争性谈判公告
  '3': AnnouncementType.COMPETITIVE_CONSULTATION,   // 竞争性磋商公告
  '4': AnnouncementType.INQUIRY,                    // 询价公告
  '5': AnnouncementType.WIN_RESULT,                 // 中标公告
  '6': AnnouncementType.CORRECTION,                 // 更正公告
  '7': AnnouncementType.TERMINATION,                // 终止公告
  '8': AnnouncementType.ABANDONED_BID,              // 废标公告
  '9': AnnouncementType.PROCUREMENT_INTENTION,      // 采购意向公告
  '10': AnnouncementType.PRE_QUALIFICATION,         // 资格预审公告
  '11': AnnouncementType.RESULT_CHANGE,             // 采购结果变更
};

// 行业分类映射
export const INDUSTRY_MAP: Record<string, string> = {
  'A': '农林牧渔业',
  'B': '采矿业',
  'C': '制造业',
  'D': '电力热力燃气及水生产和供应业',
  'E': '建筑业',
  'F': '批发和零售业',
  'G': '交通运输仓储和邮政业',
  'H': '住宿和餐饮业',
  'I': '信息传输软件和信息技术服务业',
  'J': '金融业',
  'K': '房地产业',
  'L': '租赁和商务服务业',
  'M': '科学研究和技术服务业',
  'N': '水利环境和公共设施管理业',
  'O': '居民服务修理和其他服务业',
  'P': '教育',
  'Q': '卫生和社会工作',
  'R': '文化体育和娱乐业',
  'S': '公共管理社会保障和社会组织',
  'T': '国际组织',
};

// 采购方式映射
export const PROCUREMENT_METHOD_MAP: Record<string, string> = {
  '1': '公开招标',
  '2': '邀请招标',
  '3': '竞争性谈判',
  '4': '竞争性磋商',
  '5': '询价',
  '6': '单一来源',
  '7': '询价采购',
  '8': '电子竞价',
  '9': '框架协议采购',
};
