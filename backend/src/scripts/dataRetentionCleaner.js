#!/usr/bin/env node

/**
 * 数据保留和清理策略脚本
 * 实现历史数据归档和清理机制
 */

const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs').promises;

// 数据保留策略配置
const RETENTION_POLICIES = {
  // 活动日志保留策略（天数）
  activity_logs: {
    archive_after: 90,    // 90天后归档
    delete_after: 365     // 365天后删除
  },
  
  // 审计日志保留策略
  audit_logs: {
    archive_after: 180,   // 180天后归档
    delete_after: 1095    // 3年后删除（合规要求）
  },
  
  // 每日任务保留策略
  daily_tasks: {
    archive_after: 180,   // 180天后归档已完成的任务
    delete_after: 730     // 2年后删除已归档任务
  },
  
  // 积分兑换记录保留策略
  redemptions: {
    archive_after: 365,   // 1年后归档已完成的兑换
    delete_after: 1825    // 5年后删除（会计要求）
  },
  
  // 用户会话和临时数据
  sessions: {
    delete_after: 30      // 30天后删除过期会话
  },
  
  // 上传文件清理策略
  uploaded_files: {
    orphaned_after: 7,    // 7天后清理孤儿文件
    archive_after: 365    // 1年后归档文件
  }
};

class DataRetentionCleaner {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.archiveDir = options.archiveDir || path.join(process.cwd(), 'data-archive');
    this.stats = {
      totalProcessed: 0,
      archived: 0,
      deleted: 0,
      errors: 0,
      collections: {}
    };
    
    // MongoDB连接配置
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    this.dbName = process.env.DB_NAME || 'summer_vacation_planning';
    this.client = null;
    this.db = null;
  }

  /**
   * 连接MongoDB数据库
   */
  async connect() {
    try {
      this.client = new MongoClient(this.mongoUri);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      
      if (this.verbose) {
        console.log(`✅ 已连接到数据库: ${this.dbName}`);
      }
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      throw error;
    }
  }

  /**
   * 断开数据库连接
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
      if (this.verbose) {
        console.log('✅ 数据库连接已关闭');
      }
    }
  }

  /**
   * 创建归档目录
   */
  async createArchiveDirectory() {
    try {
      await fs.mkdir(this.archiveDir, { recursive: true });
      
      // 创建按日期分组的子目录
      const today = new Date().toISOString().split('T')[0];
      const todayArchiveDir = path.join(this.archiveDir, today);
      await fs.mkdir(todayArchiveDir, { recursive: true });
      
      return todayArchiveDir;
    } catch (error) {
      console.error('❌ 创建归档目录失败:', error.message);
      throw error;
    }
  }

  /**
   * 执行数据保留和清理
   */
  async executeRetentionPolicy() {
    console.log('🧹 开始执行数据保留和清理策略...');
    console.log(`🔍 模式: ${this.dryRun ? '试运行（不会实际删除数据）' : '实际执行'}`);
    console.log('=' .repeat(60));

    await this.connect();
    const archiveDir = await this.createArchiveDirectory();

    try {
      // 处理各个集合的数据保留策略
      for (const [collection, policy] of Object.entries(RETENTION_POLICIES)) {
        await this.processCollection(collection, policy, archiveDir);
      }

      // 清理孤儿文件
      await this.cleanOrphanedFiles();

      // 优化数据库
      if (!this.dryRun) {
        await this.optimizeDatabase();
      }

    } finally {
      await this.disconnect();
    }

    this.printSummary();
    return this.stats;
  }

  /**
   * 处理单个集合的保留策略
   */
  async processCollection(collectionName, policy, archiveDir) {
    if (this.verbose) {
      console.log(`\n📋 处理集合: ${collectionName}`);
    }

    const collection = this.db.collection(collectionName);
    
    // 检查集合是否存在
    const collections = await this.db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
      if (this.verbose) {
        console.log(`  ⚠️  集合 ${collectionName} 不存在，跳过`);
      }
      return;
    }

    this.stats.collections[collectionName] = {
      archived: 0,
      deleted: 0,
      errors: 0
    };

    try {
      // 归档过期数据
      if (policy.archive_after) {
        await this.archiveData(collection, collectionName, policy.archive_after, archiveDir);
      }

      // 删除过期数据
      if (policy.delete_after) {
        await this.deleteExpiredData(collection, collectionName, policy.delete_after);
      }

    } catch (error) {
      console.error(`❌ 处理集合 ${collectionName} 时出错:`, error.message);
      this.stats.errors++;
      this.stats.collections[collectionName].errors++;
    }
  }

  /**
   * 归档过期数据
   */
  async archiveData(collection, collectionName, archiveDays, archiveDir) {
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - archiveDays);

    // 根据不同集合构建查询条件
    let query = {};
    switch (collectionName) {
      case 'activity_logs':
      case 'audit_logs':
        query = { 
          timestamp: { $lt: archiveDate },
          archived: { $ne: true }
        };
        break;
      case 'daily_tasks':
        query = { 
          createdAt: { $lt: archiveDate },
          status: 'completed',
          archived: { $ne: true }
        };
        break;
      case 'redemptions':
        query = { 
          createdAt: { $lt: archiveDate },
          status: { $in: ['approved', 'rejected'] },
          archived: { $ne: true }
        };
        break;
      default:
        query = { 
          createdAt: { $lt: archiveDate },
          archived: { $ne: true }
        };
    }

    // 查找需要归档的文档
    const documentsToArchive = await collection.find(query).toArray();
    
    if (documentsToArchive.length === 0) {
      if (this.verbose) {
        console.log(`  📦 ${collectionName}: 没有需要归档的数据`);
      }
      return;
    }

    console.log(`  📦 ${collectionName}: 找到 ${documentsToArchive.length} 条需要归档的记录`);

    if (!this.dryRun) {
      // 保存归档数据到文件
      const archiveFileName = `${collectionName}_${new Date().toISOString().split('T')[0]}.json`;
      const archiveFilePath = path.join(archiveDir, archiveFileName);
      
      await fs.writeFile(
        archiveFilePath, 
        JSON.stringify(documentsToArchive, null, 2), 
        'utf8'
      );

      // 标记文档为已归档
      const documentIds = documentsToArchive.map(doc => doc._id);
      await collection.updateMany(
        { _id: { $in: documentIds } },
        { 
          $set: { 
            archived: true, 
            archivedAt: new Date(),
            archiveFile: archiveFileName
          } 
        }
      );

      console.log(`  ✅ ${collectionName}: ${documentsToArchive.length} 条记录已归档到 ${archiveFileName}`);
    }

    this.stats.archived += documentsToArchive.length;
    this.stats.collections[collectionName].archived = documentsToArchive.length;
    this.stats.totalProcessed += documentsToArchive.length;
  }

  /**
   * 删除过期数据
   */
  async deleteExpiredData(collection, collectionName, deleteDays) {
    const deleteDate = new Date();
    deleteDate.setDate(deleteDate.getDate() - deleteDays);

    let query = {};
    switch (collectionName) {
      case 'activity_logs':
      case 'audit_logs':
        // 只删除已归档的数据
        query = { 
          timestamp: { $lt: deleteDate },
          archived: true
        };
        break;
      case 'daily_tasks':
        query = { 
          createdAt: { $lt: deleteDate },
          archived: true
        };
        break;
      case 'redemptions':
        query = { 
          createdAt: { $lt: deleteDate },
          archived: true
        };
        break;
      case 'sessions':
        // 直接删除过期会话
        query = { 
          expiresAt: { $lt: new Date() }
        };
        break;
      default:
        query = { 
          createdAt: { $lt: deleteDate },
          archived: true
        };
    }

    // 计算要删除的文档数量
    const deleteCount = await collection.countDocuments(query);
    
    if (deleteCount === 0) {
      if (this.verbose) {
        console.log(`  🗑️  ${collectionName}: 没有需要删除的数据`);
      }
      return;
    }

    console.log(`  🗑️  ${collectionName}: 找到 ${deleteCount} 条需要删除的记录`);

    if (!this.dryRun) {
      const result = await collection.deleteMany(query);
      console.log(`  ✅ ${collectionName}: 已删除 ${result.deletedCount} 条记录`);
    }

    this.stats.deleted += deleteCount;
    this.stats.collections[collectionName].deleted = deleteCount;
    this.stats.totalProcessed += deleteCount;
  }

  /**
   * 清理孤儿文件
   */
  async cleanOrphanedFiles() {
    console.log('\n📎 检查和清理孤儿文件...');

    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      // 检查uploads目录是否存在
      try {
        await fs.access(uploadsDir);
      } catch {
        if (this.verbose) {
          console.log('  ⚠️  uploads目录不存在，跳过孤儿文件清理');
        }
        return;
      }

      // 获取所有上传文件的引用
      const dailyTasks = await this.db.collection('daily_tasks').find({
        evidenceFiles: { $exists: true, $ne: [] }
      }).toArray();

      const referencedFiles = new Set();
      dailyTasks.forEach(task => {
        if (task.evidenceFiles && Array.isArray(task.evidenceFiles)) {
          task.evidenceFiles.forEach(file => {
            if (file.filename) {
              referencedFiles.add(file.filename);
            }
          });
        }
      });

      // 扫描实际文件
      const orphanedFiles = [];
      const scanDirectory = async (dir) => {
        const items = await fs.readdir(dir, { withFileTypes: true });
        
        for (const item of items) {
          const itemPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            await scanDirectory(itemPath);
          } else {
            const relativePath = path.relative(uploadsDir, itemPath);
            if (!referencedFiles.has(relativePath)) {
              const stats = await fs.stat(itemPath);
              const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
              
              if (ageInDays > RETENTION_POLICIES.uploaded_files.orphaned_after) {
                orphanedFiles.push({
                  path: itemPath,
                  relativePath,
                  ageInDays: Math.floor(ageInDays),
                  size: stats.size
                });
              }
            }
          }
        }
      };

      await scanDirectory(uploadsDir);

      if (orphanedFiles.length === 0) {
        console.log('  ✅ 没有发现孤儿文件');
        return;
      }

      console.log(`  🗑️  发现 ${orphanedFiles.length} 个孤儿文件`);

      if (!this.dryRun) {
        let deletedCount = 0;
        let deletedSize = 0;

        for (const file of orphanedFiles) {
          try {
            await fs.unlink(file.path);
            deletedCount++;
            deletedSize += file.size;
            
            if (this.verbose) {
              console.log(`    - 删除: ${file.relativePath} (${(file.size / 1024).toFixed(1)}KB, ${file.ageInDays}天前)`);
            }
          } catch (error) {
            console.error(`    ❌ 删除文件失败 ${file.relativePath}:`, error.message);
            this.stats.errors++;
          }
        }

        console.log(`  ✅ 清理完成: ${deletedCount} 个文件 (${(deletedSize / 1024 / 1024).toFixed(1)}MB)`);
      } else {
        const totalSize = orphanedFiles.reduce((sum, file) => sum + file.size, 0);
        console.log(`  📋 试运行: 将清理 ${orphanedFiles.length} 个文件 (${(totalSize / 1024 / 1024).toFixed(1)}MB)`);
      }

    } catch (error) {
      console.error('❌ 清理孤儿文件时出错:', error.message);
      this.stats.errors++;
    }
  }

  /**
   * 优化数据库
   */
  async optimizeDatabase() {
    console.log('\n⚡ 优化数据库...');

    try {
      // 重建索引
      const collections = await this.db.listCollections().toArray();
      
      for (const collInfo of collections) {
        const collection = this.db.collection(collInfo.name);
        
        try {
          await collection.reIndex();
          if (this.verbose) {
            console.log(`  ✅ 重建索引: ${collInfo.name}`);
          }
        } catch (error) {
          console.error(`  ❌ 重建索引失败 ${collInfo.name}:`, error.message);
        }
      }

      // 收集统计信息
      await this.db.command({ compact: 1 });
      
      console.log('  ✅ 数据库优化完成');

    } catch (error) {
      console.error('❌ 数据库优化时出错:', error.message);
      this.stats.errors++;
    }
  }

  /**
   * 打印清理摘要
   */
  printSummary() {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 数据保留和清理摘要报告');
    console.log('═'.repeat(60));
    console.log(`📋 总处理记录: ${this.stats.totalProcessed}`);
    console.log(`📦 归档记录: ${this.stats.archived}`);
    console.log(`🗑️  删除记录: ${this.stats.deleted}`);
    console.log(`❌ 错误数量: ${this.stats.errors}`);

    if (Object.keys(this.stats.collections).length > 0) {
      console.log('\n📋 各集合处理详情:');
      for (const [collection, stats] of Object.entries(this.stats.collections)) {
        console.log(`  ${collection}:`);
        console.log(`    📦 归档: ${stats.archived}`);
        console.log(`    🗑️  删除: ${stats.deleted}`);
        console.log(`    ❌ 错误: ${stats.errors}`);
      }
    }

    if (this.dryRun) {
      console.log('\n⚠️  这是试运行结果，没有实际修改数据');
      console.log('💡 要执行实际清理，请运行: node dataRetentionCleaner.js --execute');
    } else {
      console.log('\n✅ 数据保留和清理策略执行完成');
      console.log(`📁 归档数据保存在: ${this.archiveDir}`);
    }

    console.log('\n' + '═'.repeat(60));
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    dryRun: !args.includes('--execute'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    archiveDir: args.find(arg => arg.startsWith('--archive-dir='))?.split('=')[1]
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
数据保留和清理策略脚本

用法:
  node dataRetentionCleaner.js [选项]

选项:
  --execute              实际执行清理（默认为试运行模式）
  --verbose, -v          详细输出模式
  --archive-dir=<path>   指定归档目录路径
  --help, -h            显示此帮助信息

数据保留策略:
  - activity_logs: 90天后归档，365天后删除
  - audit_logs: 180天后归档，3年后删除
  - daily_tasks: 180天后归档已完成任务，2年后删除
  - redemptions: 1年后归档已完成兑换，5年后删除
  - sessions: 30天后删除过期会话
  - 孤儿文件: 7天后清理无引用文件

环境变量:
  MONGODB_URI    MongoDB连接字符串
  DB_NAME       数据库名称
`);
    return;
  }

  const cleaner = new DataRetentionCleaner(options);
  
  try {
    await cleaner.executeRetentionPolicy();
    console.log('🎉 数据保留和清理策略执行完成');
    process.exit(0);
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

module.exports = DataRetentionCleaner;