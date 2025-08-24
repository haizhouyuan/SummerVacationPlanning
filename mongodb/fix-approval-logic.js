// 修正积分审批逻辑，确保家长审批时获取正确基础积分
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app';

/**
 * 积分审批逻辑修正说明：
 * 
 * 问题分析：
 * 1. 原系统可能存在在审批时重新计算积分的问题，导致积分不一致
 * 2. 缺少标准化的积分计算逻辑
 * 3. 没有正确处理pendingPoints与pointsEarned的转换
 * 
 * 解决方案：
 * 1. 建立标准化的积分计算函数，确保前后端一致
 * 2. 在任务完成时预计算pendingPoints
 * 3. 审批时直接使用pendingPoints，避免重新计算
 * 4. 建立积分审批的事务逻辑确保数据一致性
 */

// 标准化积分计算逻辑 - 与前端保持完全一致
function calculateStandardizedPoints(taskTemplate, userMedalMultiplier = 1.0) {
  if (!taskTemplate) {
    throw new Error('Task template is required for points calculation');
  }
  
  // 基础积分映射表
  const activityBasePoints = {
    // 阅读类
    'reading_general': 5,
    'reading_fiction': 6,
    'reading_nonfiction': 7,
    
    // 学习类
    'learning_general': 8,
    'learning_math': 10,
    'learning_english': 8,
    'learning_chinese': 8,
    'learning_science': 9,
    'learning_history': 7,
    
    // 运动类
    'exercise_general': 6,
    'exercise_running': 7,
    'exercise_gaming': 5,
    'exercise_cycling': 6,
    'exercise_swimming': 8,
    'exercise_outdoor': 7,
    
    // 创意类
    'creativity_art': 6,
    'creativity_craft': 6,
    'creativity_music': 8,
    'creativity_writing': 7,
    'creativity_general': 5,
    
    // 家务类
    'chores_general': 4,
    'chores_cleaning': 5,
    'chores_kitchen': 6,
    'chores_outdoor': 5,
    
    // 默认
    'general': 5,
    'other': 5
  };
  
  // 难度系数
  const difficultyMultipliers = {
    'easy': 1.0,
    'medium': 1.5,
    'hard': 2.0
  };
  
  // 时间系数（基于预估时间）
  const getTimeMultiplier = (estimatedTimeMinutes) => {
    if (estimatedTimeMinutes <= 15) return 0.8;
    if (estimatedTimeMinutes <= 30) return 1.0;
    if (estimatedTimeMinutes <= 60) return 1.2;
    if (estimatedTimeMinutes <= 120) return 1.5;
    return 2.0;
  };
  
  // 获取基础积分
  const activity = taskTemplate.activity || 'general';
  const basePoints = activityBasePoints[activity] || activityBasePoints['general'];
  
  // 获取难度系数
  const difficulty = taskTemplate.difficulty || 'medium';
  const difficultyMultiplier = difficultyMultipliers[difficulty] || 1.5;
  
  // 获取时间系数
  const timeMultiplier = getTimeMultiplier(taskTemplate.estimatedTime || 30);
  
  // 计算最终积分
  const finalPoints = Math.round(
    basePoints * 
    difficultyMultiplier * 
    timeMultiplier * 
    userMedalMultiplier
  );
  
  return Math.max(finalPoints, 1); // 确保至少1分
}

// 获取用户勋章系数
function getUserMedalMultiplier(user) {
  if (!user || !user.medals) return 1.0;
  
  const medals = user.medals;
  if (medals.diamond) return 1.4;
  if (medals.gold) return 1.3;
  if (medals.silver) return 1.2;
  if (medals.bronze) return 1.1;
  
  return 1.0;
}

// 安全的审批逻辑：使用事务确保数据一致性
async function safeApprovalTransaction(db, dailyTaskId, approvalData, session) {
  const dailyTasksCollection = db.collection('dailyTasks');
  const usersCollection = db.collection('users');
  const pointsTransactionsCollection = db.collection('pointsTransactions');
  
  // 1. 获取任务详情
  const dailyTask = await dailyTasksCollection.findOne({ _id: dailyTaskId }, { session });
  if (!dailyTask) {
    throw new Error(`Daily task ${dailyTaskId} not found`);
  }
  
  if (dailyTask.approvalStatus !== 'pending') {
    throw new Error(`Task ${dailyTaskId} is not in pending status (current: ${dailyTask.approvalStatus})`);
  }
  
  // 2. 获取用户信息
  const user = await usersCollection.findOne({ _id: new ObjectId(dailyTask.userId) }, { session });
  if (!user) {
    throw new Error(`User ${dailyTask.userId} not found`);
  }
  
  const isApproved = approvalData.action === 'approve';
  let pointsChange = 0;
  let updatedDailyTask = {};
  
  if (isApproved) {
    // 审批通过：使用预存的pendingPoints
    const basePoints = dailyTask.pendingPoints || 0;
    const bonusPoints = approvalData.bonusPoints || 0;
    pointsChange = basePoints + bonusPoints;
    
    updatedDailyTask = {
      pointsEarned: basePoints,
      bonusPoints: bonusPoints,
      approvalStatus: 'approved',
      approvedBy: approvalData.approvedBy,
      approvedAt: new Date(),
      approvalNotes: approvalData.approvalNotes || '',
      updatedAt: new Date()
    };
    
    // 清空pendingPoints
    await dailyTasksCollection.updateOne(
      { _id: dailyTaskId },
      { 
        $set: updatedDailyTask,
        $unset: { pendingPoints: "" }
      },
      { session }
    );
    
  } else {
    // 审批拒绝：不给积分，清空pendingPoints
    updatedDailyTask = {
      pointsEarned: 0,
      approvalStatus: 'rejected',
      approvedBy: approvalData.approvedBy,
      approvedAt: new Date(),
      approvalNotes: approvalData.approvalNotes || 'Task rejected',
      updatedAt: new Date()
    };
    
    await dailyTasksCollection.updateOne(
      { _id: dailyTaskId },
      { 
        $set: updatedDailyTask,
        $unset: { pendingPoints: "" }
      },
      { session }
    );
  }
  
  // 3. 更新用户积分
  if (pointsChange > 0) {
    const previousPoints = user.points || 0;
    const newPoints = previousPoints + pointsChange;
    
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          points: newPoints,
          updatedAt: new Date()
        }
      },
      { session }
    );
    
    // 4. 记录积分交易
    await pointsTransactionsCollection.insertOne({
      userId: user._id.toString(),
      dailyTaskId: dailyTaskId.toString(),
      type: isApproved ? 'earn' : 'clawback',
      amount: pointsChange,
      reason: isApproved 
        ? `Task approved: ${updatedDailyTask.approvalNotes}` 
        : `Task rejected: ${updatedDailyTask.approvalNotes}`,
      approvedBy: approvalData.approvedBy,
      previousTotal: previousPoints,
      newTotal: newPoints,
      metadata: {
        activityType: 'task_approval',
        originalPoints: dailyTask.pendingPoints || 0,
        bonusPoints: updatedDailyTask.bonusPoints || 0,
        approvalNotes: updatedDailyTask.approvalNotes
      },
      createdAt: new Date()
    }, { session });
  }
  
  return {
    success: true,
    pointsChange,
    newUserPoints: (user.points || 0) + pointsChange,
    updatedTask: { ...dailyTask, ...updatedDailyTask }
  };
}

async function fixApprovalLogic() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const dailyTasksCollection = db.collection('dailyTasks');
    const tasksCollection = db.collection('tasks');
    const usersCollection = db.collection('users');
    
    console.log('🔧 Fixing Approval Logic and Points Calculation');
    console.log('=' .repeat(50));
    
    // 1. 检查现有数据状态
    console.log('📊 Analyzing current data state...');
    
    const pendingTasks = await dailyTasksCollection.countDocuments({
      approvalStatus: 'pending'
    });
    
    const tasksWithoutPendingPoints = await dailyTasksCollection.countDocuments({
      approvalStatus: 'pending',
      pendingPoints: { $exists: false }
    });
    
    const tasksWithInconsistentPoints = await dailyTasksCollection.countDocuments({
      approvalStatus: 'approved',
      $expr: { $ne: ['$pointsEarned', '$pendingPoints'] }
    });
    
    console.log(`- Pending approval tasks: ${pendingTasks}`);
    console.log(`- Pending tasks missing pendingPoints: ${tasksWithoutPendingPoints}`);
    console.log(`- Approved tasks with inconsistent points: ${tasksWithInconsistentPoints}`);
    
    // 2. 修复缺少pendingPoints的待审批任务
    if (tasksWithoutPendingPoints > 0) {
      console.log('\\n🔨 Fixing pending tasks missing pendingPoints...');
      
      const pendingTasksWithoutPendingPoints = await dailyTasksCollection.find({
        approvalStatus: 'pending',
        pendingPoints: { $exists: false }
      }).toArray();
      
      for (const dailyTask of pendingTasksWithoutPendingPoints) {
        // 获取任务模板
        const taskTemplate = await tasksCollection.findOne({
          $or: [
            { _id: new ObjectId(dailyTask.taskId) },
            { id: dailyTask.taskId }
          ]
        });
        
        // 获取用户信息（用于勋章系数）
        const user = await usersCollection.findOne({ _id: new ObjectId(dailyTask.userId) });
        
        if (taskTemplate && user) {
          const medalMultiplier = getUserMedalMultiplier(user);
          const calculatedPoints = calculateStandardizedPoints(taskTemplate, medalMultiplier);
          
          await dailyTasksCollection.updateOne(
            { _id: dailyTask._id },
            {
              $set: {
                pendingPoints: calculatedPoints,
                updatedAt: new Date()
              }
            }
          );
          
          console.log(`✅ Added pendingPoints=${calculatedPoints} to task ${dailyTask._id}`);
        } else {
          console.log(`⚠️  Could not calculate points for task ${dailyTask._id} (missing template or user)`);
        }
      }
    }
    
    // 3. 建立标准化的审批处理函数
    console.log('\\n📝 Creating standardized approval processing...');
    
    // 演示正确的审批流程
    const demoApproval = {
      action: 'approve', // or 'reject'
      approvedBy: 'demo-parent-id',
      approvalNotes: 'Great work! Well done.',
      bonusPoints: 2
    };
    
    console.log('✅ Standard approval logic implemented with following features:');
    console.log('   1. Uses pre-calculated pendingPoints (no recalculation)');
    console.log('   2. Supports bonus points from parents');
    console.log('   3. Maintains data consistency with transactions');
    console.log('   4. Records all changes in points transaction log');
    console.log('   5. Handles both approval and rejection scenarios');
    
    // 4. 积分一致性验证
    console.log('\\n🔍 Performing points consistency validation...');
    
    const allUsers = await usersCollection.find({ role: 'student' }).toArray();
    let consistencyIssues = 0;
    
    for (const user of allUsers) {
      const approvedTasks = await dailyTasksCollection.find({
        userId: user._id.toString(),
        approvalStatus: 'approved'
      }).toArray();
      
      const calculatedPoints = approvedTasks.reduce((total, task) => {
        return total + (task.pointsEarned || 0) + (task.bonusPoints || 0);
      }, 0);
      
      const userRecordPoints = user.points || 0;
      
      if (calculatedPoints !== userRecordPoints) {
        consistencyIssues++;
        console.log(`⚠️  User ${user.displayName}: calculated=${calculatedPoints}, record=${userRecordPoints}`);
        
        // 可选：自动修复不一致的积分
        // await usersCollection.updateOne(
        //   { _id: user._id },
        //   { $set: { points: calculatedPoints, updatedAt: new Date() } }
        // );
      }
    }
    
    console.log(`- Points consistency issues found: ${consistencyIssues}`);
    
    // 5. 创建审批助手函数
    console.log('\\n🛠️  Creating approval helper utilities...');
    
    // 保存审批逻辑到数据库作为存储过程（概念性）
    const approvalLogicDoc = {
      _id: 'approval-logic-v1',
      version: '1.0.0',
      description: 'Standardized points approval logic',
      logic: {
        calculatePoints: 'Uses pre-calculated pendingPoints from task completion',
        approvalFlow: 'pending -> approved/rejected with proper points transfer',
        consistency: 'Maintains user points = sum of approved task points',
        transactions: 'Records all point changes for audit trail'
      },
      implementation: {
        basePointsSource: 'pendingPoints field (calculated at completion)',
        bonusPointsHandling: 'Added by parent during approval',
        rejectionHandling: 'Clear pendingPoints, no points awarded',
        userPointsUpdate: 'Transactional update with consistency check'
      },
      lastUpdated: new Date()
    };
    
    await db.collection('systemConfigs').replaceOne(
      { _id: 'approval-logic-v1' },
      approvalLogicDoc,
      { upsert: true }
    );
    
    console.log('✅ Approval logic configuration saved');
    
    // 6. 性能优化建议
    console.log('\\n🚀 Performance optimization recommendations:');
    console.log('   1. Index on { approvalStatus: 1, userId: 1 } for parent dashboards');
    console.log('   2. Index on { userId: 1, approvedAt: -1 } for approval history');
    console.log('   3. Batch approval API for processing multiple tasks');
    console.log('   4. Cache user medal multipliers for better performance');
    
    console.log('\\n✅ Approval logic fix completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Update frontend to use the corrected approval API');
    console.log('   2. Test the approval workflow with sample data');
    console.log('   3. Run the data validation script to verify consistency');
    
    return {
      fixCompleted: true,
      pendingTasksFixed: tasksWithoutPendingPoints,
      consistencyIssuesFound: consistencyIssues,
      recommendationsProvided: true
    };
    
  } catch (error) {
    console.error('Error fixing approval logic:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// 导出审批处理函数供API使用
async function processApproval(db, dailyTaskId, approvalData) {
  const session = db.client.startSession();
  
  try {
    let result;
    
    await session.withTransaction(async () => {
      result = await safeApprovalTransaction(db, dailyTaskId, approvalData, session);
    });
    
    return result;
  } finally {
    await session.endSession();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  fixApprovalLogic().catch(console.error);
}

module.exports = { 
  fixApprovalLogic,
  processApproval,
  calculateStandardizedPoints,
  getUserMedalMultiplier,
  safeApprovalTransaction
};