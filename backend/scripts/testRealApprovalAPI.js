const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('🚀 真实审批API端到端测试');
console.log('===================================\n');

const API_BASE_URL = 'http://localhost:5000/api';

async function testRealApprovalAPI() {
  try {
    // 1. 登录获取token
    console.log('1️⃣ 爸爸用户登录获取JWT token...');
    
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: '爸爸',
        password: '' // 空密码
      }),
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`登录失败: ${errorData.error || loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    
    console.log('✅ 登录成功');
    console.log(`   用户: ${loginData.data.user.displayName}`);
    console.log(`   角色: ${loginData.data.user.role}`);
    console.log(`   Token: ${token.substring(0, 50)}...`);
    console.log('');
    
    // 2. 获取待审批任务列表
    console.log('2️⃣ 获取待审批任务列表...');
    
    const pendingTasksResponse = await fetch(`${API_BASE_URL}/daily-tasks/pending-approval`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!pendingTasksResponse.ok) {
      const errorData = await pendingTasksResponse.json();
      throw new Error(`获取待审批任务失败: ${errorData.error || pendingTasksResponse.statusText}`);
    }
    
    const pendingTasksData = await pendingTasksResponse.json();
    const pendingTasks = pendingTasksData.data.tasks || [];
    
    console.log(`✅ 找到 ${pendingTasks.length} 个待审批任务:`);
    
    if (pendingTasks.length === 0) {
      console.log('⚠️ 没有待审批任务，测试结束');
      return;
    }
    
    // 显示前3个任务
    for (let i = 0; i < Math.min(3, pendingTasks.length); i++) {
      const task = pendingTasks[i];
      console.log(`   任务${i+1}: ${task.task?.title || '未知任务'} (ID: ${task.id})`);
      console.log(`     学生: ${task.studentName}`);
      console.log(`     状态: ${task.status} -> ${task.approvalStatus || 'pending'}`);
    }
    console.log('');
    
    // 3. 测试审批第一个任务
    const testTask = pendingTasks[0];
    console.log(`3️⃣ 测试审批任务: ${testTask.task?.title || '未知任务'}...`);
    console.log(`   任务ID: ${testTask.id}`);
    console.log(`   学生: ${testTask.studentName}`);
    
    const approvalPayload = {
      action: 'approve',
      approvalNotes: '测试审批 - API端到端验证',
      bonusPoints: 1
    };
    
    console.log(`   请求体:`, approvalPayload);
    console.log('');
    
    // 发送审批请求
    const approvalResponse = await fetch(`${API_BASE_URL}/daily-tasks/${testTask.id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(approvalPayload),
    });
    
    const responseText = await approvalResponse.text();
    console.log(`📥 审批响应 (状态码: ${approvalResponse.status}):`);
    console.log('   响应头:', [...approvalResponse.headers.entries()]);
    console.log('   响应体:', responseText);
    console.log('');
    
    if (!approvalResponse.ok) {
      console.log('❌ 审批请求失败!');
      
      try {
        const errorData = JSON.parse(responseText);
        console.log(`   错误消息: ${errorData.error || '未知错误'}`);
        if (errorData.details) {
          console.log(`   详细信息:`, errorData.details);
        }
      } catch (parseError) {
        console.log(`   原始错误响应: ${responseText}`);
      }
      
      console.log('\n🔴 这是需要修复的错误！');
      return false;
    }
    
    const approvalData = JSON.parse(responseText);
    console.log('✅ 审批成功!');
    console.log(`   消息: ${approvalData.message}`);
    
    if (approvalData.data && approvalData.data.task) {
      const updatedTask = approvalData.data.task;
      console.log(`   更新后的任务状态: ${updatedTask.approvalStatus}`);
      console.log(`   积分奖励: ${updatedTask.pointsEarned || 0}`);
      console.log(`   奖励积分: ${updatedTask.bonusPoints || 0}`);
    }
    
    // 4. 验证审批结果
    console.log('\n4️⃣ 验证审批结果...');
    
    const verifyResponse = await fetch(`${API_BASE_URL}/daily-tasks/pending-approval`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      const remainingTasks = verifyData.data.tasks || [];
      const originalTaskStillPending = remainingTasks.find(t => t.id === testTask.id);
      
      if (originalTaskStillPending) {
        console.log('⚠️ 任务仍在待审批列表中，可能审批未生效');
        console.log(`   当前状态: ${originalTaskStillPending.approvalStatus}`);
      } else {
        console.log('✅ 任务已从待审批列表中移除，审批生效');
        console.log(`   剩余待审批任务: ${remainingTasks.length} 个`);
      }
    }
    
    console.log('\n🎉 端到端审批API测试完成！');
    return true;
    
  } catch (error) {
    console.log('\n❌ 端到端测试失败:');
    console.log(`   错误类型: ${error.name || 'Unknown'}`);
    console.log(`   错误消息: ${error.message}`);
    
    if (error.stack) {
      console.log(`   错误堆栈:`);
      console.log(error.stack.split('\n').slice(0, 6).map(line => `     ${line}`).join('\n'));
    }
    
    console.log('\n🔴 需要进一步调查的错误！');
    return false;
  }
}

// 运行测试
testRealApprovalAPI().then(success => {
  if (success) {
    console.log('\n✅ 测试结果: 审批功能正常工作!');
    process.exit(0);
  } else {
    console.log('\n❌ 测试结果: 审批功能存在问题!');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 测试执行异常:', error);
  process.exit(1);
});