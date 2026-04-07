#!/bin/bash
# 招采易 App 一键构建脚本
# 用法: ./build-app.sh

set -e

echo "🚀 开始构建招采易 App..."

# 1. 安装依赖
echo "📦 安装依赖..."
cd /workspace/projects/client
npm install

# 2. 预编译 Android 项目
echo "⚙️ 预编译 Android 项目..."
npx expo prebuild --platform android --clean

# 3. 修复启动画面全屏显示
echo "🖼️ 修复启动画面配置..."
sed -i 's/icon_preferred/full_screen/g' android/app/src/main/res/values/styles.xml

# 4. 构建 APK
echo "📱 构建 APK..."
cd android
./gradlew assembleRelease

# 5. 复制 APK 到项目根目录
echo "📋 复制 APK..."
cd /workspace/projects/client
cp android/app/build/outputs/apk/release/app-release.apk ./zhaocaiyi-release.apk

echo ""
echo "✅ 构建完成！"
echo "📍 APK 位置: ./zhaocaiyi-release.apk"
echo "📱 可直接安装到 Android 手机使用"
