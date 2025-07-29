#!/bin/bash

echo "=== WSL Claude CLI 设置脚本 ==="
echo ""

# 步骤1: 获取Windows主机IP并设置代理
echo "步骤1: 设置代理环境变量"
WSL_HOST=$(grep nameserver /etc/resolv.conf | awk '{print $2}')
echo "Windows主机IP: $WSL_HOST"

export HTTPS_PROXY="http://$WSL_HOST:7890"
export NO_PROXY="localhost,127.0.0.1,$WSL_HOST"

echo "HTTPS_PROXY: $HTTPS_PROXY"
echo "NO_PROXY: $NO_PROXY"
echo ""

# 步骤2: 快速健康检查
echo "步骤2: 网络健康检查"
echo "检查代理连接性..."
curl -Ik https://api.anthropic.com/v1/complete --proxy $HTTPS_PROXY --max-time 10

echo ""
echo "检查Node.js代理设置..."
node -e "https=require('https'); https.get('https://api.anthropic.com',r=>console.log('Node.js状态码:', r.statusCode)).on('error',e=>console.error('Node.js错误:', e.message))"

echo ""
echo "步骤3: 安装/升级Claude CLI"
npm i -g @anthropic-ai/claude-code@latest

echo ""
echo "步骤4: 验证安装"
which claude
claude --version

echo ""
echo "=== 设置完成 ==="
echo "现在你可以运行以下命令进行认证："
echo "1. OAuth登录: claude auth login"
echo "2. 或设置API Key: export ANTHROPIC_API_KEY='your-api-key'"
echo ""
echo "要永久保存代理设置，请将以下行添加到 ~/.bashrc:"
echo "export HTTPS_PROXY='http://$WSL_HOST:7890'"
echo "export NO_PROXY='localhost,127.0.0.1,$WSL_HOST'" 