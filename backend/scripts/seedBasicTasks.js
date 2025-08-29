const { MongoClient } = require('mongodb');
require('dotenv').config();

async function seedBasicTasks() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const tasks = db.collection('tasks');
    
    console.log('🔄 开始创建基础任务...');
    
    // 清理现有基础任务
    console.log('🧹 清理现有任务...');
    await tasks.deleteMany({});
    
    const basicTasks = [
      {
        title: '阅读30分钟',
        description: '选择一本你喜欢的书，专心阅读30分钟',
        category: 'reading',
        difficulty: 'easy',
        points: 15,
        estimatedTime: 30,
        requiresEvidence: true,
        evidenceTypes: ['text', 'photo'],
        tags: ['阅读', '学习'],
        isPublic: true,
        activity: 'reading',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '跑步锻炼',
        description: '进行30分钟的跑步锻炼，保持身体健康',
        category: 'exercise',
        difficulty: 'medium',
        points: 20,
        estimatedTime: 30,
        requiresEvidence: true,
        evidenceTypes: ['photo', 'video'],
        tags: ['运动', '健康'],
        isPublic: true,
        activity: 'running',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '数学练习',
        description: '完成数学作业或练习题',
        category: 'learning',
        difficulty: 'medium',
        points: 25,
        estimatedTime: 45,
        requiresEvidence: true,
        evidenceTypes: ['text', 'photo'],
        tags: ['数学', '学习'],
        isPublic: true,
        activity: 'homework',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '绘画创作',
        description: '自由创作一幅画作，发挥想象力',
        category: 'creativity',
        difficulty: 'easy',
        points: 18,
        estimatedTime: 60,
        requiresEvidence: true,
        evidenceTypes: ['photo'],
        tags: ['绘画', '艺术'],
        isPublic: true,
        activity: 'drawing',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '整理房间',
        description: '整理自己的房间，保持环境整洁',
        category: 'chores',
        difficulty: 'easy',
        points: 10,
        estimatedTime: 20,
        requiresEvidence: true,
        evidenceTypes: ['photo'],
        tags: ['家务', '整理'],
        isPublic: true,
        activity: 'cleaning',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '英语单词学习',
        description: '学习并记忆20个新的英语单词',
        category: 'learning',
        difficulty: 'medium',
        points: 22,
        estimatedTime: 40,
        requiresEvidence: true,
        evidenceTypes: ['text'],
        tags: ['英语', '单词'],
        isPublic: true,
        activity: 'vocabulary',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '科学实验',
        description: '进行一个简单的科学实验，观察并记录结果',
        category: 'learning',
        difficulty: 'hard',
        points: 30,
        estimatedTime: 90,
        requiresEvidence: true,
        evidenceTypes: ['text', 'photo', 'video'],
        tags: ['科学', '实验'],
        isPublic: true,
        activity: 'experiment',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    console.log('📝 插入基础任务...');
    const result = await tasks.insertMany(basicTasks);
    
    console.log('🎉 基础任务创建成功！');
    console.log(`✅ 共创建 ${result.insertedCount} 个任务`);
    
    // 验证创建结果
    console.log('🔍 验证创建结果...');
    const allTasks = await tasks.find({}).toArray();
    
    console.log(`✅ 验证完成，数据库中共有 ${allTasks.length} 个任务`);
    
    for (const task of allTasks) {
      console.log(`  - ${task.title} (${task.category}): ${task.points}分, ${task.estimatedTime}分钟`);
    }
    
  } catch (error) {
    console.error('❌ 创建基础任务失败:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 直接运行脚本
if (require.main === module) {
  seedBasicTasks()
    .then(() => {
      console.log('✨ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { seedBasicTasks };