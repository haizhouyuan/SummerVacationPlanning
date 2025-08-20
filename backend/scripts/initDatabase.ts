import { MongoClient } from 'mongodb';
import { PointsRule, GameTimeConfig } from '../src/types';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/summer_app';

async function initializeDatabase() {
  const client = new MongoClient(mongoUri);

  try {
    console.log('🔌 连接到 MongoDB...');
    await client.connect();
    console.log('✅ 已连接到 MongoDB');

    const db = client.db();
    
    // 创建集合引用
    const collections = {
      users: db.collection('users'),
      tasks: db.collection('tasks'),
      dailyTasks: db.collection('dailyTasks'),
      redemptions: db.collection('redemptions'),
      gameTimeExchanges: db.collection('gameTimeExchanges'),
      gameSessions: db.collection('gameSessions'),
      pointsRules: db.collection('pointsRules'),
      gameTimeConfigs: db.collection('gameTimeConfigs'),
      userPointsLimits: db.collection('userPointsLimits'),
    };

    console.log('📊 检查现有数据...');
    
    // 检查是否已有积分规则
    const existingRules = await collections.pointsRules.countDocuments();
    const existingConfigs = await collections.gameTimeConfigs.countDocuments();
    
    if (existingRules > 0) {
      console.log(`⚠️  数据库中已存在 ${existingRules} 条积分规则，跳过初始化`);
    } else {
      console.log('🎯 初始化默认积分规则...');
      
      // 默认积分规则（基于需求文档2025-08-04）
      const defaultRules: Omit<PointsRule, 'id'>[] = [
        // 日记任务：基础2分 + 每50字1分（封顶+10分）
        {
          category: 'reading',
          activity: 'diary',
          basePoints: 2,
          bonusRules: [
            {
              type: 'word_count',
              threshold: 50,
              bonusPoints: 1,
              maxBonus: 10,
            },
          ],
          multipliers: {
            difficulty: {
              easy: 1.0,
              medium: 1.2,
              hard: 1.5,
            },
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // 数学视频：基础2分 + 提前完成课程奖励5分
        {
          category: 'learning',
          activity: 'math_video',
          basePoints: 2,
          bonusRules: [
            {
              type: 'completion',
              threshold: 1,
              bonusPoints: 5, // Bonus for completing ahead of grade level
            },
          ],
          multipliers: {
            difficulty: {
              easy: 1.0,
              medium: 1.2,
              hard: 1.5,
            },
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // 奥数题：每题1分
        {
          category: 'learning',
          activity: 'olympiad_problem',
          basePoints: 1,
          multipliers: {
            difficulty: {
              easy: 1.0,
              medium: 1.2,
              hard: 1.5,
            },
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // 运动任务：基础0分 + 每10分钟1分，每日封顶3分
        {
          category: 'exercise',
          activity: 'general_exercise',
          basePoints: 0,
          bonusRules: [
            {
              type: 'duration',
              threshold: 10, // 每10分钟
              bonusPoints: 1, // 1分
            },
          ],
          dailyLimit: 3, // 每日封顶3分
          multipliers: {
            difficulty: {
              easy: 1.0,
              medium: 1.2,
              hard: 1.5,
            },
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // 编程游戏：基础2分
        {
          category: 'creativity',
          activity: 'programming_game',
          basePoints: 2,
          multipliers: {
            difficulty: {
              easy: 1.0,
              medium: 1.2,
              hard: 1.5,
            },
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // DIY项目里程碑
        {
          category: 'creativity',
          activity: 'diy_project_milestone',
          basePoints: 10,
          multipliers: {
            difficulty: {
              easy: 1.0,
              medium: 1.2,
              hard: 1.5,
            },
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // DIY项目完成
        {
          category: 'creativity',
          activity: 'diy_project_complete',
          basePoints: 50,
          multipliers: {
            difficulty: {
              easy: 1.0,
              medium: 1.2,
              hard: 1.5,
            },
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // 音乐练习：基础0分 + 每15分钟1分 + 优秀表现奖励2分
        {
          category: 'other',
          activity: 'music_practice',
          basePoints: 0,
          bonusRules: [
            {
              type: 'duration',
              threshold: 15, // 每15分钟
              bonusPoints: 1, // 1分
            },
            {
              type: 'quality',
              threshold: 1, // 优秀表现
              bonusPoints: 2, // 奖励2分
            },
          ],
          multipliers: {
            difficulty: {
              easy: 1.0,
              medium: 1.2,
              hard: 1.5,
            },
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // 家务劳动：基础1分
        {
          category: 'other',
          activity: 'chores',
          basePoints: 1,
          multipliers: {
            difficulty: {
              easy: 1.0,
              medium: 1.2,
              hard: 1.5,
            },
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // 插入默认积分规则
      const rulesResult = await collections.pointsRules.insertMany(defaultRules);
      console.log(`✅ 已插入 ${rulesResult.insertedCount} 条默认积分规则`);
    }

    if (existingConfigs > 0) {
      console.log(`⚠️  数据库中已存在 ${existingConfigs} 个游戏时间配置，跳过初始化`);
    } else {
      console.log('🎮 初始化默认游戏时间配置...');
      
      // 创建默认游戏时间配置
      const defaultGameTimeConfig: Omit<GameTimeConfig, 'id'> = {
        baseGameTimeMinutes: 30,
        pointsToMinutesRatio: 5, // 1 point = 5 minutes
        educationalGameBonus: 2, // Educational games: 1 point = 10 minutes
        dailyGameTimeLimit: 120,
        freeEducationalMinutes: 20,
        weeklyAccumulationLimit: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const configResult = await collections.gameTimeConfigs.insertOne(defaultGameTimeConfig);
      console.log('✅ 已插入默认游戏时间配置');
    }

    // 验证数据插入
    console.log('🔍 验证数据插入结果...');
    const finalRulesCount = await collections.pointsRules.countDocuments();
    const finalConfigsCount = await collections.gameTimeConfigs.countDocuments();
    
    console.log(`📊 积分规则总数: ${finalRulesCount}`);
    console.log(`📊 游戏时间配置总数: ${finalConfigsCount}`);

    // 显示一些示例规则
    const sampleRules = await collections.pointsRules.find().limit(3).toArray();
    console.log('📝 示例积分规则:');
    sampleRules.forEach((rule, index) => {
      console.log(`  ${index + 1}. ${rule.activity} (${rule.category}): ${rule.basePoints}分`);
    });

    console.log('🎉 数据库初始化完成！');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 已断开 MongoDB 连接');
  }
}

// 执行初始化
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ 初始化脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 初始化脚本执行失败:', error);
      process.exit(1);
    });
}

export { initializeDatabase };