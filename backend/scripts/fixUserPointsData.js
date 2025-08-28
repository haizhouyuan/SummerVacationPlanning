/**
 * Data Repair Script: Fix User Points Calculation
 * 
 * This script fixes users whose total points were incorrectly calculated
 * due to the fallback logic awarding 1 point per task instead of actual task points.
 * 
 * The issue: calculateConfigurablePoints was returning {totalPoints: 1} when no
 * points rules existed, causing all tasks to award only 1 point regardless of 
 * their configured point values.
 */

const { MongoClient } = require('mongodb');

// MongoDB connection setup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/summer-vacation-planning';

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('✅ Connected to MongoDB');
  return client.db();
}

async function fixUserPointsData() {
  try {
    console.log('🔧 Starting user points data repair...');
    
    const db = await connectToDatabase();
    const users = db.collection('users');
    const dailyTasks = db.collection('dailyTasks');
    const tasks = db.collection('tasks');
    
    // Find all student users
    const studentUsers = await users.find({ role: 'student' }).toArray();
    console.log(`📊 Found ${studentUsers.length} student users to check`);
    
    let repairedCount = 0;
    let suspiciousUsers = [];
    
    for (const user of studentUsers) {
      console.log(`\n🔍 Checking user: ${user.displayName} (${user.email})`);
      console.log(`   Current points: ${user.points || 0}`);
      
      // Get all approved daily tasks for this user
      const userApprovedTasks = await dailyTasks.find({
        userId: user._id.toString(),
        approvalStatus: 'approved',
        status: 'completed'
      }).toArray();
      
      console.log(`   Approved tasks count: ${userApprovedTasks.length}`);
      
      // Check if user's points equal the number of approved tasks (suspicious)
      if (user.points === userApprovedTasks.length) {
        console.log(`   ⚠️  SUSPICIOUS: Points (${user.points}) = Approved tasks count (${userApprovedTasks.length})`);
        suspiciousUsers.push(user);
        
        // Calculate correct points
        let correctTotalPoints = 0;
        let taskPointsBreakdown = [];
        
        for (const dailyTask of userApprovedTasks) {
          // Get the original task to find its point value
          const originalTask = await tasks.findOne({ _id: dailyTask.taskId });
          
          if (originalTask) {
            // Use the points that were actually awarded, or fallback to original task points
            const actualPoints = dailyTask.pointsEarned || originalTask.points || 1;
            correctTotalPoints += actualPoints;
            
            taskPointsBreakdown.push({
              taskTitle: originalTask.title,
              originalPoints: originalTask.points,
              awardedPoints: dailyTask.pointsEarned || 0,
              shouldBePoints: originalTask.points
            });
          }
        }
        
        console.log(`   📈 Calculated correct total points: ${correctTotalPoints}`);
        console.log(`   📋 Task breakdown:`, taskPointsBreakdown.slice(0, 3)); // Show first 3
        
        // Only update if there's a significant difference
        if (correctTotalPoints !== user.points) {
          console.log(`   🔧 UPDATING: ${user.points} → ${correctTotalPoints}`);
          
          // Update user's points
          await users.updateOne(
            { _id: user._id },
            { 
              $set: { 
                points: correctTotalPoints,
                updatedAt: new Date()
              }
            }
          );
          
          repairedCount++;
          console.log(`   ✅ Updated user points successfully`);
        } else {
          console.log(`   ℹ️  Points are already correct, no update needed`);
        }
      } else {
        console.log(`   ✅ Points look correct (${user.points} ≠ ${userApprovedTasks.length})`);
      }
    }
    
    console.log(`\n🎯 REPAIR SUMMARY:`);
    console.log(`   📊 Total users checked: ${studentUsers.length}`);
    console.log(`   ⚠️  Suspicious users found: ${suspiciousUsers.length}`);
    console.log(`   🔧 Users repaired: ${repairedCount}`);
    
    if (suspiciousUsers.length > 0) {
      console.log(`\n📝 Suspicious users details:`);
      suspiciousUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.displayName} - ${user.points} points`);
      });
    }
    
    console.log(`\n✅ Data repair completed successfully!`);
    
  } catch (error) {
    console.error('❌ Error during data repair:', error);
    throw error;
  }
}

// Export for use as module
module.exports = { fixUserPointsData };

// Run directly if called as script
if (require.main === module) {
  fixUserPointsData()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}