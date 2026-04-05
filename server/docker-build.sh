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

# 进入server目录
cd "$(dirname "$0")"

# 构建镜像
echo "📦 构建镜像..."
docker build -t "${FULL_IMAGE}" .

# 推送镜像
echo "🚀 推送镜像到阿里云容器镜像服务..."
docker push "${FULL_IMAGE}"

echo "✅ 完成!"
echo "镜像地址: ${FULL_IMAGE}"
