// 统一DailyTasks证据字段，使用evidence数组替换evidenceText/evidenceMedia
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/summer_app';

async function unifyEvidenceFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const dailyTasksCollection = db.collection('dailyTasks');
    
    // 查找有旧字段的DailyTasks
    const tasksWithOldFields = await dailyTasksCollection.find({
      $or: [
        { evidenceText: { $exists: true } },
        { evidenceMedia: { $exists: true } }
      ]
    }).toArray();
    
    console.log(`Found ${tasksWithOldFields.length} tasks with old evidence fields`);
    
    let migratedCount = 0;
    let updatedCount = 0;
    
    for (const task of tasksWithOldFields) {
      const evidence = [];
      let hasChanges = false;
      
      // 迁移evidenceText到evidence数组
      if (task.evidenceText && task.evidenceText.trim()) {
        evidence.push({
          type: 'text',
          content: task.evidenceText.trim(),
          timestamp: task.completedAt || task.updatedAt || new Date()
        });
        hasChanges = true;
      }
      
      // 迁移evidenceMedia到evidence数组
      if (task.evidenceMedia && Array.isArray(task.evidenceMedia) && task.evidenceMedia.length > 0) {
        for (const mediaItem of task.evidenceMedia) {
          evidence.push({
            type: mediaItem.type === 'image' ? 'photo' : mediaItem.type,
            content: mediaItem.url || mediaItem.filename,
            timestamp: task.completedAt || task.updatedAt || new Date(),
            metadata: {
              filename: mediaItem.filename,
              size: mediaItem.size,
              mimetype: mediaItem.mimetype
            }
          });
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        // 更新任务，设置新的evidence数组并移除旧字段
        const updateData = {
          $set: {
            evidence: evidence,
            updatedAt: new Date()
          },
          $unset: {
            evidenceText: "",
            evidenceMedia: ""
          }
        };
        
        const result = await dailyTasksCollection.updateOne(
          { _id: task._id },
          updateData
        );
        
        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`✅ Migrated task ${task._id}: ${evidence.length} evidence items`);
        }
        
        migratedCount++;
      }
    }
    
    // 验证迁移结果
    console.log('\nVerification:');
    
    const remainingOldFields = await dailyTasksCollection.countDocuments({
      $or: [
        { evidenceText: { $exists: true } },
        { evidenceMedia: { $exists: true } }
      ]
    });
    
    const tasksWithEvidence = await dailyTasksCollection.countDocuments({
      evidence: { $exists: true, $not: { $size: 0 } }
    });
    
    console.log(`- Tasks with old evidence fields remaining: ${remainingOldFields}`);
    console.log(`- Tasks with new evidence array: ${tasksWithEvidence}`);
    
    // 检查数据样本
    const sampleTask = await dailyTasksCollection.findOne({ 
      evidence: { $exists: true, $not: { $size: 0 } }
    });
    
    if (sampleTask) {
      console.log('\nSample migrated task evidence:');
      console.log('- Task ID:', sampleTask._id);
      console.log('- Evidence count:', sampleTask.evidence?.length || 0);
      if (sampleTask.evidence && sampleTask.evidence.length > 0) {
        console.log('- Sample evidence item:', {
          type: sampleTask.evidence[0].type,
          hasContent: !!sampleTask.evidence[0].content,
          hasTimestamp: !!sampleTask.evidence[0].timestamp
        });
      }
    }
    
    console.log(`\n✅ Evidence field unification completed!`);
    console.log(`📊 Migration summary:`);
    console.log(`   - Tasks processed: ${migratedCount}`);
    console.log(`   - Tasks updated: ${updatedCount}`);
    console.log(`   - Remaining old fields: ${remainingOldFields}`);
    
  } catch (error) {
    console.error('Error unifying evidence fields:', error);
  } finally {
    await client.close();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  unifyEvidenceFields().catch(console.error);
}

module.exports = { unifyEvidenceFields };