# 免费部署方案终极指南

## 🎯 快速选择

| 你的情况 | 推荐方案 | 原因 |
|----------|----------|------|
| 有信用卡 | **Fly.io** | 免费额度大，最稳定 |
| 无信用卡 | **Render** | 完全免费，需接受冷启动 |
| 国内用户 | **腾讯云函数** | 速度最快，有免费额度 |
| 想要简单 | **Zeabur** | 中文界面，操作简单 |

---

## 方案一：Render（完全免费，无需信用卡）

### ✅ 优点
- 完全免费，无需信用卡
- 自动 HTTPS
- 支持 Docker

### ⚠️ 缺点
- 免费版会休眠，冷启动 15-30 秒
- 内存只有 512MB（Playwright 可能不够）

### 📦 部署步骤

1. **访问 render.com，用 GitHub 登录**

2. **创建 Web Service**
   - New → Web Service
   - 连接 GitHub 仓库
   - 选择 Docker 环境

3. **配置**
   ```
   Name: zcy-api
   Environment: Docker
   Region: Singapore (最快)
   Instance Type: Free
   ```

4. **添加环境变量**
   ```
   COZE_SUPABASE_URL=xxx
   COZE_SUPABASE_ANON_KEY=xxx
   ALIYUN_ACCESS_KEY_ID=xxx
   ALIYUN_ACCESS_KEY_SECRET=xxx
   ```

---

## 方案二：Fly.io（免费额度大，需要信用卡）

### ✅ 优点
- 免费额度大（3GB 内存）
- 新加坡节点，国内访问快
- 不会自动休眠

### ⚠️ 缺点
- 需要信用卡验证（$5 预扣，不会实际扣款）

### 📦 部署步骤

```bash
# 1. 安装 CLI
curl -L https://fly.io/install.sh | sh

# 2. 登录（需要信用卡）
fly auth login

# 3. 进入项目目录
cd server

# 4. 启动部署
fly launch

# 5. 设置环境变量
fly secrets set COZE_SUPABASE_URL=xxx
fly secrets set COZE_SUPABASE_ANON_KEY=xxx
fly secrets set ALIYUN_ACCESS_KEY_ID=xxx
fly secrets set ALIYUN_ACCESS_KEY_SECRET=xxx

# 6. 部署
fly deploy
```

---

## 方案三：Zeabur（中文界面，无需信用卡）

### ✅ 优点
- 中文界面，操作简单
- 每月 $5 免费额度
- 支持自动部署

### ⚠️ 缺点
- 免费额度较小

### 📦 部署步骤

1. **访问 zeabur.com，用 GitHub 登录**

2. **创建项目**
   - 新建项目
   - 添加服务 → Git
   - 选择仓库

3. **配置环境变量**
   - 在 Variables 页面添加

---

## 方案四：腾讯云函数（国内最快）

### ✅ 优点
- 国内访问最快
- 每月免费额度充足
- 支持 Docker 容器

### ⚠️ 缺点
- 配置相对复杂
- 可能需要备案

### 📦 部署步骤

1. **开通腾讯云函数**
   - 访问 console.cloud.tencent.com/scf
   - 开通服务

2. **创建容器函数**
   - 新建 → Web 函数
   - 运行环境：容器镜像
   - 上传 Docker 镜像

3. **配置触发器**
   - API 网关触发器
   - 获得访问地址

---

## 方案五：本地运行 + 内网穿透（终极免费）

如果以上方案都不行，可以在本地运行服务，用内网穿透暴露到公网：

### 使用 ngrok

```bash
# 1. 启动后端服务
cd server
pnpm run dev

# 2. 安装 ngrok
# 访问 ngrok.com 注册并下载

# 3. 启动穿透
ngrok http 9091

# 4. 获得公网地址
# 类似：https://xxx.ngrok-free.app
```

### 使用 cloudflare tunnel（推荐）

```bash
# 1. 安装 cloudflared
# 访问 developers.cloudflare.com/cloudflare-one/connections/connect-networks/

# 2. 登录
cloudflared tunnel login

# 3. 创建隧道
cloudflared tunnel create zcy-api

# 4. 启动
cloudflared tunnel run --url http://localhost:9091 zcy-api
```

---

## 💰 费用对比

| 方案 | 月费用 | 适合场景 |
|------|--------|----------|
| Render | 免费 | 测试、轻量使用 |
| Fly.io | 免费 | 稳定生产环境 |
| Zeabur | 免费$5额度 | 中文用户 |
| 腾讯云函数 | ~10元 | 国内用户 |
| 本地+穿透 | 免费 | 开发测试 |

---

## 🚀 我的推荐

**如果你有信用卡** → Fly.io（最稳定）

**如果没有信用卡** → Render（免费但会休眠）

**国内用户为主** → 腾讯云函数（最快）

**完全免费方案** → 本地运行 + Cloudflare Tunnel

---

## 常见问题

### Q: Playwright 内存不够怎么办？

修改 Dockerfile 使用更轻量的方式：

```dockerfile
# 不安装浏览器，使用远程浏览器服务
ENV BROWSERLESS_API_KEY=xxx
```

### Q: 冷启动太慢？

使用付费计划或选择 Fly.io（不会休眠）。

### Q: 国内访问慢？

选择腾讯云函数或华为云函数。
