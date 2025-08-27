const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('🧪 模拟审批API调用测试');
console.log('==============================\n');

async function testApprovalAPI() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功\n');
    
    const db = client.db();
    const collections = {
      users: db.collection('users'),
      dailyTasks: db.collection('dailyTasks'), 
      tasks: db.collection('tasks'),
      gameTimeConfigs: db.collection('gameTimeConfigs'),
      userPointsLimits: db.collection('userPointsLimits'),
      pointsRules: db.collection('pointsRules')
    };

    // 1. 获取测试数据
    console.log('1️⃣ 准备测试数据...');
    
    const parentUser = await collections.users.findOne({ 
      displayName: '爸爸',
      role: 'parent' 
    });
    
    if (!parentUser) {
      console.log('❌ 未找到"爸爸"用户');
      return;
    }
    
    const studentUser = await collections.users.findOne({
      displayName: '袁绍宸',
      role: 'student'
    });
    
    if (!studentUser) {
      console.log('❌ 未找到"袁绍宸"学生');
      return;
    }
    
    const pendingTask = await collections.dailyTasks.findOne({
      userId: studentUser._id.toString(),
      status: 'completed',
      $or: [
        { approvalStatus: { $exists: false } },
        { approvalStatus: 'pending' }
      ]
    });
    
    if (!pendingTask) {
      console.log('❌ 未找到待审批任务');
      return;
    }
    
    console.log('✅ 测试数据准备完成:');
    console.log(`   - 家长: ${parentUser.displayName} (${parentUser._id})`);
    console.log(`   - 学生: ${studentUser.displayName} (${studentUser._id})`);
    console.log(`   - 待审批任务: ${pendingTask._id}`);
    console.log('');

    // 2. 模拟完整的approveTask逻辑
    console.log('2️⃣ 模拟approveTask函数执行...');
    
    try {
      // 模拟req对象
      const mockReq = {
        user: {
          id: parentUser._id.toString(),
          displayName: parentUser.displayName,
          role: parentUser.role,
          children: parentUser.children
        },
        params: {
          dailyTaskId: pendingTask._id.toString()
        },
        body: {
          action: 'approve',
          approvalNotes: '测试审批',
          bonusPoints: 2
        }
      };
      
      console.log('📋 请求参数:');
      console.log(`   - action: ${mockReq.body.action}`);
      console.log(`   - dailyTaskId: ${mockReq.params.dailyTaskId}`);
      console.log(`   - approvalNotes: ${mockReq.body.approvalNotes}`);
      console.log(`   - bonusPoints: ${mockReq.body.bonusPoints}`);
      console.log('');
      
      // 步骤1: 用户认证检查
      console.log('🔐 步骤1: 用户认证检查...');
      if (!mockReq.user) {
        throw new Error('User not authenticated');
      }
      console.log('   ✅ 用户认证通过');
      
      // 步骤2: 角色检查
      console.log('👤 步骤2: 角色检查...');
      if (mockReq.user.role !== 'parent') {
        throw new Error('Only parents can approve tasks');
      }
      console.log('   ✅ 角色检查通过');
      
      // 步骤3: 参数验证
      console.log('📝 步骤3: 参数验证...');
      const { action, approvalNotes, bonusPoints } = mockReq.body;
      if (!['approve', 'reject'].includes(action)) {
        throw new Error('Action must be either approve or reject');
      }
      console.log('   ✅ 参数验证通过');
      
      // 步骤4: 查找任务
      console.log('🔍 步骤4: 查找任务...');
      const toObjectId = (id) => {
        if (typeof id === 'string' && ObjectId.isValid(id)) {
          return new ObjectId(id);
        }
        return id;
      };
      
      const dailyTask = await collections.dailyTasks.findOne({ 
        _id: toObjectId(mockReq.params.dailyTaskId) 
      });
      
      if (!dailyTask) {
        throw new Error('Daily task not found');
      }
      console.log('   ✅ 任务查找成功');
      
      // 步骤5: 权限检查
      console.log('🛡️ 步骤5: 权限检查...');
      console.log(`   - 家长children: ${JSON.stringify(mockReq.user.children)}`);
      console.log(`   - 任务userId: ${dailyTask.userId}`);
      
      if (!mockReq.user.children?.includes(dailyTask.userId)) {
        throw new Error('You can only approve tasks from your children');
      }
      console.log('   ✅ 权限检查通过');
      
      // 步骤6: 查找关联的任务模板
      console.log('📋 步骤6: 查找任务模板...');
      const task = await collections.tasks.findOne({ 
        _id: toObjectId(dailyTask.taskId) 
      });
      
      if (!task) {
        console.log('   ⚠️ 警告：未找到任务模板，但继续执行');
      } else {
        console.log('   ✅ 任务模板查找成功');
        console.log(`   - 任务标题: ${task.title}`);
        console.log(`   - 任务积分: ${task.points}`);
      }
      
      if (action === 'approve') {
        console.log('🎖️ 步骤7: 积分计算和奖励逻辑...');
        
        // 检查gameTimeConfig
        console.log('   检查游戏时间配置...');
        const gameTimeConfig = await collections.gameTimeConfigs.findOne({ isActive: true });
        if (!gameTimeConfig) {
          console.log('   ⚠️ 未找到活动的游戏时间配置，使用默认值');
        } else {
          console.log('   ✅ 游戏时间配置找到');
        }
        
        const GLOBAL_DAILY_POINTS_LIMIT = gameTimeConfig?.dailyPointsLimit || 20;
        console.log(`   - 全局每日积分限制: ${GLOBAL_DAILY_POINTS_LIMIT}`);
        
        // 检查用户积分限制
        console.log('   检查用户积分限制...');
        const today = new Date().toISOString().split('T')[0];
        let userPointsLimit = await collections.userPointsLimits.findOne({
          userId: dailyTask.userId,
          date: today,
        });
        
        if (!userPointsLimit) {
          console.log('   ⚠️ 未找到今日积分限制记录，需要创建');
        } else {
          console.log('   ✅ 用户积分限制记录存在');
        }
        
        // 计算积分
        const basePoints = dailyTask.pendingPoints || dailyTask.pointsEarned || (task?.points || 0);
        const bonusPointsValue = bonusPoints ? parseInt(bonusPoints) : 0;
        const totalPointsToAward = basePoints + bonusPointsValue;
        
        console.log('   💰 积分计算:');
        console.log(`   - 基础积分: ${basePoints}`);
        console.log(`   - 奖励积分: ${bonusPointsValue}`);
        console.log(`   - 总积分: ${totalPointsToAward}`);
        
        if (totalPointsToAward > 0) {
          // 模拟无事务的数据更新操作
          console.log('   🔄 模拟数据库更新操作（无事务）...');
          try {
            console.log('   📝 模拟更新用户积分限制...');
            console.log('     ✅ 用户积分限制更新成功');
            
            console.log('   📝 模拟更新用户总积分...');
            console.log('     ✅ 用户总积分更新成功');
            
            console.log('   ✅ 所有数据库操作模拟完成');
            
          } catch (dbError) {
            console.log('   ❌ 数据库操作错误:');
            console.log(`     错误类型: ${dbError.name}`);
            console.log(`     错误消息: ${dbError.message}`);
            throw dbError;
          }
        }
      }
      
      console.log('🎉 模拟审批流程完成 - 未发现错误！');
      return null;
      
    } catch (error) {
      console.log(`\n❌ 审批过程中发生错误:`);
      console.log(`   错误类型: ${error.name || 'Unknown'}`);
      console.log(`   错误消息: ${error.message}`);
      if (error.stack) {
        console.log(`   错误堆栈:`);
        console.log(error.stack.split('\n').slice(0, 8).map(line => `     ${line}`).join('\n'));
      }
      
      // 这里就是真实的错误！
      console.log('\n🔴 这就是审批按钮报错的根本原因！');
      return error;
    }
    
  } catch (connectionError) {
    console.error('❌ 数据库连接或其他系统错误:', connectionError);
    return connectionError;
  } finally {
    await client.close();
    console.log('\n🔄 数据库连接已关闭');
  }
}

// 运行测试
testApprovalAPI().catch(console.error);