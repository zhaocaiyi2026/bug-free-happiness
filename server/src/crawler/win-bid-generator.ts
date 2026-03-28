/**
 * 中标信息模拟数据生成器
 * 
 * 用于生成包含完整中标单位信息的模拟数据
 */

import type { WinBidInfo } from './types';

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
  { province: '山东省', city: '济南市', sources: ['山东省政府采购网', '济南市政府采购网'] },
  { province: '山东省', city: '青岛市', sources: ['青岛政府采购网', '山东省政府采购网'] },
  { province: '湖北省', city: '武汉市', sources: ['武汉市政府采购网', '湖北省政府采购中心'] },
  { province: '湖南省', city: '长沙市', sources: ['长沙市政府采购网', '湖南省政府采购网'] },
  { province: '河南省', city: '郑州市', sources: ['河南公共资源交易中心', '河南省政府采购网'] },
  { province: '福建省', city: '厦门市', sources: ['厦门公共资源交易中心', '福建省政府采购网'] },
  { province: '陕西省', city: '西安市', sources: ['西安公共资源交易中心', '陕西省公共资源交易中心'] },
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

// 中标公司名称库
const companyPrefixes = ['华', '中', '国', '新', '东', '南', '北', '西', '天', '地', '金', '银', '盛', '达', '通'];
const companyMids = ['创', '建', '联', '智', '科', '技', '工', '程', '实', '业', '集', '团'];
const companySuffixes = ['有限公司', '股份有限公司', '集团股份有限公司', '建设有限公司', '科技有限公司', '工程有限公司'];

// 生成公司名称
function generateCompanyName(): string {
  const prefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
  const mid = companyMids[Math.floor(Math.random() * companyMids.length)];
  const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
  return `${prefix}${mid}${suffix}`;
}

// 生成随机电话
function generatePhone(): string {
  const prefixes = ['138', '139', '136', '137', '135', '158', '159', '188', '189', '186', '010', '021', '020'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let phone = prefix;
  for (let i = 0; i < 8; i++) {
    phone += Math.floor(Math.random() * 10);
  }
  return phone;
}

// 生成地址
function generateAddress(province: string, city: string): string {
  const districts = ['高新区', '经开区', '中心区', '新城区', '老城区', '工业区'];
  const streets = ['建设路', '人民路', '中山路', '解放路', '和平路', '科技路'];
  const district = districts[Math.floor(Math.random() * districts.length)];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const number = Math.floor(Math.random() * 200) + 1;
  return `${province}${city}${district}${street}${number}号`;
}

// 生成日期
function generateDate(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

/**
 * 生成单条中标信息
 */
export function generateWinBid(): WinBidInfo {
  // 随机选择地区
  const location = locations[Math.floor(Math.random() * locations.length)];
  
  // 随机选择行业和项目
  const industry = industries[Math.floor(Math.random() * industries.length)];
  const projectType = industry.projects[Math.floor(Math.random() * industry.projects.length)];
  
  // 生成标题
  const year = new Date().getFullYear();
  const projectNum = Math.floor(Math.random() * 9000) + 1000;
  const title = `${location.city}${projectType}项目中标公告`;
  
  // 随机中标金额
  const budgetBase = [100, 500, 1000, 2000, 5000, 10000, 20000, 50000][Math.floor(Math.random() * 8)];
  const winAmount = budgetBase * (Math.random() * 0.4 + 0.8) * 10000;
  
  // 生成日期（中标日期在过去30天内）
  const winDaysAgo = Math.floor(Math.random() * 30) + 1;
  const publishDaysAgo = winDaysAgo - Math.floor(Math.random() * 3) - 1;
  const winDate = generateDate(-winDaysAgo);
  const publishDate = generateDate(publishDaysAgo);
  
  // 招标类型
  const bidType = bidTypes[Math.floor(Math.random() * bidTypes.length)];
  
  // 数据来源
  const source = location.sources[Math.floor(Math.random() * location.sources.length)];
  
  // 生成中标单位信息
  const winCompany = generateCompanyName();
  const projectLocation = generateAddress(location.province, location.city);
  const winCompanyAddress = generateAddress(location.province, location.city);
  
  // 生成中标内容
  const content = `经评标委员会评审，${winCompany}以人民币${(winAmount / 10000).toFixed(0)}万元中标本项目。项目实施周期为${Math.floor(Math.random() * 60) + 30}天，质保期不低于${Math.floor(Math.random() * 3) + 1}年。`;
  
  return {
    title,
    content,
    winAmount: Math.round(winAmount),
    province: location.province,
    city: location.city,
    industry: industry.name,
    bidType,
    // 中标单位信息
    winCompany,
    winCompanyAddress,
    winCompanyPhone: generatePhone(),
    // 项目信息
    projectLocation,
    // 日期
    winDate,
    publishDate,
    // 来源
    source,
    sourceUrl: `https://www.example.gov.cn/winbid/${projectNum}`,
  };
}

/**
 * 批量生成中标信息
 */
export function generateWinBids(count: number): WinBidInfo[] {
  const winBids: WinBidInfo[] = [];
  for (let i = 0; i < count; i++) {
    winBids.push(generateWinBid());
  }
  return winBids;
}
