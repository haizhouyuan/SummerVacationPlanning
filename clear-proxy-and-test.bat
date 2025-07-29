@echo off
echo ========================================
echo 清除代理环境变量
echo ========================================
set HTTPS_PROXY=
set HTTP_PROXY=
echo HTTPS_PROXY= %HTTPS_PROXY%
echo HTTP_PROXY= %HTTP_PROXY%
echo.

echo ========================================
echo 测试网络连接
echo ========================================
echo 测试TCP连接到api.anthropic.com:443...
powershell -Command "Test-NetConnection api.anthropic.com -Port 443"
echo.

echo ========================================
echo 尝试Claude认证（无代理）
echo ========================================
echo 尝试OAuth认证...
claude auth login
echo.

echo ========================================
echo 诊断Claude状态
echo ========================================
echo 运行Claude诊断...
claude doctor
echo.

pause 