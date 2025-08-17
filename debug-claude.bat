@echo off
echo ========================================
echo 启用DEBUG模式诊断Claude
echo ========================================
set DEBUG=*
set HTTPS_PROXY=
set HTTP_PROXY=

echo 环境变量:
echo DEBUG=%DEBUG%
echo HTTPS_PROXY=%HTTPS_PROXY%
echo HTTP_PROXY=%HTTP_PROXY%
echo.

echo 测试网络连接...
powershell -Command "Test-NetConnection api.anthropic.com -Port 443"
echo.

echo 尝试Claude认证（DEBUG模式）...
claude auth login 2> debug-output.log
echo.

echo DEBUG日志已保存到 debug-output.log
echo 请查看日志文件内容...
type debug-output.log
echo.

pause 