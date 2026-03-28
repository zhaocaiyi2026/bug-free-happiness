# 招标信息爬虫系统

## 法律合规声明

本爬虫系统严格遵守中国相关法律法规，仅爬取公开的招标公告信息。

### 遵守的法规

| 法规名称 | 合规措施 |
|---------|---------|
| 《中华人民共和国网络安全法》 | 设置合理请求间隔，不干扰网络正常运行 |
| 《中华人民共和国数据安全法》 | 合法合规处理数据，保护个人信息 |
| 《互联网信息服务管理办法》 | 遵守robots.txt协议，明确标识爬虫身份 |
| 《反不正当竞争法》 | 不实质性替代目标网站服务，标注数据来源 |

### 合规配置

```typescript
// 请求间隔：3-5秒
requestDelay: 4000  // 毫秒

// 爬取频率：每4小时
schedule: '0 */4 * * *'

// User-Agent标识
userAgent: 'BidTongBot/1.0 (Compliant Crawler; Contact: admin@bidtong.com)'
```

## 系统架构

```
server/src/crawler/
├── index.ts          # 入口文件
├── config.ts         # 配置文件
├── types.ts          # 类型定义
├── fetcher.ts        # HTTP请求封装
├── storage.ts        # 数据存储
├── scheduler.ts      # 定时任务调度
└── parsers/          # 网站解析器
    ├── base.ts       # 基础解析器
    ├── chinabidding.ts   # 中国招标网
    ├── ccgp.ts       # 中国政府采购网
    └── guangdong.ts  # 广东省政府采购网
```

## 数据源配置

### 国家级平台
- 中国政府采购网 (ccgp.gov.cn)
- 中国招标投标公共服务平台 (cebpubservice.com)

### 省级平台
- 广东省、浙江省、江苏省、上海市、北京市、四川省等政府采购网

### 招标平台
- 中国招标网 (chinabidding.cn)
- 采购与招标网 (chinabidding.com.cn)

## API 接口

### 获取爬虫状态
```bash
GET /api/v1/crawler/status
```

### 获取爬虫统计
```bash
GET /api/v1/crawler/stats
```

### 获取可用数据源
```bash
GET /api/v1/crawler/sources
```

### 获取爬取日志
```bash
GET /api/v1/crawler/logs?limit=20
```

### 启动爬虫服务
```bash
POST /api/v1/crawler/start
```

### 停止爬虫服务
```bash
POST /api/v1/crawler/stop
```

### 手动触发爬取
```bash
POST /api/v1/crawler/run
Content-Type: application/json

{
  "source": "中国政府采购网"  # 可选，不传则爬取全部
}
```

## 使用示例

### 启动爬虫服务
```bash
# 方式1：通过API启动
curl -X POST http://localhost:9091/api/v1/crawler/start

# 方式2：设置环境变量自动启动
ENABLE_CRAWLER=true pnpm run dev
```

### 手动触发爬取
```bash
# 爬取单个数据源
curl -X POST http://localhost:9091/api/v1/crawler/run \
  -H "Content-Type: application/json" \
  -d '{"source": "中国政府采购网"}'

# 爬取所有数据源
curl -X POST http://localhost:9091/api/v1/crawler/run
```

## 扩展新数据源

### 1. 创建解析器

```typescript
// server/src/crawler/parsers/newsite.ts
import { BaseParser } from './base';
import type { BidInfo, ParserConfig } from '../types';

export class NewSiteParser extends BaseParser {
  constructor() {
    const config: ParserConfig = {
      name: '新招标网站',
      baseUrl: 'https://example.com',
      listUrl: 'https://example.com/list',
      requestDelay: 5000,
      maxPages: 3,
      enabled: true,
      schedule: '30 */4 * * *',
    };
    super(config);
  }

  protected async parseListPage(page: number): Promise<BidInfo[]> {
    // 实现解析逻辑
    const url = `${this.config.listUrl}?page=${page}`;
    // ...
    return bids;
  }
}
```

### 2. 注册解析器

```typescript
// server/src/crawler/parsers/index.ts
import { NewSiteParser } from './newsite';

const parserRegistry = new Map([
  // ...
  ['新招标网站', NewSiteParser],
]);
```

### 3. 添加配置

```typescript
// server/src/crawler/config.ts
export const PARSER_CONFIGS = [
  // ...
  {
    name: '新招标网站',
    // ...
  },
];
```

## 注意事项

1. **请求频率**：严格遵守设置的请求间隔，避免对目标服务器造成压力
2. **数据来源**：所有爬取的数据都会标注来源URL
3. **数据去重**：系统自动基于标题和来源URL进行去重
4. **数据清理**：超过90天的数据会自动清理
5. **错误处理**：单个数据源失败不影响其他数据源的爬取

## 监控与日志

系统提供详细的日志记录：
- 每次爬取的开始和结束时间
- 爬取的数据条数
- 保存成功/失败的数量
- 错误信息

可通过API查看最近的爬取日志：
```bash
GET /api/v1/crawler/logs?limit=50
```
