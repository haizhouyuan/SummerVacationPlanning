#!/usr/bin/env node

/**
 * 日志分析脚本
 * 分析日志文件，生成统计报告和洞察
 * 用于监控系统健康状况和性能分析
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class LogAnalyzer {
  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
    this.stats = {
      totalRequests: 0,
      errorRequests: 0,
      slowRequests: 0,
      userActions: {},
      topEndpoints: {},
      errorTypes: {},
      performanceMetrics: {
        averageResponseTime: 0,
        totalResponseTime: 0,
        requestCounts: 0,
      },
      timeRange: {
        start: null,
        end: null,
      },
      securityEvents: [],
      businessOperations: {},
    };
  }

  /**
   * 主分析方法
   */
  async analyze(options = {}) {
    const {
      date = this.getTodayString(),
      type = 'combined',
      outputFormat = 'console',
      detailed = false,
    } = options;

    console.log('📊 开始日志分析...');
    console.log(`📅 分析日期: ${date}`);
    console.log(`📁 日志类型: ${type}`);
    console.log('─'.repeat(60));

    try {
      // 根据类型分析不同的日志文件
      switch (type) {
        case 'combined':
          await this.analyzeCombinedLogs(date);
          break;
        case 'error':
          await this.analyzeErrorLogs(date);
          break;
        case 'http':
          await this.analyzeHttpLogs(date);
          break;
        case 'business':
          await this.analyzeBusinessLogs(date);
          break;
        case 'security':
          await this.analyzeSecurityEvents(date);
          break;
        case 'performance':
          await this.analyzePerformance(date);
          break;
        default:
          await this.analyzeCombinedLogs(date);
      }

      // 输出报告
      if (outputFormat === 'json') {
        await this.generateJsonReport(date, type);
      } else if (outputFormat === 'html') {
        await this.generateHtmlReport(date, type);
      } else {
        this.printReport(detailed);
      }

    } catch (error) {
      console.error('❌ 日志分析失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 分析组合日志
   */
  async analyzeCombinedLogs(date) {
    const logFile = path.join(this.logsDir, `combined-${date}.log`);
    
    if (!fs.existsSync(logFile)) {
      console.log('❗ 指定日期的日志文件不存在');
      return;
    }

    console.log(`📖 分析文件: ${logFile}`);

    const fileStream = fs.createReadStream(logFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      try {
        const logEntry = JSON.parse(line);
        this.processLogEntry(logEntry);
      } catch (error) {
        // 跳过无法解析的行
        continue;
      }
    }

    this.calculateDerivedStats();
  }

  /**
   * 分析HTTP日志
   */
  async analyzeHttpLogs(date) {
    const logFile = path.join(this.logsDir, `http-${date}.log`);
    
    if (!fs.existsSync(logFile)) {
      console.log('❗ HTTP日志文件不存在');
      return;
    }

    const fileStream = fs.createReadStream(logFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      try {
        const logEntry = JSON.parse(line);
        if (logEntry.type === 'api_call') {
          this.processApiCall(logEntry);
        }
      } catch (error) {
        continue;
      }
    }
  }

  /**
   * 分析错误日志
   */
  async analyzeErrorLogs(date) {
    const logFile = path.join(this.logsDir, `error-${date}.log`);
    
    if (!fs.existsSync(logFile)) {
      console.log('❗ 错误日志文件不存在');
      return;
    }

    const fileStream = fs.createReadStream(logFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      try {
        const logEntry = JSON.parse(line);
        this.processErrorEntry(logEntry);
      } catch (error) {
        continue;
      }
    }
  }

  /**
   * 分析业务日志
   */
  async analyzeBusinessLogs(date) {
    const logFile = path.join(this.logsDir, `business-${date}.log`);
    
    if (!fs.existsSync(logFile)) {
      console.log('❗ 业务日志文件不存在');
      return;
    }

    const fileStream = fs.createReadStream(logFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      try {
        const logEntry = JSON.parse(line);
        this.processBusinessEntry(logEntry);
      } catch (error) {
        continue;
      }
    }
  }

  /**
   * 处理日志条目
   */
  processLogEntry(entry) {
    // 更新时间范围
    const timestamp = new Date(entry.timestamp);
    if (!this.stats.timeRange.start || timestamp < this.stats.timeRange.start) {
      this.stats.timeRange.start = timestamp;
    }
    if (!this.stats.timeRange.end || timestamp > this.stats.timeRange.end) {
      this.stats.timeRange.end = timestamp;
    }

    // 根据日志类型处理
    if (entry.message && entry.message.includes('HTTP_REQUEST')) {
      this.processHttpRequest(entry);
    } else if (entry.level === 'error') {
      this.processErrorEntry(entry);
    } else if (entry.type) {
      switch (entry.type) {
        case 'user_action':
          this.processUserAction(entry);
          break;
        case 'security_event':
          this.processSecurityEvent(entry);
          break;
        case 'business_operation':
          this.processBusinessOperation(entry);
          break;
      }
    }
  }

  /**
   * 处理HTTP请求
   */
  processHttpRequest(entry) {
    this.stats.totalRequests++;

    if (entry.statusCode >= 400) {
      this.stats.errorRequests++;
    }

    // 提取响应时间
    if (entry.duration) {
      const duration = parseInt(entry.duration.replace('ms', ''));
      this.stats.performanceMetrics.totalResponseTime += duration;
      this.stats.performanceMetrics.requestCounts++;

      if (duration > 1000) { // 慢请求阈值：1秒
        this.stats.slowRequests++;
      }
    }

    // 统计端点访问
    if (entry.url) {
      this.stats.topEndpoints[entry.url] = (this.stats.topEndpoints[entry.url] || 0) + 1;
    }
  }

  /**
   * 处理API调用
   */
  processApiCall(entry) {
    this.stats.totalRequests++;

    if (entry.statusCode >= 400) {
      this.stats.errorRequests++;
    }

    if (entry.duration > 1000) {
      this.stats.slowRequests++;
    }

    // 统计端点
    const endpoint = `${entry.method} ${entry.endpoint}`;
    this.stats.topEndpoints[endpoint] = (this.stats.topEndpoints[endpoint] || 0) + 1;

    // 更新性能指标
    this.stats.performanceMetrics.totalResponseTime += entry.duration;
    this.stats.performanceMetrics.requestCounts++;
  }

  /**
   * 处理错误条目
   */
  processErrorEntry(entry) {
    const errorType = entry.error?.code || entry.error?.name || 'Unknown';
    this.stats.errorTypes[errorType] = (this.stats.errorTypes[errorType] || 0) + 1;
  }

  /**
   * 处理用户操作
   */
  processUserAction(entry) {
    if (!this.stats.userActions[entry.action]) {
      this.stats.userActions[entry.action] = 0;
    }
    this.stats.userActions[entry.action]++;
  }

  /**
   * 处理安全事件
   */
  processSecurityEvent(entry) {
    this.stats.securityEvents.push({
      type: entry.securityType,
      userId: entry.userId,
      timestamp: entry.timestamp,
      details: entry.details,
    });
  }

  /**
   * 处理业务操作
   */
  processBusinessOperation(entry) {
    if (!this.stats.businessOperations[entry.operation]) {
      this.stats.businessOperations[entry.operation] = 0;
    }
    this.stats.businessOperations[entry.operation]++;
  }

  /**
   * 计算衍生统计数据
   */
  calculateDerivedStats() {
    if (this.stats.performanceMetrics.requestCounts > 0) {
      this.stats.performanceMetrics.averageResponseTime = 
        Math.round(this.stats.performanceMetrics.totalResponseTime / this.stats.performanceMetrics.requestCounts);
    }
  }

  /**
   * 打印报告
   */
  printReport(detailed = false) {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 日志分析报告');
    console.log('═'.repeat(80));

    // 基础统计
    console.log('\n📈 基础统计:');
    console.log(`  总请求数: ${this.stats.totalRequests.toLocaleString()}`);
    console.log(`  错误请求数: ${this.stats.errorRequests.toLocaleString()}`);
    console.log(`  错误率: ${this.stats.totalRequests ? ((this.stats.errorRequests / this.stats.totalRequests) * 100).toFixed(2) : 0}%`);
    console.log(`  慢请求数: ${this.stats.slowRequests.toLocaleString()}`);
    console.log(`  慢请求率: ${this.stats.totalRequests ? ((this.stats.slowRequests / this.stats.totalRequests) * 100).toFixed(2) : 0}%`);

    // 性能指标
    if (this.stats.performanceMetrics.requestCounts > 0) {
      console.log('\n⚡ 性能指标:');
      console.log(`  平均响应时间: ${this.stats.performanceMetrics.averageResponseTime}ms`);
      console.log(`  总响应时间: ${this.stats.performanceMetrics.totalResponseTime.toLocaleString()}ms`);
    }

    // 时间范围
    if (this.stats.timeRange.start && this.stats.timeRange.end) {
      console.log('\n⏰ 时间范围:');
      console.log(`  开始时间: ${this.stats.timeRange.start.toISOString()}`);
      console.log(`  结束时间: ${this.stats.timeRange.end.toISOString()}`);
      const duration = (this.stats.timeRange.end - this.stats.timeRange.start) / 1000;
      console.log(`  持续时间: ${Math.round(duration)}秒 (${Math.round(duration / 60)}分钟)`);
    }

    // 热门端点
    if (Object.keys(this.stats.topEndpoints).length > 0) {
      console.log('\n🔥 热门端点 (Top 10):');
      const sortedEndpoints = Object.entries(this.stats.topEndpoints)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
      
      sortedEndpoints.forEach(([endpoint, count], index) => {
        console.log(`  ${index + 1}. ${endpoint}: ${count.toLocaleString()} 次`);
      });
    }

    // 错误类型
    if (Object.keys(this.stats.errorTypes).length > 0) {
      console.log('\n❌ 错误类型:');
      const sortedErrors = Object.entries(this.stats.errorTypes)
        .sort(([,a], [,b]) => b - a);
      
      sortedErrors.forEach(([errorType, count]) => {
        console.log(`  ${errorType}: ${count.toLocaleString()} 次`);
      });
    }

    // 用户操作统计
    if (Object.keys(this.stats.userActions).length > 0) {
      console.log('\n👤 用户操作统计:');
      const sortedActions = Object.entries(this.stats.userActions)
        .sort(([,a], [,b]) => b - a);
      
      sortedActions.forEach(([action, count]) => {
        console.log(`  ${action}: ${count.toLocaleString()} 次`);
      });
    }

    // 安全事件
    if (this.stats.securityEvents.length > 0) {
      console.log('\n🚨 安全事件:');
      console.log(`  总计: ${this.stats.securityEvents.length} 个事件`);
      
      if (detailed) {
        this.stats.securityEvents.slice(0, 10).forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.type} - ${event.timestamp} - ${event.userId || 'Unknown'}`);
        });
      }
    }

    // 业务操作统计
    if (Object.keys(this.stats.businessOperations).length > 0) {
      console.log('\n💼 业务操作统计:');
      const sortedOperations = Object.entries(this.stats.businessOperations)
        .sort(([,a], [,b]) => b - a);
      
      sortedOperations.forEach(([operation, count]) => {
        console.log(`  ${operation}: ${count.toLocaleString()} 次`);
      });
    }

    console.log('\n' + '═'.repeat(80));
  }

  /**
   * 生成JSON报告
   */
  async generateJsonReport(date, type) {
    const reportPath = path.join(this.logsDir, `analysis-${date}-${type}.json`);
    const report = {
      date,
      type,
      generatedAt: new Date().toISOString(),
      stats: this.stats,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON报告已生成: ${reportPath}`);
  }

  /**
   * 获取今天的日期字符串
   */
  getTodayString() {
    return new Date().toISOString().split('T')[0];
  }
}

/**
   * 主函数
   */
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // 解析命令行参数
  args.forEach((arg, index) => {
    if (arg === '--date' && args[index + 1]) {
      options.date = args[index + 1];
    } else if (arg === '--type' && args[index + 1]) {
      options.type = args[index + 1];
    } else if (arg === '--format' && args[index + 1]) {
      options.outputFormat = args[index + 1];
    } else if (arg === '--detailed') {
      options.detailed = true;
    }
  });

  if (args.includes('--help')) {
    console.log(`
使用方法: node logAnalyzer.js [选项]

选项:
  --date <YYYY-MM-DD>     分析指定日期的日志 (默认: 今天)
  --type <类型>           分析类型: combined|error|http|business|security|performance (默认: combined)
  --format <格式>         输出格式: console|json|html (默认: console)
  --detailed              显示详细信息
  --help                  显示此帮助信息

示例:
  node logAnalyzer.js --date 2024-01-15 --type error --detailed
  node logAnalyzer.js --type performance --format json
    `);
    return;
  }

  const analyzer = new LogAnalyzer();
  await analyzer.analyze(options);
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('💥 日志分析失败:', error);
    process.exit(1);
  });
}

module.exports = LogAnalyzer;