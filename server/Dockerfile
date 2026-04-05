# 招采易API服务 - Docker镜像
# 基于Node.js 20 Alpine

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

# 生产镜像
FROM node:20-alpine

# 安装pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制package文件
COPY package.json pnpm-lock.yaml ./
COPY server/package.json ./server/

# 安装生产依赖
WORKDIR /app/server
RUN pnpm install --prod --frozen-lockfile

# 复制构建产物
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/public ./public

# 环境变量
ENV NODE_ENV=production
ENV PORT=9000

# 暴露端口
EXPOSE 9000

# 启动命令
CMD ["node", "dist/index.js"]
