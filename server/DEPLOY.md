# 阿里云函数计算部署指南

## 部署架构

```
┌─────────────────────────────────────────────────────────┐
│                    阿里云函数计算 FC3                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Docker 容器 (custom-container)           │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Node.js 20 + Playwright + Express 服务      │  │  │
│  │  │  - 端口: 9000                                │  │  │
│  │  │  - 内存: 2GB                                 │  │  │
│  │  │  - 超时: 120秒                               │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                         ↓                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │            HTTP 触发器 (自动域名)                   │  │
│  │   https://zcy-api-xxxx.cn-hongkong.fc.aliyuncs.com│  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 前置条件

1. **阿里云账号**：已开通函数计算服务
2. **阿里云容器镜像服务**：已创建命名空间 `zcy`
3. **本地环境**：Docker + Node.js 20 + s 工具

### 安装 s 工具

```bash
npm install -g @serverless-devs/s
```

### 配置阿里云凭据

```bash
s config add
# 选择 Alibaba Cloud AccessKey
# 输入 AccessKeyID 和 AccessKeySecret
```

## 部署步骤

### 第一步：创建容器镜像命名空间

登录阿里云容器镜像服务控制台：
https://cr.console.aliyun.com/cn-hongkong/instances/namespaces

创建命名空间：`zcy`

### 第二步：登录阿里云容器镜像服务

```bash
# 登录阿里云容器镜像服务
docker login --username=你的阿里云账号 registry.cn-hongkong.aliyuncs.com
# 密码在容器镜像服务控制台获取
```

### 第三步：构建并推送镜像

```bash
cd /workspace/projects/server

# 方式1：使用脚本（推荐）
chmod +x docker-build.sh
./docker-build.sh

# 方式2：手动构建
docker build -t registry.cn-hongkong.aliyuncs.com/zcy/zcy-api:latest .
docker push registry.cn-hongkong.aliyuncs.com/zcy/zcy-api:latest
```

### 第四步：部署到函数计算

```bash
cd /workspace/projects/server

# 部署
s deploy -y
```

### 第五步：获取访问地址

部署成功后，输出类似：

```
zcy-api: 
  url: https://zcy-api-xxxxxx.cn-hongkong.fc.aliyuncs.com
```

## 配置说明

### s.yaml 关键配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| region | cn-hongkong | 香港区域，网络更稳定 |
| runtime | custom-container | Docker容器模式 |
| memorySize | 2048 | 2GB内存，支持Playwright |
| timeout | 120 | 120秒超时 |
| port | 9000 | 容器内端口 |

### 环境变量

| 变量名 | 说明 |
|--------|------|
| COZE_SUPABASE_URL | Supabase 数据库地址 |
| COZE_SUPABASE_ANON_KEY | Supabase 匿名密钥 |
| ALIYUN_ACCESS_KEY_ID | 阿里云 AccessKey ID |
| ALIYUN_ACCESS_KEY_SECRET | 阿里云 AccessKey Secret |
| APISPACE_API_KEY | APISpace API 密钥 |

## 更新前端配置

部署成功后，更新前端 API 地址：

```typescript
// client/src/config/api.ts
export const API_BASE_URL = 'https://zcy-api-xxxxxx.cn-hongkong.fc.aliyuncs.com/api/v1';
```

或修改环境变量：

```bash
# client/.env
EXPO_PUBLIC_BACKEND_BASE_URL=https://zcy-api-xxxxxx.cn-hongkong.fc.aliyuncs.com
```

## 常见问题

### 1. 镜像推送失败

确保已登录：
```bash
docker login --username=你的账号 registry.cn-hongkong.aliyuncs.com
```

### 2. 部署超时

增加 timeout 值：
```yaml
timeout: 300  # 5分钟
```

### 3. Playwright 浏览器下载失败

使用预装 Playwright 的基础镜像：
```dockerfile
FROM mcr.microsoft.com/playwright:v1.49.0-jammy
```

### 4. 内存不足

增加内存配置：
```yaml
memorySize: 4096  # 4GB
```

## 成本估算

按函数计算标准版计算：

| 资源 | 单价 | 预估月成本 |
|------|------|------------|
| 调用次数 | 0.0133元/万次 | ~10元 |
| 执行时间 | 0.00011108元/GB秒 | ~50元 |
| 公网流量 | 0.5元/GB | ~5元 |
| **总计** | - | **~65元/月** |

实际费用取决于使用量，函数计算有免费额度。

## 监控与日志

查看运行日志：
```bash
s logs
```

查看函数监控：
https://fc.console.aliyun.com/cn-hongkong/functions
