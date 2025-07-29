@echo off
chcp 65001 >nul
echo === 用户级代理环境变量修复脚本 ===

echo.
echo 1. 终止所有Node进程...
taskkill /f /im node.exe >nul 2>&1
echo Node进程已清理

echo.
echo 2. 设置用户级环境变量...
setx HTTPS_PROXY "http://192.168.1.100:7890"
setx HTTP_PROXY "http://192.168.1.100:7890"
setx NO_PROXY "localhost,127.0.0.1"
echo 用户级环境变量已设置

echo.
echo 3. 清理Claude配置...
if exist "%APPDATA%\claude" (
    rmdir /s /q "%APPDATA%\claude"
    echo 已清理Claude配置目录
)

echo.
echo 4. 设置当前会话环境变量...
set HTTPS_PROXY=http://192.168.1.100:7890
set HTTP_PROXY=http://192.168.1.100:7890
set NO_PROXY=localhost,127.0.0.1

echo.
echo 5. 显示当前环境变量...
echo HTTPS_PROXY=%HTTPS_PROXY%
echo HTTP_PROXY=%HTTP_PROXY%
echo NO_PROXY=%NO_PROXY%

echo.
echo 修复完成！现在可以尝试运行: claude auth
echo.
echo 如果仍然失败，请尝试:
echo 1. 确保UpNet代理正常运行在端口7890
echo 2. 尝试使用API密钥认证: claude auth --api-key YOUR_API_KEY
echo 3. 或者尝试不同的OAuth端口: claude auth --port 8080

pause 