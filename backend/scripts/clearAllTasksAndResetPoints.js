/**
 * Database Cleanup Script: Clear All Tasks and Reset Points
 * 
 * This script performs a complete cleanup of task and points data:
 * 1. Clears all daily task instances (dailyTasks collection)
 * 2. Optionally clears task templates (tasks collection) 
 * 3. Resets all user points to zero
 * 4. Clears all points-related records (transactions, redemptions, game time)
 * 
 * WARNING: This is a destructive operation and cannot be undone!
 * Make sure to backup your data before running this script.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// Configuration options
const CONFIG = {
  // Whether to preserve basic task templates (recommended for system usability)
  preserveBasicTasks: true,
  
  // Whether to preserve user accounts (recommended - only clears task/points data)
  preserveUsers: true,
  
  // Whether to preserve system configurations (points rules, game time configs)
  preserveConfigs: true
};

// MongoDB connection setup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app';

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('✅ Connected to MongoDB');
  return client.db();
}

/**
 * Get statistics before cleanup for comparison
 */
async function getPreCleanupStats(db) {
  console.log('📊 Collecting pre-cleanup statistics...');
  
  const stats = {
    users: await db.collection('users').countDocuments(),
    tasks: await db.collection('tasks').countDocuments(),
    dailyTasks: await db.collection('dailyTasks').countDocuments(),
    redemptions: await db.collection('redemptions').countDocuments(),
    pointsTransactions: await db.collection('pointsTransactions').countDocuments(),
    gameTimeExchanges: await db.collection('gameTimeExchanges').countDocuments(),
    gameSessions: await db.collection('gameSessions').countDocuments(),
    userPointsLimits: await db.collection('userPointsLimits').countDocuments(),
    pointsRules: await db.collection('pointsRules').countDocuments(),
    gameTimeConfigs: await db.collection('gameTimeConfigs').countDocuments()
  };
  
  // Get total points across all users
  const userPointsAgg = await db.collection('users').aggregate([
    { $group: { _id: null, totalPoints: { $sum: "$points" } } }
  ]).toArray();
  
  stats.totalUserPoints = userPointsAgg.length > 0 ? userPointsAgg[0].totalPoints : 0;
  
  console.log('📊 Pre-cleanup statistics:');
  console.log(`   Users: ${stats.users}`);
  console.log(`   Task Templates: ${stats.tasks}`);
  console.log(`   Daily Task Instances: ${stats.dailyTasks}`);
  console.log(`   Total User Points: ${stats.totalUserPoints}`);
  console.log(`   Points Transactions: ${stats.pointsTransactions}`);
  console.log(`   Redemptions: ${stats.redemptions}`);
  console.log(`   Game Time Exchanges: ${stats.gameTimeExchanges}`);
  console.log(`   Game Sessions: ${stats.gameSessions}`);
  console.log(`   User Points Limits: ${stats.userPointsLimits}`);
  console.log(`   Points Rules: ${stats.pointsRules}`);
  console.log(`   Game Time Configs: ${stats.gameTimeConfigs}`);
  
  return stats;
}

/**
 * Clear all daily task instances
 */
async function clearDailyTasks(db) {
  console.log('🧹 Step 1: Clearing all daily task instances...');
  
  const result = await db.collection('dailyTasks').deleteMany({});
  console.log(`   ✅ Deleted ${result.deletedCount} daily task instances`);
  
  return result.deletedCount;
}

/**
 * Clear or preserve task templates based on configuration
 */
async function handleTaskTemplates(db) {
  console.log('📋 Step 2: Handling task templates...');
  
  if (CONFIG.preserveBasicTasks) {
    console.log('   ℹ️  Preserving task templates (preserveBasicTasks = true)');
    const taskCount = await db.collection('tasks').countDocuments();
    console.log(`   📌 ${taskCount} task templates will be preserved`);
    return 0;
  } else {
    console.log('   🧹 Clearing all task templates...');
    const result = await db.collection('tasks').deleteMany({});
    console.log(`   ✅ Deleted ${result.deletedCount} task templates`);
    return result.deletedCount;
  }
}

/**
 * Reset all user points to zero
 */
async function resetUserPoints(db) {
  console.log('🔄 Step 3: Resetting all user points to zero...');
  
  const result = await db.collection('users').updateMany(
    {},
    { 
      $set: { 
        points: 0,
        updatedAt: new Date()
      }
    }
  );
  
  console.log(`   ✅ Reset points for ${result.modifiedCount} users`);
  return result.modifiedCount;
}

/**
 * Clear all points-related records
 */
async function clearPointsRecords(db) {
  console.log('💰 Step 4: Clearing all points-related records...');
  
  const collections = [
    'pointsTransactions',
    'redemptions', 
    'gameTimeExchanges',
    'gameSessions',
    'userPointsLimits'
  ];
  
  let totalDeleted = 0;
  
  for (const collectionName of collections) {
    const result = await db.collection(collectionName).deleteMany({});
    console.log(`   ✅ Cleared ${result.deletedCount} records from ${collectionName}`);
    totalDeleted += result.deletedCount;
  }
  
  console.log(`   📊 Total points-related records cleared: ${totalDeleted}`);
  return totalDeleted;
}

/**
 * Verify cleanup results
 */
async function verifyCleanup(db, preStats) {
  console.log('🔍 Step 5: Verifying cleanup results...');
  
  const postStats = await getPostCleanupStats(db);
  
  console.log('📊 Post-cleanup statistics:');
  console.log(`   Users: ${postStats.users} (unchanged: ${postStats.users === preStats.users})`);
  console.log(`   Task Templates: ${postStats.tasks}`);
  console.log(`   Daily Task Instances: ${postStats.dailyTasks} (should be 0)`);
  console.log(`   Total User Points: ${postStats.totalUserPoints} (should be 0)`);
  console.log(`   Points Transactions: ${postStats.pointsTransactions} (should be 0)`);
  console.log(`   Redemptions: ${postStats.redemptions} (should be 0)`);
  console.log(`   Game Time Exchanges: ${postStats.gameTimeExchanges} (should be 0)`);
  console.log(`   Game Sessions: ${postStats.gameSessions} (should be 0)`);
  console.log(`   User Points Limits: ${postStats.userPointsLimits} (should be 0)`);
  
  // Verify critical cleanup targets
  const errors = [];
  if (postStats.dailyTasks > 0) errors.push('Daily tasks not fully cleared');
  if (postStats.totalUserPoints > 0) errors.push('User points not fully reset');
  if (postStats.pointsTransactions > 0) errors.push('Points transactions not fully cleared');
  if (postStats.redemptions > 0) errors.push('Redemptions not fully cleared');
  
  if (errors.length > 0) {
    console.log('❌ Verification failed:');
    errors.forEach(error => console.log(`   - ${error}`));
    return false;
  } else {
    console.log('✅ Verification passed: All cleanup targets achieved');
    return true;
  }
}

async function getPostCleanupStats(db) {
  const stats = {
    users: await db.collection('users').countDocuments(),
    tasks: await db.collection('tasks').countDocuments(),
    dailyTasks: await db.collection('dailyTasks').countDocuments(),
    redemptions: await db.collection('redemptions').countDocuments(),
    pointsTransactions: await db.collection('pointsTransactions').countDocuments(),
    gameTimeExchanges: await db.collection('gameTimeExchanges').countDocuments(),
    gameSessions: await db.collection('gameSessions').countDocuments(),
    userPointsLimits: await db.collection('userPointsLimits').countDocuments()
  };
  
  // Get total points across all users
  const userPointsAgg = await db.collection('users').aggregate([
    { $group: { _id: null, totalPoints: { $sum: "$points" } } }
  ]).toArray();
  
  stats.totalUserPoints = userPointsAgg.length > 0 ? userPointsAgg[0].totalPoints : 0;
  
  return stats;
}

/**
 * Main cleanup function
 */
async function clearAllTasksAndResetPoints() {
  try {
    console.log('🚨 DATABASE CLEANUP SCRIPT STARTING...');
    console.log('⚠️  WARNING: This will permanently delete all task and points data!');
    console.log('📋 Configuration:');
    console.log(`   Preserve Basic Tasks: ${CONFIG.preserveBasicTasks}`);
    console.log(`   Preserve Users: ${CONFIG.preserveUsers}`);
    console.log(`   Preserve Configs: ${CONFIG.preserveConfigs}`);
    console.log('');
    
    const db = await connectToDatabase();
    
    // Step 0: Get pre-cleanup statistics
    const preStats = await getPreCleanupStats(db);
    console.log('');
    
    // Step 1: Clear daily tasks
    await clearDailyTasks(db);
    console.log('');
    
    // Step 2: Handle task templates
    await handleTaskTemplates(db);
    console.log('');
    
    // Step 3: Reset user points
    await resetUserPoints(db);
    console.log('');
    
    // Step 4: Clear points records
    await clearPointsRecords(db);
    console.log('');
    
    // Step 5: Verify cleanup
    const verificationPassed = await verifyCleanup(db, preStats);
    console.log('');
    
    if (verificationPassed) {
      console.log('🎉 CLEANUP COMPLETED SUCCESSFULLY!');
      console.log('✅ All tasks cleared and points reset to zero');
      console.log('✅ System is ready for fresh data');
    } else {
      console.log('❌ CLEANUP COMPLETED WITH ERRORS');
      console.log('⚠️  Please check the verification results above');
    }
    
    console.log('');
    console.log('📝 Summary of changes:');
    console.log(`   - Daily tasks cleared: ${preStats.dailyTasks} → 0`);
    console.log(`   - User points reset: ${preStats.totalUserPoints} → 0`);
    console.log(`   - Points transactions cleared: ${preStats.pointsTransactions} → 0`);
    console.log(`   - Redemptions cleared: ${preStats.redemptions} → 0`);
    console.log(`   - Game records cleared: ${preStats.gameTimeExchanges + preStats.gameSessions} → 0`);
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  }
}

// Export for use as module
module.exports = { clearAllTasksAndResetPoints, CONFIG };

// Run directly if called as script
if (require.main === module) {
  clearAllTasksAndResetPoints()
    .then(() => {
      console.log('✨ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}