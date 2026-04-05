#!/bin/bash
# 一键部署脚本
# 构建 + 推送 + 部署到阿里云函数计算

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║        招采易 API 服务 - 阿里云函数计算部署               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 步骤1：检查环境
echo "📋 步骤1/4: 检查环境..."
echo "  - Docker: $(docker --version 2>/dev/null || echo '未安装')"
echo "  - s工具: $(s --version 2>/dev/null | head -1 || echo '未安装')"
echo ""

# 步骤2：构建镜像
echo "📦 步骤2/4: 构建Docker镜像..."
cd "${PROJECT_ROOT}"
docker build -f server/Dockerfile -t registry.cn-hongkong.aliyuncs.com/zcy/zcy-api:latest .
echo ""

# 步骤3：推送镜像
echo "🚀 步骤3/4: 推送镜像到阿里云..."
docker push registry.cn-hongkong.aliyuncs.com/zcy/zcy-api:latest
echo ""

# 步骤4：部署到函数计算
echo "☁️  步骤4/4: 部署到阿里云函数计算..."
cd "${SCRIPT_DIR}"
s deploy -y
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    ✅ 部署完成！                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📖 请查看上方输出的函数访问地址"
echo "📖 更新前端API地址后即可使用"
