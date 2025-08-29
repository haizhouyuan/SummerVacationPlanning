#!/bin/bash

# ============================================================================
# Claude Code 隔离启动脚本 - Edge 浏览器多终端支持 (Linux/macOS)
# 
# 功能:
# - 自动生成唯一的 Playwright MCP 配置
# - 确保多终端并行运行无冲突
# - 强制使用 Edge 浏览器
# - 性能优化和资源管理
# ============================================================================

set -e

echo ""
echo "================================================"
echo " Claude Code 隔离启动器 - Edge 多终端支持"
echo "================================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 切换到项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# 检查项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到项目根目录，请确保脚本在正确位置"
    exit 1
fi

# 检查配置生成器
if [ ! -f "scripts/playwright-config-generator.js" ]; then
    echo "❌ 错误: 未找到配置生成器脚本"
    exit 1
fi

echo "🔄 正在生成唯一的 Playwright MCP 配置..."
node scripts/playwright-config-generator.js generate

if [ $? -ne 0 ]; then
    echo "❌ 配置生成失败"
    exit 1
fi

echo ""
echo "✅ 配置生成完成！Edge 浏览器已配置为默认浏览器"
echo "📁 会话数据已隔离，支持多终端并行运行"
echo "🚀 正在启动 Claude Code..."
echo ""

# 设置环境变量以优化性能
export PLAYWRIGHT_BROWSERS_PATH=0
export NODE_OPTIONS="--max-old-space-size=4096"

# 启动 Claude Code
claude code

# 脚本结束时清理（可选）
echo ""
read -p "🧹 Claude Code 已退出，是否清理当前会话数据？[Y/n] " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    echo "🔄 正在清理过期会话数据..."
    node scripts/playwright-config-generator.js cleanup 1
    echo "✅ 清理完成"
fi

echo ""
echo "👋 感谢使用 Claude Code Edge 隔离启动器！"