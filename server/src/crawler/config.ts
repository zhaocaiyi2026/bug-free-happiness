/**
 * 招标信息爬虫系统 - 配置文件
 * 
 * 法律合规配置：
 * 1. 请求间隔：3-5秒，避免对目标服务器造成压力
 * 2. 爬取频率：每4-6小时，符合招标网站更新频率
 * 3. 单次最大页数：限制爬取量
 * 4. 遵守robots.txt协议
 */

import type { ParserConfig } from './types';

// 爬虫全局配置
export const CRAWLER_CONFIG = {
  // 请求配置
  request: {
    timeout: 30000,           // 请求超时时间（毫秒）
    retries: 3,               // 重试次数
    retryDelay: 5000,         // 重试间隔（毫秒）
    defaultDelay: 4000,       // 默认请求间隔（毫秒）
  },
  
  // 调度配置
  schedule: {
    // 主爬取任务：每4小时执行一次
    mainCrawl: '0 */4 * * *',
    // 清理任务：每天凌晨3点执行
    cleanup: '0 3 * * *',
  },
  
  // 数据配置
  data: {
    // 去重字段
    uniqueFields: ['title', 'sourceUrl'],
    // 数据保留天数
    retentionDays: 90,
    // 批量插入大小
    batchSize: 50,
  },
  
  // 合规配置
  compliance: {
    // User-Agent标识
    userAgent: 'BidTongBot/1.0 (Compliant Crawler; Contact: admin@bidtong.com)',
    // 是否检查robots.txt
    checkRobotsTxt: true,
    // 是否遵守Crawl-Delay
    respectCrawlDelay: true,
  },
};

// 数据源配置
export const PARSER_CONFIGS: ParserConfig[] = [
  // ==================== 国家级平台 ====================
  {
    name: '中国政府采购网',
    baseUrl: 'http://www.ccgp.gov.cn',
    listUrl: 'http://www.ccgp.gov.cn/cggg/dfgg/index_{page}.htm',
    requestDelay: 5000,
    maxPages: 3,
    enabled: true,
    schedule: '0 */4 * * *',  // 每4小时
  },
  {
    name: '中国招标投标公共服务平台',
    baseUrl: 'http://www.cebpubservice.com',
    listUrl: 'http://www.cebpubservice.com/ctpsp_iiss/searchbusinesshttpaction/getStringMethod.do',
    requestDelay: 5000,
    maxPages: 2,
    enabled: true,
    schedule: '0 2,6,10,14,18,22 * * *',  // 每4小时
  },
  
  // ==================== 省级平台 ====================
  {
    name: '广东省政府采购网',
    baseUrl: 'http://gdgpo.czt.gd.gov.cn',
    listUrl: 'http://gdgpo.czt.gd.gov.cn/queryMoreInfoList.do',
    requestDelay: 4000,
    maxPages: 3,
    enabled: true,
    schedule: '5 */4 * * *',
  },
  {
    name: '浙江省政府采购网',
    baseUrl: 'https://zfcg.czt.zj.gov.cn',
    listUrl: 'https://zfcg.czt.zj.gov.cn/site/notice/search',
    requestDelay: 4000,
    maxPages: 3,
    enabled: true,
    schedule: '10 */4 * * *',
  },
  {
    name: '江苏省政府采购网',
    baseUrl: 'http://www.ccgp-jiangsu.gov.cn',
    listUrl: 'http://www.ccgp-jiangsu.gov.cn/cggg/dfgg/index_{page}.htm',
    requestDelay: 4000,
    maxPages: 3,
    enabled: true,
    schedule: '15 */4 * * *',
  },
  {
    name: '上海市政府采购网',
    baseUrl: 'http://www.zfcg.sh.gov.cn',
    listUrl: 'http://www.zfcg.sh.gov.cn/front/search/category',
    requestDelay: 4000,
    maxPages: 3,
    enabled: true,
    schedule: '20 */4 * * *',
  },
  {
    name: '北京政府采购网',
    baseUrl: 'http://www.ccgp-beijing.gov.cn',
    listUrl: 'http://www.ccgp-beijing.gov.cn/cggg/dfgg/index_{page}.htm',
    requestDelay: 4000,
    maxPages: 3,
    enabled: true,
    schedule: '25 */4 * * *',
  },
  {
    name: '四川省政府采购网',
    baseUrl: 'http://www.ccgp-sichuan.gov.cn',
    listUrl: 'http://www.ccgp-sichuan.gov.cn/cggg/dfgg/index_{page}.htm',
    requestDelay: 4000,
    maxPages: 3,
    enabled: true,
    schedule: '30 */4 * * *',
  },
  
  // ==================== 招标平台 ====================
  {
    name: '中国招标网',
    baseUrl: 'https://www.chinabidding.cn',
    listUrl: 'https://www.chinabidding.cn/search/searchgj/zbcg',
    requestDelay: 5000,
    maxPages: 2,
    enabled: true,
    schedule: '35 */4 * * *',
  },
  {
    name: '采购与招标网',
    baseUrl: 'https://www.chinabidding.com.cn',
    listUrl: 'https://www.chinabidding.com.cn/zbcg/wuliu.html',
    requestDelay: 5000,
    maxPages: 2,
    enabled: true,
    schedule: '40 */4 * * *',
  },
];

// 行业分类映射
export const INDUSTRY_MAPPING: Record<string, string> = {
  '工程': '建筑工程',
  '施工': '建筑工程',
  '建设': '建筑工程',
  '市政': '建筑工程',
  '道路': '交通运输',
  '交通': '交通运输',
  '公路': '交通运输',
  '铁路': '交通运输',
  'IT': 'IT服务',
  '信息化': 'IT服务',
  '软件': 'IT服务',
  '网络': 'IT服务',
  '医疗': '医疗设备',
  '器械': '医疗设备',
  '医院': '医疗设备',
  '教育': '教育培训',
  '学校': '教育培训',
  '培训': '教育培训',
  '环保': '环保能源',
  '能源': '环保能源',
  '新能源': '环保能源',
  '园林': '建筑工程',
  '绿化': '建筑工程',
};

// 省份映射
export const PROVINCE_MAPPING: Record<string, string> = {
  '广东': '广东省',
  '浙江': '浙江省',
  '江苏': '江苏省',
  '上海': '上海市',
  '北京': '北京市',
  '四川': '四川省',
  '山东': '山东省',
  '河南': '河南省',
  '湖北': '湖北省',
  '湖南': '湖南省',
  '福建': '福建省',
  '安徽': '安徽省',
  '河北': '河北省',
  '陕西': '陕西省',
  '辽宁': '辽宁省',
  '江西': '江西省',
  '重庆': '重庆市',
  '云南': '云南省',
  '广西': '广西壮族自治区',
  '山西': '山西省',
  '贵州': '贵州省',
  '黑龙江': '黑龙江省',
  '吉林': '吉林省',
  '天津': '天津市',
  '甘肃': '甘肃省',
  '内蒙古': '内蒙古自治区',
  '新疆': '新疆维吾尔自治区',
  '海南': '海南省',
  '宁夏': '宁夏回族自治区',
  '青海': '青海省',
  '西藏': '西藏自治区',
};
