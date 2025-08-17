#!/bin/bash

echo "🚀 启动暑期计划应用"
echo ""

echo "📦 安装前端依赖..."
cd "$(dirname "$0")/frontend"
npm install

echo "🎯 启动前端开发服务器..."
echo ""
echo "✨ 应用将在浏览器中自动打开"
echo "🌐 访问地址: http://localhost:3000"
echo ""

npm start