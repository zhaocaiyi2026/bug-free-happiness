/**
 * API 配置
 * 
 * 统一管理后端 API 基础 URL
 * 
 * 优先级：Constants.expoConfig.extra > 硬编码线上地址
 */

import { Constants } from 'expo-constants';

// 从 app.config.ts 的 extra 字段获取后端地址
const getConfigUrl = (): string => {
  try {
    const extra = Constants.expoConfig?.extra as { expoPublicBackendBaseUrl?: string } | undefined;
    if (extra?.expoPublicBackendBaseUrl) {
      return extra.expoPublicBackendBaseUrl;
    }
  } catch (e) {
    console.warn('[API] 无法读取 expoConfig.extra:', e);
  }
  // 默认线上地址 - Render 部署
  return 'https://zcy-api.onrender.com';
};

// 导出 API 基础 URL
export const API_BASE_URL = getConfigUrl();

// 调试日志
console.log('[API] Backend URL:', API_BASE_URL);
