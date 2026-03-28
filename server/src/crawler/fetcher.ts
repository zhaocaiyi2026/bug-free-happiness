/**
 * 招标信息爬虫系统 - HTTP请求封装
 * 
 * 功能：
 * 1. 带重试的HTTP请求
 * 2. 请求限流
 * 3. robots.txt检查
 * 4. 请求日志记录
 */

import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { CRAWLER_CONFIG } from './config';

// 请求队列管理
class RequestQueue {
  private lastRequestTime: number = 0;
  private queue: Array<() => Promise<void>> = [];
  private isProcessing: boolean = false;

  async wait(delay: number): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < delay) {
      await new Promise(resolve => setTimeout(resolve, delay - elapsed));
    }
  }

  async throttle<T>(fn: () => Promise<T>, delay: number): Promise<T> {
    await this.wait(delay);
    this.lastRequestTime = Date.now();
    return fn();
  }
}

const requestQueue = new RequestQueue();

/**
 * 检查robots.txt是否允许爬取
 */
async function checkRobotsTxt(baseUrl: string, path: string): Promise<boolean> {
  if (!CRAWLER_CONFIG.compliance.checkRobotsTxt) {
    return true;
  }

  try {
    const robotsUrl = `${baseUrl}/robots.txt`;
    const response = await axios.get(robotsUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': CRAWLER_CONFIG.compliance.userAgent,
      },
    });

    const robotsTxt = response.data;
    // 简单解析robots.txt
    // 实际应用中可以使用robots-parser库
    const lines = robotsTxt.split('\n');
    let userAgentMatch = false;
    
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.startsWith('user-agent:')) {
        const agent = trimmed.substring(11).trim();
        userAgentMatch = agent === '*' || agent.includes('bidtong');
      }
      if (userAgentMatch && trimmed.startsWith('disallow:')) {
        const disallowPath = trimmed.substring(9).trim();
        if (path.startsWith(disallowPath)) {
          console.log(`[Crawler] robots.txt disallows: ${path}`);
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    // 如果无法获取robots.txt，默认允许
    return true;
  }
}

/**
 * 发送HTTP请求
 */
export async function fetchUrl(
  url: string,
  options: AxiosRequestConfig = {},
  delay: number = CRAWLER_CONFIG.request.defaultDelay
): Promise<AxiosResponse> {
  const config: AxiosRequestConfig = {
    ...options,
    timeout: options.timeout || CRAWLER_CONFIG.request.timeout,
    headers: {
      'User-Agent': CRAWLER_CONFIG.compliance.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      ...options.headers,
    },
    validateStatus: (status) => status < 500, // 不抛出4xx错误
  };

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= CRAWLER_CONFIG.request.retries; attempt++) {
    try {
      const response = await requestQueue.throttle(
        () => axios.get(url, config),
        delay
      );

      // 检查响应状态
      if (response.status === 200) {
        return response;
      }
      
      if (response.status === 403 || response.status === 429) {
        // 被禁止或限流，增加延迟后重试
        console.log(`[Crawler] Rate limited (${response.status}), waiting...`);
        await new Promise(resolve => setTimeout(resolve, CRAWLER_CONFIG.request.retryDelay * 2));
        continue;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error as Error;
      console.log(`[Crawler] Attempt ${attempt}/${CRAWLER_CONFIG.request.retries} failed for ${url}: ${lastError.message}`);
      
      if (attempt < CRAWLER_CONFIG.request.retries) {
        await new Promise(resolve => 
          setTimeout(resolve, CRAWLER_CONFIG.request.retryDelay * attempt)
        );
      }
    }
  }

  throw lastError || new Error('Request failed');
}

/**
 * 获取页面HTML并解析
 */
export async function fetchPage(url: string, delay?: number): Promise<cheerio.CheerioAPI> {
  const response = await fetchUrl(url, {}, delay);
  return cheerio.load(response.data);
}

/**
 * 获取JSON API数据
 */
export async function fetchJson<T>(url: string, options?: AxiosRequestConfig, delay?: number): Promise<T> {
  const response = await fetchUrl(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...options?.headers,
    },
  }, delay);
  
  return response.data;
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
