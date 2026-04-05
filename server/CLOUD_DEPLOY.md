# 云端自动化部署指南

## 架构说明

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   GitHub    │────▶│  GitHub Actions  │────▶│   阿里云函数计算     │
│  (代码仓库)  │     │  (云端构建部署)   │     │  (Docker容器运行)   │
└─────────────┘     └──────────────────┘     └─────────────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │  阿里云容器镜像   │
                    │  (存储Docker镜像) │
                    └──────────────────┘
```

## 第一步：创建阿里云资源

### 1.1 创建容器镜像命名空间

1. 登录 [阿里云容器镜像服务控制台](https://cr.console.aliyun.com/cn-hongkong/instances/namespaces)
2. 创建命名空间：`zcy`
3. 记录命名空间名称

### 1.2 获取容器镜像访问凭据

1. 进入 [访问凭证页面](https://cr.console.aliyun.com/cn-hongkong/instances/credentials)
2. 设置固定密码（用于Docker登录）
3. 记录：
   - 用户名：你的阿里云账号
   - 密码：刚设置的固定密码

### 1.3 获取阿里云 AccessKey

1. 进入 [AccessKey管理](https://ram.console.aliyun.com/manage/ak)
2. 创建 AccessKey
3. 记录：
   - AccessKey ID
   - AccessKey Secret

---

## 第二步：配置 GitHub Secrets

在你的 GitHub 仓库中，进入 **Settings → Secrets and variables → Actions**，添加以下密钥：

| Secret 名称 | 说明 | 获取方式 |
|------------|------|----------|
| `ALIYUN_REGISTRY_USERNAME` | 容器镜像用户名 | 阿里云账号（邮箱或手机号） |
| `ALIYUN_REGISTRY_PASSWORD` | 容器镜像密码 | 容器镜像服务访问凭证页面设置 |
| `ALIYUN_ACCESS_KEY_ID` | 阿里云 AccessKey ID | AccessKey 管理页面 |
| `ALIYUN_ACCESS_KEY_SECRET` | 阿里云 AccessKey Secret | AccessKey 管理页面 |

### 添加步骤：

1. 进入 GitHub 仓库页面
2. 点击 **Settings** 标签
3. 左侧菜单选择 **Secrets and variables → Actions**
4. 点击 **New repository secret**
5. 依次添加上述 4 个密钥

---

## 第三步：推送代码触发部署

### 方式1：首次部署

```bash
# 初始化Git仓库（如果还没有）
cd /workspace/projects
git init
git add .
git commit -m "feat: 初始化项目"

# 添加远程仓库
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送到GitHub
git push -u origin main
```

### 方式2：手动触发

1. 进入 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 选择 **Deploy to Aliyun FC** 工作流
4. 点击 **Run workflow** → **Run workflow**

---

## 第四步：查看部署结果

### 4.1 查看 Actions 日志

1. 进入 GitHub **Actions** 页面
2. 点击正在运行的工作流
3. 查看各步骤执行日志

### 4.2 获取函数访问地址

部署成功后，在 Actions 日志末尾会显示：

```
### 部署成功! 🎉

**函数访问地址**: https://zcy-api-xxxxx.cn-hongkong.fc.aliyuncs.com
```

### 4.3 验证服务

```bash
# 健康检查
curl https://你的函数地址/api/v1/health

# 测试采集接口
curl https://你的函数地址/api/v1/bid-auto-fetch
```

---

## 第五步：更新前端配置

部署成功后，更新前端 API 地址：

### 方式1：修改环境变量

```bash
# client/.env
EXPO_PUBLIC_BACKEND_BASE_URL=https://zcy-api-xxxxx.cn-hongkong.fc.aliyuncs.com
```

### 方式2：修改代码

```typescript
// client/src/config/api.ts
export const API_BASE_URL = 'https://zcy-api-xxxxx.cn-hongkong.fc.aliyuncs.com';
```

---

## 常见问题

### Q1: 镜像推送失败

**错误**: `denied: requested access to the resource is denied`

**解决**: 检查 `ALIYUN_REGISTRY_USERNAME` 和 `ALIYUN_REGISTRY_PASSWORD` 是否正确

### Q2: 部署失败

**错误**: `Account is not exist`

**解决**: 检查 `ALIYUN_ACCESS_KEY_ID` 和 `ALIYUN_ACCESS_KEY_SECRET` 是否正确

### Q3: 函数超时

**错误**: `Task timed out`

**解决**: 在 `s.yaml` 中增加 `timeout` 值（默认120秒）

### Q4: Playwright 浏览器问题

**错误**: `Executable doesn't exist`

**解决**: Dockerfile 已配置预装 Playwright 的基础镜像，如仍有问题，检查镜像构建日志

---

## 成本估算

| 资源 | 单价 | 预估月成本 |
|------|------|------------|
| 函数计算调用 | 0.0133元/万次 | ~5元 |
| 函数计算执行 | 0.00011108元/GB秒 | ~30元 |
| 容器镜像存储 | 0.18元/GB/月 | ~2元 |
| 公网流量 | 0.5元/GB | ~5元 |
| **总计** | - | **~42元/月** |

> 阿里云函数计算有免费额度，实际费用可能更低。

---

## 后续维护

### 更新代码后自动部署

每次推送到 `main` 分支，GitHub Actions 会自动触发部署：

```bash
git add .
git commit -m "feat: 新功能"
git push
```

### 查看函数日志

```bash
# 使用 s 工具
cd server
s logs
```

或在阿里云控制台查看：
https://fc.console.aliyun.com/cn-hongkong/functions
