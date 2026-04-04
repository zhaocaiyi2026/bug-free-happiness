#!/bin/bash

# EAS 云端构建 APK 脚本
# 使用方法: bash build-apk.sh YOUR_EXPO_TOKEN

set -e

# 检查参数
if [ -z "$1" ] && [ -z "$EXPO_TOKEN" ]; then
    echo "=========================================="
    echo "  EAS 云端构建 APK"
    echo "=========================================="
    echo ""
    echo "使用方法："
    echo "  方式1: bash build-apk.sh YOUR_TOKEN"
    echo "  方式2: export EXPO_TOKEN=YOUR_TOKEN && bash build-apk.sh"
    echo ""
    echo "获取 Token 步骤："
    echo "  1. 访问 https://expo.dev/signup 创建账户"
    echo "  2. 登录后访问 https://expo.dev/settings/access-tokens"
    echo "  3. 点击 'Create Token' 创建并复制 Token"
    echo ""
    exit 1
fi

# 设置 Token
export EXPO_TOKEN="${1:-$EXPO_TOKEN}"
export COZE_PROJECT_ID=7622121045184577562

echo "=========================================="
echo "  开始 EAS 云端构建 APK"
echo "=========================================="
echo ""
echo "项目信息:"
echo "  - 应用名称: 招采易"
echo "  - 项目 ID: $COZE_PROJECT_ID"
echo "  - 构建配置: preview (APK)"
echo ""

# 进入项目目录
cd /workspace/projects/client

# 执行构建
echo "正在提交构建任务到云端..."
echo ""

npx eas build --platform android --profile preview --non-interactive

echo ""
echo "=========================================="
echo "  构建任务已提交！"
echo "=========================================="
echo ""
echo "您可以通过以下方式查看构建进度："
echo "  - 命令行: npx eas build:list"
echo "  - 网页: https://expo.dev/accounts/您的用户名/projects"
echo ""
echo "构建完成后，可以直接下载 APK 安装到手机"
