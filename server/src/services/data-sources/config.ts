/**
 * 官方数据源配置
 * 
 * 配置说明：
 * 1. 优先使用官方API（免费、合规）
 * 2. 商业API作为备用（需要付费）
 * 3. 所有数据源需配置速率限制
 */

import type { DataSourceConfig } from './types';

// 数据源配置列表
export const DATA_SOURCE_CONFIGS: DataSourceConfig[] = [
  // ==================== 官方数据源（优先级最高）====================
  
  {
    name: '中国政府采购网',
    platform: 'ccgp',
    baseUrl: 'http://www.ccgp.gov.cn',
    apiEndpoint: 'http://www.ccgp.gov.cn/crps',
    enabled: true,
    priority: 100,
    rateLimit: {
      requestsPerSecond: 2,
      requestsPerDay: 10000,
    },
    auth: {
      type: 'signature',
      // 实际使用时需要向财政部申请
      apiKey: process.env.CCGP_API_KEY,
      secret: process.env.CCGP_SECRET,
    },
  },
  
  {
    name: '中国招标投标公共服务平台',
    platform: 'cebpub',
    baseUrl: 'http://www.cebpubservice.com',
    apiEndpoint: 'http://www.cebpubservice.com/api',
    enabled: true,
    priority: 95,
    rateLimit: {
      requestsPerSecond: 2,
      requestsPerDay: 10000,
    },
    auth: {
      type: 'api_key',
      // 需要在平台注册获取
      apiKey: process.env.CEBPUB_API_KEY,
    },
  },
  
  {
    name: '全国公共资源交易平台',
    platform: 'ggzy',
    baseUrl: 'http://www.ggzy.gov.cn',
    apiEndpoint: 'http://www.ggzy.gov.cn/api',
    enabled: true,
    priority: 90,
    rateLimit: {
      requestsPerSecond: 2,
      requestsPerDay: 8000,
    },
    auth: {
      type: 'api_key',
      apiKey: process.env.GGZY_API_KEY,
    },
  },
  
  // ==================== 省级数据源 ====================
  
  {
    name: '广东省政府采购网',
    platform: 'province_gd',
    baseUrl: 'http://gdgpo.czt.gd.gov.cn',
    apiEndpoint: 'http://gdgpo.czt.gd.gov.cn/api',
    enabled: true,
    priority: 80,
    rateLimit: {
      requestsPerSecond: 2,
      requestsPerDay: 5000,
    },
  },
  
  {
    name: '浙江省政府采购网',
    platform: 'province_zj',
    baseUrl: 'https://zfcg.czt.zj.gov.cn',
    apiEndpoint: 'https://zfcg.czt.zj.gov.cn/api',
    enabled: true,
    priority: 80,
    rateLimit: {
      requestsPerSecond: 2,
      requestsPerDay: 5000,
    },
  },
  
  // ==================== 商业数据源（备用）====================
  
  {
    name: 'APISpace招标数据',
    platform: 'apispace',
    baseUrl: 'https://api.apispace.com',
    apiEndpoint: 'https://23330.o.apispace.com/project-info',
    enabled: true,
    priority: 50,
    rateLimit: {
      requestsPerSecond: 5,
      requestsPerDay: 1000,  // 基础套餐限制
    },
    auth: {
      type: 'api_key',
      // 从APISpace获取
      apiKey: process.env.APISPACE_API_KEY || 'demo_key',
    },
  },
];

// 获取启用的数据源（按优先级排序）
export function getEnabledSources(): DataSourceConfig[] {
  return DATA_SOURCE_CONFIGS
    .filter(config => config.enabled)
    .sort((a, b) => b.priority - a.priority);
}

// 获取特定数据源配置
export function getSourceConfig(platform: string): DataSourceConfig | undefined {
  return DATA_SOURCE_CONFIGS.find(config => config.platform === platform);
}

// 数据源同步时间配置
export const SYNC_SCHEDULES = {
  // 全量同步：每天凌晨2点
  fullSync: '0 2 * * *',
  
  // 增量同步：每2小时
  incrementalSync: '0 */2 * * *',
  
  // 实时同步：每30分钟
  realtimeSync: '*/30 * * * *',
  
  // 数据清理：每周日凌晨4点
  cleanup: '0 4 * * 0',
};

// 同步批处理配置
export const SYNC_BATCH_CONFIG = {
  // 单次同步最大条数
  maxRecordsPerSync: 1000,
  
  // 批量插入大小
  batchSize: 100,
  
  // 重试配置
  maxRetries: 3,
  retryDelay: 5000,  // 5秒
  
  // 超时配置
  timeout: 60000,    // 60秒
};

// 数据源优先级权重（用于多源聚合时的排序）
export const SOURCE_PRIORITY_WEIGHTS = {
  ccgp: 1.0,        // 政府采购网最权威
  cebpub: 0.95,     // 招标投标平台
  ggzy: 0.9,        // 公共资源交易平台
  province_gd: 0.8, // 省级平台
  province_zj: 0.8,
  apispace: 0.6,    // 商业数据源
};
