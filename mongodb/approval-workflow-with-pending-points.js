// 演示带有pendingPoints字段的积分审批工作流逻辑
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app';

/**
 * 积分审批工作流逻辑说明和演示
 * 
 * 1. 任务完成阶段：
 *    - 学生完成任务时，计算基础积分存储在 pendingPoints 字段
 *    - pointsEarned 保持为 0（积分尚未获得）
 *    - approvalStatus 设置为 'pending'
 * 
 * 2. 家长审批阶段：
 *    - 审批通过：将 pendingPoints 转移到 pointsEarned，清空 pendingPoints
 *    - 审批拒绝：清空 pendingPoints，pointsEarned 保持为 0
 *    - 可以添加 bonusPoints 作为额外奖励
 * 
 * 3. 积分一致性：
 *    - 用户总积分 = 所有已审批任务的 (pointsEarned + bonusPoints) 之和
 *    - pendingPoints 不计入用户总积分，只用于展示待审批积分
 */

async function demonstrateApprovalWorkflow() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const dailyTasksCollection = db.collection('dailyTasks');
    const usersCollection = db.collection('users');
    const tasksCollection = db.collection('tasks');
    
    console.log('📋 Approval Workflow with PendingPoints Demo');
    console.log('=' .repeat(50));
    
    // 检查是否存在演示数据
    const existingDemoTasks = await dailyTasksCollection.find({
      'metadata.isDemoData': true
    }).toArray();
    
    if (existingDemoTasks.length > 0) {
      console.log(`Found ${existingDemoTasks.length} existing demo tasks, cleaning up...`);
      await dailyTasksCollection.deleteMany({ 'metadata.isDemoData': true });
    }
    
    // 查找第一个学生用户作为演示对象
    const student = await usersCollection.findOne({ role: 'student' });
    if (!student) {
      console.log('❌ No student users found. Please create a student user first.');
      return;
    }
    
    // 查找第一个任务模板
    const taskTemplate = await tasksCollection.findOne({ isPublic: true });
    if (!taskTemplate) {
      console.log('❌ No public tasks found. Please create task templates first.');
      return;
    }
    
    console.log(`👤 Using student: ${student.displayName} (${student.email})`);
    console.log(`📝 Using task: ${taskTemplate.title} (${taskTemplate.category})`);
    console.log(`🎯 Task difficulty: ${taskTemplate.difficulty}, Activity: ${taskTemplate.activity}`);
    
    // 计算基础积分
    const basePoints = calculateBasePointsFromTask(taskTemplate);
    console.log(`💰 Base points for this task: ${basePoints}`);
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // === 步骤 1: 创建已完成但待审批的任务 ===
    console.log('\n🚀 Step 1: Student completes task (creates pendingPoints)');
    
    const newDailyTask = {
      userId: student._id.toString(),
      taskId: taskTemplate._id.toString(),
      date: today,
      status: 'completed',
      completedAt: new Date(),
      evidence: [{
        type: 'text',
        content: '我已经完成了这个任务！',
        timestamp: new Date()
      }],
      pointsEarned: 0, // 积分尚未获得
      pendingPoints: basePoints, // 待审批积分
      approvalStatus: 'pending',
      notes: 'Demo task for testing approval workflow',
      metadata: { isDemoData: true }, // 标记为演示数据
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const insertResult = await dailyTasksCollection.insertOne(newDailyTask);
    const dailyTaskId = insertResult.insertedId;
    
    console.log(`✅ Created daily task with ID: ${dailyTaskId}`);
    console.log(`   - Status: ${newDailyTask.status}`);
    console.log(`   - PendingPoints: ${newDailyTask.pendingPoints}`);
    console.log(`   - PointsEarned: ${newDailyTask.pointsEarned}`);
    console.log(`   - ApprovalStatus: ${newDailyTask.approvalStatus}`);
    
    // 检查学生当前总积分（pendingPoints不应计入）
    const studentCurrentPoints = student.points || 0;
    console.log(`👤 Student current total points: ${studentCurrentPoints} (pendingPoints not included)`);
    
    // === 步骤 2: 模拟家长审批通过 ===
    console.log('\n✅ Step 2: Parent approves task (converts pendingPoints to pointsEarned)');
    
    const bonusPoints = 2; // 家长给予的额外奖励积分
    
    const approvalUpdate = await dailyTasksCollection.updateOne(
      { _id: dailyTaskId },
      {
        $set: {
          pointsEarned: basePoints, // 从pendingPoints转移过来
          bonusPoints: bonusPoints,
          approvalStatus: 'approved',
          approvedBy: 'demo-parent-id',
          approvedAt: new Date(),
          approvalNotes: 'Great job! Here are some bonus points.',
          updatedAt: new Date()
        },
        $unset: {
          pendingPoints: "" // 清空待审批积分
        }
      }
    );
    
    console.log(`✅ Approval completed. Modified ${approvalUpdate.modifiedCount} document(s)`);
    
    // 更新学生总积分
    const totalEarnedPoints = basePoints + bonusPoints;
    const newStudentPoints = studentCurrentPoints + totalEarnedPoints;
    
    await usersCollection.updateOne(
      { _id: student._id },
      {
        $set: {
          points: newStudentPoints,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`   - Base points earned: ${basePoints}`);
    console.log(`   - Bonus points: ${bonusPoints}`);
    console.log(`   - Total points from this task: ${totalEarnedPoints}`);
    console.log(`👤 Student total points updated: ${studentCurrentPoints} → ${newStudentPoints}`);
    
    // === 步骤 3: 验证最终状态 ===
    console.log('\n🔍 Step 3: Verification of final state');
    
    const approvedTask = await dailyTasksCollection.findOne({ _id: dailyTaskId });
    
    console.log('Final task state:');
    console.log(`   - Status: ${approvedTask.status}`);
    console.log(`   - ApprovalStatus: ${approvedTask.approvalStatus}`);
    console.log(`   - PointsEarned: ${approvedTask.pointsEarned}`);
    console.log(`   - BonusPoints: ${approvedTask.bonusPoints || 0}`);
    console.log(`   - PendingPoints: ${approvedTask.pendingPoints || 'undefined (cleared)'}`);
    console.log(`   - ApprovedBy: ${approvedTask.approvedBy}`);
    console.log(`   - ApprovalNotes: ${approvedTask.approvalNotes}`);
    
    // === 步骤 4: 演示拒绝审批的情况 ===
    console.log('\n❌ Step 4: Demo of rejection workflow');
    
    // 创建另一个待审批任务
    const rejectedTask = {
      userId: student._id.toString(),
      taskId: taskTemplate._id.toString(),
      date: today,
      status: 'completed',
      completedAt: new Date(),
      evidence: [{
        type: 'text',
        content: '这是一个将被拒绝的任务证据',
        timestamp: new Date()
      }],
      pointsEarned: 0,
      pendingPoints: basePoints,
      approvalStatus: 'pending',
      notes: 'Demo task for rejection workflow',
      metadata: { isDemoData: true },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const rejectedInsertResult = await dailyTasksCollection.insertOne(rejectedTask);
    const rejectedDailyTaskId = rejectedInsertResult.insertedId;
    
    console.log(`📝 Created second task for rejection demo: ${rejectedDailyTaskId}`);
    
    // 拒绝审批
    await dailyTasksCollection.updateOne(
      { _id: rejectedDailyTaskId },
      {
        $set: {
          approvalStatus: 'rejected',
          approvedBy: 'demo-parent-id',
          approvedAt: new Date(),
          approvalNotes: 'Evidence is not sufficient, please redo the task.',
          updatedAt: new Date()
        },
        $unset: {
          pendingPoints: "" // 清空待审批积分，不转移到pointsEarned
        }
      }
    );
    
    console.log('✅ Rejection completed');
    
    const finalRejectedTask = await dailyTasksCollection.findOne({ _id: rejectedDailyTaskId });
    console.log('Rejected task final state:');
    console.log(`   - ApprovalStatus: ${finalRejectedTask.approvalStatus}`);
    console.log(`   - PointsEarned: ${finalRejectedTask.pointsEarned} (should be 0)`);
    console.log(`   - PendingPoints: ${finalRejectedTask.pendingPoints || 'undefined (cleared)'}`);
    console.log(`   - ApprovalNotes: ${finalRejectedTask.approvalNotes}`);
    
    // === 总结统计 ===
    console.log('\n📊 Workflow Summary and Statistics');
    console.log('=' .repeat(50));
    
    const pendingTasks = await dailyTasksCollection.countDocuments({
      approvalStatus: 'pending',
      pendingPoints: { $exists: true, $gt: 0 }
    });
    
    const approvedTasks = await dailyTasksCollection.countDocuments({
      approvalStatus: 'approved',
      pointsEarned: { $gt: 0 }
    });
    
    const rejectedTasks = await dailyTasksCollection.countDocuments({
      approvalStatus: 'rejected',
      pointsEarned: 0
    });
    
    console.log(`📋 Task Status Summary:`);
    console.log(`   - Pending approval: ${pendingTasks} tasks`);
    console.log(`   - Approved: ${approvedTasks} tasks`);
    console.log(`   - Rejected: ${rejectedTasks} tasks`);
    
    // 积分一致性检查
    const allApprovedTasks = await dailyTasksCollection.find({
      userId: student._id.toString(),
      approvalStatus: 'approved'
    }).toArray();
    
    const calculatedTotalPoints = allApprovedTasks.reduce((total, task) => {
      return total + (task.pointsEarned || 0) + (task.bonusPoints || 0);
    }, 0);
    
    const currentStudentRecord = await usersCollection.findOne({ _id: student._id });
    const actualStudentPoints = currentStudentRecord.points || 0;
    
    console.log(`💰 Points Consistency Check:`);
    console.log(`   - Calculated from approved tasks: ${calculatedTotalPoints}`);
    console.log(`   - Student record points: ${actualStudentPoints}`);
    console.log(`   - Consistency: ${calculatedTotalPoints === actualStudentPoints ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n🎉 Approval workflow demonstration completed!');
    console.log('💡 Key Points:');
    console.log('   1. pendingPoints stores points awaiting approval');
    console.log('   2. pointsEarned only contains approved points');
    console.log('   3. User total points = sum of all (pointsEarned + bonusPoints)');
    console.log('   4. pendingPoints are cleared after approval/rejection');
    
    return {
      demonstrationCompleted: true,
      tasksCreated: 2,
      approvedTasks: 1,
      rejectedTasks: 1,
      pointsAwarded: totalEarnedPoints,
      consistencyCheck: calculatedTotalPoints === actualStudentPoints
    };
    
  } catch (error) {
    console.error('Error in approval workflow demonstration:', error);
    throw error;
  } finally {
    await client.close();
  }
}

function calculateBasePointsFromTask(task) {
  const difficultyMultipliers = {
    'easy': 1.0,
    'medium': 1.5,
    'hard': 2.0
  };
  
  const activityBasePoints = {
    'reading_general': 5,
    'learning_general': 8,
    'learning_math': 10,
    'learning_english': 8,
    'learning_chinese': 8,
    'exercise_general': 6,
    'exercise_running': 7,
    'exercise_gaming': 5,
    'exercise_cycling': 6,
    'exercise_swimming': 8,
    'creativity_art': 6,
    'creativity_craft': 6,
    'creativity_music': 8,
    'creativity_general': 5,
    'chores_general': 4,
    'chores_cleaning': 5,
    'chores_kitchen': 6,
    'general': 5
  };
  
  const basePoints = activityBasePoints[task.activity] || activityBasePoints['general'];
  const multiplier = difficultyMultipliers[task.difficulty] || 1.5;
  
  return Math.round(basePoints * multiplier);
}

// 如果直接运行此文件
if (require.main === module) {
  demonstrateApprovalWorkflow().catch(console.error);
}

module.exports = { demonstrateApprovalWorkflow, calculateBasePointsFromTask };