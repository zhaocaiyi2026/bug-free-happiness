# DeepSeek 集成方案

## 一、DeepSeek API 接入

### 1. 基本信息

| 项目 | 内容 |
|------|------|
| 服务商 | DeepSeek |
| API文档 | https://platform.deepseek.com/docs |
| 模型 | deepseek-chat, deepseek-coder |
| 计费 | 按Token计费 |

### 2. 环境变量配置

```bash
# DeepSeek API
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

---

## 二、应用场景设计

### 场景1：智能搜索意图识别

**用户输入** → DeepSeek分析 → 结构化查询条件

```
用户: "最近一个月广东的IT项目招标"

DeepSeek分析结果:
{
  "keywords": ["IT", "信息化"],
  "province": "广东省",
  "industry": "IT服务",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "bidType": null
}
```

### 场景2：招标信息智能摘要

**原始招标公告** → DeepSeek处理 → 结构化摘要

```
输入: [长篇招标公告文本]

DeepSeek输出:
{
  "projectName": "XX市智慧城市建设项目",
  "budget": "500万元",
  "deadline": "2024-02-15",
  "requirements": ["信息系统集成资质", "ISO9001认证"],
  "keyPoints": ["需本地化服务团队", "项目周期6个月"],
  "riskAlert": ["投标保证金要求较高"]
}
```

### 场景3：中标分析报告

**多个中标数据** → DeepSeek分析 → 行业洞察

```
输入: [近30天IT行业中标数据]

DeepSeek输出:
{
  "avgWinAmount": "320万元",
  "topWinners": ["公司A", "公司B"],
  "priceTrend": "上涨5%",
  "hotRegions": ["广东", "浙江", "江苏"],
  "recommendations": ["建议关注智慧城市方向", "预算建议提高10%"]
}
```

---

## 三、技术实现架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端应用                                  │
│              用户提问 / 搜索 / 分析请求                          │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Express API Gateway                        │
│              /api/v1/ai/search                                   │
│              /api/v1/ai/analyze                                  │
│              /api/v1/ai/chat                                     │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      AI Service Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Intent Parser │  │ Summarizer   │  │  Analyzer    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DeepSeek API                               │
│              deepseek-chat (对话)                                │
│              deepseek-coder (代码生成)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、代码实现预留

### 1. AI服务基础类

```typescript
// server/src/services/ai/deepseek-service.ts

import axios from 'axios';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  id: string;
  choices: {
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  }
  
  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await axios.post<ChatResponse>(
      `${this.baseUrl}/v1/chat/completions`,
      {
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.choices[0].message.content;
  }
  
  // 流式输出（SSE）
  async *chatStream(messages: ChatMessage[]): AsyncGenerator<string> {
    // 实现流式输出
  }
}
```

### 2. 意图识别服务

```typescript
// server/src/services/ai/intent-parser.ts

import { DeepSeekService } from './deepseek-service';

const SYSTEM_PROMPT = `你是一个招标信息搜索助手。分析用户的搜索意图，提取以下信息：
1. 关键词（keywords）：数组
2. 省份（province）：字符串
3. 城市（city）：字符串
4. 行业（industry）：字符串
5. 预算范围（budgetRange）：{min, max}
6. 时间范围（dateRange）：{start, end}
7. 招标类型（bidType）：字符串

返回JSON格式结果。`;

export async function parseSearchIntent(query: string) {
  const service = new DeepSeekService();
  
  const response = await service.chat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: query },
  ]);
  
  try {
    return JSON.parse(response);
  } catch {
    return { keywords: [query] };
  }
}
```

### 3. 招标摘要服务

```typescript
// server/src/services/ai/summarizer.ts

export async function summarizeBidNotice(content: string) {
  const service = new DeepSeekService();
  
  const response = await service.chat([
    { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
    { role: 'user', content: `请分析以下招标公告：\n\n${content}` },
  ]);
  
  return JSON.parse(response);
}
```

---

## 五、成本估算

| 使用场景 | 月调用量 | Token消耗 | 月费用估算 |
|----------|----------|-----------|------------|
| 意图识别 | 10,000次 | ~500K tokens | ¥50-100 |
| 内容摘要 | 5,000次 | ~2M tokens | ¥100-200 |
| 分析报告 | 1,000次 | ~500K tokens | ¥50-100 |
| **合计** | - | - | **¥200-400/月** |

---

## 六、实施计划

| 阶段 | 内容 | 预计时间 |
|------|------|----------|
| Phase 1 | 接入DeepSeek API，实现基础对话 | 1周 |
| Phase 2 | 实现搜索意图识别 | 1周 |
| Phase 3 | 实现招标信息智能摘要 | 1周 |
| Phase 4 | 实现中标数据分析报告 | 2周 |
| Phase 5 | 优化Prompt，提升准确性 | 持续 |

---

## 七、注意事项

1. **API Key安全**
   - 使用环境变量存储
   - 定期轮换密钥
   - 设置使用限额

2. **响应质量**
   - 优化System Prompt
   - 添加Few-shot示例
   - 实现结果校验

3. **成本控制**
   - 缓存常见查询结果
   - 限制Token消耗
   - 监控API调用量
