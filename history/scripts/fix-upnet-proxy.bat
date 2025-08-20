@echo off
echo ========================================
echo 1. 设置用户级环境变量
echo ========================================
powershell -Command "[Environment]::SetEnvironmentVariable('HTTPS_PROXY', 'http://127.0.0.1:7890', 'User')"
powershell -Command "[Environment]::SetEnvironmentVariable('HTTP_PROXY', 'http://127.0.0.1:7890', 'User')"
powershell -Command "[Environment]::SetEnvironmentVariable('NODE_TLS_REJECT_UNAUTHORIZED', '0', 'User')"
echo 环境变量已设置到用户级
echo.

echo ========================================
echo 2. 终止所有Node进程
echo ========================================
taskkill /IM node.exe /F 2>nul
echo Node进程已终止
echo.

echo ========================================
echo 3. 验证环境变量
echo ========================================
echo 当前会话环境变量:
echo HTTPS_PROXY=%HTTPS_PROXY%
echo HTTP_PROXY=%HTTP_PROXY%
echo.

echo 用户级环境变量:
powershell -Command "echo 'HTTPS_PROXY = ' + [Environment]::GetEnvironmentVariable('HTTPS_PROXY', 'User')"
powershell -Command "echo 'HTTP_PROXY = ' + [Environment]::GetEnvironmentVariable('HTTP_PROXY', 'User')"
echo.

echo ========================================
echo 4. 测试网络连接
echo ========================================
echo 测试TCP连接...
powershell -Command "Test-NetConnection api.anthropic.com -Port 443"
echo.

echo ========================================
echo 5. 尝试OAuth认证
echo ========================================
echo 开始OAuth认证...
claude auth login
echo.

echo ========================================
echo 6. 诊断状态
echo ========================================
echo 检查认证状态...
claude doctor
echo.

pause 