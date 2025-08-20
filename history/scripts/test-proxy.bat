@echo off
echo === 代理连接测试 ===

echo.
echo 1. 测试 127.0.0.1:7890
curl.exe -v --proxy http://127.0.0.1:7890 https://api.anthropic.com/v1/complete --max-time 10

echo.
echo 2. 测试 192.168.1.100:7890
curl.exe -v --proxy http://192.168.1.100:7890 https://api.anthropic.com/v1/complete --max-time 10

echo.
echo 3. 测试直连（应该失败）
curl.exe -v https://api.anthropic.com/v1/complete --max-time 10

echo.
echo 测试完成
pause 