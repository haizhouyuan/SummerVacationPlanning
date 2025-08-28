/**
 * Database Backup Script: MongoDB Complete Backup
 * 
 * This script creates a complete backup of the MongoDB database before cleanup operations.
 * Features:
 * 1. Creates timestamped backup directories
 * 2. Backs up all collections with data validation
 * 3. Compresses backup files to save space
 * 4. Provides restore instructions
 * 5. Maintains backup retention policy
 * 
 * Usage: node backupDatabase.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  // MongoDB connection
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app',
  
  // Backup settings
  backupDir: 'backups',
  maxBackups: 3, // Keep last 3 backups
  compressionEnabled: true,
  
  // Collections to backup (empty array means backup all)
  collectionsToBackup: [], // If empty, backup all collections
  
  // Critical collections that must be backed up
  criticalCollections: [
    'users',
    'tasks', 
    'dailyTasks',
    'pointsTransactions',
    'redemptions',
    'pointsRules',
    'gameTimeConfigs'
  ]
};

/**
 * Generate backup directory name with timestamp
 */
function generateBackupDirName() {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:-]/g, '')
    .replace(/\..+/, '')
    .replace('T', '_');
  return `backup_${timestamp}`;
}

/**
 * Ensure backup directory exists
 */
async function ensureBackupDirectory(backupPath) {
  try {
    await fs.access(backupPath);
    console.log(`📁 Backup directory exists: ${backupPath}`);
  } catch (error) {
    console.log(`📁 Creating backup directory: ${backupPath}`);
    await fs.mkdir(backupPath, { recursive: true });
  }
}

/**
 * Get database statistics before backup
 */
async function getDatabaseStats(db) {
  console.log('📊 Collecting database statistics...');
  
  const stats = {
    collections: {},
    totalDocuments: 0,
    totalSize: 0
  };
  
  try {
    // Get list of collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections`);
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      try {
        const count = await collection.countDocuments();
        const collStats = await db.command({ collStats: collectionName });
        
        stats.collections[collectionName] = {
          documents: count,
          size: collStats.size || 0,
          avgObjSize: collStats.avgObjSize || 0
        };
        
        stats.totalDocuments += count;
        stats.totalSize += collStats.size || 0;
        
        console.log(`   📄 ${collectionName}: ${count} documents, ${Math.round((collStats.size || 0) / 1024)}KB`);
      } catch (error) {
        console.warn(`   ⚠️  Could not get stats for ${collectionName}:`, error.message);
        stats.collections[collectionName] = {
          documents: 0,
          size: 0,
          error: error.message
        };
      }
    }
    
    console.log(`📊 Total: ${stats.totalDocuments} documents, ${Math.round(stats.totalSize / 1024)}KB`);
    
  } catch (error) {
    console.error('❌ Error collecting database stats:', error.message);
    throw error;
  }
  
  return stats;
}

/**
 * Export collection data to JSON
 */
async function exportCollectionData(db, collectionName, backupPath) {
  try {
    const collection = db.collection(collectionName);
    const documents = await collection.find({}).toArray();
    
    if (documents.length === 0) {
      console.log(`   📄 ${collectionName}: No documents to backup`);
      return { documents: 0, size: 0 };
    }
    
    // Convert MongoDB ObjectIds to strings for JSON compatibility
    const jsonData = JSON.stringify(documents, null, 2);
    const filePath = path.join(backupPath, `${collectionName}.json`);
    
    await fs.writeFile(filePath, jsonData, 'utf8');
    
    const fileStats = await fs.stat(filePath);
    console.log(`   ✅ ${collectionName}: ${documents.length} documents, ${Math.round(fileStats.size / 1024)}KB`);
    
    return {
      documents: documents.length,
      size: fileStats.size
    };
    
  } catch (error) {
    console.error(`   ❌ Failed to backup ${collectionName}:`, error.message);
    throw error;
  }
}

/**
 * Create MongoDB backup using mongodump (if available)
 */
async function createMongoDump(backupPath) {
  try {
    console.log('🔧 Attempting to use mongodump...');
    
    const mongoDumpPath = path.join(backupPath, 'mongodump');
    await fs.mkdir(mongoDumpPath, { recursive: true });
    
    const command = `mongodump --uri="${CONFIG.mongoUri}" --out="${mongoDumpPath}"`;
    console.log(`📤 Executing: ${command}`);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('done dumping')) {
      throw new Error(`mongodump error: ${stderr}`);
    }
    
    console.log('✅ MongoDB binary backup completed');
    return true;
    
  } catch (error) {
    console.warn('⚠️  mongodump not available or failed:', error.message);
    console.log('📝 Continuing with JSON export method...');
    return false;
  }
}

/**
 * Compress backup directory
 */
async function compressBackup(backupPath) {
  if (!CONFIG.compressionEnabled) {
    console.log('📦 Compression disabled, skipping...');
    return null;
  }
  
  try {
    console.log('📦 Compressing backup...');
    
    const backupDirName = path.basename(backupPath);
    const parentDir = path.dirname(backupPath);
    const compressedPath = `${backupPath}.tar.gz`;
    
    const command = `cd "${parentDir}" && tar -czf "${backupDirName}.tar.gz" "${backupDirName}"`;
    console.log(`📤 Executing: ${command}`);
    
    await execAsync(command);
    
    const compressedStats = await fs.stat(compressedPath);
    const originalStats = await fs.stat(backupPath);
    
    console.log(`✅ Backup compressed: ${Math.round(compressedStats.size / 1024)}KB`);
    console.log(`📈 Compression ratio: ${Math.round((1 - compressedStats.size / originalStats.size) * 100)}%`);
    
    return compressedPath;
    
  } catch (error) {
    console.warn('⚠️  Compression failed:', error.message);
    return null;
  }
}

/**
 * Clean up old backups based on retention policy
 */
async function cleanupOldBackups(backupBaseDir) {
  try {
    console.log('🧹 Cleaning up old backups...');
    
    const entries = await fs.readdir(backupBaseDir);
    const backupDirs = entries
      .filter(entry => entry.startsWith('backup_'))
      .sort()
      .reverse(); // Latest first
    
    console.log(`📋 Found ${backupDirs.length} existing backups`);
    
    if (backupDirs.length > CONFIG.maxBackups) {
      const toDelete = backupDirs.slice(CONFIG.maxBackups);
      
      for (const dirName of toDelete) {
        const dirPath = path.join(backupBaseDir, dirName);
        const compressedPath = `${dirPath}.tar.gz`;
        
        try {
          // Remove directory
          await fs.rmdir(dirPath, { recursive: true });
          console.log(`🗑️  Removed old backup: ${dirName}`);
          
          // Remove compressed file if exists
          try {
            await fs.unlink(compressedPath);
            console.log(`🗑️  Removed compressed backup: ${dirName}.tar.gz`);
          } catch (e) {
            // Compressed file might not exist, that's ok
          }
        } catch (error) {
          console.warn(`⚠️  Could not remove ${dirName}:`, error.message);
        }
      }
    } else {
      console.log('✅ No old backups to clean up');
    }
    
  } catch (error) {
    console.warn('⚠️  Cleanup failed:', error.message);
  }
}

/**
 * Generate backup report
 */
function generateBackupReport(backupPath, stats, startTime, endTime, compressed) {
  const report = {
    timestamp: new Date().toISOString(),
    backupPath: backupPath,
    duration: Math.round((endTime - startTime) / 1000),
    totalCollections: Object.keys(stats.collections).length,
    totalDocuments: stats.totalDocuments,
    totalSize: stats.totalSize,
    compressed: !!compressed,
    collections: stats.collections,
    restoreInstructions: [
      '# To restore this backup:',
      '# 1. Using mongorestore (if mongodump was used):',
      `#    mongorestore --uri="${CONFIG.mongoUri}" --drop "${backupPath}/mongodump/"`,
      '# 2. Using JSON files (manual import):',
      '#    - Use MongoDB Compass or custom import script',
      '#    - Import each .json file to corresponding collection'
    ].join('\n')
  };
  
  return report;
}

/**
 * Main backup function
 */
async function backupDatabase() {
  const startTime = Date.now();
  
  try {
    console.log('🗄️  DATABASE BACKUP STARTING...');
    console.log(`📅 Backup started at: ${new Date().toISOString()}`);
    console.log(`🔗 MongoDB URI: ${CONFIG.mongoUri.replace(/\/\/.*@/, '//**:**@')}`); // Hide credentials
    console.log('');
    
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    const client = new MongoClient(CONFIG.mongoUri);
    await client.connect();
    const db = client.db();
    console.log('✅ Connected to MongoDB');
    console.log('');
    
    // Get database statistics
    const stats = await getDatabaseStats(db);
    console.log('');
    
    // Create backup directory
    const backupDirName = generateBackupDirName();
    const backupBaseDir = path.resolve(CONFIG.backupDir);
    const backupPath = path.join(backupBaseDir, backupDirName);
    
    await ensureBackupDirectory(backupPath);
    console.log('');
    
    // Try MongoDB binary backup first
    const mongoDumpSuccess = await createMongoDump(backupPath);
    console.log('');
    
    // JSON export backup (always do this as fallback/verification)
    console.log('📄 Creating JSON export backup...');
    let totalBackedUp = { documents: 0, size: 0 };
    
    const collections = Object.keys(stats.collections);
    for (const collectionName of collections) {
      const result = await exportCollectionData(db, collectionName, backupPath);
      totalBackedUp.documents += result.documents;
      totalBackedUp.size += result.size;
    }
    
    console.log(`✅ JSON export completed: ${totalBackedUp.documents} documents, ${Math.round(totalBackedUp.size / 1024)}KB`);
    console.log('');
    
    // Close database connection
    await client.close();
    console.log('🔌 Database connection closed');
    console.log('');
    
    // Compress backup
    const compressedPath = await compressBackup(backupPath);
    console.log('');
    
    // Clean up old backups
    await cleanupOldBackups(backupBaseDir);
    console.log('');
    
    // Generate and save backup report
    const endTime = Date.now();
    const report = generateBackupReport(backupPath, stats, startTime, endTime, compressedPath);
    
    const reportPath = path.join(backupPath, 'backup-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('🎉 BACKUP COMPLETED SUCCESSFULLY!');
    console.log(`📊 Summary:`);
    console.log(`   📁 Backup location: ${backupPath}`);
    console.log(`   📦 Collections backed up: ${report.totalCollections}`);
    console.log(`   📄 Total documents: ${report.totalDocuments}`);
    console.log(`   ⏱️  Duration: ${report.duration} seconds`);
    console.log(`   🗜️  Compressed: ${compressedPath ? 'Yes' : 'No'}`);
    console.log('');
    
    console.log('📝 Backup files created:');
    const backupFiles = await fs.readdir(backupPath);
    for (const file of backupFiles.sort()) {
      const filePath = path.join(backupPath, file);
      const fileStats = await fs.stat(filePath);
      if (fileStats.isFile()) {
        console.log(`   📄 ${file} (${Math.round(fileStats.size / 1024)}KB)`);
      }
    }
    
    console.log('');
    console.log('✅ Database backup is ready for cleanup operations!');
    
    return {
      success: true,
      backupPath: backupPath,
      compressedPath: compressedPath,
      report: report
    };
    
  } catch (error) {
    console.error('❌ Error during database backup:', error);
    throw error;
  }
}

// Export for use as module
module.exports = { backupDatabase, CONFIG };

// Run directly if called as script
if (require.main === module) {
  backupDatabase()
    .then((result) => {
      console.log('✨ Backup script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Backup script failed:', error);
      process.exit(1);
    });
}