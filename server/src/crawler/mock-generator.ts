/**
 * 招标信息模拟数据生成器
 * 
 * 用于生成包含详细联系信息的招标数据
 */

import type { BidInfo } from './types';

// 省份城市数据
const locations = [
  { province: '广东省', city: '广州市', sources: ['广州政府采购网', '广东省政府采购网'] },
  { province: '广东省', city: '深圳市', sources: ['深圳公共资源交易中心', '深圳市政府采购网'] },
  { province: '北京市', city: '北京市', sources: ['北京市政府采购网', '中国政府采购网'] },
  { province: '上海市', city: '上海市', sources: ['上海政府采购网', '上海公共资源交易中心'] },
  { province: '浙江省', city: '杭州市', sources: ['杭州公共资源交易中心', '浙江省政府采购网'] },
  { province: '浙江省', city: '宁波市', sources: ['宁波公共资源交易中心', '浙江省政府采购网'] },
  { province: '江苏省', city: '南京市', sources: ['南京市政府采购网', '江苏省政府采购网'] },
  { province: '江苏省', city: '苏州市', sources: ['苏州公共资源交易中心', '江苏省政府采购网'] },
  { province: '四川省', city: '成都市', sources: ['成都公共资源交易中心', '四川省政府采购网'] },
  { province: '四川省', city: '绵阳市', sources: ['绵阳公共资源交易中心', '四川省政府采购网'] },
  { province: '山东省', city: '济南市', sources: ['山东省政府采购网', '济南市政府采购网'] },
  { province: '山东省', city: '青岛市', sources: ['青岛政府采购网', '山东省政府采购网'] },
  { province: '湖北省', city: '武汉市', sources: ['武汉市政府采购网', '湖北省政府采购中心'] },
  { province: '湖南省', city: '长沙市', sources: ['长沙市政府采购网', '湖南省政府采购网'] },
  { province: '河南省', city: '郑州市', sources: ['河南公共资源交易中心', '河南省政府采购网'] },
  { province: '福建省', city: '厦门市', sources: ['厦门公共资源交易中心', '福建省政府采购网'] },
  { province: '陕西省', city: '西安市', sources: ['西安公共资源交易中心', '陕西省公共资源交易中心'] },
  { province: '辽宁省', city: '沈阳市', sources: ['辽宁省政府采购中心', '辽宁省政府采购网'] },
  { province: '河北省', city: '石家庄市', sources: ['河北政府采购网', '河北省政府采购网'] },
  { province: '安徽省', city: '合肥市', sources: ['合肥公共资源交易中心', '安徽省政府采购网'] },
];

// 行业数据
const industries = [
  { name: '信息技术', projects: ['信息化系统建设', '智慧城市项目', '数据中心建设', '网络安全升级', '软件开发服务'] },
  { name: '建筑工程', projects: ['市政道路改造', '办公大楼建设', '学校建设工程', '医院扩建项目', '公园景观工程'] },
  { name: '医疗卫生', projects: ['医疗设备采购', '医院信息化', '急救中心建设', '防疫物资采购', '医疗耗材供应'] },
  { name: '教育科研', projects: ['教学设备采购', '实验室建设', '智慧校园项目', '图书馆改造', '科研仪器采购'] },
  { name: '交通运输', projects: ['轨道交通建设', '公交车辆采购', '智能交通系统', '道路养护工程', '停车场建设'] },
  { name: '环保能源', projects: ['污水处理工程', '垃圾焚烧发电', '新能源充电桩', '光伏发电项目', '环保监测系统'] },
  { name: '市政设施', projects: ['供水管网改造', '路灯节能改造', '环卫设备采购', '园林绿化工程', '河道治理工程'] },
  { name: '农业农村', projects: ['农业机械化', '农村道路建设', '农田水利设施', '农产品检测设备', '乡村振兴项目'] },
];

// 招标类型
const bidTypes = ['公开招标', '竞争性谈判', '竞争性磋商', '询价采购', '单一来源采购'];

// 姓名库
const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高'];
const names = ['明', '华', '强', '伟', '军', '平', '辉', '建', '文', '志', '国', '东', '海', '波', '杰'];

// 资质要求模板
const requirementsTemplates = [
  '1. 具有独立法人资格，持有有效的营业执照；\n2. 具有良好的商业信誉和健全的财务会计制度；\n3. 具有履行合同所必需的设备和专业技术能力；\n4. 参加本次采购活动前三年内，在经营活动中没有重大违法记录；\n5. 符合法律、行政法规规定的其他条件。',
  '1. 供应商须为在中华人民共和国境内注册的独立法人；\n2. 具有相关行业资质证书，近三年有类似项目业绩；\n3. 项目负责人须具有中级及以上职称；\n4. 财务状况良好，具有足够的流动资金承担本项目；\n5. 未被列入失信被执行人名单。',
  '1. 具有相关经营范围的营业执照；\n2. 具有ISO9001质量管理体系认证；\n3. 注册资金不低于人民币XXX万元；\n4. 近三年内完成过不少于X个类似项目；\n5. 具有良好的售后服务能力和质量保证体系。',
];

// 项目内容模板
const contentTemplates = [
  '本项目主要建设内容包括：{project}。投标人应按照招标文件要求，提供完整的方案设计、设备供货、安装调试及售后服务。项目实施周期为{days}天，质保期不低于{warranty}年。',
  '项目概况：{project}。采购范围包括设备采购、运输、安装、调试、培训及售后服务等全过程。交货期：合同签订后{days}日内完成全部供货及安装调试工作。',
  '招标范围：{project}。要求供应商提供符合国家标准和行业规范的设备及服务，包括但不限于方案设计、设备供应、系统集成、人员培训及售后维护等。工期要求：{days}个日历天。',
];

// 生成随机电话
function generatePhone(): string {
  const prefixes = ['138', '139', '136', '137', '135', '158', '159', '188', '189', '186'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let phone = prefix;
  for (let i = 0; i < 8; i++) {
    phone += Math.floor(Math.random() * 10);
  }
  return phone;
}

// 生成随机邮箱
function generateEmail(name: string): string {
  const domains = ['163.com', '126.com', 'qq.com', 'gov.cn', 'sina.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const pinyin = `user${Math.floor(Math.random() * 10000)}`;
  return `${pinyin}@${domain}`;
}

// 生成地址
function generateAddress(city: string): string {
  const districts = ['高新区', '经开区', '中心区', '新城区', '老城区'];
  const streets = ['建设路', '人民路', '中山路', '解放路', '和平路'];
  const district = districts[Math.floor(Math.random() * districts.length)];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const number = Math.floor(Math.random() * 200) + 1;
  return `${city}${district}${street}${number}号`;
}

// 生成日期
function generateDate(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

/**
 * 生成单条招标信息
 */
export function generateBid(): BidInfo {
  // 随机选择地区
  const location = locations[Math.floor(Math.random() * locations.length)];
  
  // 随机选择行业和项目
  const industry = industries[Math.floor(Math.random() * industries.length)];
  const projectType = industry.projects[Math.floor(Math.random() * industry.projects.length)];
  
  // 生成标题
  const year = new Date().getFullYear();
  const projectNum = Math.floor(Math.random() * 9000) + 1000;
  const title = `${location.city}${projectType}项目${year}年第${projectNum}号招标公告`;
  
  // 随机预算
  const budgetBase = [100, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000][Math.floor(Math.random() * 9)];
  const budget = budgetBase * (Math.random() * 0.4 + 0.8) * 10000;
  
  // 生成日期
  const publishDaysAgo = Math.floor(Math.random() * 7);
  const deadlineDays = Math.floor(Math.random() * 20) + 7;
  const publishDate = generateDate(-publishDaysAgo);
  const deadline = generateDate(deadlineDays);
  const openBidTime = generateDate(deadlineDays + 1);
  
  // 生成联系人
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const firstName = names[Math.floor(Math.random() * names.length)];
  const contactPerson = surname + firstName;
  
  // 生成项目内容
  const contentTemplate = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];
  const content = contentTemplate
    .replace('{project}', projectType + '相关内容')
    .replace('{days}', String(Math.floor(Math.random() * 60) + 30))
    .replace('{warranty}', String(Math.floor(Math.random() * 3) + 1));
  
  // 是否紧急
  const isUrgent = Math.random() < 0.2;
  
  // 招标类型
  const bidType = bidTypes[Math.floor(Math.random() * bidTypes.length)];
  
  // 数据来源
  const source = location.sources[Math.floor(Math.random() * location.sources.length)];
  
  // 生成详细地址
  const projectLocation = `${location.province}${location.city}${generateAddress(location.city)}`;
  const contactAddress = `${location.city}公共资源交易中心`;
  const openBidLocation = `${location.city}公共资源交易中心开标大厅`;
  
  return {
    title,
    content,
    budget: Math.round(budget),
    province: location.province,
    city: location.city,
    industry: industry.name,
    bidType,
    publishDate,
    deadline,
    source,
    sourceUrl: `https://www.example.gov.cn/bid/${projectNum}`,
    isUrgent,
    // 联系人信息
    contactPerson,
    contactPhone: generatePhone(),
    contactEmail: generateEmail(contactPerson),
    contactAddress,
    // 详细信息
    projectLocation,
    requirements: requirementsTemplates[Math.floor(Math.random() * requirementsTemplates.length)],
    openBidTime,
    openBidLocation,
  };
}

/**
 * 批量生成招标信息
 */
export function generateBids(count: number): BidInfo[] {
  const bids: BidInfo[] = [];
  for (let i = 0; i < count; i++) {
    bids.push(generateBid());
  }
  return bids;
}
