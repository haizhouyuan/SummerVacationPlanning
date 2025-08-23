// 修复PointsRules集合数据结构不匹配问题
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app';

async function fixPointsRules() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const pointsRulesCollection = db.collection('pointsRules');
    
    // 获取现有积分规则数据
    const existingRules = await pointsRulesCollection.find({}).toArray();
    console.log('Found existing rules:', existingRules.length);
    
    // 创建符合新接口的积分规则
    const newPointsRules = [
      // 阅读类任务规则
      {
        id: 'reading_general_rule',
        category: 'reading',
        activity: 'reading_general', // 标准化的activity标识
        basePoints: 10,
        bonusRules: [
          {
            type: 'word_count',
            threshold: 100,
            bonusPoints: 1,
            maxBonus: 5
          }
        ],
        dailyLimit: 50,
        multipliers: {
          difficulty: { easy: 1, medium: 1.2, hard: 1.5 },
          quality: { good: 1.1, excellent: 1.2 },
          medal: { bronze: 1.1, silver: 1.2, gold: 1.3, diamond: 1.5 }
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 学习类任务规则
      {
        id: 'learning_general_rule',
        category: 'learning',
        activity: 'learning_general',
        basePoints: 12,
        bonusRules: [
          {
            type: 'duration',
            threshold: 30,
            bonusPoints: 2,
            maxBonus: 8
          }
        ],
        dailyLimit: 60,
        multipliers: {
          difficulty: { easy: 1, medium: 1.3, hard: 1.6 },
          quality: { good: 1.1, excellent: 1.2 },
          medal: { bronze: 1.1, silver: 1.2, gold: 1.3, diamond: 1.5 }
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 运动类任务规则
      {
        id: 'exercise_general_rule',
        category: 'exercise',
        activity: 'exercise_general',
        basePoints: 15,
        bonusRules: [
          {
            type: 'duration',
            threshold: 20,
            bonusPoints: 3,
            maxBonus: 10
          }
        ],
        dailyLimit: 45,
        multipliers: {
          difficulty: { easy: 1, medium: 1.2, hard: 1.4 },
          quality: { good: 1.1, excellent: 1.2 },
          medal: { bronze: 1.1, silver: 1.2, gold: 1.3, diamond: 1.5 }
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 创意类任务规则
      {
        id: 'creativity_general_rule',
        category: 'creativity',
        activity: 'creativity_general',
        basePoints: 18,
        bonusRules: [
          {
            type: 'quality',
            threshold: 1,
            bonusPoints: 5,
            maxBonus: 15
          }
        ],
        dailyLimit: 40,
        multipliers: {
          difficulty: { easy: 1, medium: 1.3, hard: 1.5 },
          quality: { good: 1.2, excellent: 1.4 },
          medal: { bronze: 1.1, silver: 1.2, gold: 1.3, diamond: 1.5 }
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 家务类任务规则
      {
        id: 'chores_general_rule',
        category: 'chores',
        activity: 'chores_general',
        basePoints: 8,
        bonusRules: [
          {
            type: 'completion',
            threshold: 1,
            bonusPoints: 2,
            maxBonus: 6
          }
        ],
        dailyLimit: 30,
        multipliers: {
          difficulty: { easy: 1, medium: 1.2, hard: 1.4 },
          quality: { good: 1.1, excellent: 1.3 },
          medal: { bronze: 1.1, silver: 1.2, gold: 1.3, diamond: 1.5 }
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 通用任务规则 (fallback)
      {
        id: 'general_rule',
        category: 'other',
        activity: 'general',
        basePoints: 5,
        bonusRules: [],
        dailyLimit: 25,
        multipliers: {
          difficulty: { easy: 1, medium: 1.2, hard: 1.5 },
          quality: { good: 1.1, excellent: 1.2 },
          medal: { bronze: 1.1, silver: 1.2, gold: 1.3, diamond: 1.5 }
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    console.log('Creating new points rules structure...');
    
    // 删除现有规则
    const deleteResult = await pointsRulesCollection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing rules`);
    
    // 插入新规则
    const insertResult = await pointsRulesCollection.insertMany(newPointsRules);
    console.log(`Inserted ${insertResult.insertedCount} new rules`);
    
    // 验证结果
    const verifyRules = await pointsRulesCollection.find({ isActive: true }).toArray();
    console.log(`Verification - Found ${verifyRules.length} active rules`);
    
    // 检查关键字段
    const sampleRule = verifyRules[0];
    console.log('Sample rule validation:');
    console.log('- Has activity field:', !!sampleRule.activity);
    console.log('- Has bonusRules array:', Array.isArray(sampleRule.bonusRules));
    console.log('- Has multipliers object:', !!sampleRule.multipliers);
    console.log('- Has dailyLimit:', !!sampleRule.dailyLimit);
    
    console.log('✅ PointsRules structure fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing PointsRules:', error);
  } finally {
    await client.close();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  fixPointsRules().catch(console.error);
}

module.exports = { fixPointsRules };