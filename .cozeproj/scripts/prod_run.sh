#!/usr/bin/env bash
# 产物部署使用
set -euo pipefail

ROOT_DIR="$(pwd)"

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-5000}"

# ==================== 工具函数 ====================
info() {
  echo "[INFO] $1"
}
warn() {
  echo "[WARN] $1"
}
error() {
  echo "[ERROR] $1"
  exit 1
}

# ============== 启动服务 ======================
info "开始启动服务..."
info "ROOT_DIR: $ROOT_DIR"
info "PORT: $PORT"

# 设置环境变量
export NODE_ENV=production
export PORT="$PORT"

# 检查 dist 目录是否存在
if [ ! -f "$ROOT_DIR/server/dist/index.js" ]; then
  error "server/dist/index.js 文件不存在，请先执行构建"
fi

info "启动 Express 服务器..."
cd "$ROOT_DIR/server" && node dist/index.js
