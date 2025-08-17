#!/bin/bash

echo "=== Claude CLI 测试脚本 ==="

# 设置代理环境变量
export HTTPS_PROXY="http://172.24.160.1:7890"
export NO_PROXY="localhost,127.0.0.1,172.24.160.1"

echo "代理设置:"
echo "HTTPS_PROXY: $HTTPS_PROXY"
echo "NO_PROXY: $NO_PROXY"
echo ""

echo "Claude CLI 信息:"
which claude
claude --version
echo ""

echo "网络诊断:"
claude doctor
echo ""

echo "测试简单对话（需要认证）:"
echo "如果你已经设置了API密钥，可以运行: claude -p 'hello'"
echo "或者运行OAuth登录: claude auth login"
echo ""

echo "要永久保存代理设置，请将以下行添加到 ~/.bashrc:"
echo "export HTTPS_PROXY='http://172.24.160.1:7890'"
echo "export NO_PROXY='localhost,127.0.0.1,172.24.160.1'" 