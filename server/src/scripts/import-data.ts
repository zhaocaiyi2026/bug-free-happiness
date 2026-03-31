/**
 * 数据导入脚本
 * 
 * 支持导入:
 * 1. 八爪鱼导出的JSON数据
 * 2. Excel/CSV数据
 * 3. 手动录入
 * 
 * 使用方法:
 *   npx tsx src/scripts/import-data.ts --file data.json
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { AnnouncementType } from '../crawler/types.js';

const supabase = createClient(
  process.env.COZE_SUPABASE_URL || '',
  process.env.COZE_SUPABASE_ANON_KEY || ''
);

// 数据导入配置
interface ImportConfig {
  // 字段映射：源字段 -> 目标字段
  fieldMapping: Record<string, string>;
  // 公告类型映射
  typeMapping: Record<string, string>;
  // 默认值
  defaults: Record<string, any>;
}

// 八爪鱼数据导入配置
const OCTOPARSE_CONFIG: ImportConfig = {
  fieldMapping: {
    '标题': 'title',
    '公告标题': 'title',
    '项目名称': 'title',
    '内容': 'content',
    '公告内容': 'content',
    '项目编号': 'project_code',
    '招标编号': 'project_code',
    '预算金额': 'budget',
    '采购预算': 'budget',
    '项目预算': 'budget',
    '发布时间': 'publish_date',
    '发布日期': 'publish_date',
    '公告日期': 'publish_date',
    '截止时间': 'deadline',
    '投标截止': 'deadline',
    '开标时间': 'open_bid_time',
    '采购人': 'purchaser_name',
    '采购单位': 'purchaser_name',
    '招标人': 'purchaser_name',
    '业主': 'purchaser_name',
    '采购人电话': 'purchaser_phone',
    '联系电话': 'contact_phone',
    '电话': 'contact_phone',
    '联系方式': 'contact_phone',
    '联系人': 'contact_person',
    '代理机构': 'agency_name',
    '招标代理': 'agency_name',
    '代理机构电话': 'agency_phone',
    '中标人': 'winning_bidder',
    '中标单位': 'winning_bidder',
    '中标金额': 'winning_amount',
    '成交金额': 'winning_amount',
    '省份': 'province',
    '地区': 'province',
    '城市': 'city',
    '行业': 'industry',
    '采购方式': 'procurement_method',
    '公告类型': 'announcement_type',
    '类型': 'announcement_type',
    '来源': 'source_platform',
    '来源平台': 'source_platform',
    '原文链接': 'source_url',
    '链接': 'source_url',
    '详情链接': 'source_url',
  },
  typeMapping: {
    '招标公告': '招标公告',
    '公开招标': '招标公告',
    '中标公告': '中标结果公告',
    '中标结果': '中标结果公告',
    '中标': '中标结果公告',
    '成交公告': '中标结果公告',
    '废标公告': '废标公告',
    '废标': '废标公告',
    '终止公告': '终止公告',
    '终止': '终止公告',
    '更正公告': '更正公告',
    '更正': '更正公告',
    '变更公告': '更正公告',
    '竞争性谈判': '竞争性谈判公告',
    '竞争性磋商': '竞争性磋商公告',
    '询价公告': '询价公告',
    '采购意向': '采购意向公告',
    '资格预审': '资格预审公告',
  },
  defaults: {
    source_platform: 'import',
    data_type: 'import',
    announcement_type: '招标公告',
    status: 'active',
  },
};

/**
 * 解析金额
 */
function parseBudget(value: any): number | null {
  if (typeof value === 'number') return value;
  if (!value) return null;
  
  const str = String(value).replace(/[\s,，]/g, '');
  const match = str.match(/[\d.]+/);
  if (!match) return null;
  
  const num = parseFloat(match[0]);
  if (isNaN(num)) return null;
  
  if (str.includes('万') || str.includes('W')) return num * 10000;
  if (str.includes('亿')) return num * 100000000;
  
  return num;
}

/**
 * 解析日期
 */
function parseDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  const str = String(value);
  const match = str.match(/(\d{4})[-\/年](\d{1,2})[-\/月](\d{1,2})/);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }
  
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 转换数据项
 */
function transformItem(item: any, config: ImportConfig): any {
  const result: any = { ...config.defaults };
  
  // 字段映射
  for (const [sourceField, targetField] of Object.entries(config.fieldMapping)) {
    if (item[sourceField] !== undefined) {
      result[targetField] = item[sourceField];
    }
  }
  
  // 处理金额
  result.budget = parseBudget(result.budget);
  result.winning_amount = parseBudget(result.winning_amount);
  
  // 处理日期
  result.publish_date = parseDate(result.publish_date);
  result.deadline = parseDate(result.deadline);
  result.open_bid_time = parseDate(result.open_bid_time);
  
  // 处理公告类型
  if (result.announcement_type && config.typeMapping[result.announcement_type]) {
    result.announcement_type = config.typeMapping[result.announcement_type];
  }
  
  // 生成source_id
  if (!result.source_id) {
    result.source_id = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return result;
}

/**
 * 导入JSON数据
 */
async function importJson(filePath: string, config: ImportConfig = OCTOPARSE_CONFIG): Promise<{
  total: number;
  saved: number;
  duplicates: number;
  errors: string[];
}> {
  console.log(`\n导入文件: ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  let data: any[];
  
  try {
    const json = JSON.parse(content);
    data = Array.isArray(json) ? json : (json.data || [json]);
  } catch (e) {
    console.error('JSON解析失败:', e);
    return { total: 0, saved: 0, duplicates: 0, errors: ['JSON解析失败'] };
  }
  
  console.log(`读取到 ${data.length} 条数据`);
  
  let saved = 0;
  let duplicates = 0;
  const errors: string[] = [];
  
  for (const item of data) {
    try {
      const transformed = transformItem(item, config);
      
      if (!transformed.title) {
        errors.push(`缺少标题: ${JSON.stringify(item).substring(0, 100)}`);
        continue;
      }
      
      // 去重检查
      const { data: existing } = await supabase
        .from('bids')
        .select('id')
        .eq('source_platform', transformed.source_platform)
        .eq('source_id', transformed.source_id)
        .limit(1);
      
      if (existing && existing.length > 0) {
        duplicates++;
        continue;
      }
      
      // 插入数据
      const { error } = await supabase.from('bids').insert(transformed);
      
      if (error) {
        errors.push(`插入失败: ${error.message}`);
      } else {
        saved++;
        if (saved % 100 === 0) {
          console.log(`已保存 ${saved} 条...`);
        }
      }
      
    } catch (e: any) {
      errors.push(`处理失败: ${e.message}`);
    }
  }
  
  return { total: data.length, saved, duplicates, errors };
}

/**
 * 生成数据模板
 */
function generateTemplate(): void {
  const template = [
    {
      '标题': '示例招标公告标题',
      '项目编号': 'ZB2025001',
      '预算金额': '100万元',
      '发布时间': '2025-01-15',
      '截止时间': '2025-01-25',
      '采购人': '示例采购单位',
      '联系人': '张三',
      '联系电话': '13800138000',
      '代理机构': '示例代理机构',
      '代理机构电话': '010-12345678',
      '省份': '北京市',
      '行业': '建筑业',
      '采购方式': '公开招标',
      '公告类型': '招标公告',
      '原文链接': 'https://example.com/bid/001',
    },
  ];
  
  const templatePath = path.join(process.cwd(), 'data-template.json');
  fs.writeFileSync(templatePath, JSON.stringify(template, null, 2), 'utf-8');
  console.log(`\n数据模板已生成: ${templatePath}`);
  console.log('请按照模板格式准备数据文件');
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  // 生成模板
  if (args.includes('--template')) {
    generateTemplate();
    return;
  }
  
  // 导入数据
  const fileArg = args.find(a => a.startsWith('--file='));
  if (!fileArg) {
    console.log(`
使用方法:
  npx tsx src/scripts/import-data.ts --file data.json    # 导入JSON数据
  npx tsx src/scripts/import-data.ts --template          # 生成数据模板

支持的数据格式:
  - 八爪鱼导出的JSON
  - 自定义JSON（使用 --template 查看格式）

字段映射:
  标题/公告标题/项目名称 -> title
  预算金额/采购预算 -> budget
  发布时间/发布日期 -> publish_date
  采购人/招标人/业主 -> purchaser_name
  联系电话/联系方式 -> contact_phone
  省份/地区 -> province
  公告类型 -> announcement_type
  ...
`);
    return;
  }
  
  const filePath = fileArg.split('=')[1];
  
  if (!fs.existsSync(filePath)) {
    console.error(`文件不存在: ${filePath}`);
    return;
  }
  
  const result = await importJson(filePath);
  
  console.log('\n====================================');
  console.log('导入完成');
  console.log('====================================');
  console.log(`总数据: ${result.total} 条`);
  console.log(`保存成功: ${result.saved} 条`);
  console.log(`重复跳过: ${result.duplicates} 条`);
  console.log(`错误: ${result.errors.length} 条`);
  
  if (result.errors.length > 0 && result.errors.length <= 10) {
    console.log('\n错误详情:');
    result.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }
}

main().catch(console.error);
