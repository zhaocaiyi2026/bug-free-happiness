@echo off
REM 招采易 App 一键构建脚本 (Windows)
REM 用法: 双击运行此脚本

echo 🚀 开始构建招采易 App...

REM 1. 安装依赖
echo 📦 安装依赖...
cd /workspace/projects/client
call npm install

REM 2. 预编译 Android 项目
echo ⚙️ 预编译 Android 项目...
call npx expo prebuild --platform android --clean

REM 3. 修复启动画面全屏显示
echo 🖼️ 修复启动画面配置...
powershell -Command "(Get-Content android/app/src/main/res/values/styles.xml) -replace 'icon_preferred', 'full_screen' | Set-Content android/app/src/main/res/values/styles.xml"

REM 4. 构建 APK
echo 📱 构建 APK...
cd android
call gradlew.bat assembleRelease

REM 5. 复制 APK 到项目根目录
echo 📋 复制 APK...
cd /workspace/projects/client
copy android\app\build\outputs\apk\release\app-release.apk .\zhaocaiyi-release.apk

echo.
echo ✅ 构建完成！
echo 📍 APK 位置: .\zhaocaiyi-release.apk
echo 📱 可直接安装到 Android 手机使用
pause
