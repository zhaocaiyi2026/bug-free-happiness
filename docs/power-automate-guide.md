# Power Automate 自动化流程

## 🎯 工作原理

```
Power Automate（自动点击）+ Tampermonkey（自动提取入库）
```

Power Automate 模拟用户操作 → Tampermonkey 检测到详情页 → 自动提取并发送到 API

---

## 📦 准备工作

### 1. 安装 Tampermonkey

- **Chrome**: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
- **Edge**: https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd

### 2. 安装脚本

1. 打开 Tampermonkey 扩展 → 添加新脚本
2. 复制 `tampermonkey-jilin.js` 的全部内容
3. 保存

### 3. 测试脚本

1. 访问 https://www.ggzyzx.jl.gov.cn/
2. 点击任意公告进入详情页
3. 右侧应该出现「一键入库」按钮
4. 点击测试是否正常入库

---

## 🤖 Power Automate 流程

### 方案 A：简单自动点击

**适用场景**：少量公告（几十条）

**流程**：

```
1. 打开浏览器 → 访问列表页
2. 循环（比如 50 次）：
   a. 点击第一个公告链接
   b. 等待 3 秒（让 Tampermonkey 自动入库）
   c. 返回列表页
   d. 等待 1 秒
3. 结束
```

**Power Automate 步骤**：

| 步骤 | 操作 | 参数 |
|------|------|------|
| 1 | 启动新 Chrome | URL: `https://www.ggzyzx.jl.gov.cn/` |
| 2 | 等待页面加载 | 5 秒 |
| 3 | 循环 (Loop) | 计数器 0 → 49 |
| 3.1 | 点击链接 | 选择器: `.notice-list a` (第一个) |
| 3.2 | 等待 | 3 秒 |
| 3.3 | 执行 JavaScript | `window.postMessage('zcy_import', '*')` |
| 3.4 | 等待 | 2 秒 |
| 3.5 | 返回上一页 | 或点击「返回」按钮 |
| 3.6 | 等待 | 1 秒 |
| 4 | 关闭浏览器 | - |

---

### 方案 B：智能自动模式

**适用场景**：大量公告（几百条），需要翻页

**流程**：

```
1. 打开浏览器 → 访问列表页
2. 开启 Tampermonkey「自动模式」
3. 循环处理当前页所有公告
4. 点击「下一页」
5. 重复步骤 3-4
6. 结束
```

**Power Automate 步骤**：

| 步骤 | 操作 | 参数 |
|------|------|------|
| 1 | 启动新 Chrome | URL: `https://www.ggzyzx.jl.gov.cn/` |
| 2 | 等待页面加载 | 5 秒 |
| 3 | 执行 JavaScript | 开启自动模式（见下方） |
| 4 | 外层循环（翻页） | 比如 10 页 |
| 4.1 | 内层循环（当前页） | 比如每页 15 条 |
| 4.1.1 | 点击链接 | 当前公告链接 |
| 4.1.2 | 等待 | 4 秒（自动入库） |
| 4.1.3 | 返回上一页 | - |
| 4.1.4 | 等待 | 1 秒 |
| 4.2 | 点击「下一页」 | - |
| 4.3 | 等待 | 2 秒 |
| 5 | 关闭浏览器 | - |

---

## 💡 关键配置

### Tampermonkey 自动模式

在 Tampermonkey 脚本中勾选「自动模式」后，脚本会：

1. 监听 URL 变化
2. 检测到详情页时自动入库
3. 通过 `localStorage` 记录状态

### Power Automate 检测入库状态

在循环中添加 JavaScript 检测：

```javascript
// 检测入库状态
var status = localStorage.getItem('zcy_import_status');
var time = parseInt(localStorage.getItem('zcy_import_time') || '0');
var now = Date.now();

// 如果最近 5 秒有成功入库
if (status === 'success' && (now - time) < 5000) {
    console.log('入库成功，继续下一个');
}
```

---

## ⚠️ 注意事项

### 1. 控制频率

- 每次操作间隔 **1-3 秒**
- 避免触发反爬机制
- 建议每小时处理 **100-200 条**

### 2. 错误处理

- 如果脚本失败，Power Automate 会卡住
- 建议添加「超时」处理
- 如果超时，跳过当前公告继续下一个

### 3. 合规性

- 这是**模拟用户操作**，风险较低
- 但仍建议在**工作时间**运行
- 不要在深夜或节假日大量运行

---

## 🚀 快速开始

### 最简配置（5分钟上手）

1. 安装 Tampermonkey
2. 安装脚本
3. 打开 Power Automate Desktop
4. 创建新流程：

```
启动 Chrome → https://www.ggzyzx.jl.gov.cn/
循环 20 次：
  点击链接 (第一个公告)
  等待 3 秒
  返回上一页
  等待 1 秒
关闭 Chrome
```

5. 运行测试

---

## 📊 效果预估

| 配置 | 数量 | 时间 |
|------|------|------|
| 每次等待 4 秒 | 100 条 | ~7 分钟 |
| 每次等待 4 秒 | 500 条 | ~35 分钟 |
| 每次等待 4 秒 | 1000 条 | ~70 分钟 |

---

## 🔧 故障排查

### 问题 1：脚本没有出现

**原因**：URL 不匹配

**解决**：检查脚本中的 `@match` 配置，确保包含目标网站

### 问题 2：入库失败

**原因**：API 地址不对或后端未启动

**解决**：
1. 检查脚本中的 `API_URL`
2. 确保后端服务已启动
3. 检查浏览器控制台是否有错误

### 问题 3：Power Automate 卡住

**原因**：等待时间不够

**解决**：增加等待时间到 5-8 秒

---

## 📁 文件清单

- `tampermonkey-jilin.js` - Tampermonkey 脚本
- `power-automate-guide.md` - 本文档
