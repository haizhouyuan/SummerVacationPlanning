const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('🔍 任务审批按钮报错诊断脚本');
console.log('=====================================\n');

async function diagnosticApprovalIssue() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功\n');
    
    const db = client.db();
    const users = db.collection('users');
    const dailyTasks = db.collection('dailyTasks'); 
    const tasks = db.collection('tasks');

    // 1. 查找"爸爸"用户
    console.log('1️⃣ 查找"爸爸"用户...');
    const parentUser = await users.findOne({ 
      displayName: '爸爸',
      role: 'parent' 
    });
    
    if (!parentUser) {
      console.log('❌ 未找到"爸爸"用户');
      return;
    }
    
    console.log('✅ 找到"爸爸"用户:');
    console.log(`   - ID: ${parentUser._id} (类型: ${typeof parentUser._id})`);
    console.log(`   - children数组: ${JSON.stringify(parentUser.children)} (类型: ${typeof parentUser.children})`);
    
    if (parentUser.children && parentUser.children.length > 0) {
      console.log(`   - children[0]类型: ${typeof parentUser.children[0]}`);
      console.log(`   - children长度: ${parentUser.children.length}`);
    }
    console.log('');
    
    // 2. 查找"袁绍宸"学生
    console.log('2️⃣ 查找"袁绍宸"学生...');
    const studentUser = await users.findOne({
      displayName: '袁绍宸',
      role: 'student'
    });
    
    if (!studentUser) {
      console.log('❌ 未找到"袁绍宸"学生');
      return;
    }
    
    console.log('✅ 找到"袁绍宸"学生:');
    console.log(`   - ID: ${studentUser._id} (类型: ${typeof studentUser._id})`);
    console.log(`   - ID字符串: ${studentUser._id.toString()}`);
    console.log(`   - parentId: ${studentUser.parentId} (类型: ${typeof studentUser.parentId})`);
    console.log('');
    
    // 3. 测试权限检查逻辑
    console.log('3️⃣ 测试权限检查逻辑...');
    
    // 模拟req.user对象
    const mockReqUser = {
      id: parentUser._id.toString(),
      displayName: parentUser.displayName,
      role: parentUser.role,
      children: parentUser.children
    };
    
    // 模拟dailyTask对象 
    const mockDailyTask = {
      userId: studentUser._id.toString() // 这是关键：检查这个值的格式
    };
    
    console.log('权限检查测试数据:');
    console.log(`   - req.user.children: ${JSON.stringify(mockReqUser.children)}`);
    console.log(`   - dailyTask.userId: ${mockDailyTask.userId} (类型: ${typeof mockDailyTask.userId})`);
    
    // 执行实际的权限检查逻辑
    const hasPermission = mockReqUser.children?.includes(mockDailyTask.userId);
    console.log(`   - 权限检查结果: ${hasPermission} ${hasPermission ? '✅' : '❌'}`);
    
    // 详细分析每个children元素
    if (mockReqUser.children && mockReqUser.children.length > 0) {
      console.log('\n详细比较分析:');
      mockReqUser.children.forEach((childId, index) => {
        console.log(`   children[${index}]: "${childId}" (类型: ${typeof childId}, 长度: ${childId?.length})`);
        console.log(`   dailyTask.userId: "${mockDailyTask.userId}" (类型: ${typeof mockDailyTask.userId}, 长度: ${mockDailyTask.userId.length})`);
        console.log(`   严格相等比较: ${childId === mockDailyTask.userId} ${childId === mockDailyTask.userId ? '✅' : '❌'}`);
        
        // 如果不相等，分析具体差异
        if (childId !== mockDailyTask.userId) {
          console.log(`   - 字符码比较:`);
          const minLen = Math.min(childId?.length || 0, mockDailyTask.userId.length);
          let firstDiff = -1;
          for (let i = 0; i < minLen; i++) {
            if (childId[i] !== mockDailyTask.userId[i]) {
              firstDiff = i;
              break;
            }
          }
          if (firstDiff >= 0) {
            console.log(`     第${firstDiff}位不同: "${childId[firstDiff]}" vs "${mockDailyTask.userId[firstDiff]}"`);
          } else if (childId?.length !== mockDailyTask.userId.length) {
            console.log(`     长度不同: ${childId?.length} vs ${mockDailyTask.userId.length}`);
          }
        }
        console.log('');
      });
    }
    
    // 4. 查找实际的待审批任务
    console.log('4️⃣ 查找"袁绍宸"的实际待审批任务...');
    const pendingTasks = await dailyTasks.find({
      userId: studentUser._id.toString(),
      status: 'completed',
      $or: [
        { approvalStatus: { $exists: false } },
        { approvalStatus: 'pending' }
      ]
    }).limit(3).toArray();
    
    console.log(`找到 ${pendingTasks.length} 个待审批任务:`);
    for (let i = 0; i < pendingTasks.length; i++) {
      const dailyTask = pendingTasks[i];
      console.log(`   任务${i+1}:`);
      console.log(`     - ID: ${dailyTask._id}`);
      console.log(`     - userId: ${dailyTask.userId} (类型: ${typeof dailyTask.userId})`);
      console.log(`     - status: ${dailyTask.status}`);
      console.log(`     - approvalStatus: ${dailyTask.approvalStatus || '无'}`);
      
      // 测试这个具体任务的权限检查
      const taskPermission = mockReqUser.children?.includes(dailyTask.userId);
      console.log(`     - 权限检查结果: ${taskPermission} ${taskPermission ? '✅' : '❌'}`);
      console.log('');
    }
    
    // 5. 模拟审批API调用
    console.log('5️⃣ 模拟审批API调用测试...');
    if (pendingTasks.length > 0) {
      const testTask = pendingTasks[0];
      console.log(`使用任务ID: ${testTask._id} 进行测试`);
      
      // 模拟完整的approveTask逻辑检查
      console.log('模拟approveTask函数检查:');
      console.log(`1. 用户认证: ✅ (模拟通过)`);
      console.log(`2. 角色检查: ${mockReqUser.role === 'parent' ? '✅' : '❌'} (${mockReqUser.role})`);
      console.log(`3. 任务存在: ✅ (已找到)`);
      
      // 关键的权限检查
      const finalPermissionCheck = mockReqUser.children?.includes(testTask.userId);
      console.log(`4. 权限检查: ${finalPermissionCheck ? '✅' : '❌'}`);
      console.log(`   - req.user.children?.includes(dailyTask.userId)`);
      console.log(`   - children数组: ${JSON.stringify(mockReqUser.children)}`);  
      console.log(`   - 目标userId: ${testTask.userId}`);
      console.log(`   - includes结果: ${finalPermissionCheck}`);
      
      if (!finalPermissionCheck) {
        console.log('🔴 权限检查失败！这就是审批按钮报错的根本原因！');
      } else {
        console.log('✅ 权限检查通过，问题可能在其他地方');
      }
    }
    
    // 6. 数据修复建议
    console.log('\n6️⃣ 数据修复建议:');
    if (!mockReqUser.children?.includes(studentUser._id.toString())) {
      console.log('🔧 建议修复措施:');
      console.log('   1. 确保parents.children数组包含正确的学生ID');
      console.log('   2. 检查数据类型一致性（都应该是字符串）');
      console.log('   3. 验证ID格式是否完全匹配');
      
      // 提供具体的修复命令
      console.log('\n修复命令 (如果需要):');
      console.log(`db.users.updateOne(
  { _id: ObjectId("${parentUser._id}") },
  { $addToSet: { children: "${studentUser._id.toString()}" } }
)`);
    }
    
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error);
  } finally {
    await client.close();
    console.log('\n🔄 数据库连接已关闭');
  }
}

// 运行诊断
diagnosticApprovalIssue().catch(console.error);