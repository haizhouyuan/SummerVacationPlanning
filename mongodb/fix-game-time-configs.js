// 修复GameTimeConfigs集合数据结构不匹配问题
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app';

async function fixGameTimeConfigs() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const gameTimeConfigsCollection = db.collection('gameTimeConfigs');
    
    // 获取现有配置数据
    const existingConfigs = await gameTimeConfigsCollection.find({}).toArray();
    console.log('Found existing configs:', existingConfigs.length);
    
    let normalConfig = null;
    let educationalConfig = null;
    
    for (const config of existingConfigs) {
      if (config.gameType === 'normal') {
        normalConfig = config;
      } else if (config.gameType === 'educational') {
        educationalConfig = config;
      }
    }
    
    if (!normalConfig || !educationalConfig) {
      console.error('Missing normal or educational game config');
      return;
    }
    
    // 创建统一的全局配置
    const unifiedConfig = {
      id: 'global-game-time-config',
      baseGameTimeMinutes: 30, // 每日基础免费游戏时间
      pointsToMinutesRatio: 0.5, // 每积分兑换0.5分钟 (普通游戏2积分/分钟的倒数)
      educationalGameBonus: normalConfig.pointsPerMinute / educationalConfig.pointsPerMinute, // 教育游戏积分消耗比例：2/1.5 = 1.33
      dailyGameTimeLimit: Math.max(normalConfig.maxDailyMinutes || 120, educationalConfig.maxDailyMinutes || 180), // 取较大值
      freeEducationalMinutes: 45, // 每日免费教育游戏时间
      weeklyAccumulationLimit: 100, // 每周积分累积上限
      dailyPointsLimit: 20, // 每日积分获取上限
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Creating unified config:', unifiedConfig);
    
    // 删除现有配置
    const deleteResult = await gameTimeConfigsCollection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing configs`);
    
    // 插入新的统一配置
    const insertResult = await gameTimeConfigsCollection.insertOne(unifiedConfig);
    console.log('Inserted unified config with ID:', insertResult.insertedId);
    
    // 验证结果
    const verifyConfig = await gameTimeConfigsCollection.findOne({ isActive: true });
    console.log('Verification - Active config:', verifyConfig ? 'Found' : 'Not found');
    console.log('Config fields validation:');
    console.log('- baseGameTimeMinutes:', verifyConfig?.baseGameTimeMinutes);
    console.log('- pointsToMinutesRatio:', verifyConfig?.pointsToMinutesRatio);
    console.log('- educationalGameBonus:', verifyConfig?.educationalGameBonus);
    console.log('- dailyPointsLimit:', verifyConfig?.dailyPointsLimit);
    
    console.log('✅ GameTimeConfigs structure fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing GameTimeConfigs:', error);
  } finally {
    await client.close();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  fixGameTimeConfigs().catch(console.error);
}

module.exports = { fixGameTimeConfigs };