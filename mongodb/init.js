const { MongoClient } = require('mongodb');

/**
 * MongoDB基础数据初始化脚本
 * 用于创建初始用户、基础任务数据和系统配置
 */

// 从环境变量获取MongoDB连接字符串，默认为本地开发
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/summer_app';

async function initializeDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 连接到MongoDB...');
    await client.connect();
    
    const db = client.db();
    console.log('✅ 成功连接到数据库:', db.databaseName);
    
    console.log('\n🌱 开始初始化基础数据...');
    
    // ======================
    // 初始化基础任务库
    // ======================
    console.log('\n📚 初始化基础任务库...');
    
    const basicTasks = [
      // 语文阅读类
      {
        title: '阅读经典故事',
        description: '阅读一篇经典儿童故事，理解故事情节，培养阅读兴趣',
        category: 'reading',
        difficulty: 'easy',
        estimatedTime: 30,
        points: 10,
        requiresEvidence: true,
        evidenceTypes: ['text', 'photo'],
        tags: ['阅读', '故事', '理解'],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '写阅读心得',
        description: '读完一本书后，写下100字以上的读后感，分享你的感受',
        category: 'reading',
        difficulty: 'medium',
        estimatedTime: 45,
        points: 15,
        requiresEvidence: true,
        evidenceTypes: ['text'],
        tags: ['写作', '心得', '表达'],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 学习类
      {
        title: '完成数学练习',
        description: '认真完成今日的数学练习题，巩固所学知识',
        category: 'learning',
        difficulty: 'medium',
        estimatedTime: 40,
        points: 12,
        requiresEvidence: true,
        evidenceTypes: ['photo'],
        tags: ['数学', '练习', '基础'],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '学习新单词',
        description: '学习5个新的英语单词，包括发音、拼写和用法',
        category: 'learning',
        difficulty: 'easy',
        estimatedTime: 25,
        points: 8,
        requiresEvidence: true,
        evidenceTypes: ['text', 'photo'],
        tags: ['英语', '单词', '记忆'],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 运动类
      {
        title: '晨间跑步',
        description: '进行15-20分钟的跑步锻炼，增强体质',
        category: 'exercise',
        difficulty: 'medium',
        estimatedTime: 20,
        points: 15,
        requiresEvidence: true,
        evidenceTypes: ['photo', 'video'],
        tags: ['跑步', '晨练', '健康'],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '体感游戏运动',
        description: '玩30分钟健身类体感游戏，寓教于乐',
        category: 'exercise',
        difficulty: 'easy',
        estimatedTime: 30,
        points: 10,
        requiresEvidence: true,
        evidenceTypes: ['photo', 'video'],
        tags: ['游戏', '运动', '趣味'],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 创意类
      {
        title: '绘画创作',
        description: '画一幅主题画作，发挥想象力和创造力',
        category: 'creativity',
        difficulty: 'medium',
        estimatedTime: 60,
        points: 18,
        requiresEvidence: true,
        evidenceTypes: ['photo'],
        tags: ['绘画', '创作', '艺术'],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '制作手工',
        description: '用废旧材料制作一个小手工作品，培养环保意识',
        category: 'creativity',
        difficulty: 'hard',
        estimatedTime: 90,
        points: 25,
        requiresEvidence: true,
        evidenceTypes: ['photo', 'video'],
        tags: ['手工', '环保', '创新'],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 家务类
      {
        title: '整理房间',
        description: '整理自己的房间，保持干净整洁',
        category: 'chores',
        difficulty: 'easy',
        estimatedTime: 30,
        points: 8,
        requiresEvidence: true,
        evidenceTypes: ['photo'],
        tags: ['整理', '清洁', '责任'],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '帮忙洗碗',
        description: '协助家长清洗餐具，培养家庭责任感',
        category: 'chores',
        difficulty: 'easy',
        estimatedTime: 15,
        points: 6,
        requiresEvidence: true,
        evidenceTypes: ['photo'],
        tags: ['家务', '帮助', '责任'],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // 批量插入基础任务（避免重复）
    const tasksCollection = db.collection('tasks');
    let insertedTasks = 0;
    
    for (const task of basicTasks) {
      const existingTask = await tasksCollection.findOne({ 
        title: task.title, 
        createdBy: 'system' 
      });
      
      if (!existingTask) {
        await tasksCollection.insertOne(task);
        insertedTasks++;
        console.log(`  ✅ 创建任务: ${task.title}`);
      } else {
        console.log(`  ⚠️  任务已存在: ${task.title}`);
      }
    }
    
    console.log(`\n📊 任务初始化完成: 新增 ${insertedTasks} 个基础任务`);
    
    // ======================
    // 初始化积分规则配置
    // ======================
    console.log('\n⚙️ 初始化积分规则配置...');
    
    const pointsRules = [
      {
        category: 'reading',
        name: '阅读类任务',
        basePoints: 10,
        difficultyMultiplier: { easy: 1, medium: 1.2, hard: 1.5 },
        dailyLimit: 50,
        weeklyBonus: 10,
        description: '培养阅读习惯，开拓知识视野',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'learning',
        name: '学习类任务',
        basePoints: 12,
        difficultyMultiplier: { easy: 1, medium: 1.3, hard: 1.6 },
        dailyLimit: 60,
        weeklyBonus: 15,
        description: '巩固学科知识，提升学习能力',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'exercise',
        name: '运动类任务',
        basePoints: 15,
        difficultyMultiplier: { easy: 1, medium: 1.2, hard: 1.4 },
        dailyLimit: 45,
        weeklyBonus: 20,
        description: '强身健体，培养运动习惯',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'creativity',
        name: '创意类任务',
        basePoints: 18,
        difficultyMultiplier: { easy: 1, medium: 1.3, hard: 1.7 },
        dailyLimit: 40,
        weeklyBonus: 25,
        description: '发挥创造力，培养艺术素养',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'chores',
        name: '家务类任务',
        basePoints: 8,
        difficultyMultiplier: { easy: 1, medium: 1.2, hard: 1.4 },
        dailyLimit: 30,
        weeklyBonus: 12,
        description: '培养责任感，锻炼生活技能',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const pointsRulesCollection = db.collection('pointsRules');
    let insertedRules = 0;
    
    for (const rule of pointsRules) {
      const existingRule = await pointsRulesCollection.findOne({ 
        category: rule.category 
      });
      
      if (!existingRule) {
        await pointsRulesCollection.insertOne(rule);
        insertedRules++;
        console.log(`  ✅ 创建积分规则: ${rule.name}`);
      } else {
        console.log(`  ⚠️  积分规则已存在: ${rule.name}`);
      }
    }
    
    console.log(`\n📊 积分规则初始化完成: 新增 ${insertedRules} 条规则`);
    
    // ======================
    // 初始化游戏时间配置
    // ======================
    console.log('\n🎮 初始化游戏时间配置...');
    
    const gameTimeConfigs = [
      {
        gameType: 'normal',
        name: '普通游戏',
        pointsPerMinute: 2,
        maxDailyMinutes: 120,
        description: '普通娱乐游戏时间兑换',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        gameType: 'educational',
        name: '教育游戏',
        pointsPerMinute: 1.5,
        maxDailyMinutes: 180,
        description: '益智教育游戏时间兑换，积分消耗更少',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const gameTimeConfigsCollection = db.collection('gameTimeConfigs');
    let insertedConfigs = 0;
    
    for (const config of gameTimeConfigs) {
      const existingConfig = await gameTimeConfigsCollection.findOne({ 
        gameType: config.gameType 
      });
      
      if (!existingConfig) {
        await gameTimeConfigsCollection.insertOne(config);
        insertedConfigs++;
        console.log(`  ✅ 创建游戏配置: ${config.name}`);
      } else {
        console.log(`  ⚠️  游戏配置已存在: ${config.name}`);
      }
    }
    
    console.log(`\n📊 游戏时间配置初始化完成: 新增 ${insertedConfigs} 个配置`);
    
    // ======================
    // 创建系统管理员用户（如果不存在）
    // ======================
    console.log('\n👤 检查系统管理员用户...');
    
    const usersCollection = db.collection('users');
    const adminUser = await usersCollection.findOne({ email: 'admin@summer.app' });
    
    if (!adminUser) {
      const systemAdmin = {
        email: 'admin@summer.app',
        displayName: '系统管理员',
        role: 'admin',
        points: 0,
        currentStreak: 0,
        medals: {
          bronze: false,
          silver: false,
          gold: false,
          diamond: false
        },
        isSystemUser: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await usersCollection.insertOne(systemAdmin);
      console.log('  ✅ 创建系统管理员用户');
    } else {
      console.log('  ⚠️  系统管理员用户已存在');
    }
    
    // ======================
    // 验证数据完整性
    // ======================
    console.log('\n🔍 验证数据初始化结果...');
    
    const collections = [
      { name: 'tasks', description: '任务库' },
      { name: 'pointsRules', description: '积分规则' },
      { name: 'gameTimeConfigs', description: '游戏时间配置' },
      { name: 'users', description: '用户' }
    ];
    
    for (const { name, description } of collections) {
      try {
        const count = await db.collection(name).countDocuments();
        console.log(`  📊 ${description}集合: ${count} 条记录`);
      } catch (error) {
        console.log(`  ⚠️  ${description}集合: 访问失败`);
      }
    }
    
    // ======================
    // 初始化完成总结
    // ======================
    console.log('\n🎯 数据库初始化总结');
    console.log('='.repeat(50));
    console.log(`✅ 基础任务库: ${insertedTasks} 个任务`);
    console.log(`✅ 积分规则: ${insertedRules} 条规则`);
    console.log(`✅ 游戏配置: ${insertedConfigs} 个配置`);
    console.log('✅ 系统用户: 管理员账户');
    
    console.log('\n💡 初始化说明:');
    console.log('  - 基础任务涵盖5大类别，适合不同年龄段');
    console.log('  - 积分规则支持难度调节和每日限制');
    console.log('  - 游戏时间配置区分普通和教育游戏');
    console.log('  - 所有数据支持后续管理和扩展');
    
    console.log('\n🚀 下一步建议:');
    console.log('  1. 运行索引创建脚本优化查询性能');
    console.log('  2. 根据实际需求调整积分规则');
    console.log('  3. 添加更多适合的基础任务');
    console.log('  4. 配置家长和学生演示账户');
    
    return {
      tasks: insertedTasks,
      pointsRules: insertedRules,
      gameTimeConfigs: insertedConfigs,
      systemUsers: adminUser ? 0 : 1
    };
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 导出供其他脚本使用
module.exports = { initializeDatabase };

// 直接运行脚本时执行初始化
if (require.main === module) {
  initializeDatabase()
    .then((result) => {
      console.log('\n🏆 数据库初始化成功完成!');
      console.log(`📊 总计创建: ${Object.values(result).reduce((a, b) => a + b, 0)} 条记录`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 数据库初始化失败:', error);
      process.exit(1);
    });
}