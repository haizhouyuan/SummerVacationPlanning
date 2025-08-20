@echo off
chcp 65001 >nul
echo === Claude代理修复脚本 ===

echo.
echo 步骤1: 验证代理端口是否通畅...
set port=7890

echo 测试 127.0.0.1:%port%...
curl.exe -v --proxy http://127.0.0.1:%port% https://api.anthropic.com/v1/complete --max-time 10
if %errorlevel% equ 0 (
    echo ✅ 127.0.0.1:%port% 代理正常
    set proxy_url=http://127.0.0.1:%port%
    goto :set_env
)

echo 测试 192.168.1.100:%port%...
curl.exe -v --proxy http://192.168.1.100:%port% https://api.anthropic.com/v1/complete --max-time 10
if %errorlevel% equ 0 (
    echo ✅ 192.168.1.100:%port% 代理正常
    set proxy_url=http://192.168.1.100:%port%
    goto :set_env
)

echo ❌ 所有代理端口都失败
echo 请检查UpNet是否开启了HTTP代理端口
pause
exit /b 1

:set_env
echo.
echo 步骤2: 设置会话级环境变量...
set HTTPS_PROXY=%proxy_url%
set HTTP_PROXY=%proxy_url%
echo 🔍 HTTPS_PROXY in this session → %HTTPS_PROXY%

echo.
echo 步骤3: 测试Claude连接...
claude -p "ping"
if %errorlevel% equ 0 (
    echo ✅ Claude连接成功！
) else (
    echo ❌ Claude连接失败，但网络可能已OK
)

echo.
echo 步骤4: 写入用户级永久环境变量...
setx HTTPS_PROXY "%proxy_url%"
setx HTTP_PROXY "%proxy_url%"
echo ✅ 已写入用户级代理；重新开PowerShell生效

echo.
echo 修复完成！
echo 请重新打开PowerShell并运行: claude doctor
echo 如果显示Network OK，则运行: claude auth

pause 