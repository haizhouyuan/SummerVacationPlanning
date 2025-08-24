// 修复UserPointsLimits索引错误，改为userId+date唯一索引
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app';

async function fixUserPointsLimitsIndex() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('userPointsLimits');
    
    // 检查现有索引
    console.log('Checking existing indexes...');
    const existingIndexes = await collection.indexes();
    console.log('Current indexes:', existingIndexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // 删除错误的索引（如果存在）
    const wrongIndexName = 'idx_user_limits_user_category';
    const wrongIndex = existingIndexes.find(idx => idx.name === wrongIndexName);
    
    if (wrongIndex) {
      console.log(`Dropping incorrect index: ${wrongIndexName}`);
      await collection.dropIndex(wrongIndexName);
      console.log('✅ Dropped incorrect index');
    } else {
      console.log('❌ Incorrect index not found, may have been dropped already');
    }
    
    // 创建正确的唯一索引：userId + date
    console.log('Creating correct unique index: userId + date');
    
    try {
      await collection.createIndex(
        { userId: 1, date: 1 },
        { 
          name: 'idx_user_points_limits_user_date_unique',
          unique: true // 唯一约束：每个用户每天只能有一条记录
        }
      );
      console.log('✅ Created unique index on userId + date');
    } catch (error) {
      if (error.code === 85) { // IndexOptionsConflict
        console.log('Index already exists, checking if it\'s correct...');
        const existingIndex = await collection.indexes();
        const userDateIndex = existingIndex.find(idx => 
          JSON.stringify(idx.key) === JSON.stringify({ userId: 1, date: 1 })
        );
        if (userDateIndex) {
          console.log('✅ Correct index already exists');
        }
      } else {
        throw error;
      }
    }
    
    // 验证最终索引状态
    console.log('\nVerification:');
    const finalIndexes = await collection.indexes();
    console.log('Final indexes:');
    finalIndexes.forEach(idx => {
      console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? ' (UNIQUE)' : ''}`);
    });
    
    // 检查是否有正确的userId+date索引
    const correctIndex = finalIndexes.find(idx => 
      JSON.stringify(idx.key) === JSON.stringify({ userId: 1, date: 1 })
    );
    
    if (correctIndex) {
      console.log('✅ Correct userId+date index found');
      if (correctIndex.unique) {
        console.log('✅ Index has unique constraint');
      } else {
        console.log('⚠️  Index exists but missing unique constraint');
      }
    } else {
      console.log('❌ Correct userId+date index NOT found');
    }
    
    // 检查集合数据量
    const docCount = await collection.countDocuments();
    console.log(`- Collection document count: ${docCount}`);
    
    if (docCount > 0) {
      // 检查是否有重复的userId+date组合
      const pipeline = [
        {
          $group: {
            _id: { userId: "$userId", date: "$date" },
            count: { $sum: 1 }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        }
      ];
      
      const duplicates = await collection.aggregate(pipeline).toArray();
      
      if (duplicates.length > 0) {
        console.log(`⚠️  Found ${duplicates.length} duplicate userId+date combinations`);
        console.log('Sample duplicates:', duplicates.slice(0, 3));
        console.log('Consider cleaning up duplicates before creating unique index');
      } else {
        console.log('✅ No duplicate userId+date combinations found');
      }
    }
    
    console.log('\n✅ UserPointsLimits index fix completed!');
    
  } catch (error) {
    console.error('Error fixing UserPointsLimits index:', error);
  } finally {
    await client.close();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  fixUserPointsLimitsIndex().catch(console.error);
}

module.exports = { fixUserPointsLimitsIndex };