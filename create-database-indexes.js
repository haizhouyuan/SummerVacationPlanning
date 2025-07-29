const { MongoClient } = require('mongodb');

// Database indexing script for performance optimization
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/summer_vacation_planning';

async function createOptimizedIndexes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db();
    
    console.log('📊 Creating optimized database indexes...\n');
    
    // ======================
    // USERS COLLECTION
    // ======================
    console.log('👤 Creating indexes for users collection...');
    
    // Primary lookup by email (login)
    await db.collection('users').createIndex(
      { email: 1 }, 
      { unique: true, name: 'idx_users_email_unique' }
    );
    console.log('  ✅ Created unique index on email');
    
    // Role-based queries
    await db.collection('users').createIndex(
      { role: 1 }, 
      { name: 'idx_users_role' }
    );
    console.log('  ✅ Created index on role');
    
    // Parent-child relationship queries
    await db.collection('users').createIndex(
      { parentId: 1 }, 
      { name: 'idx_users_parent_id', sparse: true }
    );
    console.log('  ✅ Created index on parentId');
    
    // Points leaderboard queries
    await db.collection('users').createIndex(
      { points: -1, role: 1 }, 
      { name: 'idx_users_points_role_desc' }
    );
    console.log('  ✅ Created compound index on points (desc) + role');
    
    // ======================
    // TASKS COLLECTION
    // ======================
    console.log('\n📋 Creating indexes for tasks collection...');
    
    // Public task queries
    await db.collection('tasks').createIndex(
      { isPublic: 1, category: 1 }, 
      { name: 'idx_tasks_public_category' }
    );
    console.log('  ✅ Created compound index on isPublic + category');
    
    // Difficulty-based filtering
    await db.collection('tasks').createIndex(
      { difficulty: 1, points: 1 }, 
      { name: 'idx_tasks_difficulty_points' }
    );
    console.log('  ✅ Created compound index on difficulty + points');
    
    // Task recommendation queries
    await db.collection('tasks').createIndex(
      { category: 1, difficulty: 1, isPublic: 1 }, 
      { name: 'idx_tasks_recommendation' }
    );
    console.log('  ✅ Created compound index for task recommendations');
    
    // Created by user queries
    await db.collection('tasks').createIndex(
      { createdBy: 1, createdAt: -1 }, 
      { name: 'idx_tasks_created_by_date' }
    );
    console.log('  ✅ Created compound index on createdBy + createdAt');
    
    // ======================
    // DAILY_TASKS COLLECTION
    // ======================
    console.log('\n📅 Creating indexes for daily_tasks collection...');
    
    // Most critical: user + date queries (dashboard, today's tasks)
    await db.collection('daily_tasks').createIndex(
      { userId: 1, date: -1 }, 
      { name: 'idx_daily_tasks_user_date' }
    );
    console.log('  ✅ Created compound index on userId + date (desc)');
    
    // Status-based filtering (pending approval, completed, etc.)
    await db.collection('daily_tasks').createIndex(
      { userId: 1, status: 1 }, 
      { name: 'idx_daily_tasks_user_status' }
    );
    console.log('  ✅ Created compound index on userId + status');
    
    // Parent approval workflow queries
    await db.collection('daily_tasks').createIndex(
      { status: 1, userId: 1, completedAt: -1 }, 
      { name: 'idx_daily_tasks_status_user_completed' }
    );
    console.log('  ✅ Created compound index for approval workflow');
    
    // Task performance analytics
    await db.collection('daily_tasks').createIndex(
      { taskId: 1, status: 1, completedAt: -1 }, 
      { name: 'idx_daily_tasks_task_performance' }
    );
    console.log('  ✅ Created compound index for task analytics');
    
    // Date range queries (weekly/monthly stats)
    await db.collection('daily_tasks').createIndex(
      { userId: 1, date: -1, status: 1 }, 
      { name: 'idx_daily_tasks_user_date_status' }
    );
    console.log('  ✅ Created compound index for date range queries');
    
    // Completion tracking for recommendations
    await db.collection('daily_tasks').createIndex(
      { userId: 1, completedAt: -1, pointsEarned: 1 }, 
      { name: 'idx_daily_tasks_user_completion_points' }
    );
    console.log('  ✅ Created compound index for recommendation algorithm');
    
    // ======================
    // REDEMPTIONS COLLECTION
    // ======================
    console.log('\n🎁 Creating indexes for redemptions collection...');
    
    // User redemption history
    await db.collection('redemptions').createIndex(
      { userId: 1, requestedAt: -1 }, 
      { name: 'idx_redemptions_user_date' }
    );
    console.log('  ✅ Created compound index on userId + requestedAt');
    
    // Status-based queries (pending approvals)
    await db.collection('redemptions').createIndex(
      { status: 1, requestedAt: -1 }, 
      { name: 'idx_redemptions_status_date' }
    );
    console.log('  ✅ Created compound index on status + requestedAt');
    
    // Parent approval workflow
    await db.collection('redemptions').createIndex(
      { status: 1, userId: 1, pointsCost: -1 }, 
      { name: 'idx_redemptions_approval_workflow' }
    );
    console.log('  ✅ Created compound index for approval workflow');
    
    // ======================
    // GAME_TIME_EXCHANGES COLLECTION
    // ======================
    console.log('\n🎮 Creating indexes for game_time_exchanges collection...');
    
    // Daily game time tracking
    await db.collection('game_time_exchanges').createIndex(
      { userId: 1, date: -1 }, 
      { name: 'idx_game_time_user_date' }
    );
    console.log('  ✅ Created compound index on userId + date');
    
    // Game type analytics
    await db.collection('game_time_exchanges').createIndex(
      { userId: 1, gameType: 1, createdAt: -1 }, 
      { name: 'idx_game_time_user_type_date' }
    );
    console.log('  ✅ Created compound index on userId + gameType + createdAt');
    
    // ======================
    // GAME_SESSIONS COLLECTION (if exists)
    // ======================
    console.log('\n🕹️ Creating indexes for game_sessions collection...');
    
    // Game session tracking
    await db.collection('game_sessions').createIndex(
      { userId: 1, date: -1 }, 
      { name: 'idx_game_sessions_user_date' }
    );
    console.log('  ✅ Created compound index on userId + date');
    
    // Session duration analytics
    await db.collection('game_sessions').createIndex(
      { userId: 1, startTime: -1, minutesUsed: 1 }, 
      { name: 'idx_game_sessions_user_time_duration' }
    );
    console.log('  ✅ Created compound index for session analytics');
    
    // ======================
    // ACTIVITY_LOGS COLLECTION (future-proofing)
    // ======================
    console.log('\n📊 Creating indexes for activity_logs collection...');
    
    // User activity tracking
    await db.collection('activity_logs').createIndex(
      { userId: 1, timestamp: -1 }, 
      { name: 'idx_activity_logs_user_timestamp' }
    );
    console.log('  ✅ Created compound index on userId + timestamp');
    
    // Activity type analytics
    await db.collection('activity_logs').createIndex(
      { action: 1, timestamp: -1 }, 
      { name: 'idx_activity_logs_action_timestamp' }
    );
    console.log('  ✅ Created compound index on action + timestamp');
    
    // ======================
    // VERIFY INDEX CREATION
    // ======================
    console.log('\n🔍 Verifying created indexes...');
    
    const collections = ['users', 'tasks', 'daily_tasks', 'redemptions', 'game_time_exchanges', 'game_sessions', 'activity_logs'];
    let totalIndexes = 0;
    
    for (const collectionName of collections) {
      try {
        const indexes = await db.collection(collectionName).listIndexes().toArray();
        console.log(`  📋 ${collectionName}: ${indexes.length} indexes`);
        indexes.forEach(index => {
          if (index.name !== '_id_') {  // Skip default _id index
            console.log(`    - ${index.name}: ${JSON.stringify(index.key)}`);
          }
        });
        totalIndexes += indexes.length;
      } catch (error) {
        console.log(`  ⚠️  ${collectionName}: Collection may not exist yet`);
      }
    }
    
    console.log(`\n🎯 Index Creation Summary:`);
    console.log(`  📊 Total indexes created: ${totalIndexes}`);
    console.log(`  🚀 Query performance significantly improved for:`);
    console.log(`    - User authentication and profile lookups`);
    console.log(`    - Daily task queries by user and date`);
    console.log(`    - Task recommendations based on user behavior`);
    console.log(`    - Parent approval workflows`);
    console.log(`    - Game time tracking and analytics`);
    console.log(`    - Redemption history and status queries`);
    console.log(`    - Points-based leaderboards`);
    
    console.log(`\n✅ Database optimization completed successfully!`);
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Export for use in other scripts
module.exports = { createOptimizedIndexes };

// Run directly if called as main script
if (require.main === module) {
  createOptimizedIndexes()
    .then(() => {
      console.log('\n🏆 Index optimization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Index optimization failed:', error);
      process.exit(1);
    });
}