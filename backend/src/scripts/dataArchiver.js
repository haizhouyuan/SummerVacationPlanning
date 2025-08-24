#!/usr/bin/env node

/**
 * 数据归档脚本
 * 定期归档历史数据到外部存储
 */

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');
const { createGzip } = require('zlib');
const { pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

// 归档策略配置
const ARCHIVE_CONFIG = {
  // 数据分片大小（记录数）
  batchSize: 1000,
  
  // 压缩设置
  compression: {
    enabled: true,
    level: 6  // 1-9, 9为最高压缩率
  },
  
  // 归档格式
  format: 'json', // json, bson, csv
  
  // 存储设置
  storage: {
    local: {
      enabled: true,
      basePath: './data-archive'
    },
    cloud: {
      enabled: false, // 可扩展到云存储
      provider: 'oss', // oss, s3, gcs
      bucket: ''
    }
  }
};

// 归档集合配置
const ARCHIVE_COLLECTIONS = {
  activity_logs: {
    enabled: true,
    archiveAfterDays: 90,
    batchField: 'timestamp',
    preserveIndexes: ['userId', 'action', 'timestamp']
  },
  
  audit_logs: {
    enabled: true,
    archiveAfterDays: 180,
    batchField: 'timestamp',
    preserveIndexes: ['userId', 'operation', 'timestamp']
  },
  
  daily_tasks: {
    enabled: true,
    archiveAfterDays: 180,
    batchField: 'createdAt',
    condition: { status: 'completed' },
    preserveIndexes: ['userId', 'taskId', 'createdAt']
  },
  
  redemptions: {
    enabled: true,
    archiveAfterDays: 365,
    batchField: 'createdAt',
    condition: { status: { $in: ['approved', 'rejected'] } },
    preserveIndexes: ['userId', 'status', 'createdAt']
  }
};

class DataArchiver {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.concurrent = options.concurrent || 2;
    this.config = { ...ARCHIVE_CONFIG, ...options.config };
    
    this.stats = {
      collections: {},
      totalRecords: 0,
      totalArchived: 0,
      totalSize: 0,
      startTime: Date.now(),
      errors: []
    };
    
    // MongoDB连接
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    this.dbName = process.env.DB_NAME || 'summer_vacation_planning';
    this.client = null;
    this.db = null;
  }

  /**
   * 连接数据库
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
      throw new Error(`数据库连接失败: ${error.message}`);
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
   * 执行数据归档
   */
  async executeArchiving() {
    console.log('📦 开始执行数据归档任务...');
    console.log(`🔍 模式: ${this.dryRun ? '试运行（不会实际归档）' : '实际执行'}`);
    console.log('=' .repeat(60));

    await this.connect();

    try {
      // 创建归档目录
      await this.createArchiveDirectories();

      // 并发处理多个集合
      const archiveTasks = [];
      
      for (const [collectionName, config] of Object.entries(ARCHIVE_COLLECTIONS)) {
        if (config.enabled) {
          archiveTasks.push(this.archiveCollection(collectionName, config));
        }
      }

      // 控制并发数
      const results = await this.processConcurrently(archiveTasks, this.concurrent);
      
      // 生成归档清单和元数据
      if (!this.dryRun) {
        await this.generateArchiveManifest();
        await this.updateArchiveMetadata();
      }

    } finally {
      await this.disconnect();
    }

    this.printSummary();
    return this.stats;
  }

  /**
   * 创建归档目录结构
   */
  async createArchiveDirectories() {
    const baseDir = this.config.storage.local.basePath;
    const today = new Date().toISOString().split('T')[0];
    
    const dirs = [
      baseDir,
      path.join(baseDir, today),
      path.join(baseDir, today, 'data'),
      path.join(baseDir, today, 'metadata'),
      path.join(baseDir, 'manifests')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    this.archiveDate = today;
    this.archiveDataDir = path.join(baseDir, today, 'data');
    this.archiveMetaDir = path.join(baseDir, today, 'metadata');
  }

  /**
   * 控制并发执行任务
   */
  async processConcurrently(tasks, limit) {
    const results = [];
    
    for (let i = 0; i < tasks.length; i += limit) {
      const batch = tasks.slice(i, i + limit);
      const batchResults = await Promise.allSettled(batch);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * 归档单个集合
   */
  async archiveCollection(collectionName, config) {
    console.log(`\n📋 开始归档集合: ${collectionName}`);
    
    const collection = this.db.collection(collectionName);
    
    // 初始化统计
    this.stats.collections[collectionName] = {
      totalRecords: 0,
      archivedRecords: 0,
      archivedFiles: 0,
      archiveSize: 0,
      errors: []
    };

    try {
      // 构建查询条件
      const archiveDate = new Date();
      archiveDate.setDate(archiveDate.getDate() - config.archiveAfterDays);
      
      let query = {
        [config.batchField]: { $lt: archiveDate },
        archived: { $ne: true }
      };
      
      if (config.condition) {
        query = { ...query, ...config.condition };
      }

      // 计算需要归档的记录数
      const totalCount = await collection.countDocuments(query);
      this.stats.collections[collectionName].totalRecords = totalCount;
      
      if (totalCount === 0) {
        console.log(`  ✅ ${collectionName}: 没有需要归档的数据`);
        return;
      }

      console.log(`  📊 ${collectionName}: 找到 ${totalCount} 条需要归档的记录`);

      if (!this.dryRun) {
        // 分批处理归档
        let processed = 0;
        let fileIndex = 0;
        
        while (processed < totalCount) {
          const batch = await collection
            .find(query)
            .sort({ [config.batchField]: 1 })
            .limit(this.config.batchSize)
            .skip(processed)
            .toArray();

          if (batch.length === 0) break;

          // 归档当前批次
          const archiveInfo = await this.archiveBatch(
            collectionName, 
            batch, 
            fileIndex++
          );

          // 标记为已归档
          const batchIds = batch.map(doc => doc._id);
          await collection.updateMany(
            { _id: { $in: batchIds } },
            {
              $set: {
                archived: true,
                archivedAt: new Date(),
                archiveFile: archiveInfo.filename,
                archiveBatch: fileIndex - 1
              }
            }
          );

          processed += batch.length;
          this.stats.collections[collectionName].archivedRecords += batch.length;
          this.stats.collections[collectionName].archiveSize += archiveInfo.size;
          
          if (this.verbose) {
            console.log(`  📦 ${collectionName}: 归档批次 ${fileIndex} (${batch.length} 条记录)`);
          }
        }

        this.stats.collections[collectionName].archivedFiles = fileIndex;
        console.log(`  ✅ ${collectionName}: 归档完成 (${processed} 条记录, ${fileIndex} 个文件)`);
      }

    } catch (error) {
      const errorMsg = `归档集合 ${collectionName} 失败: ${error.message}`;
      console.error(`  ❌ ${errorMsg}`);
      this.stats.errors.push(errorMsg);
      this.stats.collections[collectionName].errors.push(errorMsg);
    }
  }

  /**
   * 归档数据批次
   */
  async archiveBatch(collectionName, batch, batchIndex) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${collectionName}_${this.archiveDate}_batch_${batchIndex.toString().padStart(3, '0')}.json`;
    
    let finalFilename = filename;
    if (this.config.compression.enabled) {
      finalFilename += '.gz';
    }

    const filePath = path.join(this.archiveDataDir, finalFilename);
    
    try {
      const data = JSON.stringify({
        metadata: {
          collection: collectionName,
          batchIndex,
          recordCount: batch.length,
          archiveDate: this.archiveDate,
          timestamp: new Date().toISOString()
        },
        data: batch
      }, null, 2);

      let size;
      
      if (this.config.compression.enabled) {
        // 压缩归档
        const compressed = await this.compressData(data);
        await fs.writeFile(filePath, compressed);
        size = compressed.length;
      } else {
        // 直接写入
        await fs.writeFile(filePath, data, 'utf8');
        size = Buffer.byteLength(data, 'utf8');
      }

      return {
        filename: finalFilename,
        size,
        recordCount: batch.length
      };

    } catch (error) {
      throw new Error(`写入归档文件失败 ${finalFilename}: ${error.message}`);
    }
  }

  /**
   * 压缩数据
   */
  async compressData(data) {
    return new Promise((resolve, reject) => {
      const gzip = createGzip({ level: this.config.compression.level });
      const chunks = [];
      
      gzip.on('data', chunk => chunks.push(chunk));
      gzip.on('end', () => resolve(Buffer.concat(chunks)));
      gzip.on('error', reject);
      
      gzip.write(data);
      gzip.end();
    });
  }

  /**
   * 生成归档清单
   */
  async generateArchiveManifest() {
    const manifestPath = path.join(
      this.config.storage.local.basePath,
      'manifests',
      `archive_manifest_${this.archiveDate}.json`
    );

    const manifest = {
      archiveDate: this.archiveDate,
      createdAt: new Date().toISOString(),
      totalCollections: Object.keys(this.stats.collections).length,
      totalRecords: this.stats.totalRecords,
      totalArchivedRecords: this.stats.totalArchived,
      totalSize: this.stats.totalSize,
      collections: this.stats.collections,
      config: {
        batchSize: this.config.batchSize,
        compression: this.config.compression,
        format: this.config.format
      }
    };

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    
    if (this.verbose) {
      console.log(`📋 归档清单已生成: ${manifestPath}`);
    }
  }

  /**
   * 更新归档元数据
   */
  async updateArchiveMetadata() {
    const metadataPath = path.join(
      this.config.storage.local.basePath,
      'archive_metadata.json'
    );

    let metadata = {
      archives: [],
      totalArchives: 0,
      totalRecordsArchived: 0,
      lastArchiveDate: null
    };

    // 读取现有元数据
    try {
      const existingData = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(existingData);
    } catch {
      // 文件不存在，使用默认值
    }

    // 更新元数据
    const archiveEntry = {
      date: this.archiveDate,
      collectionsArchived: Object.keys(this.stats.collections).length,
      recordsArchived: this.stats.totalArchived,
      totalSize: this.stats.totalSize,
      duration: Date.now() - this.stats.startTime,
      errors: this.stats.errors.length
    };

    metadata.archives.unshift(archiveEntry);
    metadata.archives = metadata.archives.slice(0, 100); // 保留最近100次归档记录
    metadata.totalArchives++;
    metadata.totalRecordsArchived += this.stats.totalArchived;
    metadata.lastArchiveDate = this.archiveDate;

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    
    if (this.verbose) {
      console.log(`📋 归档元数据已更新: ${metadataPath}`);
    }
  }

  /**
   * 打印归档摘要
   */
  printSummary() {
    // 计算总计
    this.stats.totalRecords = Object.values(this.stats.collections)
      .reduce((sum, stats) => sum + stats.totalRecords, 0);
    this.stats.totalArchived = Object.values(this.stats.collections)
      .reduce((sum, stats) => sum + stats.archivedRecords, 0);
    this.stats.totalSize = Object.values(this.stats.collections)
      .reduce((sum, stats) => sum + stats.archiveSize, 0);

    const duration = Date.now() - this.stats.startTime;

    console.log('\n' + '═'.repeat(60));
    console.log('📦 数据归档摘要报告');
    console.log('═'.repeat(60));
    console.log(`📊 处理集合: ${Object.keys(this.stats.collections).length}`);
    console.log(`📋 总记录数: ${this.stats.totalRecords.toLocaleString()}`);
    console.log(`📦 归档记录: ${this.stats.totalArchived.toLocaleString()}`);
    console.log(`💾 归档大小: ${(this.stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`⏱️  执行时间: ${(duration / 1000).toFixed(1)} 秒`);
    console.log(`❌ 错误数量: ${this.stats.errors.length}`);

    if (Object.keys(this.stats.collections).length > 0) {
      console.log('\n📋 各集合归档详情:');
      for (const [collection, stats] of Object.entries(this.stats.collections)) {
        console.log(`  ${collection}:`);
        console.log(`    📊 总记录: ${stats.totalRecords}`);
        console.log(`    📦 已归档: ${stats.archivedRecords}`);
        console.log(`    📁 文件数: ${stats.archivedFiles}`);
        console.log(`    💾 大小: ${(stats.archiveSize / 1024 / 1024).toFixed(2)} MB`);
        
        if (stats.errors.length > 0) {
          console.log(`    ❌ 错误: ${stats.errors.length}`);
        }
      }
    }

    if (this.stats.errors.length > 0) {
      console.log('\n❌ 错误详情:');
      this.stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (this.dryRun) {
      console.log('\n⚠️  这是试运行结果，没有实际归档数据');
      console.log('💡 要执行实际归档，请运行: node dataArchiver.js --execute');
    } else {
      console.log('\n✅ 数据归档任务执行完成');
      console.log(`📁 归档数据保存在: ${path.join(this.config.storage.local.basePath, this.archiveDate)}`);
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
    concurrent: parseInt(args.find(arg => arg.startsWith('--concurrent='))?.split('=')[1] || '2')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
数据归档脚本

用法:
  node dataArchiver.js [选项]

选项:
  --execute              实际执行归档（默认为试运行模式）
  --verbose, -v          详细输出模式
  --concurrent=<num>     并发处理集合数量（默认: 2）
  --help, -h            显示此帮助信息

归档策略:
  - activity_logs: 90天后归档
  - audit_logs: 180天后归档  
  - daily_tasks: 180天后归档已完成任务
  - redemptions: 365天后归档已完成兑换

环境变量:
  MONGODB_URI    MongoDB连接字符串
  DB_NAME       数据库名称
`);
    return;
  }

  const archiver = new DataArchiver(options);
  
  try {
    await archiver.executeArchiving();
    console.log('🎉 数据归档任务执行完成');
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

module.exports = DataArchiver;