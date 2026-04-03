/**
 * 招标信息内容清理服务
 * 
 * 功能：
 * 1. 过滤HTML代码、CSS样式
 * 2. 移除网站导航、页脚等无关内容
 * 3. 分段整理内容
 * 4. 提取关键信息
 */

interface CleanedBidContent {
  title: string;
  content: string;
  projectNumber: string;
  projectName: string;
  budget: number | null;
  bidType: string;
  publishDate: string;
  deadline: string;
  contactPerson: string;
  contactPhone: string;
  contactAddress: string;
  procurementUnit: string;
  agency: string;
}

// 需要过滤的无关内容模式
const NOISE_PATTERNS = [
  // 网站导航和页眉
  /财政部唯一指定政府采购信息网络发布媒体/g,
  /国家级政府采购专业网站/g,
  /服务热线[：:]\s*[\d-]+/g,
  /服务投诉[：:]\s*[\d-]+/g,
  /首页\s*政采法规\s*购买服务\s*监督检查\s*信息公告\s*国际专栏/g,
  /当前位置[：:][^\n]*/g,
  /【打印】/g,
  /【收藏】/g,
  /【分享】/g,
  /来源：\s*$/gm,
  
  // CSS样式
  /\.[a-zA-Z_][\w-]*\s*\{[^}]*\}/g,
  /th\s*,\s*td\s*\{[^}]*\}/g,
  /\.copyright_bl\{[^}]*\}/g,
  /@media[^}]*\{[^}]*\}/g,
  /document\.write\([^)]*\);?/g,
  
  // 网站链接
  /https?:\/\/www\.zcygov\.cn\/?/g,
  /https?:\/\/www\.ccgp\.gov\.cn\/?/g,
  /https?:\/\/dcs\.conac\.cn\/[^\s]*/g,
  
  // 页脚和版权信息
  /版权所有[^\n]*/g,
  /京ICP备[\d-]+号/g,
  /京公网安备[\d-]+号/g,
  /违法和不良信息举报[^\n]*/g,
  /技术支持[：:][^\n]*/g,
  /©\s*\d{4}[^\n]*/g,
  /主办单位[：:][^\n]*/g,
  /网站标识码[：:][^\n]*/g,
  /联系我们[^\n]*/g,
  /意见反馈/g,
  
  // JavaScript代码
  /var\s+\w+\s*=\s*[^;]+;/g,
  /\$\([^)]+\)\.html\([^)]*\);?/g,
  
  // HTML实体
  /&nbsp;/g,
  /&copy;/g,
  /&quot;/g,
  
  // 其他噪音
  /unescape\([^)]*\)/g,
  /%3C[^%]*%3E/g,
];

/**
 * 清理文本中的无关内容
 */
function filterNoise(text: string): string {
  let cleaned = text;
  
  // 应用所有过滤模式
  for (const pattern of NOISE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // 移除多余的空格
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  
  // 移除多余的换行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
}

/**
 * 提取关键信息
 */
function extractKeyInfo(text: string): Partial<CleanedBidContent> {
  const info: Partial<CleanedBidContent> = {};
  
  // 提取项目编号
  const projectNumberMatch = text.match(/项目编号[：:]\s*([^\s\n]+)/);
  if (projectNumberMatch) {
    info.projectNumber = projectNumberMatch[1].trim();
  }
  
  // 提取项目名称
  const projectNameMatch = text.match(/项目名称[：:]\s*([^\n]+)/);
  if (projectNameMatch) {
    info.projectName = projectNameMatch[1].trim();
  }
  
  // 提取预算金额
  const budgetMatch = text.match(/预算金额[（(]元[)）]?[：:]\s*([\d,.]+)/);
  if (budgetMatch) {
    info.budget = parseFloat(budgetMatch[1].replace(/,/g, ''));
  }
  const budgetMatch2 = text.match(/￥([\d,.]+)\s*万元/);
  if (budgetMatch2 && !info.budget) {
    info.budget = Math.round(parseFloat(budgetMatch2[1].replace(/,/g, '')) * 10000);
  }
  
  // 提取采购方式
  const bidTypeMatch = text.match(/采购方式[：:]\s*([^\n]+)/);
  if (bidTypeMatch) {
    info.bidType = bidTypeMatch[1].trim();
  }
  
  // 提取发布日期
  const publishDateMatch = text.match(/公告时间[：:]\s*(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (publishDateMatch) {
    info.publishDate = `${publishDateMatch[1]}-${publishDateMatch[2].padStart(2, '0')}-${publishDateMatch[3].padStart(2, '0')}`;
  }
  const publishDateMatch2 = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s*\d{1,2}:\d{1,2}/);
  if (publishDateMatch2 && !info.publishDate) {
    info.publishDate = `${publishDateMatch2[1]}-${publishDateMatch2[2].padStart(2, '0')}-${publishDateMatch2[3].padStart(2, '0')}`;
  }
  
  // 提取截止时间
  const deadlineMatch = text.match(/截止时间[：:]\s*(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2}):(\d{1,2})/);
  if (deadlineMatch) {
    info.deadline = `${deadlineMatch[1]}-${deadlineMatch[2].padStart(2, '0')}-${deadlineMatch[3].padStart(2, '0')} ${deadlineMatch[4].padStart(2, '0')}:${deadlineMatch[5].padStart(2, '0')}:00`;
  }
  const deadlineMatch2 = text.match(/响应文件(?:开启|提交)时间[：:]\s*(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2}):(\d{1,2})/);
  if (deadlineMatch2 && !info.deadline) {
    info.deadline = `${deadlineMatch2[1]}-${deadlineMatch2[2].padStart(2, '0')}-${deadlineMatch2[3].padStart(2, '0')} ${deadlineMatch2[4].padStart(2, '0')}:${deadlineMatch2[5].padStart(2, '0')}:00`;
  }
  const deadlineMatch3 = text.match(/开标时间[：:]\s*(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2}):(\d{1,2})/);
  if (deadlineMatch3 && !info.deadline) {
    info.deadline = `${deadlineMatch3[1]}-${deadlineMatch3[2].padStart(2, '0')}-${deadlineMatch3[3].padStart(2, '0')} ${deadlineMatch3[4].padStart(2, '0')}:${deadlineMatch3[5].padStart(2, '0')}:00`;
  }
  
  // 提取联系人
  const contactMatch = text.match(/项目联系人[：:]\s*([^\n\d]+)/);
  if (contactMatch) {
    info.contactPerson = contactMatch[1].trim();
  }
  
  // 提取联系电话
  const phoneMatch = text.match(/项目联系电话[：:]\s*([\d,\-、\s]+)/);
  if (phoneMatch) {
    info.contactPhone = phoneMatch[1].trim();
  }
  
  // 提取采购单位
  const unitMatch = text.match(/采购单位[：:]\s*([^\n]+)/);
  if (unitMatch) {
    info.procurementUnit = unitMatch[1].trim();
  }
  
  // 提取代理机构
  const agencyMatch = text.match(/代理机构名称[：:]\s*([^\n]+)/);
  if (agencyMatch) {
    info.agency = agencyMatch[1].trim();
  }
  
  // 提取采购单位地址
  const addressMatch = text.match(/采购单位地址[：:]\s*([^\n]+)/);
  if (addressMatch) {
    info.contactAddress = addressMatch[1].trim();
  }
  
  return info;
}

/**
 * 将内容分段整理
 */
function formatContent(text: string): string {
  // 定义章节标题
  const sectionTitles = [
    '一、项目基本情况',
    '二、申请人的资格要求',
    '三、获取采购文件',
    '四、响应文件提交',
    '五、响应文件开启',
    '六、公告期限',
    '七、其他补充事宜',
    '八、联系方式',
    '九、凡对本次招标提出询问',
    '项目概况',
    '公告概要',
  ];
  
  let formatted = text;
  
  // 在章节标题前添加换行
  for (const title of sectionTitles) {
    const escapedTitle = title.replace(/[（）()一二三四五六七八九十]/g, '\\$&');
    const regex = new RegExp(`\\s*${escapedTitle}`, 'g');
    formatted = formatted.replace(regex, `\n\n${title}`);
  }
  
  // 处理字段行
  const fieldPatterns = [
    '项目编号', '项目名称', '采购方式', '预算金额', '最高限价',
    '采购需求', '合同履约期限', '公告时间', '获取采购文件时间',
    '响应文件递交地点', '响应文件开启时间', '响应文件开启地点',
    '联系人', '联系电话', '采购单位', '采购单位地址', '采购单位联系方式',
    '代理机构名称', '代理机构地址', '代理机构联系方式',
    '品目', '行政区域', '公告时间', '预算金额',
  ];
  
  for (const field of fieldPatterns) {
    const regex = new RegExp(`([\\s])(${field}[：:])`, 'g');
    formatted = formatted.replace(regex, '$1\n$2');
  }
  
  // 清理多余空行
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  return formatted.trim();
}

/**
 * 清理单条招标信息内容
 */
export function cleanBidContent(
  title: string,
  rawContent: string
): CleanedBidContent {
  // 1. 过滤噪音
  let cleanedContent = filterNoise(rawContent);
  
  // 2. 提取关键信息
  const keyInfo = extractKeyInfo(cleanedContent);
  
  // 3. 分段整理
  cleanedContent = formatContent(cleanedContent);
  
  // 4. 构建结果
  return {
    title: title,
    content: cleanedContent,
    projectNumber: keyInfo.projectNumber || '',
    projectName: keyInfo.projectName || title,
    budget: keyInfo.budget || null,
    bidType: keyInfo.bidType || '公开招标',
    publishDate: keyInfo.publishDate || '',
    deadline: keyInfo.deadline || '',
    contactPerson: keyInfo.contactPerson || '',
    contactPhone: keyInfo.contactPhone || '',
    contactAddress: keyInfo.contactAddress || '',
    procurementUnit: keyInfo.procurementUnit || '',
    agency: keyInfo.agency || '',
  };
}

/**
 * 批量清理招标信息
 */
export function cleanBidContents(
  items: Array<{ title: string; content: string }>
): CleanedBidContent[] {
  return items.map(item => cleanBidContent(item.title, item.content));
}
