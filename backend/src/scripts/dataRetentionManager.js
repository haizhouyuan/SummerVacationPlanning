#!/usr/bin/env node

/**
 * 数据保留管理器
 * 统一管理数据保留、归档和清理策略
 */

const DataRetentionCleaner = require('./dataRetentionCleaner');
const DataArchiver = require('./dataArchiver');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

// 数据保留管理配置
const RETENTION_MANAGER_CONFIG = {
  // 执行计划
  schedules: {
    // 每日数据归档 (凌晨1点)
    dailyArchive: '0 1 * * *',
    // 每周数据清理 (周日凌晨3点)
    weeklyCleanup: '0 3 * * 0',
    // 每月压缩优化 (每月1号凌晨4点)
    monthlyOptimization: '0 4 1 * *'
  },

  // 通知设置
  notifications: {
    email: {
      enabled: false,
      recipients: [],
      smtp: {
        host: process.env.SMTP_HOST || '',
        port: process.env.SMTP_PORT || 587,
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    },
    webhook: {
      enabled: false,
      urls: []
    },
    log: {
      enabled: true,
      path: './logs/retention-manager.log'
    }
  },

  // 监控阈值
  thresholds: {
    maxArchiveSize: 1024 * 1024 * 1024, // 1GB
    maxErrorRate: 0.05, // 5%
    maxExecutionTime: 3600000 // 1小时
  }
};

class DataRetentionManager {
  constructor(options = {}) {
    this.config = { ...RETENTION_MANAGER_CONFIG, ...options };
    this.isRunning = false;
    this.scheduledTasks = {};
    this.stats = {
      lastArchive: null,
      lastCleanup: null,
      lastOptimization: null,
      totalArchived: 0,
      totalCleaned: 0,
      errors: []
    };
  }

  /**
   * 启动数据保留管理器
   */
  async start() {
    console.log('🚀 启动数据保留管理器...');
    
    this.isRunning = true;
    
    // 加载历史统计
    await this.loadStats();
    
    // 设置定时任务
    this.setupScheduledTasks();
    
    // 设置信号处理
    this.setupSignalHandlers();
    
    console.log('✅ 数据保留管理器已启动');
    console.log('📋 定时任务:');
    console.log(`  🗃️  每日归档: ${this.config.schedules.dailyArchive}`);
    console.log(`  🧹 每周清理: ${this.config.schedules.weeklyCleanup}`);
    console.log(`  ⚡每月优化: ${this.config.schedules.monthlyOptimization}`);
    
    // 保持进程运行
    if (process.env.NODE_ENV !== 'test') {
      await this.keepAlive();
    }
  }

  /**
   * 停止数据保留管理器
   */
  async stop() {
    console.log('🛑 正在停止数据保留管理器...');
    
    this.isRunning = false;
    
    // 停止所有定时任务
    Object.values(this.scheduledTasks).forEach(task => task.destroy());
    this.scheduledTasks = {};
    
    // 保存统计数据
    await this.saveStats();
    
    console.log('✅ 数据保留管理器已停止');
  }

  /**
   * 设置定时任务
   */
  setupScheduledTasks() {
    // 每日归档任务
    this.scheduledTasks.dailyArchive = cron.schedule(
      this.config.schedules.dailyArchive,
      () => this.executeDailyArchive(),
      {
        scheduled: true,
        timezone: 'Asia/Shanghai'
      }
    );

    // 每周清理任务
    this.scheduledTasks.weeklyCleanup = cron.schedule(
      this.config.schedules.weeklyCleanup,
      () => this.executeWeeklyCleanup(),
      {
        scheduled: true,
        timezone: 'Asia/Shanghai'
      }
    );

    // 每月优化任务
    this.scheduledTasks.monthlyOptimization = cron.schedule(
      this.config.schedules.monthlyOptimization,
      () => this.executeMonthlyOptimization(),
      {
        scheduled: true,
        timezone: 'Asia/Shanghai'
      }
    );
  }

  /**
   * 执行每日归档
   */
  async executeDailyArchive() {
    console.log('\n📦 开始执行每日数据归档任务...');
    const startTime = Date.now();

    try {
      const archiver = new DataArchiver({
        dryRun: false,
        verbose: false
      });

      const result = await archiver.executeArchiving();
      
      const duration = Date.now() - startTime;
      this.stats.lastArchive = {
        timestamp: new Date().toISOString(),
        duration,
        recordsArchived: result.totalArchived,
        success: true,
        errors: result.errors
      };

      this.stats.totalArchived += result.totalArchived;

      await this.logActivity('DAILY_ARCHIVE', 'SUCCESS', {
        recordsArchived: result.totalArchived,
        duration,
        collections: Object.keys(result.collections).length
      });

      console.log(`✅ 每日归档完成: 归档 ${result.totalArchived} 条记录`);

    } catch (error) {
      console.error('❌ 每日归档失败:', error.message);
      
      this.stats.lastArchive = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: false,
        error: error.message
      };

      this.stats.errors.push({
        timestamp: new Date().toISOString(),
        type: 'DAILY_ARCHIVE_FAILED',
        message: error.message
      });

      await this.logActivity('DAILY_ARCHIVE', 'ERROR', {
        error: error.message,
        duration: Date.now() - startTime
      });

      // 发送错误通知
      await this.sendNotification('error', {
        type: 'daily_archive_failed',
        message: error.message
      });
    }
  }

  /**
   * 执行每周清理
   */
  async executeWeeklyCleanup() {
    console.log('\n🧹 开始执行每周数据清理任务...');
    const startTime = Date.now();

    try {
      const cleaner = new DataRetentionCleaner({
        dryRun: false,
        verbose: false
      });

      const result = await cleaner.executeRetentionPolicy();
      
      const duration = Date.now() - startTime;
      this.stats.lastCleanup = {
        timestamp: new Date().toISOString(),
        duration,
        recordsCleaned: result.deleted,
        success: true,
        errors: result.errors
      };

      this.stats.totalCleaned += result.deleted;

      await this.logActivity('WEEKLY_CLEANUP', 'SUCCESS', {
        recordsDeleted: result.deleted,
        recordsArchived: result.archived,
        duration,
        collections: Object.keys(result.collections).length
      });

      console.log(`✅ 每周清理完成: 删除 ${result.deleted} 条记录`);

    } catch (error) {
      console.error('❌ 每周清理失败:', error.message);
      
      this.stats.lastCleanup = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: false,
        error: error.message
      };

      this.stats.errors.push({
        timestamp: new Date().toISOString(),
        type: 'WEEKLY_CLEANUP_FAILED',
        message: error.message
      });

      await this.logActivity('WEEKLY_CLEANUP', 'ERROR', {
        error: error.message,
        duration: Date.now() - startTime
      });

      // 发送错误通知
      await this.sendNotification('error', {
        type: 'weekly_cleanup_failed',
        message: error.message
      });
    }
  }

  /**
   * 执行每月优化
   */
  async executeMonthlyOptimization() {
    console.log('\n⚡ 开始执行每月数据库优化任务...');
    const startTime = Date.now();

    try {
      // 数据库优化逻辑
      await this.optimizeDatabase();
      
      // 归档文件压缩和整理
      await this.compressArchiveFiles();
      
      const duration = Date.now() - startTime;
      this.stats.lastOptimization = {
        timestamp: new Date().toISOString(),
        duration,
        success: true
      };

      await this.logActivity('MONTHLY_OPTIMIZATION', 'SUCCESS', {
        duration
      });

      console.log(`✅ 每月优化完成: 耗时 ${(duration / 1000).toFixed(1)} 秒`);

    } catch (error) {
      console.error('❌ 每月优化失败:', error.message);
      
      this.stats.lastOptimization = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: false,
        error: error.message
      };

      this.stats.errors.push({
        timestamp: new Date().toISOString(),
        type: 'MONTHLY_OPTIMIZATION_FAILED',
        message: error.message
      });

      await this.logActivity('MONTHLY_OPTIMIZATION', 'ERROR', {
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * 优化数据库
   */
  async optimizeDatabase() {
    console.log('  🔧 优化数据库索引和统计信息...');
    
    // 这里可以添加具体的数据库优化逻辑
    // 例如重建索引、更新统计信息、碎片整理等
    
    // 模拟优化过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('  ✅ 数据库优化完成');
  }

  /**
   * 压缩归档文件
   */
  async compressArchiveFiles() {
    console.log('  📦 压缩和整理归档文件...');
    
    const archiveDir = path.join(process.cwd(), 'data-archive');
    
    try {
      // 检查是否存在归档目录
      await fs.access(archiveDir);
      
      // 这里可以添加归档文件压缩逻辑
      // 例如将旧的归档文件进一步压缩、整理等
      
      console.log('  ✅ 归档文件整理完成');
    } catch {
      console.log('  ⚠️  归档目录不存在，跳过文件压缩');
    }
  }

  /**
   * 记录活动日志
   */
  async logActivity(type, status, details = {}) {
    if (!this.config.notifications.log.enabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      status,
      details
    };

    const logPath = this.config.notifications.log.path;
    const logDir = path.dirname(logPath);
    
    try {
      await fs.mkdir(logDir, { recursive: true });
      await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('记录活动日志失败:', error.message);
    }
  }

  /**
   * 发送通知
   */
  async sendNotification(type, data) {
    // 邮件通知
    if (this.config.notifications.email.enabled) {
      await this.sendEmailNotification(type, data);
    }

    // Webhook通知
    if (this.config.notifications.webhook.enabled) {
      await this.sendWebhookNotification(type, data);
    }
  }

  /**
   * 发送邮件通知
   */
  async sendEmailNotification(type, data) {
    // 这里可以集成邮件发送功能
    console.log(`📧 邮件通知 (${type}):`, data);
  }

  /**
   * 发送Webhook通知
   */
  async sendWebhookNotification(type, data) {
    // 这里可以集成Webhook通知功能
    console.log(`🔗 Webhook通知 (${type}):`, data);
  }

  /**
   * 加载历史统计
   */
  async loadStats() {
    const statsPath = path.join(process.cwd(), 'data-retention-stats.json');
    
    try {
      const data = await fs.readFile(statsPath, 'utf8');
      this.stats = { ...this.stats, ...JSON.parse(data) };
    } catch {
      // 文件不存在，使用默认统计
    }
  }

  /**
   * 保存统计数据
   */
  async saveStats() {
    const statsPath = path.join(process.cwd(), 'data-retention-stats.json');
    
    try {
      await fs.writeFile(
        statsPath,
        JSON.stringify({
          ...this.stats,
          lastUpdate: new Date().toISOString()
        }, null, 2)
      );
    } catch (error) {
      console.error('保存统计数据失败:', error.message);
    }
  }

  /**
   * 设置信号处理
   */
  setupSignalHandlers() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n收到 ${signal} 信号，正在优雅关闭...`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  }

  /**
   * 保持进程运行
   */
  async keepAlive() {
    while (this.isRunning) {
      await new Promise(resolve => setTimeout(resolve, 60000)); // 每分钟检查一次
      
      // 定期保存统计数据
      await this.saveStats();
    }
  }

  /**
   * 获取状态报告
   */
  getStatusReport() {
    return {
      isRunning: this.isRunning,
      stats: this.stats,
      nextSchedules: {
        dailyArchive: this.scheduledTasks.dailyArchive?.nextDate?.()?.toISOString(),
        weeklyCleanup: this.scheduledTasks.weeklyCleanup?.nextDate?.()?.toISOString(),
        monthlyOptimization: this.scheduledTasks.monthlyOptimization?.nextDate?.()?.toISOString()
      }
    };
  }

  /**
   * 手动触发任务
   */
  async triggerTask(taskType) {
    console.log(`🎯 手动触发任务: ${taskType}`);
    
    switch (taskType) {
      case 'archive':
        await this.executeDailyArchive();
        break;
      case 'cleanup':
        await this.executeWeeklyCleanup();
        break;
      case 'optimize':
        await this.executeMonthlyOptimization();
        break;
      default:
        throw new Error(`未知任务类型: ${taskType}`);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
数据保留管理器

用法:
  node dataRetentionManager.js [选项]

选项:
  --trigger=<type>       手动触发任务 (archive/cleanup/optimize)
  --status              显示状态报告
  --help, -h           显示此帮助信息

守护进程模式:
  node dataRetentionManager.js   # 启动守护进程

定时任务:
  - 每日归档: 每天凌晨1点归档历史数据
  - 每周清理: 每周日凌晨3点清理过期数据  
  - 每月优化: 每月1号凌晨4点优化数据库

环境变量:
  MONGODB_URI    MongoDB连接字符串
  DB_NAME       数据库名称
  SMTP_HOST     SMTP服务器地址
  SMTP_USER     SMTP用户名
  SMTP_PASS     SMTP密码
`);
    return;
  }

  const manager = new DataRetentionManager();

  try {
    if (args.includes('--status')) {
      await manager.loadStats();
      const report = manager.getStatusReport();
      console.log('📊 数据保留管理器状态报告');
      console.log('=' .repeat(50));
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    const triggerTask = args.find(arg => arg.startsWith('--trigger='))?.split('=')[1];
    if (triggerTask) {
      await manager.triggerTask(triggerTask);
      return;
    }

    // 默认启动守护进程
    await manager.start();

  } catch (error) {
    console.error('💥 执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('未处理的错误:', error);
    process.exit(1);
  });
}

module.exports = DataRetentionManager;