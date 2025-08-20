#!/bin/bash

# 环境变量设置脚本
# 引导用户完成环境变量配置

echo "🔧 环境变量设置向导"
echo "===================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查是否已有配置文件
if [ -f "frontend/.env.local" ] || [ -f "backend/.env" ]; then
    echo -e "${YELLOW}警告：检测到现有的环境变量文件。${NC}"
    read -p "是否要覆盖现有配置？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "取消配置。"
        exit 0
    fi
fi

echo ""
echo -e "${BLUE}请准备以下信息：${NC}"
echo "1. Firebase项目ID"
echo "2. Firebase Web应用配置（从Firebase Console获取）"
echo "3. Firebase Admin SDK密钥文件"
echo ""

read -p "按回车键继续..."

# 获取项目ID
echo ""
echo -e "${YELLOW}步骤1：项目基本信息${NC}"
read -p "请输入Firebase项目ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}错误：项目ID不能为空${NC}"
    exit 1
fi

# 更新config.sh
echo "更新项目配置..."
sed -i "s/your-firebase-project-id/$PROJECT_ID/g" config.sh

# 设置前端环境变量
echo ""
echo -e "${YELLOW}步骤2：前端配置${NC}"
echo "请输入Firebase Web应用配置信息："

read -p "API Key: " API_KEY
read -p "Auth Domain (默认: $PROJECT_ID.firebaseapp.com): " AUTH_DOMAIN
AUTH_DOMAIN=${AUTH_DOMAIN:-"$PROJECT_ID.firebaseapp.com"}

read -p "Storage Bucket (默认: $PROJECT_ID.appspot.com): " STORAGE_BUCKET
STORAGE_BUCKET=${STORAGE_BUCKET:-"$PROJECT_ID.appspot.com"}

read -p "Messaging Sender ID: " MESSAGING_SENDER_ID
read -p "App ID: " APP_ID
read -p "Measurement ID (可选，直接回车跳过): " MEASUREMENT_ID

# 创建前端环境变量文件
cat > frontend/.env.local << EOF
# Firebase Configuration for Frontend
REACT_APP_FIREBASE_API_KEY=$API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN=$AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID=$PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET=$STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=$MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID=$APP_ID
EOF

if [ -n "$MEASUREMENT_ID" ]; then
    echo "REACT_APP_FIREBASE_MEASUREMENT_ID=$MEASUREMENT_ID" >> frontend/.env.local
fi

cat >> frontend/.env.local << EOF

# API Configuration
REACT_APP_API_BASE_URL=https://us-central1-$PROJECT_ID.cloudfunctions.net/api

# Application Configuration
REACT_APP_APP_NAME=Summer Vacation Planning
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=production
EOF

echo -e "${GREEN}✓ 前端环境变量配置完成${NC}"

# 设置后端环境变量
echo ""
echo -e "${YELLOW}步骤3：后端配置${NC}"

# 检查Admin SDK文件
if [ ! -f "backend/firebase-admin-key.json" ]; then
    echo -e "${RED}错误：未找到firebase-admin-key.json文件${NC}"
    echo "请将Firebase Admin SDK密钥文件复制到backend/firebase-admin-key.json"
    read -p "文件已复制，按回车继续..."
    
    if [ ! -f "backend/firebase-admin-key.json" ]; then
        echo -e "${RED}错误：仍未找到firebase-admin-key.json文件${NC}"
        exit 1
    fi
fi

# 从JSON文件读取配置
CLIENT_EMAIL=$(cat backend/firebase-admin-key.json | python3 -c "import sys, json; print(json.load(sys.stdin)['client_email'])")
PRIVATE_KEY=$(cat backend/firebase-admin-key.json | python3 -c "import sys, json; print(json.load(sys.stdin)['private_key'])")
PRIVATE_KEY_ID=$(cat backend/firebase-admin-key.json | python3 -c "import sys, json; print(json.load(sys.stdin)['private_key_id'])")

# 生成JWT密钥
echo "生成JWT密钥..."
JWT_SECRET=$(openssl rand -hex 64)

# 创建后端环境变量文件
cat > backend/.env << EOF
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=$PROJECT_ID
FIREBASE_CLIENT_EMAIL=$CLIENT_EMAIL
FIREBASE_PRIVATE_KEY="$PRIVATE_KEY"
FIREBASE_PRIVATE_KEY_ID=$PRIVATE_KEY_ID

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production
PORT=3001

# CORS Configuration
CORS_ORIGIN=https://$PROJECT_ID.web.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Database Configuration
FIRESTORE_EMULATOR_HOST=
FIREBASE_AUTH_EMULATOR_HOST=

# Logging
LOG_LEVEL=info

# Application Configuration
APP_NAME=Summer Vacation Planning API
APP_VERSION=1.0.0
EOF

echo -e "${GREEN}✓ 后端环境变量配置完成${NC}"

# 创建functions环境变量文件
if [ -d "functions" ]; then
    cp backend/.env functions/.env
    echo -e "${GREEN}✓ Functions环境变量配置完成${NC}"
fi

echo ""
echo -e "${GREEN}🎉 环境变量配置完成！${NC}"
echo ""
echo "下一步："
echo "1. 运行 ./pre-deploy-check.sh 检查配置"
echo "2. 运行 ./deploy.sh 开始部署"
echo ""
echo -e "${YELLOW}重要提醒：${NC}"
echo "- 请确保不要将.env文件提交到版本控制系统"
echo "- 定期轮换JWT密钥和Firebase密钥"
echo "- 在生产环境中使用强密码和安全配置"