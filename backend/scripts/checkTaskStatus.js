const { MongoClient, ObjectId } = require('mongodb');

async function checkTaskStatus() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/summer_app');
  
  try {
    await client.connect();
    const db = client.db();
    const dailyTasks = db.collection('dailyTasks');
    
    console.log('=== 检查任务状态数据 ===\n');
    
    // 获取所有daily tasks
    const allTasks = await dailyTasks.find({}).toArray();
    
    console.log(`总任务数: ${allTasks.length}\n`);
    
    if (allTasks.length > 0) {
      console.log('所有任务状态:');
      allTasks.forEach((task, index) => {
        console.log(`${index + 1}. 任务ID: ${task._id}`);
        console.log(`   用户ID: ${task.userId}`);
        console.log(`   任务模板ID: ${task.taskId}`);
        console.log(`   状态: ${task.status}`);
        console.log(`   审批状态: ${task.approvalStatus || 'undefined'}`);
        console.log(`   积分: ${task.pointsEarned || 0}`);
        console.log(`   待审积分: ${task.pendingPoints || 0}`);
        console.log(`   创建时间: ${task.createdAt}`);
        console.log(`   完成时间: ${task.completedAt || 'N/A'}`);
        console.log(`   证据文字: ${task.evidenceText || 'N/A'}`);
        console.log(`   证据媒体: ${task.evidenceMedia ? JSON.stringify(task.evidenceMedia) : 'N/A'}`);
        console.log('');
      });
      
      // 统计各种状态
      const statusStats = {};
      const approvalStats = {};
      
      allTasks.forEach(task => {
        statusStats[task.status] = (statusStats[task.status] || 0) + 1;
        approvalStats[task.approvalStatus || 'undefined'] = (approvalStats[task.approvalStatus || 'undefined'] || 0) + 1;
      });
      
      console.log('=== 状态统计 ===');
      console.log('任务状态统计:');
      Object.entries(statusStats).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      
      console.log('\n审批状态统计:');
      Object.entries(approvalStats).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      
      // 查找待审批的任务
      const completedTasks = allTasks.filter(task => task.status === 'completed');
      const pendingApprovalTasks = completedTasks.filter(task => 
        !task.approvalStatus || task.approvalStatus === 'pending'
      );
      
      console.log('\n=== 审批分析 ===');
      console.log(`已完成任务数: ${completedTasks.length}`);
      console.log(`待审批任务数: ${pendingApprovalTasks.length}`);
      
      if (pendingApprovalTasks.length > 0) {
        console.log('\n待审批任务详情:');
        pendingApprovalTasks.forEach((task, index) => {
          console.log(`${index + 1}. 用户: ${task.userId}, 状态: ${task.status}, 审批: ${task.approvalStatus || 'undefined'}`);
        });
      }
    } else {
      console.log('数据库中没有任务数据');
    }
    
  } catch (error) {
    console.error('检查任务状态时出错:', error);
  } finally {
    await client.close();
  }
}

// 运行检查
checkTaskStatus();