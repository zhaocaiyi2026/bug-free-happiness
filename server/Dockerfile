# 招采易API服务 - Docker镜像 (支持Playwright)
# 适用于 Render 部署（根目录为 server）

# ==================== 构建阶段 ====================
FROM node:20-alpine AS builder

# 安装pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制package文件
COPY package.json ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY . .

# 构建
RUN pnpm run build

# ==================== 生产镜像 ====================
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# 安装pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制package文件
COPY package.json ./

# 安装生产依赖
RUN pnpm install --prod

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 复制 public 目录（如果存在）
RUN mkdir -p public

# 安装Playwright浏览器（仅chromium）
RUN pnpm exec playwright install chromium

# 环境变量
ENV NODE_ENV=production
ENV PORT=9091

# 暴露端口
EXPOSE 9091

# 启动命令
CMD ["node", "dist/index.js"]
