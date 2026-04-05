#!/bin/bash
# Docker镜像构建和推送脚本
# 用于阿里云函数计算容器镜像部署

set -e

# 配置
REGISTRY="registry.cn-hongkong.aliyuncs.com"
NAMESPACE="zcy"
IMAGE_NAME="zcy-api"
TAG="${1:-latest}"
FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${TAG}"

echo "=========================================="
echo "构建Docker镜像: ${FULL_IMAGE}"
echo "=========================================="

# 进入项目根目录（Dockerfile在server目录）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "📁 项目根目录: ${PROJECT_ROOT}"
echo "📁 Dockerfile目录: ${SCRIPT_DIR}"

# 检查Docker是否可用
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker daemon未运行，请先启动Docker"
    exit 1
fi

# 检查是否已登录阿里云
echo "🔐 检查阿里云容器镜像服务登录状态..."
if ! docker pull ${REGISTRY}/${NAMESPACE}/hello-world:latest 2>/dev/null; then
    echo "⚠️  未登录阿里云容器镜像服务，请执行："
    echo "   docker login --username=你的阿里云账号 ${REGISTRY}"
    echo ""
    echo "   密码在阿里云容器镜像服务控制台获取："
    echo "   https://cr.console.aliyun.com/cn-hongkong/instances/credentials"
    exit 1
fi

# 构建镜像（在项目根目录执行，因为需要复制client目录）
echo ""
echo "📦 构建镜像..."
cd "${PROJECT_ROOT}"
docker build -f server/Dockerfile -t "${FULL_IMAGE}" .

# 推送镜像
echo ""
echo "🚀 推送镜像到阿里云容器镜像服务..."
docker push "${FULL_IMAGE}"

echo ""
echo "✅ 完成!"
echo "   镜像地址: ${FULL_IMAGE}"
echo ""
echo "📋 下一步："
echo "   cd server && s deploy -y"
