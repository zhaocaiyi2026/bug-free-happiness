/**
 * CSV 导入脚本（Tab 分隔符）
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = '/workspace/projects/assets/吉林省招标采购信息.csv';
const API_URL = 'http://localhost:9091/api/v1/csv-import';

// 解析 Tab 分隔的 CSV
function parseTSV(content) {
  const lines = content.split('\n');
  
  // 第一行是标题
  const headers = lines[0].split('\t');
  
  console.log('CSV 标题:', headers);
  
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split('\t');
    
    if (values.length >= headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }
  
  return rows;
}

async function main() {
  console.log('==========================================');
  console.log('CSV 导入工具（Tab 分隔符版本）');
  console.log('==========================================\n');
  
  // 1. 读取 CSV 文件
  console.log(`[1/4] 读取 CSV 文件: ${CSV_PATH}`);
  
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  console.log(`文件大小: ${(content.length / 1024).toFixed(2)} KB\n`);
  
  // 2. 解析 CSV
  console.log('[2/4] 解析 CSV 数据...');
  const rows = parseTSV(content);
  console.log(`解析完成，共 ${rows.length} 条数据\n`);
  
  // 打印前 3 条数据的标题
  console.log('前 3 条数据预览:');
  rows.slice(0, 3).forEach((row, index) => {
    console.log(`  ${index + 1}. ${row['标题']?.substring(0, 50)}...`);
  });
  console.log('');
  
  // 3. 调用 API 导入
  console.log(`[3/4] 调用 API 导入: ${API_URL}`);
  console.log('这可能需要几分钟时间...\n');
  
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
    result.data.errors.slice(0, 10).forEach((error) => {
      console.log(`  - ${error}`);
    });
    if (result.data.errors.length > 10) {
      console.log(`  ... 还有 ${result.data.errors.length - 10} 条错误`);
    }
  }
  
  console.log('==========================================');
  console.log(result.success ? '✅ 导入完成' : '❌ 导入失败');
}

main().catch(console.error);
