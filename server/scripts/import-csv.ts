/**
 * CSV 导入脚本
 * 
 * 用法：npx tsx scripts/import-csv.ts
 * 
 * 流程：
 * 1. 读取 CSV 文件
 * 2. 解析为 JSON
 * 3. 调用 API 进行查重、格式化、入库
 */

import * as fs from 'fs';
import * as path from 'path';

// CSV 文件路径
const CSV_PATH = path.join(__dirname, '../../assets/吉林省招标采购信息.csv');
const API_URL = process.env.API_URL || 'http://localhost:9091/api/v1/csv-import';

interface CSVRow {
  类型: string;
  标题: string;
  省份: string;
  发布时间: string;
  来源: string;
  详情链接: string;
  完整内容: string;
}

/**
 * 解析 CSV 行（处理引号内的逗号和换行）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 转义引号
        current += '"';
        i++;
      } else {
        // 切换引号状态
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 字段分隔符
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // 最后一个字段
  result.push(current.trim());
  
  return result;
}

/**
 * 解析 CSV 文件
 */
function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV 文件为空或格式错误');
  }
  
  // 解析标题行
  const headers = parseCSVLine(lines[0]);
  console.log('CSV 标题:', headers);
  
  const rows: CSVRow[] = [];
  
  // 解析数据行（处理多行内容）
  let currentRow: string[] = [];
  let inQuotes = false;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // 检查是否在引号内
    let quoteCount = 0;
    for (const char of line) {
      if (char === '"') quoteCount++;
    }
    
    // 奇数个引号表示开始或结束引用块
    if (quoteCount % 2 === 1) {
      inQuotes = !inQuotes;
    }
    
    currentRow.push(line);
    
    // 如果不在引号内，表示一行结束
    if (!inQuotes) {
      const fullLine = currentRow.join('\n');
      const values = parseCSVLine(fullLine);
      
      if (values.length >= headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }
      
      currentRow = [];
    }
  }
  
  return rows;
}

/**
 * 主函数
 */
async function main() {
  console.log('==========================================');
  console.log('CSV 导入工具');
  console.log('==========================================\n');
  
  // 1. 读取 CSV 文件
  console.log(`[1/4] 读取 CSV 文件: ${CSV_PATH}`);
  
  if (!fs.existsSync(CSV_PATH)) {
    // 尝试从 URL 参数获取
    const csvUrl = process.env.CSV_URL;
    if (csvUrl) {
      console.log('从 URL 下载 CSV...');
      const response = await fetch(csvUrl);
      const content = await response.text();
      fs.writeFileSync(CSV_PATH, content, 'utf-8');
    } else {
      throw new Error(`CSV 文件不存在: ${CSV_PATH}`);
    }
  }
  
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  console.log(`文件大小: ${(csvContent.length / 1024).toFixed(2)} KB\n`);
  
  // 2. 解析 CSV
  console.log('[2/4] 解析 CSV 数据...');
  const rows = parseCSV(csvContent);
  console.log(`解析完成，共 ${rows.length} 条数据\n`);
  
  // 打印前 3 条数据的标题
  console.log('前 3 条数据预览:');
  rows.slice(0, 3).forEach((row, index) => {
    console.log(`  ${index + 1}. ${row['标题']?.substring(0, 50)}...`);
  });
  console.log('');
  
  // 3. 调用 API 导入
  console.log(`[3/4] 调用 API 导入: ${API_URL}`);
  console.log('这可能需要几分钟时间（每条数据都会调用豆包大模型格式化）...\n');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: rows }),
  });
  
  const result = await response.json();
  
  // 4. 输出结果
  console.log('[4/4] 导入结果:');
  console.log('==========================================');
  console.log(`总计: ${result.data?.total || 0} 条`);
  console.log(`重复: ${result.data?.duplicate || 0} 条`);
  console.log(`格式化: ${result.data?.formatted || 0} 条`);
  console.log(`成功入库: ${result.data?.imported || 0} 条`);
  console.log(`失败: ${result.data?.failed || 0} 条`);
  
  if (result.data?.errors?.length > 0) {
    console.log('\n错误详情:');
    result.data.errors.slice(0, 10).forEach((error: string) => {
      console.log(`  - ${error}`);
    });
    if (result.data.errors.length > 10) {
      console.log(`  ... 还有 ${result.data.errors.length - 10} 条错误`);
    }
  }
  
  console.log('==========================================');
  console.log(result.success ? '✅ 导入完成' : '❌ 导入失败');
}

// 执行
main().catch(console.error);
