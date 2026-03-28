/**
 * 解析器工厂 - 创建和管理所有解析器
 */

import type { ParserConfig } from '../types';
import { BaseParser } from './base';
import { ChinaBiddingParser } from './chinabidding';
import { CcgpParser } from './ccgp';
import { GuangdongGpoParser } from './guangdong';

// 导出所有解析器
export { BaseParser } from './base';
export { ChinaBiddingParser } from './chinabidding';
export { CcgpParser } from './ccgp';
export { GuangdongGpoParser } from './guangdong';

// 解析器类型映射
const parserRegistry: Map<string, new () => BaseParser> = new Map<string, new () => BaseParser>([
  ['中国招标网', ChinaBiddingParser as new () => BaseParser],
  ['中国政府采购网', CcgpParser as new () => BaseParser],
  ['广东省政府采购网', GuangdongGpoParser as new () => BaseParser],
]);

/**
 * 创建解析器实例
 */
export function createParser(name: string): BaseParser | null {
  const ParserClass = parserRegistry.get(name);
  if (!ParserClass) {
    console.warn(`[ParserFactory] Unknown parser: ${name}`);
    return null;
  }
  return new ParserClass();
}

/**
 * 获取所有可用的解析器名称
 */
export function getAvailableParsers(): string[] {
  return Array.from(parserRegistry.keys());
}

/**
 * 创建所有启用的解析器
 */
export function createAllParsers(configs: ParserConfig[]): BaseParser[] {
  const parsers: BaseParser[] = [];
  
  for (const config of configs) {
    if (!config.enabled) continue;
    
    const parser = createParser(config.name);
    if (parser) {
      parsers.push(parser);
    }
  }
  
  return parsers;
}
