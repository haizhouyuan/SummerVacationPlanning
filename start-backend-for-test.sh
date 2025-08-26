#!/usr/bin/env bash

echo "🚀 启动后端服务用于测试"
echo "目标: 在端口5000启动后端API服务"
echo ""

# 检查环境
echo "🔍 检查环境..."
cd "$(dirname "$0")"

if [ ! -d "backend" ]; then
    echo "❌ backend目录不存在"
    exit 1
fi

cd backend

# 检查依赖
echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    npm install
fi

# 检查环境变量
echo "⚙️ 检查环境配置..."
if [ ! -f ".env" ]; then
    echo "⚠️ 创建默认.env配置..."
    cat > .env << 'EOF'
# 基本配置
NODE_ENV=development
PORT=5000

# MongoDB配置 (请根据实际情况修改)
MONGODB_URI=mongodb://localhost:27017/summer_vacation_planning

# JWT配置
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_MAX_SIZE=50mb
UPLOAD_PATH=./uploads

# 日志级别
LOG_LEVEL=info
EOF
    echo "✅ 默认.env已创建，请根据需要修改MongoDB连接信息"
fi

# 检查MongoDB连接
echo "🗄️ 检查数据库连接..."
if command -v mongosh >/dev/null 2>&1; then
    mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1 && echo "✅ MongoDB连接正常" || echo "⚠️ MongoDB连接失败，请确保MongoDB运行"
elif command -v mongo >/dev/null 2>&1; then
    mongo --eval "db.adminCommand('ping')" >/dev/null 2>&1 && echo "✅ MongoDB连接正常" || echo "⚠️ MongoDB连接失败，请确保MongoDB运行"
else
    echo "⚠️ 未检测到MongoDB客户端，请确保MongoDB已安装并运行"
fi

# 构建TypeScript
echo "🔨 构建TypeScript..."
if npm run build; then
    echo "✅ TypeScript构建成功"
else
    echo "⚠️ TypeScript构建失败，尝试直接运行开发版本"
fi

# 检查端口占用
echo "🔍 检查端口5000占用情况..."
if lsof -ti:5000 >/dev/null 2>&1; then
    echo "⚠️ 端口5000被占用，尝试终止现有进程..."
    sudo kill -9 $(lsof -ti:5000) 2>/dev/null || true
    sleep 2
fi

# 启动服务
echo ""
echo "🚀 启动后端服务..."
echo "📡 服务将在 http://127.0.0.1:5000 运行"
echo "🏥 健康检查: http://127.0.0.1:5000/health"
echo "📋 API基础: http://127.0.0.1:5000/api/"
echo ""
echo "按 Ctrl+C 停止服务"
echo "-----------------------------------"

# 优先使用开发模式，如果失败则使用生产模式
if npm run dev 2>/dev/null; then
    echo "✅ 开发模式启动成功"
else
    echo "⚠️ 开发模式启动失败，尝试生产模式..."
    if npm start; then
        echo "✅ 生产模式启动成功"
    else
        echo "❌ 后端服务启动失败"
        echo ""
        echo "🔧 troubleshooting steps:"
        echo "1. 检查MongoDB是否运行: systemctl status mongod"
        echo "2. 检查.env配置是否正确"
        echo "3. 检查依赖是否完整: npm install"
        echo "4. 查看详细错误: npm run dev"
        exit 1
    fi
fi