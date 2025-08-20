#!/bin/bash

# 项目配置文件
# 在部署前请更新这些值

# Firebase项目ID - 从Firebase Console获取
export PROJECT_ID="your-firebase-project-id"

# 项目名称
export PROJECT_NAME="Summer Vacation Planning"

# 部署区域
export REGION="us-central1"

# 前端构建目录
export FRONTEND_BUILD_DIR="frontend/build"

# 后端构建目录
export BACKEND_BUILD_DIR="backend/dist"

# 函数部署超时时间（秒）
export FUNCTION_TIMEOUT=60

# 函数内存限制（MB）
export FUNCTION_MEMORY=512

# 提示用户配置
echo "请确保已经更新了以下配置："
echo "1. PROJECT_ID: $PROJECT_ID"
echo "2. 前端环境变量文件: frontend/.env.local"
echo "3. 后端环境变量文件: backend/.env"
echo "4. Firebase Admin SDK密钥: backend/firebase-admin-key.json"
echo ""
echo "如果还没有配置，请先运行配置脚本。"