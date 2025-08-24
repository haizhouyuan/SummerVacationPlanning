#!/usr/bin/env node

/**
 * 日志清理脚本
 * 定期清理过期的日志文件和压缩包
 * 可以通过cron定时执行，建议每天凌晨运行
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

// 配置参数
const config = {
  logsDir: path.join(process.cwd(), 'logs'),
  retentionPolicies: {
    // 不同类型日志的保留策略（天）
    'combined-': 30,      // 组合日志保留30天
    'error-': 90,         // 错误日志保留90天
    'http-': 7,           // HTTP日志保留7天
    'business-': 60,      // 业务日志保留60天
    'exceptions.log': 180, // 异常日志保留180天
    'rejections.log': 180, // Promise拒绝日志保留180天
  },
  maxLogFileSize: 100 * 1024 * 1024, // 100MB，超过此大小的文件会被删除（异常情况）
  dryRun: process.argv.includes('--dry-run'), // 是否为试运行模式
};

class LogCleaner {
  constructor(options = {}) {
    this.config = { ...config, ...options };
    this.stats = {
      totalFiles: 0,
      deletedFiles: 0,
      freedSpace: 0,
      errors: [],
    };
  }

  /**
   * 主清理方法
   */
  async cleanup() {
    console.log('🧹 开始日志清理任务...');
    console.log(`📁 日志目录: ${this.config.logsDir}`);
    console.log(`🔍 试运行模式: ${this.config.dryRun ? '是' : '否'}`);
    console.log('─'.repeat(60));

    try {
      // 检查日志目录是否存在
      if (!fs.existsSync(this.config.logsDir)) {
        console.log('❗ 日志目录不存在，创建目录...');
        fs.mkdirSync(this.config.logsDir, { recursive: true });
        return;
      }

      // 获取所有日志文件
      const files = await readdir(this.config.logsDir);
      this.stats.totalFiles = files.length;

      console.log(`📋 发现 ${files.length} 个文件`);

      // 清理过期文件
      await this.cleanupExpiredFiles(files);

      // 清理超大文件
      await this.cleanupOversizedFiles(files);

      // 清理审计日志（单独处理）
      await this.cleanupAuditFile();

      // 输出统计信息
      this.printStats();

    } catch (error) {
      console.error('❌ 日志清理失败:', error.message);
      this.stats.errors.push(error);
    }
  }

  /**
   * 清理过期的日志文件
   */
  async cleanupExpiredFiles(files) {
    for (const file of files) {
      try {
        const filePath = path.join(this.config.logsDir, file);
        const fileStat = await stat(filePath);

        // 跳过目录
        if (fileStat.isDirectory()) continue;

        // 获取文件的保留策略
        const retentionDays = this.getRetentionDays(file);
        if (retentionDays === null) continue;

        // 计算文件年龄
        const fileAge = (Date.now() - fileStat.mtime.getTime()) / (1000 * 60 * 60 * 24);

        if (fileAge > retentionDays) {
          console.log(`🗑️  删除过期文件: ${file} (年龄: ${Math.floor(fileAge)} 天, 限制: ${retentionDays} 天)`);
          
          if (!this.config.dryRun) {
            await unlink(filePath);
            this.stats.deletedFiles++;
            this.stats.freedSpace += fileStat.size;
          }
        } else {
          console.log(`✅ 保留文件: ${file} (年龄: ${Math.floor(fileAge)} 天, 限制: ${retentionDays} 天)`);
        }
      } catch (error) {
        console.error(`❌ 处理文件 ${file} 时出错:`, error.message);
        this.stats.errors.push({ file, error: error.message });
      }
    }
  }

  /**
   * 清理超大文件
   */
  async cleanupOversizedFiles(files) {
    for (const file of files) {
      try {
        const filePath = path.join(this.config.logsDir, file);
        const fileStat = await stat(filePath);

        // 跳过目录
        if (fileStat.isDirectory()) continue;

        if (fileStat.size > this.config.maxLogFileSize) {
          console.log(`🚨 删除超大文件: ${file} (大小: ${this.formatBytes(fileStat.size)}, 限制: ${this.formatBytes(this.config.maxLogFileSize)})`);
          
          if (!this.config.dryRun) {
            await unlink(filePath);
            this.stats.deletedFiles++;
            this.stats.freedSpace += fileStat.size;
          }
        }
      } catch (error) {
        console.error(`❌ 检查文件大小 ${file} 时出错:`, error.message);
        this.stats.errors.push({ file, error: error.message });
      }
    }
  }

  /**
   * 清理审计日志文件
   */
  async cleanupAuditFile() {
    const auditFile = path.join(this.config.logsDir, '.audit.json');
    
    try {
      if (fs.existsSync(auditFile)) {
        const fileStat = await stat(auditFile);
        
        // 如果审计文件超过10MB，进行清理
        if (fileStat.size > 10 * 1024 * 1024) {
          console.log('🧹 清理审计文件...');
          
          if (!this.config.dryRun) {
            // 读取审计文件
            const auditData = JSON.parse(fs.readFileSync(auditFile, 'utf8'));
            
            // 只保留最近30天的记录
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const cleanedData = {
              ...auditData,
              files: auditData.files ? auditData.files.filter(file => {
                return new Date(file.date || 0).getTime() > thirtyDaysAgo;
              }) : [],
            };
            
            // 写回文件
            fs.writeFileSync(auditFile, JSON.stringify(cleanedData, null, 2));
            console.log('✅ 审计文件已清理');
          }
        }
      }
    } catch (error) {
      console.error('❌ 清理审计文件时出错:', error.message);
      this.stats.errors.push({ file: '.audit.json', error: error.message });
    }
  }

  /**
   * 获取文件的保留天数
   */
  getRetentionDays(filename) {
    for (const [pattern, days] of Object.entries(this.config.retentionPolicies)) {
      if (filename.startsWith(pattern) || filename === pattern) {
        return days;
      }
    }
    
    // 检查是否为压缩日志文件
    if (filename.endsWith('.gz')) {
      const baseFilename = filename.replace('.gz', '');
      return this.getRetentionDays(baseFilename);
    }
    
    return null; // 不匹配任何策略的文件不处理
  }

  /**
   * 格式化字节数
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 打印统计信息
   */
  printStats() {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 清理统计信息');
    console.log('═'.repeat(60));
    console.log(`📁 总文件数: ${this.stats.totalFiles}`);
    console.log(`🗑️  已删除文件数: ${this.stats.deletedFiles}`);
    console.log(`💾 释放空间: ${this.formatBytes(this.stats.freedSpace)}`);
    console.log(`❌ 错误数: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n🚨 错误详情:');
      this.stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.file}: ${error.error}`);
      });
    }

    if (this.config.dryRun) {
      console.log('\n💡 这是试运行模式，实际上没有删除任何文件');
    }

    console.log('\n✅ 日志清理任务完成');
  }
}

/**
 * 获取磁盘使用情况
 */
async function getDiskUsage(dirPath) {
  try {
    const files = await readdir(dirPath);
    let totalSize = 0;
    let fileCount = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const fileStat = await stat(filePath);
      
      if (fileStat.isFile()) {
        totalSize += fileStat.size;
        fileCount++;
      }
    }

    return { totalSize, fileCount };
  } catch (error) {
    return { totalSize: 0, fileCount: 0 };
  }
}

/**
 * 主函数
 */
async function main() {
  const cleaner = new LogCleaner();
  
  // 显示清理前的磁盘使用情况
  const beforeUsage = await getDiskUsage(config.logsDir);
  console.log(`📊 清理前: ${beforeUsage.fileCount} 个文件, ${cleaner.formatBytes(beforeUsage.totalSize)}`);
  
  await cleaner.cleanup();
  
  // 显示清理后的磁盘使用情况
  if (!config.dryRun) {
    const afterUsage = await getDiskUsage(config.logsDir);
    console.log(`📊 清理后: ${afterUsage.fileCount} 个文件, ${cleaner.formatBytes(afterUsage.totalSize)}`);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('💥 清理脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = LogCleaner;