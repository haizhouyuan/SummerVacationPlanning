#!/bin/bash

echo "=== 永久代理设置脚本 ==="

# 获取Windows主机IP
WSL_HOST=$(grep nameserver /etc/resolv.conf | awk '{print $2}')
echo "Windows主机IP: $WSL_HOST"

# 检查是否已经设置过
if grep -q "HTTPS_PROXY.*$WSL_HOST" ~/.bashrc; then
    echo "代理设置已存在于 ~/.bashrc 中"
else
    echo "添加代理设置到 ~/.bashrc..."
    echo "" >> ~/.bashrc
    echo "# Claude CLI 代理设置" >> ~/.bashrc
    echo "export HTTPS_PROXY='http://$WSL_HOST:7890'" >> ~/.bashrc
    echo "export NO_PROXY='localhost,127.0.0.1,$WSL_HOST'" >> ~/.bashrc
    echo "代理设置已添加到 ~/.bashrc"
fi

echo ""
echo "要应用新设置，请运行: source ~/.bashrc"
echo "或者重新打开WSL终端"
echo ""
echo "现在你可以进行认证："
echo "1. OAuth登录: claude auth login"
echo "2. 或设置API Key: export ANTHROPIC_API_KEY='your-api-key'" 