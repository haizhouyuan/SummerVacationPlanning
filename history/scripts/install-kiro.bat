@echo off
chcp 65001 >nul
echo ========================================
echo           Kiro 自动安装脚本
echo ========================================
echo.

echo 正在检查 Node.js 安装...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js 已安装
    node --version
)

echo.
echo 正在检查 npm 安装...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 未安装
    pause
    exit /b 1
) else (
    echo ✅ npm 已安装
    npm --version
)

echo.
echo 正在安装 Kiro CLI...
npm install -g @kiro-ai/cli

if %errorlevel% neq 0 (
    echo ❌ Kiro 安装失败
    echo 请检查网络连接或尝试使用管理员权限运行
    pause
    exit /b 1
) else (
    echo ✅ Kiro 安装成功
)

echo.
echo 正在验证安装...
kiro --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Kiro 验证失败
    pause
    exit /b 1
) else (
    echo ✅ Kiro 验证成功
    kiro --version
)

echo.
echo ========================================
echo           安装完成！
echo ========================================
echo.
echo 下一步操作：
echo 1. 访问 https://kiro.ai 注册账户
echo 2. 获取 API 密钥
echo 3. 运行: kiro login
echo 4. 在项目中运行: kiro init
echo.
echo 查看详细指南: KIRO_SETUP_GUIDE.md
echo.
pause 