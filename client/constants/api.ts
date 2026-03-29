/**
 * API 配置
 * 
 * 统一管理后端 API 基础 URL
 * 优先级：环境变量 > 默认值
 */

// 从 app.config.ts 的 extra 中获取，或使用环境变量，或使用默认值
import Constants from 'expo-constants';

/**
 * 获取后端 API 基础 URL
 * 优先级：
 * 1. Constants.expoConfig?.extra?.expoPublicBackendBaseUrl (从 app.config.ts 配置)
 * 2. process.env.EXPO_PUBLIC_BACKEND_BASE_URL (环境变量)
 * 3. 默认值 http://127.0.0.1:9091
 */
export const getBackendBaseUrl = (): string => {
  // 尝试从 app.config.ts extra 获取
  const extraUrl = Constants.expoConfig?.extra?.expoPublicBackendBaseUrl;
  if (extraUrl) {
    return extraUrl;
  }
  
  // 尝试从环境变量获取
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // 默认值
  return 'http://127.0.0.1:9091';
};

// 导出默认值，方便直接使用
export const API_BASE_URL = getBackendBaseUrl();

console.log('[API Config] Backend Base URL:', API_BASE_URL);
