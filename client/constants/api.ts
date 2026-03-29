/**
 * API 配置
 * 
 * 统一管理后端 API 基础 URL
 * 优先级：环境变量 > 默认值
 */

// 从 app.config.ts 的 extra 中获取，或使用环境变量，或使用默认值
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * 获取后端 API 基础 URL
 * 优先级：
 * 1. Constants.expoConfig?.extra?.expoPublicBackendBaseUrl (从 app.config.ts 配置)
 * 2. process.env.EXPO_PUBLIC_BACKEND_BASE_URL (环境变量)
 * 3. Web 平台使用空字符串（通过 Metro 代理）
 * 4. 原生平台使用默认值
 */
export const getBackendBaseUrl = (): string => {
  // Web 平台优先使用相对路径（通过 Metro 代理）
  if (Platform.OS === 'web') {
    // 检查是否有显式配置的完整 URL
    const extraUrl = Constants.expoConfig?.extra?.expoPublicBackendBaseUrl;
    const envUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
    
    // 如果配置的是本地地址，使用相对路径让 Metro 代理处理
    if (extraUrl?.includes('127.0.0.1') || extraUrl?.includes('localhost') ||
        envUrl?.includes('127.0.0.1') || envUrl?.includes('localhost')) {
      return ''; // 使用相对路径，通过 Metro 代理
    }
    
    // 如果有外部 URL，使用它
    if (extraUrl && !extraUrl.includes('127.0.0.1') && !extraUrl.includes('localhost')) {
      return extraUrl;
    }
    if (envUrl && !envUrl.includes('127.0.0.1') && !envUrl.includes('localhost')) {
      return envUrl;
    }
    
    // 默认使用相对路径（Metro 代理）
    return '';
  }
  
  // 原生平台
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

console.log('[API Config] Backend Base URL:', API_BASE_URL, 'Platform:', Platform.OS);
