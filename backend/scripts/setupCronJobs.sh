#!/bin/bash

# 设置cron作业脚本
# 用于配置日志清理和分析的定时任务

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 日志清理脚本路径
LOG_CLEANUP_SCRIPT="$PROJECT_DIR/src/scripts/logCleanup.js"
LOG_ANALYZER_SCRIPT="$PROJECT_DIR/src/scripts/logAnalyzer.js"

# Node.js可执行文件路径（根据实际安装路径调整）
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo "❌ Node.js 未找到，请确保 Node.js 已安装"
    exit 1
fi

echo "🔧 设置日志管理定时任务..."
echo "📁 项目目录: $PROJECT_DIR"
echo "🟢 Node.js 路径: $NODE_PATH"

# 创建cron作业配置
CRON_JOBS=$(cat << EOF
# 暑假规划应用日志管理定时任务
# 每天凌晨2点执行日志清理
0 2 * * * cd $PROJECT_DIR && $NODE_PATH src/scripts/logCleanup.js >> logs/cron-cleanup.log 2>&1

# 每天凌晨3点生成日志分析报告
0 3 * * * cd $PROJECT_DIR && $NODE_PATH src/scripts/logAnalyzer.js --format json >> logs/cron-analysis.log 2>&1

# 每周一凌晨4点生成详细的周报告
0 4 * * 1 cd $PROJECT_DIR && $NODE_PATH src/scripts/logAnalyzer.js --type performance --format html --detailed >> logs/cron-weekly.log 2>&1

# 每小时检查错误日志（如果有严重错误需要立即通知）
0 * * * * cd $PROJECT_DIR && $NODE_PATH src/scripts/logAnalyzer.js --type error | grep -q "ERROR" && echo "严重错误检测到" >> logs/error-alerts.log

EOF
)

# 创建临时cron文件
TEMP_CRON_FILE="/tmp/summer_app_cron_jobs"
echo "$CRON_JOBS" > "$TEMP_CRON_FILE"

# 函数：安装cron作业
install_cron_jobs() {
    echo "📝 安装定时任务..."
    
    # 备份现有的crontab
    crontab -l > /tmp/current_crontab 2>/dev/null || touch /tmp/current_crontab
    
    # 检查是否已经存在我们的任务
    if grep -q "暑假规划应用日志管理定时任务" /tmp/current_crontab; then
        echo "⚠️  检测到现有的日志管理定时任务，将更新它们"
        # 移除旧的任务
        grep -v "暑假规划应用日志管理定时任务" /tmp/current_crontab > /tmp/updated_crontab
        grep -v "logCleanup.js" /tmp/updated_crontab > /tmp/temp_crontab && mv /tmp/temp_crontab /tmp/updated_crontab
        grep -v "logAnalyzer.js" /tmp/updated_crontab > /tmp/temp_crontab && mv /tmp/temp_crontab /tmp/updated_crontab
        grep -v "error-alerts.log" /tmp/updated_crontab > /tmp/temp_crontab && mv /tmp/temp_crontab /tmp/updated_crontab
    else
        cp /tmp/current_crontab /tmp/updated_crontab
    fi
    
    # 添加新的任务
    cat "$TEMP_CRON_FILE" >> /tmp/updated_crontab
    
    # 安装新的crontab
    crontab /tmp/updated_crontab
    
    if [ $? -eq 0 ]; then
        echo "✅ 定时任务安装成功"
    else
        echo "❌ 定时任务安装失败"
        exit 1
    fi
    
    # 清理临时文件
    rm -f /tmp/current_crontab /tmp/updated_crontab "$TEMP_CRON_FILE"
}

# 函数：移除cron作业
remove_cron_jobs() {
    echo "🗑️  移除日志管理定时任务..."
    
    # 备份现有的crontab
    crontab -l > /tmp/current_crontab 2>/dev/null || touch /tmp/current_crontab
    
    # 移除相关任务
    grep -v "暑假规划应用日志管理定时任务" /tmp/current_crontab > /tmp/updated_crontab
    grep -v "logCleanup.js" /tmp/updated_crontab > /tmp/temp_crontab && mv /tmp/temp_crontab /tmp/updated_crontab
    grep -v "logAnalyzer.js" /tmp/updated_crontab > /tmp/temp_crontab && mv /tmp/temp_crontab /tmp/updated_crontab
    grep -v "error-alerts.log" /tmp/updated_crontab > /tmp/temp_crontab && mv /tmp/temp_crontab /tmp/updated_crontab
    
    # 安装清理后的crontab
    crontab /tmp/updated_crontab
    
    if [ $? -eq 0 ]; then
        echo "✅ 定时任务移除成功"
    else
        echo "❌ 定时任务移除失败"
        exit 1
    fi
    
    # 清理临时文件
    rm -f /tmp/current_crontab /tmp/updated_crontab
}

# 函数：显示当前cron作业
show_cron_jobs() {
    echo "📋 当前的定时任务："
    echo "─".repeat(50)
    crontab -l | grep -A 10 -B 2 "暑假规划应用日志管理定时任务" || echo "未找到相关定时任务"
}

# 函数：测试脚本
test_scripts() {
    echo "🧪 测试日志管理脚本..."
    
    # 测试日志清理脚本
    echo "🧹 测试日志清理脚本（试运行）..."
    cd "$PROJECT_DIR"
    $NODE_PATH src/scripts/logCleanup.js --dry-run
    
    if [ $? -eq 0 ]; then
        echo "✅ 日志清理脚本测试通过"
    else
        echo "❌ 日志清理脚本测试失败"
        exit 1
    fi
    
    # 测试日志分析脚本
    echo "📊 测试日志分析脚本..."
    $NODE_PATH src/scripts/logAnalyzer.js --type combined --format console
    
    if [ $? -eq 0 ]; then
        echo "✅ 日志分析脚本测试通过"
    else
        echo "❌ 日志分析脚本测试失败"
        exit 1
    fi
}

# 函数：创建必要的目录和文件
setup_directories() {
    echo "📁 设置必要的目录和文件..."
    
    # 创建日志目录
    mkdir -p "$PROJECT_DIR/logs"
    
    # 创建cron日志文件
    touch "$PROJECT_DIR/logs/cron-cleanup.log"
    touch "$PROJECT_DIR/logs/cron-analysis.log"
    touch "$PROJECT_DIR/logs/cron-weekly.log"
    touch "$PROJECT_DIR/logs/error-alerts.log"
    
    # 设置权限
    chmod 755 "$PROJECT_DIR/logs"
    chmod 644 "$PROJECT_DIR/logs"/*.log
    
    echo "✅ 目录和文件设置完成"
}

# 显示使用说明
usage() {
    cat << EOF
使用说明:
  $0 install    - 安装日志管理定时任务
  $0 remove     - 移除日志管理定时任务
  $0 show       - 显示当前定时任务
  $0 test       - 测试脚本功能
  $0 setup      - 设置必要的目录和权限
  $0 --help     - 显示此帮助信息

定时任务说明:
  - 每天凌晨2点：自动清理过期日志文件
  - 每天凌晨3点：生成日志分析报告
  - 每周一凌晨4点：生成详细的性能报告
  - 每小时：检查严重错误并记录警报

注意事项:
  - 确保 Node.js 已正确安装
  - 确保脚本具有执行权限
  - 定时任务日志保存在 logs/ 目录下
EOF
}

# 主程序逻辑
case "${1:-}" in
    install)
        setup_directories
        test_scripts
        install_cron_jobs
        echo ""
        echo "🎉 日志管理定时任务设置完成！"
        echo "📋 运行 '$0 show' 查看已安装的任务"
        ;;
    remove)
        remove_cron_jobs
        echo "🗑️  日志管理定时任务已移除"
        ;;
    show)
        show_cron_jobs
        ;;
    test)
        test_scripts
        ;;
    setup)
        setup_directories
        ;;
    --help|help)
        usage
        ;;
    *)
        echo "❌ 无效的参数: ${1:-}"
        echo ""
        usage
        exit 1
        ;;
esac