#!/bin/bash

# 部署前检查脚本
# 确保所有必需的配置都已完成

set -e

echo "🔍 执行部署前检查..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查结果
ERRORS=0
WARNINGS=0

# 检查函数
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 存在"
    else
        echo -e "${RED}✗${NC} $1 不存在"
        ((ERRORS++))
    fi
}

check_env_var() {
    if [ -n "$2" ]; then
        echo -e "${GREEN}✓${NC} $1 已设置"
    else
        echo -e "${RED}✗${NC} $1 未设置"
        ((ERRORS++))
    fi
}

check_npm_install() {
    if [ -d "$1/node_modules" ]; then
        echo -e "${GREEN}✓${NC} $1 依赖已安装"
    else
        echo -e "${YELLOW}⚠${NC} $1 依赖未安装"
        ((WARNINGS++))
    fi
}

echo ""
echo "1. 检查必需文件..."
check_file "frontend/.env.local"
check_file "backend/.env"
check_file "firebase-admin-key.json"
check_file "firebase.json"
check_file "firestore.rules"
check_file "storage.rules"

echo ""
echo "2. 检查项目配置..."
source ./config.sh 2>/dev/null || true
check_env_var "PROJECT_ID" "$PROJECT_ID"

echo ""
echo "3. 检查依赖安装..."
check_npm_install "frontend"
check_npm_install "backend"
check_npm_install "functions"

echo ""
echo "4. 检查Firebase CLI..."
if command -v firebase &> /dev/null; then
    echo -e "${GREEN}✓${NC} Firebase CLI 已安装"
    
    # 检查是否已登录
    if firebase projects:list &> /dev/null; then
        echo -e "${GREEN}✓${NC} Firebase 已登录"
    else
        echo -e "${RED}✗${NC} Firebase 未登录"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} Firebase CLI 未安装"
    ((ERRORS++))
fi

echo ""
echo "5. 检查环境变量文件内容..."

# 检查前端环境变量
if [ -f "frontend/.env.local" ]; then
    if grep -q "your-project-id" frontend/.env.local; then
        echo -e "${RED}✗${NC} 前端环境变量包含示例值"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓${NC} 前端环境变量已配置"
    fi
fi

# 检查后端环境变量
if [ -f "backend/.env" ]; then
    if grep -q "your-project-id" backend/.env; then
        echo -e "${RED}✗${NC} 后端环境变量包含示例值"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓${NC} 后端环境变量已配置"
    fi
fi

echo ""
echo "6. 检查构建能力..."

# 检查前端构建
cd frontend
if npm run build &> /dev/null; then
    echo -e "${GREEN}✓${NC} 前端构建成功"
else
    echo -e "${RED}✗${NC} 前端构建失败"
    ((ERRORS++))
fi
cd ..

# 检查后端构建
cd backend
if npm run build &> /dev/null; then
    echo -e "${GREEN}✓${NC} 后端构建成功"
else
    echo -e "${RED}✗${NC} 后端构建失败"
    ((ERRORS++))
fi
cd ..

echo ""
echo "========================"
echo "检查结果汇总:"
echo "错误: $ERRORS"
echo "警告: $WARNINGS"
echo "========================"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ 所有检查通过！可以进行部署。${NC}"
    exit 0
else
    echo -e "${RED}❌ 发现 $ERRORS 个错误，请修复后再部署。${NC}"
    echo ""
    echo "常见解决方案:"
    echo "1. 如果环境变量未设置，请运行：./setup-env.sh"
    echo "2. 如果依赖未安装，请运行：npm install"
    echo "3. 如果Firebase未登录，请运行：firebase login"
    echo "4. 如果构建失败，请检查代码错误"
    exit 1
fi