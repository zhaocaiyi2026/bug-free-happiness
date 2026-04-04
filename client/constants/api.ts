/**
 * API 配置
 * 
 * 统一管理后端 API 基础 URL
 * 
 * 生产环境（Web）：使用相对路径 ''，前端和后端在同一服务器
 * 开发环境（Web）：使用相对路径 ''，通过 Metro 代理 /api 到后端
 * 原生平台（APP）：需要设置环境变量 EXPO_PUBLIC_BACKEND_BASE_URL（公网地址）
 */

// 公网访问地址（兜底，用于原生APP）
const FALLBACK_URL = 'https://4dedb0b5-952a-4a4c-a211-0bf5165689d2.dev.coze.site';

// 检测是否为Web平台
// 注意：这里不能用window/document（RN原生端不存在），用Platform.OS判断
import { Platform } from 'react-native';

// Web平台使用相对路径（Metro代理到后端）
// 原生平台使用公网地址（APP需要公网访问）
const backendUrl = Platform.OS === 'web' 
  ? ''  // Web: 相对路径，Metro代理
  : (process.env.EXPO_PUBLIC_BACKEND_BASE_URL || FALLBACK_URL);  // Native: 公网地址

// 导出 API 基础 URL
export const API_BASE_URL = backendUrl;

// 调试日志
console.log('[API] Backend URL:', API_BASE_URL, '| Platform:', Platform.OS);
