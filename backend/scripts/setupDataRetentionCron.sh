#!/bin/bash

# 设置数据保留和清理策略的定时任务脚本

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 数据保留管理脚本路径
DATA_RETENTION_MANAGER="$PROJECT_DIR/src/scripts/dataRetentionManager.js"
DATA_ARCHIVER="$PROJECT_DIR/src/scripts/dataArchiver.js"
DATA_CLEANER="$PROJECT_DIR/src/scripts/dataRetentionCleaner.js"

# Node.js可执行文件路径
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo "❌ Node.js 未找到，请确保 Node.js 已安装"
    exit 1
fi

echo "🔧 设置数据保留和清理策略定时任务..."
echo "📁 项目目录: $PROJECT_DIR"
echo "🟢 Node.js 路径: $NODE_PATH"

# 创建cron作业配置
CRON_JOBS=$(cat << EOF
# 暑假规划应用数据保留和清理定时任务

# 每日凌晨1点执行数据归档
0 1 * * * cd $PROJECT_DIR && $NODE_PATH src/scripts/dataArchiver.js --execute >> logs/cron-archiver.log 2>&1

# 每周日凌晨3点执行数据清理
0 3 * * 0 cd $PROJECT_DIR && $NODE_PATH src/scripts/dataRetentionCleaner.js --execute >> logs/cron-retention.log 2>&1

# 每月1号凌晨4点执行数据库优化
0 4 1 * * cd $PROJECT_DIR && $NODE_PATH -e "
const manager = require('./src/scripts/dataRetentionManager.js');
const m = new manager();
m.executeMonthlyOptimization().then(() => process.exit(0)).catch(e => {console.error(e); process.exit(1);})
" >> logs/cron-optimization.log 2>&1

# 每天凌晨5点生成数据保留报告
0 5 * * * cd $PROJECT_DIR && $NODE_PATH -e "
const fs = require('fs');
const path = require('path');
const reportPath = path.join('logs', 'data-retention-report-' + new Date().toISOString().split('T')[0] + '.json');
const statsPath = 'data-retention-stats.json';
if (fs.existsSync(statsPath)) {
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  const report = {
    date: new Date().toISOString().split('T')[0],
    stats: stats,
    summary: {
      totalArchived: stats.totalArchived || 0,
      totalCleaned: stats.totalCleaned || 0,
      lastArchive: stats.lastArchive?.timestamp || 'N/A',
      lastCleanup: stats.lastCleanup?.timestamp || 'N/A',
      errors: stats.errors?.length || 0
    }
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('数据保留日报生成完成: ' + reportPath);
} else {
  console.log('统计数据文件不存在，跳过报告生成');
}
" >> logs/cron-reports.log 2>&1

EOF
)

# 创建临时cron文件
TEMP_CRON_FILE="/tmp/data_retention_cron_jobs"
echo "$CRON_JOBS" > "$TEMP_CRON_FILE"

# 函数：安装cron作业
install_cron_jobs() {
    echo "📝 安装数据保留定时任务..."
    
    # 备份现有的crontab
    crontab -l > /tmp/current_crontab 2>/dev/null || touch /tmp/current_crontab
    
    # 检查是否已经存在我们的任务
    if grep -q "暑假规划应用数据保留和清理定时任务" /tmp/current_crontab; then
        echo "⚠️  检测到现有的数据保留定时任务，将更新它们"
        # 移除旧的任务
        grep -v "暑假规划应用数据保留和清理定时任务" /tmp/current_crontab > /tmp/updated_crontab
        grep -v "dataArchiver.js" /tmp/updated_crontab > /tmp/temp_crontab && mv /tmp/temp_crontab /tmp/updated_crontab
        grep -v "dataRetentionCleaner.js" /tmp/updated_crontab > /tmp/temp_crontab && mv /tmp/temp_crontab /tmp/updated_crontab
        grep -v "dataRetentionManager.js" /tmp/updated_crontab > /tmp/temp_crontab && mv /tmp/temp_crontab /tmp/updated_crontab
        grep -v "data-retention-report" /tmp/updated_crontab > /tmp/temp_crontab && mv /tmp/temp_crontab /tmp/updated_crontab
    else
        cp /tmp/current_crontab /tmp/updated_crontab
    fi
    
    # 添加新的任务
    cat "$TEMP_CRON_FILE" >> /tmp/updated_crontab
    
    # 安装新的crontab
    crontab /tmp/updated_crontab
    
    if [ $? -eq 0 ]; then
        echo "✅ 数据保留定时任务安装成功"
        echo ""
        echo "📋 已安装的定时任务:"
        echo "  🗃️  每日数据归档: 凌晨1点"
        echo "  🧹 每周数据清理: 周日凌晨3点"
        echo "  ⚡每月数据库优化: 每月1号凌晨4点"
        echo "  📊 每日保留报告: 凌晨5点"
    else
        echo "❌ 数据保留定时任务安装失败"
        exit 1
    fi
    
    # 清理临时文件
    rm -f /tmp/current_crontab /tmp/updated_crontab "$TEMP_CRON_FILE"
}

# 函数：移除cron作业
remove_cron_jobs() {
    echo "🗑️  移除数据保留定时任务..."
    
    # 备份现有的crontab
    crontab -l > /tmp/current_crontab 2>/dev/null || touch /tmp/current_crontab
    
    # 移除相关任务
    grep -v "暑假规划应用数据保留和清理定时任务" /tmp/current_crontab > /tmp/updated_crontab
    grep -v "dataArchiver.js" /tmp/updated_crontab > /tmp/temp_crontab && mv /tmp/temp_crontab /tmp/updated_crontab
    grep -v "dataRetentionCleaner.js" /tmp/updated_crontab > /tmp/temp_crontab && mv /tmp/temp_crontab /tmp/updated_crontab
    grep -v "dataRetentionManager.js" /tmp/updated_crontab > /tmp/temp_crontab && mv /tmp/temp_crontab /tmp/updated_crontab
    grep -v "data-retention-report" /tmp/updated_crontab > /tmp/temp_crontab && mv /tmp/temp_crontab /tmp/updated_crontab
    
    # 安装清理后的crontab
    crontab /tmp/updated_crontab
    
    if [ $? -eq 0 ]; then
        echo "✅ 数据保留定时任务移除成功"
    else
        echo "❌ 数据保留定时任务移除失败"
        exit 1
    fi
    
    # 清理临时文件
    rm -f /tmp/current_crontab /tmp/updated_crontab
}

# 函数：显示当前cron作业
show_cron_jobs() {
    echo "📋 当前的数据保留定时任务："
    echo "─".repeat(50)
    crontab -l | grep -A 15 -B 2 "暑假规划应用数据保留和清理定时任务" || echo "未找到相关定时任务"
}

# 函数：测试脚本
test_scripts() {
    echo "🧪 测试数据保留管理脚本..."
    
    # 确保项目目录存在必要的子目录
    mkdir -p "$PROJECT_DIR/logs"
    mkdir -p "$PROJECT_DIR/data-archive"
    
    # 测试数据归档脚本
    echo "📦 测试数据归档脚本（试运行）..."
    cd "$PROJECT_DIR"
    $NODE_PATH src/scripts/dataArchiver.js --verbose
    
    if [ $? -eq 0 ]; then
        echo "✅ 数据归档脚本测试通过"
    else
        echo "❌ 数据归档脚本测试失败"
        exit 1
    fi
    
    # 测试数据清理脚本
    echo "🧹 测试数据保留清理脚本（试运行）..."
    $NODE_PATH src/scripts/dataRetentionCleaner.js --verbose
    
    if [ $? -eq 0 ]; then
        echo "✅ 数据保留清理脚本测试通过"
    else
        echo "❌ 数据保留清理脚本测试失败"
        exit 1
    fi
    
    # 测试数据保留管理器状态
    echo "📊 测试数据保留管理器状态..."
    $NODE_PATH src/scripts/dataRetentionManager.js --status
    
    if [ $? -eq 0 ]; then
        echo "✅ 数据保留管理器测试通过"
    else
        echo "❌ 数据保留管理器测试失败"
        exit 1
    fi
}

# 函数：运行完整测试套件
run_test_suite() {
    echo "🧪 运行数据保留和清理策略完整测试套件..."
    cd "$PROJECT_DIR"
    
    $NODE_PATH src/scripts/testDataRetention.js
    
    if [ $? -eq 0 ]; then
        echo "✅ 完整测试套件通过"
    else
        echo "❌ 完整测试套件失败"
        exit 1
    fi
}

# 函数：创建必要的目录和文件
setup_directories() {
    echo "📁 设置必要的目录和文件..."
    
    # 创建日志目录
    mkdir -p "$PROJECT_DIR/logs"
    mkdir -p "$PROJECT_DIR/data-archive"
    mkdir -p "$PROJECT_DIR/data-archive/manifests"
    
    # 创建cron日志文件
    touch "$PROJECT_DIR/logs/cron-archiver.log"
    touch "$PROJECT_DIR/logs/cron-retention.log"
    touch "$PROJECT_DIR/logs/cron-optimization.log"
    touch "$PROJECT_DIR/logs/cron-reports.log"
    
    # 创建统计数据文件（如果不存在）
    if [ ! -f "$PROJECT_DIR/data-retention-stats.json" ]; then
        echo '{
  "lastArchive": null,
  "lastCleanup": null,
  "lastOptimization": null,
  "totalArchived": 0,
  "totalCleaned": 0,
  "errors": []
}' > "$PROJECT_DIR/data-retention-stats.json"
    fi
    
    # 设置权限
    chmod 755 "$PROJECT_DIR/logs"
    chmod 755 "$PROJECT_DIR/data-archive"
    chmod 644 "$PROJECT_DIR/logs"/*.log 2>/dev/null || true
    
    echo "✅ 目录和文件设置完成"
}

# 函数：手动触发任务
trigger_task() {
    local task_type="$1"
    
    if [ -z "$task_type" ]; then
        echo "❌ 请指定任务类型: archive, cleanup, optimize"
        exit 1
    fi
    
    echo "🎯 手动触发 $task_type 任务..."
    cd "$PROJECT_DIR"
    
    case "$task_type" in
        archive)
            $NODE_PATH src/scripts/dataArchiver.js --execute --verbose
            ;;
        cleanup)
            $NODE_PATH src/scripts/dataRetentionCleaner.js --execute --verbose
            ;;
        optimize)
            $NODE_PATH src/scripts/dataRetentionManager.js --trigger=optimize
            ;;
        *)
            echo "❌ 未知任务类型: $task_type"
            echo "可用的任务类型: archive, cleanup, optimize"
            exit 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        echo "✅ $task_type 任务执行完成"
    else
        echo "❌ $task_type 任务执行失败"
        exit 1
    fi
}

# 显示使用说明
usage() {
    cat << EOF
数据保留和清理策略定时任务管理

使用说明:
  $0 install          - 安装数据保留定时任务
  $0 remove           - 移除数据保留定时任务
  $0 show             - 显示当前定时任务
  $0 test             - 测试脚本功能
  $0 test-full        - 运行完整测试套件
  $0 setup            - 设置必要的目录和权限
  $0 trigger <type>   - 手动触发任务 (archive/cleanup/optimize)
  $0 --help           - 显示此帮助信息

定时任务说明:
  - 每日数据归档: 凌晨1点归档超过保留期的历史数据
  - 每周数据清理: 周日凌晨3点清理过期的归档数据
  - 每月数据库优化: 每月1号凌晨4点优化数据库性能
  - 每日保留报告: 凌晨5点生成数据保留状况日报

数据保留策略:
  - activity_logs: 90天后归档，365天后删除
  - audit_logs: 180天后归档，3年后删除
  - daily_tasks: 180天后归档已完成任务，2年后删除
  - redemptions: 1年后归档已完成兑换，5年后删除
  - sessions: 30天后删除过期会话
  - 孤儿文件: 7天后清理无引用文件

注意事项:
  - 确保 Node.js 和 MongoDB 已正确安装
  - 确保脚本具有执行权限
  - 定时任务日志保存在 logs/ 目录下
  - 归档数据保存在 data-archive/ 目录下
EOF
}

# 主程序逻辑
case "${1:-}" in
    install)
        setup_directories
        test_scripts
        install_cron_jobs
        echo ""
        echo "🎉 数据保留和清理策略定时任务设置完成！"
        echo "📋 运行 '$0 show' 查看已安装的任务"
        echo "🧪 运行 '$0 test-full' 进行完整功能测试"
        ;;
    remove)
        remove_cron_jobs
        echo "🗑️  数据保留定时任务已移除"
        ;;
    show)
        show_cron_jobs
        ;;
    test)
        test_scripts
        ;;
    test-full)
        run_test_suite
        ;;
    setup)
        setup_directories
        ;;
    trigger)
        trigger_task "${2:-}"
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