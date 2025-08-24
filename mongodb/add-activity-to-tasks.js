// 为所有Tasks模板添加activity字段标识
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app';

// Activity映射规则：基于任务标题和类别确定activity
function getActivityByTitleAndCategory(title, category) {
  const titleLower = title.toLowerCase();
  
  // 基于任务标题的特定映射
  const titleMappings = {
    // 阅读相关
    '阅读': 'reading_general',
    '读书': 'reading_general', 
    '背诵': 'reading_general',
    '故事': 'reading_general',
    '书籍': 'reading_general',
    
    // 学习相关
    '数学': 'learning_math',
    '英语': 'learning_english',
    '语文': 'learning_chinese',
    '作业': 'learning_general',
    '练习': 'learning_general',
    '学习': 'learning_general',
    'duolingo': 'learning_english',
    'runfox': 'learning_english',
    
    // 运动相关
    '跑步': 'exercise_running',
    '运动': 'exercise_general',
    '体感游戏': 'exercise_gaming',
    '骑车': 'exercise_cycling',
    '游泳': 'exercise_swimming',
    
    // 创意相关
    '绘画': 'creativity_art',
    '画画': 'creativity_art',
    '手工': 'creativity_craft',
    '制作': 'creativity_craft',
    'diy': 'creativity_craft',
    '音乐': 'creativity_music',
    '萨克斯': 'creativity_music',
    '钢琴': 'creativity_music',
    
    // 家务相关
    '整理': 'chores_cleaning',
    '洗碗': 'chores_kitchen',
    '帮忙': 'chores_general',
    '收拾': 'chores_cleaning',
    '打扫': 'chores_cleaning'
  };
  
  // 检查标题中是否包含特定关键词
  for (const [keyword, activity] of Object.entries(titleMappings)) {
    if (titleLower.includes(keyword)) {
      return activity;
    }
  }
  
  // 基于类别的默认映射
  const categoryMappings = {
    'reading': 'reading_general',
    'learning': 'learning_general', 
    'exercise': 'exercise_general',
    'creativity': 'creativity_general',
    'chores': 'chores_general',
    'other': 'general'
  };
  
  return categoryMappings[category] || 'general';
}

async function addActivityToTasks() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const tasksCollection = db.collection('tasks');
    
    // 获取所有没有activity字段的任务
    const tasksWithoutActivity = await tasksCollection.find({
      activity: { $exists: false }
    }).toArray();
    
    console.log(`Found ${tasksWithoutActivity.length} tasks without activity field`);
    
    let updatedCount = 0;
    const activityStats = {};
    
    for (const task of tasksWithoutActivity) {
      const activity = getActivityByTitleAndCategory(task.title, task.category);
      
      // 更新任务，添加activity字段
      const result = await tasksCollection.updateOne(
        { _id: task._id },
        { 
          $set: { 
            activity: activity,
            updatedAt: new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        updatedCount++;
        
        // 统计activity分布
        activityStats[activity] = (activityStats[activity] || 0) + 1;
        
        console.log(`✅ Updated task "${task.title}" (${task.category}) -> ${activity}`);
      }
    }
    
    // 验证结果
    console.log('\nVerification:');
    
    const totalTasks = await tasksCollection.countDocuments({});
    const tasksWithActivity = await tasksCollection.countDocuments({
      activity: { $exists: true }
    });
    
    console.log(`- Total tasks: ${totalTasks}`);
    console.log(`- Tasks with activity field: ${tasksWithActivity}`);
    console.log(`- Tasks updated: ${updatedCount}`);
    
    console.log('\nActivity distribution:');
    for (const [activity, count] of Object.entries(activityStats)) {
      console.log(`- ${activity}: ${count} tasks`);
    }
    
    // 检查数据样本
    const sampleTasks = await tasksCollection.find({ 
      activity: { $exists: true } 
    }).limit(3).toArray();
    
    console.log('\nSample tasks with activity:');
    sampleTasks.forEach(task => {
      console.log(`- "${task.title}" (${task.category}) -> ${task.activity}`);
    });
    
    console.log(`\n✅ Activity field addition completed!`);
    console.log(`📊 Summary: ${updatedCount} tasks updated with activity fields`);
    
  } catch (error) {
    console.error('Error adding activity to tasks:', error);
  } finally {
    await client.close();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  addActivityToTasks().catch(console.error);
}

module.exports = { addActivityToTasks };