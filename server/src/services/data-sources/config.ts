/**
 * 官方数据源配置
 * 
 * 配置说明：
 * 1. 优先使用官方API（免费、合规）
 * 2. 商业API作为备用（需要付费）
 * 3. 所有数据源需配置速率限制
 * 
 * 法律依据：
 * - 《招标公告和公示信息发布管理办法》第十二条：发布媒介应当免费提供依法必须招标项目的招标公告和公示信息
 * - 第十五条：其他媒介可以依法全文转载，但不得改变内容，必须注明信息来源
 */

import type { DataSourceConfig } from './types';

// 数据源配置列表
export const DATA_SOURCE_CONFIGS: DataSourceConfig[] = [
  // ==================== 免费数据源（优先级最高）====================
  
  {
    name: '思通数据免费API',
    platform: 'stonedt',
    baseUrl: 'http://data.stonedt.com',
    apiEndpoint: 'http://data.stonedt.com/api',
    enabled: true,
    priority: 110,  // 最高优先级，免费且可用
    rateLimit: {
      requestsPerSecond: 1,  // 控制请求频率
      requestsPerDay: 500,   // 免费版有配额限制
    },
    auth: {
      type: 'api_key',
      // 关注微信公众号"思通数据"获取
      apiKey: process.env.STONEDT_APP_ID,
      secret: process.env.STONEDT_APP_SECRET,
    },
  },
  
  // ==================== 国家级官方数据源 ====================
  
  {
    name: '全国公共资源交易平台',
    platform: 'ggzy',
    baseUrl: 'http://www.ggzy.gov.cn',
    apiEndpoint: 'http://data.ggzy.gov.cn',
    enabled: true,
    priority: 105,  // 国家级平台，优先级高
    rateLimit: {
      requestsPerSecond: 1,  // 控制请求频率，避免被封
      requestsPerDay: 5000,
    },
    auth: {
      type: 'api_key',
      apiKey: process.env.GGZY_API_KEY,
    },
  },
  
  {
    name: '中国招标投标公共服务平台',
    platform: 'cebpub',
    baseUrl: 'http://www.cebpubservice.com',
    apiEndpoint: 'http://www.cebpubservice.com/api',
    enabled: true,
    priority: 102,
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerDay: 5000,
    },
    auth: {
      type: 'api_key',
      apiKey: process.env.CEBPUB_API_KEY,
    },
  },
  
  {
    name: '中国政府采购网',
    platform: 'ccgp',
    baseUrl: 'http://www.ccgp.gov.cn',
    apiEndpoint: 'http://www.ccgp.gov.cn/crps',
    enabled: false,  // 暂未开放API，需申请
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
  
  // ==================== 省级公共资源交易平台 ====================
  
  {
    name: '北京市公共资源交易平台',
    platform: 'province_beijing',
    baseUrl: 'https://ggzyfw.beijing.gov.cn',
    enabled: true,
    priority: 85,
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerDay: 3000,
    },
  },
  
  {
    name: '广东省公共资源交易平台',
    platform: 'province_guangdong',
    baseUrl: 'https://ygp.gdzwfw.gov.cn',
    enabled: true,
    priority: 85,
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerDay: 3000,
    },
  },
  
  {
    name: '浙江省公共资源交易平台',
    platform: 'province_zhejiang',
    baseUrl: 'https://ggzy.zj.gov.cn',
    enabled: true,
    priority: 85,
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerDay: 3000,
    },
  },
  
  {
    name: '江苏省公共资源交易平台',
    platform: 'province_jiangsu',
    baseUrl: 'https://ggzy.jiangsu.gov.cn',
    enabled: true,
    priority: 85,
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerDay: 3000,
    },
  },
  
  {
    name: '山东省公共资源交易平台',
    platform: 'province_shandong',
    baseUrl: 'https://ggzyjy.shandong.gov.cn',
    enabled: true,
    priority: 80,
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerDay: 3000,
    },
  },
  
  {
    name: '上海市公共资源交易平台',
    platform: 'province_shanghai',
    baseUrl: 'https://www.shggzy.com',
    enabled: true,
    priority: 85,
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerDay: 3000,
    },
  },
  
  {
    name: '四川省公共资源交易平台',
    platform: 'province_sichuan',
    baseUrl: 'https://ggzyjy.sc.gov.cn',
    enabled: true,
    priority: 80,
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerDay: 3000,
    },
  },
  
  {
    name: '湖北省公共资源交易平台',
    platform: 'province_hubei',
    baseUrl: 'https://www.hbggzyfwy.cn',
    enabled: true,
    priority: 80,
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerDay: 3000,
    },
  },
  
  {
    name: '河南省公共资源交易平台',
    platform: 'province_henan',
    baseUrl: 'https://hnsggzyjy.henan.gov.cn',
    enabled: true,
    priority: 80,
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerDay: 3000,
    },
  },
  
  {
    name: '福建省公共资源交易平台',
    platform: 'province_fujian',
    baseUrl: 'https://ggzyywgz.fj.gov.cn',
    enabled: true,
    priority: 80,
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerDay: 3000,
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
  stonedt: 1.0,     // 思通数据免费API，推荐使用
  ggzy: 1.0,        // 全国公共资源交易平台，权威性高
  cebpub: 0.98,     // 中国招标投标公共服务平台
  ccgp: 1.0,        // 政府采购网最权威（需申请API）
  province_beijing: 0.85,
  province_guangdong: 0.85,
  province_zhejiang: 0.85,
  province_jiangsu: 0.85,
  province_shandong: 0.80,
  province_shanghai: 0.85,
  province_sichuan: 0.80,
  province_hubei: 0.80,
  province_henan: 0.80,
  province_fujian: 0.80,
  apispace: 0.6,    // 商业数据源
};
