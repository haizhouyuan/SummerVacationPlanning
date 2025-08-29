@echo off
setlocal

:: ============================================================================
:: Claude Code 隔离启动脚本 - Edge 浏览器多终端支持
:: 
:: 功能:
:: - 自动生成唯一的 Playwright MCP 配置
:: - 确保多终端并行运行无冲突
:: - 强制使用 Edge 浏览器
:: - 性能优化和资源管理
:: ============================================================================

echo.
echo ================================================
echo  Claude Code 隔离启动器 - Edge 多终端支持
echo ================================================
echo.

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

:: 切换到项目根目录
cd /d "%~dp0.."

:: 检查项目根目录
if not exist "package.json" (
    echo ❌ 错误: 未找到项目根目录，请确保脚本在正确位置
    pause
    exit /b 1
)

:: 检查配置生成器
if not exist "scripts\playwright-config-generator.js" (
    echo ❌ 错误: 未找到配置生成器脚本
    pause
    exit /b 1
)

echo 🔄 正在生成唯一的 Playwright MCP 配置...
node scripts\playwright-config-generator.js generate

if %errorlevel% neq 0 (
    echo ❌ 配置生成失败
    pause
    exit /b 1
)

echo.
echo ✅ 配置生成完成！Edge 浏览器已配置为默认浏览器
echo 📁 会话数据已隔离，支持多终端并行运行
echo 🚀 正在启动 Claude Code...
echo.

:: 设置环境变量以优化性能
set PLAYWRIGHT_BROWSERS_PATH=0
set NODE_OPTIONS=--max-old-space-size=4096

:: 启动 Claude Code
claude code

:: 脚本结束时清理（可选）
echo.
echo 🧹 Claude Code 已退出，是否清理当前会话数据？
echo    [Y] 是（推荐） [N] 否（保留用于调试）
set /p cleanup_choice=请选择 (Y/N): 

if /i "%cleanup_choice%"=="Y" (
    echo 🔄 正在清理过期会话数据...
    node scripts\playwright-config-generator.js cleanup 1
    echo ✅ 清理完成
)

echo.
echo 👋 感谢使用 Claude Code Edge 隔离启动器！
pause