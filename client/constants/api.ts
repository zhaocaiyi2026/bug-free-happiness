/**
 * API 配置
 * 
 * 统一管理后端 API 基础 URL
 * 
 * 所有平台统一使用线上公网地址，不依赖本地后端
 */

// 线上公网地址
const PRODUCTION_URL = 'https://4dedb0b5-952a-4a4c-a211-0bf5165689d2.dev.coze.site';

// 导出 API 基础 URL（统一使用线上地址）
export const API_BASE_URL = PRODUCTION_URL;

// 调试日志
console.log('[API] Backend URL:', API_BASE_URL);
