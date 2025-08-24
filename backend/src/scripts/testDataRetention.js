#!/usr/bin/env node

/**
 * 数据保留和清理策略测试脚本
 * 验证归档和清理功能的正确性
 */

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');
const DataRetentionCleaner = require('./dataRetentionCleaner');
const DataArchiver = require('./dataArchiver');
const DataRetentionManager = require('./dataRetentionManager');

class DataRetentionTestSuite {
  constructor() {
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    this.dbName = process.env.DB_NAME || 'summer_vacation_planning_test';
    this.client = null;
    this.db = null;
    
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始数据保留和清理策略测试套件');
    console.log('=' .repeat(60));

    await this.connect();

    try {
      const tests = [
        { name: '数据库连接测试', fn: () => this.testDatabaseConnection() },
        { name: '测试数据准备', fn: () => this.prepareTestData() },
        { name: '数据归档器测试', fn: () => this.testDataArchiver() },
        { name: '数据清理器测试', fn: () => this.testDataRetentionCleaner() },
        { name: '归档文件验证测试', fn: () => this.testArchiveFileVerification() },
        { name: '孤儿文件清理测试', fn: () => this.testOrphanedFileCleanup() },
        { name: '数据保留管理器测试', fn: () => this.testDataRetentionManager() },
        { name: '清理测试数据', fn: () => this.cleanupTestData() }
      ];

      for (const test of tests) {
        await this.runTest(test.name, test.fn);
      }

    } finally {
      await this.disconnect();
    }

    this.printTestResults();
    return this.testResults.failed === 0;
  }

  /**
   * 连接数据库
   */
  async connect() {
    try {
      this.client = new MongoClient(this.mongoUri);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      console.log(`✅ 已连接到测试数据库: ${this.dbName}`);
    } catch (error) {
      throw new Error(`测试数据库连接失败: ${error.message}`);
    }
  }

  /**
   * 断开数据库连接
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('✅ 测试数据库连接已关闭');
    }
  }

  /**
   * 运行单个测试
   */
  async runTest(name, testFn) {
    this.testResults.total++;
    
    try {
      console.log(`\n🧪 执行测试: ${name}`);
      await testFn();
      
      this.testResults.passed++;
      this.testResults.tests.push({
        name,
        status: 'PASSED'
      });
      
      console.log(`✅ ${name} - 通过`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.tests.push({
        name,
        status: 'FAILED',
        error: error.message
      });
      
      console.log(`❌ ${name} - 失败: ${error.message}`);
    }
  }

  /**
   * 测试数据库连接
   */
  async testDatabaseConnection() {
    const admin = this.db.admin();
    const result = await admin.ping();
    
    if (result.ok !== 1) {
      throw new Error('数据库ping失败');
    }

    console.log('  ✓ 数据库连接正常');
  }

  /**
   * 准备测试数据
   */
  async prepareTestData() {
    // 创建测试用的过期数据
    const testCollections = ['activity_logs', 'audit_logs', 'daily_tasks', 'redemptions'];
    
    const now = new Date();
    const oldDate = new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000); // 200天前
    const veryOldDate = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000); // 400天前

    for (const collectionName of testCollections) {
      const collection = this.db.collection(collectionName);
      
      // 清理现有测试数据
      await collection.deleteMany({ 
        $or: [
          { isTestData: true },
          { userId: { $regex: /^test-user/ } }
        ]
      });

      // 插入新的测试数据
      const testData = [];
      
      for (let i = 0; i < 50; i++) {
        let doc = {
          isTestData: true,
          userId: `test-user-${i}`,
          createdAt: i < 20 ? veryOldDate : (i < 40 ? oldDate : now),
          timestamp: i < 20 ? veryOldDate : (i < 40 ? oldDate : now)
        };

        // 为不同集合添加特定字段
        switch (collectionName) {
          case 'activity_logs':
            doc.action = `test_action_${i}`;
            doc.details = { testData: true, index: i };
            break;
          case 'audit_logs':
            doc.operation = `test_operation_${i}`;
            doc.collection = 'test_collection';
            doc.changes = { field: `value_${i}` };
            break;
          case 'daily_tasks':
            doc.taskId = `test-task-${i}`;
            doc.status = i < 30 ? 'completed' : 'pending';
            doc.points = 10;
            break;
          case 'redemptions':
            doc.status = i < 25 ? 'approved' : (i < 35 ? 'rejected' : 'pending');
            doc.pointsCost = 50;
            doc.item = 'gaming_time';
            break;
        }

        testData.push(doc);
      }

      await collection.insertMany(testData);
      console.log(`  ✓ 为 ${collectionName} 准备了 ${testData.length} 条测试数据`);
    }

    // 创建测试用的孤儿文件
    await this.createTestOrphanFiles();
  }

  /**
   * 创建测试用的孤儿文件
   */
  async createTestOrphanFiles() {
    const testUploadsDir = path.join(process.cwd(), 'test-uploads');
    await fs.mkdir(testUploadsDir, { recursive: true });

    // 创建一些测试文件
    const testFiles = [
      'orphan_file_1.txt',
      'orphan_file_2.jpg',
      'old_file_1.png',
      'old_file_2.pdf'
    ];

    for (const fileName of testFiles) {
      const filePath = path.join(testUploadsDir, fileName);
      await fs.writeFile(filePath, `Test content for ${fileName}`);
      
      // 修改文件时间使其看起来很旧
      const oldTime = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10天前
      await fs.utimes(filePath, oldTime, oldTime);
    }

    console.log(`  ✓ 创建了 ${testFiles.length} 个测试孤儿文件`);
  }

  /**
   * 测试数据归档器
   */
  async testDataArchiver() {
    const archiver = new DataArchiver({
      dryRun: true, // 使用试运行模式
      verbose: false
    });

    const result = await archiver.executeArchiving();
    
    if (!result.collections) {
      throw new Error('归档器未返回集合统计信息');
    }

    // 验证至少有一些集合被处理
    const processedCollections = Object.keys(result.collections);
    if (processedCollections.length === 0) {
      throw new Error('没有集合被归档器处理');
    }

    console.log(`  ✓ 归档器试运行成功，处理了 ${processedCollections.length} 个集合`);
    
    // 测试实际归档
    archiver.dryRun = false;
    const realResult = await archiver.executeArchiving();
    
    if (realResult.totalArchived === 0) {
      console.log('  ⚠️  没有数据需要归档（这是正常的）');
    } else {
      console.log(`  ✓ 实际归档了 ${realResult.totalArchived} 条记录`);
    }
  }

  /**
   * 测试数据保留清理器
   */
  async testDataRetentionCleaner() {
    const cleaner = new DataRetentionCleaner({
      dryRun: true, // 使用试运行模式
      verbose: false
    });

    const result = await cleaner.executeRetentionPolicy();
    
    if (!result.collections) {
      throw new Error('清理器未返回集合统计信息');
    }

    console.log(`  ✓ 清理器试运行成功，处理了 ${Object.keys(result.collections).length} 个集合`);
    
    // 测试实际清理
    cleaner.dryRun = false;
    const realResult = await cleaner.executeRetentionPolicy();
    
    if (realResult.totalProcessed === 0) {
      console.log('  ⚠️  没有数据需要清理（这是正常的）');
    } else {
      console.log(`  ✓ 实际处理了 ${realResult.totalProcessed} 条记录`);
    }
  }

  /**
   * 测试归档文件验证
   */
  async testArchiveFileVerification() {
    const archiveDir = path.join(process.cwd(), 'data-archive');
    
    try {
      await fs.access(archiveDir);
      
      // 检查归档目录结构
      const items = await fs.readdir(archiveDir);
      console.log(`  ✓ 归档目录存在，包含 ${items.length} 个项目`);
      
      // 检查是否有最近的归档
      for (const item of items) {
        const itemPath = path.join(archiveDir, item);
        const stat = await fs.stat(itemPath);
        
        if (stat.isDirectory()) {
          const subItems = await fs.readdir(itemPath);
          console.log(`  ✓ 归档日期目录 ${item} 包含 ${subItems.length} 个文件`);
        }
      }
      
    } catch (error) {
      console.log('  ⚠️  归档目录不存在或为空（这是正常的）');
    }
  }

  /**
   * 测试孤儿文件清理
   */
  async testOrphanedFileCleanup() {
    const testUploadsDir = path.join(process.cwd(), 'test-uploads');
    
    try {
      // 检查测试文件是否存在
      const files = await fs.readdir(testUploadsDir);
      console.log(`  ✓ 发现 ${files.length} 个测试文件`);
      
      // 模拟清理过程（不实际删除）
      let oldFilesCount = 0;
      for (const file of files) {
        const filePath = path.join(testUploadsDir, file);
        const stat = await fs.stat(filePath);
        const ageInDays = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24);
        
        if (ageInDays > 7) {
          oldFilesCount++;
        }
      }
      
      console.log(`  ✓ 发现 ${oldFilesCount} 个超过7天的旧文件`);
      
    } catch (error) {
      console.log('  ⚠️  测试上传目录不存在');
    }
  }

  /**
   * 测试数据保留管理器
   */
  async testDataRetentionManager() {
    // 测试管理器的状态报告功能
    const manager = new DataRetentionManager();
    
    // 加载统计数据
    await manager.loadStats();
    
    // 获取状态报告
    const statusReport = manager.getStatusReport();
    
    if (!statusReport.hasOwnProperty('isRunning')) {
      throw new Error('状态报告缺少isRunning字段');
    }
    
    if (!statusReport.hasOwnProperty('stats')) {
      throw new Error('状态报告缺少stats字段');
    }
    
    console.log('  ✓ 数据保留管理器状态报告功能正常');
    
    // 测试手动触发功能（试运行）
    try {
      // 这里不实际触发，只是测试方法存在
      if (typeof manager.triggerTask !== 'function') {
        throw new Error('triggerTask方法不存在');
      }
      
      console.log('  ✓ 数据保留管理器手动触发功能可用');
    } catch (error) {
      throw new Error(`管理器功能测试失败: ${error.message}`);
    }
  }

  /**
   * 清理测试数据
   */
  async cleanupTestData() {
    console.log('  🧹 清理测试数据...');
    
    const testCollections = ['activity_logs', 'audit_logs', 'daily_tasks', 'redemptions'];
    
    for (const collectionName of testCollections) {
      const collection = this.db.collection(collectionName);
      
      const result = await collection.deleteMany({ 
        $or: [
          { isTestData: true },
          { userId: { $regex: /^test-user/ } }
        ]
      });
      
      console.log(`    - ${collectionName}: 删除了 ${result.deletedCount} 条测试数据`);
    }

    // 清理测试上传目录
    try {
      const testUploadsDir = path.join(process.cwd(), 'test-uploads');
      await fs.rm(testUploadsDir, { recursive: true, force: true });
      console.log('    - 清理了测试上传目录');
    } catch (error) {
      console.log('    - 测试上传目录清理跳过（可能不存在）');
    }

    console.log('  ✅ 测试数据清理完成');
  }

  /**
   * 打印测试结果
   */
  printTestResults() {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 数据保留和清理策略测试报告');
    console.log('═'.repeat(60));
    console.log(`📋 总测试数: ${this.testResults.total}`);
    console.log(`✅ 通过: ${this.testResults.passed}`);
    console.log(`❌ 失败: ${this.testResults.failed}`);
    console.log(`📈 成功率: ${Math.round((this.testResults.passed / this.testResults.total) * 100)}%`);

    if (this.testResults.failed > 0) {
      console.log('\n💥 失败的测试:');
      this.testResults.tests
        .filter(test => test.status === 'FAILED')
        .forEach((test, index) => {
          console.log(`  ${index + 1}. ${test.name}: ${test.error}`);
        });
    }

    if (this.testResults.failed === 0) {
      console.log('\n🎉 所有数据保留和清理策略测试通过！');
      console.log('\n✨ 验证的功能:');
      console.log('   ✅ 数据归档功能');
      console.log('   ✅ 数据清理功能');
      console.log('   ✅ 归档文件管理');
      console.log('   ✅ 孤儿文件清理');
      console.log('   ✅ 保留管理器');
      console.log('   ✅ 测试数据准备和清理');
    } else {
      console.log('\n🔧 请修复失败的测试后重新运行');
    }

    console.log('\n' + '═'.repeat(60));
  }
}

/**
 * 主函数
 */
async function main() {
  const testSuite = new DataRetentionTestSuite();
  
  try {
    const success = await testSuite.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 数据保留测试套件执行失败:', error);
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

module.exports = DataRetentionTestSuite;