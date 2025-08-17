@echo off
echo ========================================
echo 测试TLS证书问题修复
echo ========================================
set NODE_TLS_REJECT_UNAUTHORIZED=0
set HTTPS_PROXY=
set HTTP_PROXY=

echo 环境变量:
echo NODE_TLS_REJECT_UNAUTHORIZED=%NODE_TLS_REJECT_UNAUTHORIZED%
echo HTTPS_PROXY=%HTTPS_PROXY%
echo HTTP_PROXY=%HTTP_PROXY%
echo.

echo 测试网络连接...
powershell -Command "Test-NetConnection api.anthropic.com -Port 443"
echo.

echo 测试Claude连接（禁用TLS验证）...
claude -p "test"
echo.

echo 如果成功，尝试OAuth认证...
claude auth login
echo.

pause 