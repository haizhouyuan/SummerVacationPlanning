#!/usr/bin/env node

/**
 * Database Migration Script: Fix requiresEvidence Consistency
 * 
 * This script ensures all tasks in the database have requiresEvidence: true
 * to maintain consistency with the new approval-required policy.
 * 
 * Usage: node scripts/fixRequiresEvidenceConsistency.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/summer-vacation-planning';
const DB_NAME = process.env.MONGODB_DB_NAME || 'summer-vacation-planning';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    const db = client.db(DB_NAME);
    const tasksCollection = db.collection('tasks');
    
    // Check current state
    console.log('\n📊 Checking current task database state...');
    
    const totalTasks = await tasksCollection.countDocuments();
    const tasksRequireEvidence = await tasksCollection.countDocuments({ requiresEvidence: true });
    const tasksNoEvidence = await tasksCollection.countDocuments({ requiresEvidence: false });
    const tasksUndefinedEvidence = await tasksCollection.countDocuments({ requiresEvidence: { $exists: false } });
    
    console.log(`📈 Database Analysis:`);
    console.log(`   Total tasks: ${totalTasks}`);
    console.log(`   Tasks with requiresEvidence: true: ${tasksRequireEvidence}`);
    console.log(`   Tasks with requiresEvidence: false: ${tasksNoEvidence}`);
    console.log(`   Tasks with requiresEvidence: undefined: ${tasksUndefinedEvidence}`);
    
    if (tasksNoEvidence === 0 && tasksUndefinedEvidence === 0) {
      console.log('\n✅ All tasks already have requiresEvidence: true. No changes needed.');
      return;
    }
    
    // Fix tasks with requiresEvidence: false or undefined
    console.log('\n🔧 Fixing task consistency...');
    
    // Update tasks that have requiresEvidence: false
    if (tasksNoEvidence > 0) {
      console.log(`📝 Updating ${tasksNoEvidence} tasks with requiresEvidence: false...`);
      const updateResult1 = await tasksCollection.updateMany(
        { requiresEvidence: false },
        { 
          $set: { 
            requiresEvidence: true,
            updatedAt: new Date(),
            migrationNote: 'Updated by requiresEvidence consistency fix - all tasks now require approval'
          }
        }
      );
      console.log(`   ✅ Updated ${updateResult1.modifiedCount} tasks (requiresEvidence: false -> true)`);
    }
    
    // Update tasks that don't have requiresEvidence field
    if (tasksUndefinedEvidence > 0) {
      console.log(`📝 Updating ${tasksUndefinedEvidence} tasks with missing requiresEvidence field...`);
      const updateResult2 = await tasksCollection.updateMany(
        { requiresEvidence: { $exists: false } },
        { 
          $set: { 
            requiresEvidence: true,
            updatedAt: new Date(),
            migrationNote: 'Updated by requiresEvidence consistency fix - all tasks now require approval'
          }
        }
      );
      console.log(`   ✅ Updated ${updateResult2.modifiedCount} tasks (missing field -> requiresEvidence: true)`);
    }
    
    // Verify changes
    console.log('\n🔍 Verifying changes...');
    const finalTasksRequireEvidence = await tasksCollection.countDocuments({ requiresEvidence: true });
    const finalTasksNoEvidence = await tasksCollection.countDocuments({ requiresEvidence: false });
    const finalTasksUndefinedEvidence = await tasksCollection.countDocuments({ requiresEvidence: { $exists: false } });
    
    console.log(`📈 Final Database State:`);
    console.log(`   Tasks with requiresEvidence: true: ${finalTasksRequireEvidence}`);
    console.log(`   Tasks with requiresEvidence: false: ${finalTasksNoEvidence}`);
    console.log(`   Tasks with requiresEvidence: undefined: ${finalTasksUndefinedEvidence}`);
    
    if (finalTasksNoEvidence === 0 && finalTasksUndefinedEvidence === 0) {
      console.log('\n🎉 SUCCESS: All tasks now have requiresEvidence: true');
      console.log('🔒 All tasks now require parent approval before points are awarded');
    } else {
      console.log('\n⚠️  WARNING: Some tasks still don\'t have requiresEvidence: true');
      console.log('   This may cause inconsistent approval behavior');
    }
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { main };