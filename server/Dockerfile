# 招采易API服务 - Docker镜像 (支持Playwright)
# 基于Node.js 20 + Playwright

# ==================== 构建阶段 ====================
FROM node:20-alpine AS builder

# 安装pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制package文件
COPY package.json pnpm-lock.yaml ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建服务端
WORKDIR /app/server
RUN pnpm run build

# ==================== 生产镜像 ====================
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# 安装pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制package文件
COPY package.json pnpm-lock.yaml ./
COPY server/package.json ./server/

# 安装生产依赖（包含playwright）
WORKDIR /app/server
RUN pnpm install --prod --frozen-lockfile

# 复制构建产物
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/public ./public

# 安装Playwright浏览器（仅chromium）
RUN pnpm exec playwright install chromium

# 环境变量
ENV NODE_ENV=production
ENV PORT=9000
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# 暴露端口
EXPOSE 9000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:9000/api/v1/health || exit 1

# 启动命令
CMD ["node", "dist/index.js"]
