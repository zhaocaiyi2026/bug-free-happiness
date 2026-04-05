# 免费部署方案对比

## 方案总览

| 平台 | 月费用 | 内存 | 国内访问速度 | 部署难度 | 推荐场景 |
|------|--------|------|-------------|----------|----------|
| **Railway** 🌟 | 免费($5额度) | 2GB | ⭐⭐⭐ | 简单 | 个人项目、测试 |
| **Fly.io** 🌟 | 免费(3GB) | 3GB | ⭐⭐⭐⭐ | 中等 | 生产环境 |
| **Render** | 免费 | 512MB | ⭐⭐ | 简单 | 轻量API |
| **Vercel** | 免费 | 1GB | ⭐⭐⭐ | 最简单 | Serverless函数 |
| **腾讯云函数** | 免费额度 | 1GB | ⭐⭐⭐⭐⭐ | 中等 | 国内用户 |

---

## 推荐方案一：Railway（最简单）

### 优点
- ✅ 部署最简单，连接GitHub自动部署
- ✅ 免费HTTPS，无需购买证书
- ✅ 支持Docker和Playwright
- ✅ 有控制台，方便管理

### 缺点
- ⚠️ 国内访问速度中等
- ⚠️ 免费额度有限（$5/月）

### 快速开始
```bash
# 1. 访问 railway.app，用GitHub登录
# 2. 新建项目 → Deploy from GitHub repo
# 3. 添加环境变量
# 4. 生成域名
```

---

## 推荐方案二：Fly.io（最稳定）

### 优点
- ✅ 免费额度更大（3GB内存）
- ✅ 新加坡节点，国内访问较快
- ✅ 支持Docker和Playwright
- ✅ 不会自动休眠

### 缺点
- ⚠️ 需要信用卡验证
- ⚠️ 需要安装CLI工具

### 快速开始
```bash
# 1. 安装CLI
curl -L https://fly.io/install.sh | sh

# 2. 登录
fly auth login

# 3. 部署
cd server
fly launch
fly deploy

# 4. 设置环境变量
fly secrets set COZE_SUPABASE_URL=xxx
fly secrets set COZE_SUPABASE_ANON_KEY=xxx
```

---

## 推荐方案三：Render（最省心）

### 优点
- ✅ 完全免费
- ✅ 自动HTTPS
- ✅ 支持Docker

### 缺点
- ⚠️ 免费版会休眠，冷启动慢（15-30秒）
- ⚠️ 内存只有512MB（Playwright可能不够）

### 适合场景
- 只需要轻量API
- 可以接受冷启动延迟

---

## 推荐方案四：腾讯云函数（国内最快）

### 优点
- ✅ 国内访问最快
- ✅ 每月免费额度足够
- ✅ 支持Docker容器

### 缺点
- ⚠️ 配置相对复杂
- ⚠️ 可能需要备案

### 费用说明
- 免费额度：40万GB秒/月
- 实际使用约 10-20元/月

---

## 方案选择建议

```
┌─────────────────────────────────────────────────┐
│  你的需求是？                                     │
├─────────────────────────────────────────────────┤
│  🚀 快速部署测试 → Railway                       │
│  💰 完全免费 → Render（接受休眠）                 │
│  🌏 国内用户多 → 腾讯云函数                      │
│  ⚡ 稳定生产环境 → Fly.io                        │
└─────────────────────────────────────────────────┘
```

---

## 环境变量配置（通用）

所有平台都需要配置以下环境变量：

```
NODE_ENV=production
COZE_SUPABASE_URL=https://xxx.supabase.xxx
COZE_SUPABASE_ANON_KEY=eyJxxx
ALIYUN_ACCESS_KEY_ID=LTAIxxx
ALIYUN_ACCESS_KEY_SECRET=xxx
APISPACE_API_KEY=xxx
```

---

## 部署后测试

```bash
# 健康检查
curl https://你的域名/api/v1/health

# 测试采集
curl https://你的域名/api/v1/bid-auto-fetch
```

---

## 我的推荐

**如果你不想折腾**：选 **Railway**
- 最简单，5分钟搞定
- 免费HTTPS
- 推送代码自动部署

**如果你需要稳定生产**：选 **Fly.io**
- 免费额度大
- 国内访问较快
- 不会休眠
