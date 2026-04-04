/**
 * 规范化公告类型名称
 * 1. 去掉金额等后缀（如"竞争性谈判290万元" -> "竞争性谈判"）
 * 2. 统一简称（如"竞争性谈判公告" -> "竞争性谈判"）
 * 3. 处理特殊字符
 */

// 公告类型映射表：完整名称 -> 简称
const TYPE_NAME_MAP: Record<string, string> = {
  // 招标类
  '公开招标公告': '公开招标',
  '资格预审公告': '资格预审',
  '邀请招标公告': '邀请招标',
  '竞争性谈判公告': '竞争性谈判',
  '竞争性磋商公告': '竞争性磋商',
  '询价公告': '询价',
  '采购意向公告': '采购意向',
  '允许采购进口产品公示': '进口产品公示',
  '采购文件需求公告': '采购文件需求',
  '公共服务项目需求意见公告': '需求意见公告',
  '询价/竞价公告': '询价/竞价',
  '封闭式征集公告': '封闭式征集',
  '开放式征集公告': '开放式征集',
  '单一来源公告': '单一来源',
  '单一来源采购': '单一来源',
  '更正公告': '更正公告',
  '废标公告': '废标公告',
  '终止公告': '终止公告',
  '采购结果变更公告': '结果变更',
  // 中标类
  '中标公告': '中标',
  '中标结果公告': '中标',
  '中标（成交）结果公告': '中标',
  '成交公告': '成交',
  '成交结果公告': '成交',
  '合同公告': '合同公告',
  '合同变更公告': '合同变更',
  '履约验收公告': '履约验收',
  '其它公告': '其他',
  '其他公告': '其他',
  // 简称映射
  '招标': '招标',
  '中标': '中标',
  '变更': '更正',
  '废标': '废标',
};

// 需要去掉的名称后缀模式
const SUFFIX_PATTERNS = [
  /[\d,.]+万元?$/i,      // 金额：290万元、290万
  /[\d,.]+亿元?$/i,      // 金额：1.5亿元
  /[\d,.]+元$/i,         // 金额：1000元
  /公告$/i,              // 公告后缀
  /\s+公告$/i,           // 公告后缀（带空格）
];

/**
 * 规范化公告类型名称
 * @param typeName 原始类型名称
 * @param maxLength 最大显示长度，默认6个字符
 * @returns 规范化后的类型名称
 */
export function normalizeTypeName(typeName: string | null | undefined, maxLength: number = 6): string {
  if (!typeName) return '招标';
  
  let normalized = typeName.trim();
  
  // 1. 先尝试直接映射
  if (TYPE_NAME_MAP[normalized]) {
    return TYPE_NAME_MAP[normalized];
  }
  
  // 2. 去掉金额等后缀
  for (const pattern of SUFFIX_PATTERNS) {
    normalized = normalized.replace(pattern, '');
  }
  
  // 3. 再次尝试映射
  if (TYPE_NAME_MAP[normalized]) {
    return TYPE_NAME_MAP[normalized];
  }
  
  // 4. 如果包含"公告"，去掉后重试
  if (normalized.endsWith('公告')) {
    const withoutSuffix = normalized.replace(/公告$/, '');
    if (TYPE_NAME_MAP[withoutSuffix + '公告']) {
      return TYPE_NAME_MAP[withoutSuffix + '公告'];
    }
    if (TYPE_NAME_MAP[withoutSuffix]) {
      return TYPE_NAME_MAP[withoutSuffix];
    }
  }
  
  // 5. 截断过长的名称
  if (normalized.length > maxLength) {
    return normalized.slice(0, maxLength);
  }
  
  return normalized || '招标';
}

/**
 * 获取公告类型的背景色
 */
export function getTypeTagColor(typeName: string | null | undefined): { bg: string; text: string } {
  const normalized = normalizeTypeName(typeName);
  
  // 中标类 - 绿色
  const winTypes = ['中标', '成交', '合同', '履约验收'];
  if (winTypes.some(t => normalized.includes(t))) {
    return { bg: '#10B98120', text: '#059669' };
  }
  
  // 变更/异常类 - 橙色
  const warningTypes = ['更正', '变更', '废标', '终止'];
  if (warningTypes.some(t => normalized.includes(t))) {
    return { bg: '#F5920020', text: '#D97706' };
  }
  
  // 默认 - 蓝色
  return { bg: '#2563EB20', text: '#2563EB' };
}
