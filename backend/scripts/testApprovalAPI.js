const { MongoClient, ObjectId } = require('mongodb');
const { sign } = require('jsonwebtoken');

async function testApprovalAPI() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/summer_app');
  
  try {
    await client.connect();
    console.log('=== 测试审批API修复效果 ===\n');
    
    // 1. 创建家长用户的JWT token
    const parentUserId = '68af0ea5e425c85da1ed5403'; // 爸爸的用户ID
    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key-here';
    
    const token = sign(
      {
        userId: parentUserId,
        email: '爸爸',
        role: 'parent'
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    console.log('1. 生成的JWT Token (前20字符):', token.substring(0, 20) + '...');
    
    // 2. 模拟API调用 - 直接调用数据库查询逻辑
    const db = client.db();
    const collections = {
      users: db.collection('users'),
      dailyTasks: db.collection('dailyTasks'),
      tasks: db.collection('tasks')
    };
    
    // 获取家长用户信息
    const parentUser = await collections.users.findOne({ _id: new ObjectId(parentUserId) });
    console.log('2. 家长用户信息:');
    console.log(`   姓名: ${parentUser.displayName}`);
    console.log(`   角色: ${parentUser.role}`);
    console.log(`   children字段: ${JSON.stringify(parentUser.children)}`);
    
    // 获取children IDs
    const childrenIds = parentUser.children || [];
    console.log('3. 子女用户ID列表:', childrenIds);
    
    if (childrenIds.length === 0) {
      console.log('❌ 错误: 家长用户没有关联的子女');
      return;
    }
    
    // 4. 使用修复后的查询逻辑
    console.log('4. 使用修复后的查询逻辑查找待审批任务...');
    const pendingTasks = await collections.dailyTasks.find({
      userId: { $in: childrenIds },
      status: 'completed',
      $or: [
        { approvalStatus: { $exists: false } },
        { approvalStatus: 'pending' }
      ]
    }).toArray();
    
    console.log(`✅ 查询到 ${pendingTasks.length} 个待审批任务`);
    
    if (pendingTasks.length > 0) {
      console.log('\n待审批任务详情:');
      for (let i = 0; i < pendingTasks.length; i++) {
        const task = pendingTasks[i];
        const studentUser = await collections.users.findOne({ _id: new ObjectId(task.userId) });
        const taskTemplate = await collections.tasks.findOne({ _id: new ObjectId(task.taskId) });
        
        console.log(`${i + 1}. 任务ID: ${task._id}`);
        console.log(`   学生: ${studentUser?.displayName || 'Unknown'}`);
        console.log(`   任务: ${taskTemplate?.title || 'Unknown Task'}`);
        console.log(`   状态: ${task.status}`);
        console.log(`   审批状态: ${task.approvalStatus || 'undefined'}`);
        console.log(`   积分: ${task.pointsEarned || 0}`);
        console.log(`   待审积分: ${task.pendingPoints || 0}`);
        console.log('');
      }
    }
    
    // 5. 测试新的查询逻辑 vs 旧的查询逻辑
    console.log('5. 对比测试 - 旧查询逻辑 (需要证据):');
    const oldQueryTasks = await collections.dailyTasks.find({
      userId: { $in: childrenIds },
      status: 'completed',
      $and: [
        {
          $or: [
            { evidenceText: { $exists: true, $ne: '' } },
            { evidenceMedia: { $exists: true, $not: { $size: 0 } } }
          ]
        },
        {
          $or: [
            { approvalStatus: { $exists: false } },
            { approvalStatus: 'pending' }
          ]
        }
      ]
    }).toArray();
    
    console.log(`   旧逻辑查询结果: ${oldQueryTasks.length} 个任务`);
    console.log(`   新逻辑查询结果: ${pendingTasks.length} 个任务`);
    console.log(`   修复效果: ${pendingTasks.length > oldQueryTasks.length ? '✅ 成功' : '⚠️  无改善'} (新逻辑显示更多任务)`);
    
  } catch (error) {
    console.error('测试出错:', error);
  } finally {
    await client.close();
  }
}

testApprovalAPI();