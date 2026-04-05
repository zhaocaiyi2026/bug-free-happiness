# 阿里云函数计算 Docker 容器部署指南

## 前置条件

1. 本地安装 Docker
2. 安装阿里云 Serverless Devs 工具：`npm install -g @serverless-devs/s`
3. 拥有阿里云账号并开通以下服务：
   - 函数计算 FC
   - 容器镜像服务 ACR

## 步骤一：配置阿里云凭证

```bash
s config add \
  --AccessKeyID YOUR_ACCESS_KEY_ID \
  --AccessKeySecret YOUR_ACCESS_KEY_SECRET \
  -a default -f
```

## 步骤二：创建容器镜像命名空间

登录阿里云容器镜像服务控制台：
https://cr.console.aliyun.com/

创建命名空间：`zcy`

## 步骤三：构建并推送镜像

```bash
# 进入server目录
cd server

# 登录阿里云容器镜像服务
docker login --username=你的阿里云账号 registry.cn-hongkong.aliyuncs.com

# 构建镜像
docker build -t registry.cn-hongkong.aliyuncs.com/zcy/zcy-api:latest .

# 推送镜像
docker push registry.cn-hongkong.aliyuncs.com/zcy/zcy-api:latest
```

## 步骤四：部署到函数计算

```bash
# 部署
s deploy -y
```

## 步骤五：测试API

```bash
# 健康检查
curl https://你的函数URL/api/v1/health

# 获取招标列表
curl https://你的函数URL/api/v1/bids
```

## 配置文件说明

### s.yaml - 函数计算配置
- 运行时：custom-container（容器镜像）
- 内存：1024MB
- 超时：60秒
- 地区：香港（cn-hongkong）

### Dockerfile - 镜像构建配置
- 基础镜像：node:20-alpine
- 端口：9000
- 启动命令：node dist/index.js

## 环境变量

在 s.yaml 中配置以下环境变量：

```yaml
environmentVariables:
  NODE_ENV: production
  COZE_SUPABASE_URL: 你的Supabase URL
  COZE_SUPABASE_ANON_KEY: 你的Supabase密钥
```

## 常见问题

### Q: 镜像构建失败
A: 确保 Dockerfile 在 server 目录下，且有足够的磁盘空间

### Q: 推送镜像失败
A: 检查是否已登录容器镜像服务，命名空间是否已创建

### Q: 函数启动失败
A: 检查环境变量是否正确配置，查看函数计算日志排查问题

## 费用说明

阿里云函数计算按量计费：
- 内存：1024MB × 执行时间
- 调用次数费用
- 网络流量费用

香港区域价格参考：
- 内存：¥0.00001111/GB-秒
- 调用次数：¥0.0133/万次

预估月费用（每天1000次调用，每次执行1秒）：
约 ¥0.35/月

## 相关链接

- [阿里云函数计算文档](https://help.aliyun.com/product/50980.html)
- [容器镜像服务文档](https://help.aliyun.com/product/60716.html)
- [Serverless Devs文档](https://www.serverless-devs.com/)
