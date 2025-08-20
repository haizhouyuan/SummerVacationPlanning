@echo off
echo ========================================
echo ① 验证代理变量残留
echo ========================================
echo HTTPS_PROXY= %HTTPS_PROXY%
echo HTTP_PROXY= %HTTP_PROXY%
echo.

echo ========================================
echo ② 验证npm代理配置
echo ========================================
npm config get https-proxy
echo.

echo ========================================
echo ③ 验证WinHTTP代理设置
echo ========================================
netsh winhttp show proxy
echo.

echo ========================================
echo ④ 测试网络连接
echo ========================================
echo 测试TCP连接到api.anthropic.com:443...
powershell -Command "Test-NetConnection api.anthropic.com -Port 443"
echo.

echo ========================================
echo ⑤ 测试HTTP请求
echo ========================================
echo 测试HTTP请求到api.anthropic.com...
powershell -Command "Invoke-WebRequest -Uri 'https://api.anthropic.com/v1/complete' -Method HEAD -TimeoutSec 10"
echo.

echo ========================================
echo ⑥ 尝试Claude认证
echo ========================================
echo 尝试OAuth认证...
claude auth login
echo.

echo ========================================
echo ⑦ 诊断Claude状态
echo ========================================
echo 运行Claude诊断...
claude doctor
echo.

pause 