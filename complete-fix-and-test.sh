#!/usr/bin/env bash

echo "🎯 Summer Vacation Planning - 完整修复和测试流程"
echo "解决HTTPS证书冲突，启用HTTP访问，准备袁绍宸账户测试"
echo "================================================================="
echo ""

# 检查是否为root用户
if [ "$EUID" -eq 0 ]; then 
    echo "⚠️ 请不要使用root用户直接运行此脚本"
    echo "💡 请使用: bash complete-fix-and-test.sh"
    exit 1
fi

# 设置脚本路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📍 工作目录: $SCRIPT_DIR"
echo ""

# Phase 1: 修复HTTPS证书冲突
echo "🚨 Phase 1: 修复HTTPS证书冲突..."
echo "----------------------------------------"

if [ -f "execute-fix-now.sh" ]; then
    chmod +x execute-fix-now.sh
    echo "🔧 执行HTTPS修复脚本..."
    if sudo bash execute-fix-now.sh; then
        echo "✅ Phase 1 完成: HTTPS冲突已修复"
    else
        echo "❌ Phase 1 失败: HTTPS修复出错"
        exit 1
    fi
else
    echo "❌ execute-fix-now.sh 脚本不存在"
    exit 1
fi

echo ""
echo "⏳ 等待5秒让Nginx服务稳定..."
sleep 5

# Phase 2: 验证HTTP访问
echo ""
echo "🔍 Phase 2: 验证HTTP访问..."
echo "----------------------------------------"

echo "📡 测试本地访问..."
if curl -f -s http://localhost/ > /dev/null; then
    echo "✅ 本地HTTP访问正常"
else
    echo "⚠️ 本地HTTP访问异常，但继续测试外部访问"
fi

echo "📡 测试外部访问..."
if curl -f -s http://47.120.74.212/ > /dev/null; then
    echo "✅ 外部HTTP访问正常"
    echo "🎉 Phase 2 完成: HTTP访问已恢复"
else
    echo "⚠️ 外部HTTP访问仍有问题，但继续进行后端启动"
fi

# Phase 3: 准备后端服务
echo ""
echo "🚀 Phase 3: 准备后端服务..."
echo "----------------------------------------"

if [ -d "backend" ]; then
    cd backend
    
    echo "📦 检查后端依赖..."
    if [ ! -d "node_modules" ]; then
        echo "📥 安装后端依赖..."
        npm install
    else
        echo "✅ 后端依赖已存在"
    fi
    
    # 检查环境配置
    if [ ! -f ".env" ]; then
        echo "⚙️ 创建后端环境配置..."
        cat > .env << 'EOF'
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/summer_vacation_planning
JWT_SECRET=summer-vacation-planning-secret-2024
JWT_EXPIRES_IN=7d
UPLOAD_MAX_SIZE=50mb
LOG_LEVEL=info
EOF
        echo "✅ 后端.env配置已创建"
    fi
    
    cd "$SCRIPT_DIR"
    echo "✅ Phase 3 完成: 后端环境准备就绪"
else
    echo "❌ backend目录不存在"
    exit 1
fi

# Phase 4: 最终验证和指导
echo ""
echo "📋 Phase 4: 最终验证和下一步指导..."
echo "----------------------------------------"

echo "🌐 HTTP访问测试结果:"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://47.120.74.212/ 2>/dev/null || echo "000")
echo "  状态码: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
    echo "  🎉 状态: 完全正常，可以进行测试"
elif [ "$HTTP_STATUS" = "502" ]; then
    echo "  ⚠️ 状态: 需要启动后端服务"
elif [ "$HTTP_STATUS" = "000" ]; then
    echo "  ⚠️ 状态: 网络连接问题"
else
    echo "  ℹ️ 状态: 其他状态，需进一步检查"
fi

echo ""
echo "=========================================="
echo "🎯 修复完成! 下一步操作指南:"
echo "=========================================="
echo ""
echo "1️⃣ 立即测试HTTP访问:"
echo "   在浏览器打开: http://47.120.74.212/"
echo "   应该能看到页面，不再有证书错误"
echo ""
echo "2️⃣ 启动后端服务 (新终端):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "3️⃣ 测试完整功能:"
echo "   - 访问: http://47.120.74.212/"
echo "   - 登录袁绍宸账户"
echo "   - 测试学生数据结构"
echo ""
echo "4️⃣ 如果后端启动失败:"
echo "   - 确保MongoDB运行: sudo systemctl start mongod"
echo "   - 检查端口占用: sudo lsof -i:5000"
echo "   - 查看后端日志获取详细错误信息"
echo ""
echo "📞 支持信息:"
echo "   - 测试页面: http://47.120.74.212/test"
echo "   - 健康检查: http://47.120.74.212/health"
echo "   - API测试: http://47.120.74.212/api/"
echo ""
echo "🎉 准备就绪，可以开始测试袁绍宸账户了!"
echo ""

# 提供快速后端启动选项
read -p "是否现在启动后端服务? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 启动后端服务..."
    cd backend
    echo "📡 后端将在 http://127.0.0.1:5000 运行"
    echo "按 Ctrl+C 停止服务"
    echo "-----------------------------------"
    npm run dev
else
    echo "👍 你可以稍后手动启动后端服务"
    echo "命令: cd backend && npm run dev"
fi