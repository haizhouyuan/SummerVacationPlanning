@echo off
echo 设置代理环境变量...

set HTTPS_PROXY=http://192.168.1.100:7890
set HTTP_PROXY=http://192.168.1.100:7890
set NO_PROXY=localhost,127.0.0.1

echo 环境变量已设置:
echo HTTPS_PROXY=%HTTPS_PROXY%
echo HTTP_PROXY=%HTTP_PROXY%
echo NO_PROXY=%NO_PROXY%

echo.
echo 现在可以运行: claude auth
echo.
echo 如果仍然失败，请尝试:
echo 1. 确保UpNet代理正常运行
echo 2. 使用API密钥: claude auth --api-key YOUR_API_KEY
echo 3. 使用不同端口: claude auth --port 8080

cmd /k 