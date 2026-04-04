# 豆包数据实时推送接口文档

## 概述

本文档描述了豆包大模型与扣子系统之间的双向数据同步接口。采用"推送一条 → 审核一条 → 展示一条"的实时流程，确保数据及时入库并展示给用户。

## 基础信息

- **Base URL**: `https://your-domain.com/api/v1/sync-status`
- **Content-Type**: `application/json`
- **认证方式**: 暂无（后续可添加API Key）

---

## 1. 实时推送招标数据

### 接口地址
```
POST /api/v1/sync-status/push-bid
```

### 功能说明
豆包采集到招标数据后，实时调用此接口进行审核入库。系统会自动进行数据完整性审核、去重检查，审核通过后立即入库，前端即可展示。

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| province | string | 是 | 省份名称（用于更新同步状态） |
| bidData | object | 是 | 招标数据对象 |

#### bidData 对象结构

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | **是** | 招标公告标题 |
| sourceUrl | string | **是** | 来源URL（用于去重） |
| content | string | **是** | 正文内容（至少500字符） |
| contactPerson | string | 条件必填 | 联系人（与contactPhone至少填一项） |
| contactPhone | string | 条件必填 | 联系电话（与contactPerson至少填一项） |
| projectNumber | string | 否 | 项目编号 |
| budget | number | 否 | 预算金额（数字，单位：元） |
| province | string | 否 | 省份 |
| city | string | 否 | 城市 |
| industry | string | 否 | 行业分类 |
| bidType | string | 否 | 公告类型（默认：招标公告） |
| publishDate | string | 否 | 发布日期（YYYY-MM-DD） |
| deadline | string | 否 | 截止日期（YYYY-MM-DD） |
| sourcePlatform | string | 否 | 来源平台（默认：豆包采集） |

### 审核规则

1. **必填字段检查**：必须有标题和来源URL
2. **联系信息检查**：必须有联系人或联系电话（至少一项）
3. **内容完整性检查**：正文内容至少500字符
4. **去重检查**：
   - URL去重：相同sourceUrl的数据会被拒绝
   - 项目编号去重：相同项目编号的数据会被拒绝
   - 标题模糊匹配：标题前30字符相似的数据会被拒绝

### 响应格式

#### 成功入库
```json
{
  "success": true,
  "action": "saved",
  "data": {
    "id": 1090,
    "title": "某某医院设备采购项目公开招标公告",
    "province": "吉林省",
    "city": "长春市",
    "bidType": "招标公告",
    "publishDate": "2025-01-15T00:00:00"
  }
}
```

#### 审核不通过
```json
{
  "success": false,
  "action": "rejected",
  "reason": "正文内容不完整（仅200字符，需至少500字符）",
  "title": "项目标题"
}
```

#### 重复数据
```json
{
  "success": false,
  "action": "duplicate",
  "reason": "URL已存在",
  "title": "项目标题"
}
```

### 示例请求

```json
{
  "province": "吉林省",
  "bidData": {
    "title": "吉林省人民医院医疗设备采购项目公开招标公告",
    "sourceUrl": "https://www.ggzy.jl.gov.cn/bid/12345",
    "projectNumber": "JL-2025-001",
    "budget": 5000000,
    "province": "吉林省",
    "city": "长春市",
    "industry": "医疗",
    "bidType": "招标公告",
    "publishDate": "2025-01-15",
    "deadline": "2025-02-15",
    "contactPerson": "张经理",
    "contactPhone": "0431-88888888",
    "content": "完整正文内容（至少500字符）...",
    "sourcePlatform": "吉林省公共资源交易平台"
  }
}
```

---

## 2. 实时推送中标数据

### 接口地址
```
POST /api/v1/sync-status/push-winbid
```

### 功能说明
豆包采集到中标数据后，实时调用此接口进行审核入库。

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| province | string | 是 | 省份名称 |
| winbidData | object | 是 | 中标数据对象 |

#### winbidData 对象结构

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | **是** | 中标公告标题 |
| sourceUrl | string | **是** | 来源URL |
| content | string | **是** | 正文内容（至少300字符） |
| winner | string | **是** | 中标单位名称 |
| projectNumber | string | 否 | 项目编号 |
| winAmount | number | 否 | 中标金额（数字，单位：元） |
| province | string | 否 | 省份 |
| city | string | 否 | 城市 |
| industry | string | 否 | 行业分类 |
| publishDate | string | 否 | 发布日期 |
| winDate | string | 否 | 中标日期 |
| winnerAddress | string | 否 | 中标单位地址 |
| winnerPhone | string | 否 | 中标单位电话 |
| sourcePlatform | string | 否 | 来源平台 |

### 响应格式

#### 成功入库
```json
{
  "success": true,
  "action": "saved",
  "data": {
    "id": 590,
    "title": "某某医院设备采购项目中标公告",
    "province": "吉林省",
    "city": "长春市",
    "publishDate": "2025-02-20T00:00:00"
  }
}
```

---

## 3. 更新同步状态

### 接口地址
```
POST /api/v1/sync-status/update
```

### 功能说明
豆包在采集过程中，定期调用此接口更新同步进度。

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| province | string | 是 | 省份名称 |
| totalCount | number | 否 | 该省份数据总数 |
| syncedCount | number | 否 | 已同步数量 |
| lastSyncId | number | 否 | 最后一条同步的数据ID |
| status | string | 否 | 状态：pending/in_progress/completed/failed |
| message | string | 否 | 备注信息 |

### 响应格式
```json
{
  "success": true,
  "message": "状态更新成功",
  "data": {
    "id": 1,
    "provider": "doubao",
    "province": "吉林省",
    "status": "in_progress",
    "synced_count": 5,
    "last_sync_time": "2025-01-15T10:30:00"
  }
}
```

---

## 4. 心跳接口

### 接口地址
```
POST /api/v1/sync-status/heartbeat
```

### 功能说明
豆包在长时间采集任务中，定期调用此接口表示仍在工作。

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| province | string | 是 | 省份名称 |
| message | string | 否 | 可选的消息 |

---

## 5. 完成采集

### 接口地址
```
POST /api/v1/sync-status/complete
```

### 功能说明
豆包完成采集任务后调用此接口标记完成。

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| province | string | 是 | 省份名称 |
| totalCount | number | 否 | 总共采集数量 |
| savedCount | number | 否 | 成功入库数量 |
| message | string | 否 | 备注信息 |

### 响应格式
```json
{
  "success": true,
  "message": "采集完成状态已更新",
  "data": {
    "id": 1,
    "provider": "doubao",
    "province": "吉林省",
    "status": "completed",
    "total_count": 10,
    "synced_count": 8
  }
}
```

---

## 6. 查询同步状态

### 接口地址
```
GET /api/v1/sync-status/list
```

### 功能说明
查询所有省份的同步状态。

### 响应格式
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "provider": "doubao",
      "province": "吉林省",
      "status": "completed",
      "total_count": 10,
      "synced_count": 8,
      "last_sync_time": "2025-01-15T10:30:00"
    }
  ]
}
```

---

## 数据流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    豆包采集流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 开始采集                                                 │
│     └─→ POST /heartbeat { province: "吉林省" }              │
│                                                              │
│  2. 采集到招标数据                                           │
│     └─→ POST /push-bid { province, bidData }                │
│         ├─→ success: saved → 入库成功，前端可展示            │
│         ├─→ action: rejected → 审核不通过，跳过             │
│         └─→ action: duplicate → 重复数据，跳过              │
│                                                              │
│  3. 采集到中标数据                                           │
│     └─→ POST /push-winbid { province, winbidData }          │
│                                                              │
│  4. 定期更新进度                                             │
│     └─→ POST /update { province, syncedCount, ... }         │
│                                                              │
│  5. 完成采集                                                 │
│     └─→ POST /complete { province, totalCount, savedCount } │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 常见问题

### Q1: 数据被拒绝怎么办？
查看返回的 `reason` 字段，常见原因：
- 正文内容不足500字符 → 需要采集完整的公告正文
- 缺少联系信息 → 需要提取联系人或电话
- 重复数据 → 该数据已存在，跳过即可

### Q2: 如何判断数据是否已入库？
- `success: true, action: "saved"` → 入库成功
- `success: false, action: "duplicate"` → 重复数据，已跳过
- `success: false, action: "rejected"` → 审核不通过

### Q3: 预算金额如何传递？
budget字段需要传数字类型，单位为元。例如：500万 → 5000000

---

## 联系方式

如有问题，请联系扣子系统开发团队。
