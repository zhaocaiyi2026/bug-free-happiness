/**
 * API 配置
 * 
 * 统一管理后端 API 基础 URL
 * 
 * 生产环境（Web）：使用相对路径 ''，前端和后端在同一服务器
 * 开发环境（Web）：使用相对路径 ''，通过 Metro 代理 /api 到后端
 * 原生平台：需要设置环境变量 EXPO_PUBLIC_BACKEND_BASE_URL
 */

// Web 平台使用相对路径
// 原生平台需要完整 URL（通过环境变量注入）
const backendUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

// 导出 API 基础 URL
// Web: '' (相对路径，由 Express 提供 API 服务)
// Native: 完整 URL (如 http://api.example.com)
export const API_BASE_URL = backendUrl;
