// 添加pendingPoints字段到DailyTasks集合，用于存储待审批积分
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app';

/**
 * 根据任务难度和活动类型计算基础积分
 * 这个逻辑应该与前端/后端的积分计算逻辑保持一致
 */
function calculateBasePoints(task, difficulty = 'medium') {
  // 基础积分映射
  const difficultyMultipliers = {
    'easy': 1.0,
    'medium': 1.5,
    'hard': 2.0
  };
  
  // 活动类型基础积分
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
  const multiplier = difficultyMultipliers[difficulty] || 1.5;
  
  return Math.round(basePoints * multiplier);
}

async function addPendingPointsField() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const dailyTasksCollection = db.collection('dailyTasks');
    const tasksCollection = db.collection('tasks');
    
    console.log('🔍 Analyzing DailyTasks that need pendingPoints field...');
    
    // 查找需要添加pendingPoints字段的任务：
    // 1. status为'completed'但没有pendingPoints字段的任务
    // 2. approvalStatus为'pending'但没有pendingPoints字段的任务
    const tasksNeedingPendingPoints = await dailyTasksCollection.find({
      $and: [
        { pendingPoints: { $exists: false } }, // 没有pendingPoints字段
        {
          $or: [
            { status: 'completed', approvalStatus: 'pending' }, // 已完成待审批
            { status: 'completed', approvalStatus: { $exists: false } }, // 已完成但没有审批状态
            { approvalStatus: 'pending' } // 明确标记为待审批
          ]
        }
      ]
    }).toArray();
    
    console.log(`Found ${tasksNeedingPendingPoints.length} tasks that need pendingPoints field`);
    
    // 获取所有相关的任务模板信息
    const taskIds = [...new Set(tasksNeedingPendingPoints.map(dt => dt.taskId))];
    const tasksMap = {};
    
    if (taskIds.length > 0) {
      const tasks = await tasksCollection.find({
        $or: [
          { _id: { $in: taskIds.map(id => new ObjectId(id)) } },
          { id: { $in: taskIds } }
        ]
      }).toArray();
      
      tasks.forEach(task => {
        const taskId = task._id ? task._id.toString() : task.id;
        tasksMap[taskId] = task;
      });
    }
    
    console.log(`Loaded ${Object.keys(tasksMap).length} task templates for points calculation`);
    
    let updatedCount = 0;
    const pendingPointsStats = {
      totalPendingPoints: 0,
      tasksByPoints: {}
    };
    
    // 更新每个需要pendingPoints字段的任务
    for (const dailyTask of tasksNeedingPendingPoints) {
      const taskTemplate = tasksMap[dailyTask.taskId];
      let pendingPoints = 0;
      
      if (taskTemplate) {
        // 使用任务模板计算基础积分
        pendingPoints = calculateBasePoints(taskTemplate, taskTemplate.difficulty);
        console.log(`📊 Task "${taskTemplate.title}" (${taskTemplate.difficulty}) -> ${pendingPoints} pending points`);
      } else if (dailyTask.pointsEarned && dailyTask.pointsEarned > 0) {
        // 如果没有找到任务模板，但已经有pointsEarned，使用该值
        pendingPoints = dailyTask.pointsEarned;
        console.log(`📊 Using existing pointsEarned: ${pendingPoints} pending points`);
      } else {
        // 默认积分
        pendingPoints = 5;
        console.log(`⚠️  No task template found for ${dailyTask.taskId}, using default 5 points`);
      }
      
      // 更新DailyTask，添加pendingPoints字段
      const updateResult = await dailyTasksCollection.updateOne(
        { _id: dailyTask._id },
        {
          $set: {
            pendingPoints: pendingPoints,
            approvalStatus: dailyTask.approvalStatus || 'pending', // 确保有审批状态
            updatedAt: new Date()
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        updatedCount++;
        pendingPointsStats.totalPendingPoints += pendingPoints;
        pendingPointsStats.tasksByPoints[pendingPoints] = (pendingPointsStats.tasksByPoints[pendingPoints] || 0) + 1;
        
        console.log(`✅ Added pendingPoints=${pendingPoints} to task ${dailyTask._id}`);
      }
    }
    
    // 验证更新结果
    console.log('\n📊 Verification and Statistics:');
    
    const totalTasksWithPendingPoints = await dailyTasksCollection.countDocuments({
      pendingPoints: { $exists: true }
    });
    
    const pendingApprovalTasks = await dailyTasksCollection.countDocuments({
      approvalStatus: 'pending',
      pendingPoints: { $exists: true }
    });
    
    const avgPendingPoints = totalTasksWithPendingPoints > 0 
      ? Math.round(pendingPointsStats.totalPendingPoints / updatedCount * 100) / 100 
      : 0;
    
    console.log(`- Total tasks with pendingPoints field: ${totalTasksWithPendingPoints}`);
    console.log(`- Tasks with pending approval status: ${pendingApprovalTasks}`);
    console.log(`- Tasks updated in this run: ${updatedCount}`);
    console.log(`- Total pending points added: ${pendingPointsStats.totalPendingPoints}`);
    console.log(`- Average pending points per task: ${avgPendingPoints}`);
    
    console.log('\nPoints distribution:');
    Object.entries(pendingPointsStats.tasksByPoints)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([points, count]) => {
        console.log(`- ${points} points: ${count} tasks`);
      });
    
    // 示例数据检查
    const sampleTask = await dailyTasksCollection.findOne({
      pendingPoints: { $exists: true },
      approvalStatus: 'pending'
    });
    
    if (sampleTask) {
      console.log('\nSample task with pendingPoints:');
      console.log(`- Task ID: ${sampleTask._id}`);
      console.log(`- User ID: ${sampleTask.userId}`);
      console.log(`- Task template ID: ${sampleTask.taskId}`);
      console.log(`- Status: ${sampleTask.status}`);
      console.log(`- Approval status: ${sampleTask.approvalStatus}`);
      console.log(`- Points earned: ${sampleTask.pointsEarned || 0}`);
      console.log(`- Pending points: ${sampleTask.pendingPoints}`);
      console.log(`- Date: ${sampleTask.date}`);
    }
    
    console.log('\n✅ PendingPoints field addition completed!');
    console.log(`📈 Summary: ${updatedCount} tasks updated with pendingPoints field`);
    console.log(`💰 Total pending points in system: ${pendingPointsStats.totalPendingPoints}`);
    
  } catch (error) {
    console.error('Error adding pendingPoints field:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  addPendingPointsField().catch(console.error);
}

module.exports = { addPendingPointsField };