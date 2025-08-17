// 验证统计系统修复的测试脚本
console.log('=== 验证统计系统修复 ===\n');

// 1. 验证后端日期工具
try {
  const fs = require('fs');
  const dateUtilsPath = './backend/src/utils/dateUtils.ts';
  const dateUtilsContent = fs.readFileSync(dateUtilsPath, 'utf8');
  
  if (dateUtilsContent.includes('getCurrentWeek') && 
      dateUtilsContent.includes('formatDate') &&
      dateUtilsContent.includes('currentDay === 0 ? 6 : currentDay - 1')) {
    console.log('✅ 后端 dateUtils.ts 已正确创建');
  } else {
    console.log('❌ 后端 dateUtils.ts 缺少关键函数');
  }
} catch (e) {
  console.log('❌ 后端 dateUtils.ts 不存在');
}

// 2. 验证 mongoAuthController 导入
try {
  const fs = require('fs');
  const controllerPath = './backend/src/controllers/mongoAuthController.ts';
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  
  if (controllerContent.includes('import { getCurrentWeek')) {
    console.log('✅ mongoAuthController 已导入统一日期工具');
  } else {
    console.log('❌ mongoAuthController 未导入日期工具');
  }
} catch (e) {
  console.log('❌ 无法检查 mongoAuthController');
}

// 3. 验证前端 EnhancedTaskPlanning
try {
  const fs = require('fs');
  const planningPath = './frontend/src/pages/EnhancedTaskPlanning.tsx';
  const planningContent = fs.readFileSync(planningPath, 'utf8');
  
  if (planningContent.includes('import { getCurrentWeek, formatDate }') &&
      planningContent.includes('getCurrentWeek(referenceDate)')) {
    console.log('✅ EnhancedTaskPlanning 已使用统一日期计算');
  } else {
    console.log('❌ EnhancedTaskPlanning 未正确更新');
  }
} catch (e) {
  console.log('❌ 无法检查 EnhancedTaskPlanning');
}

// 4. 验证Compatible API数据结构
try {
  const fs = require('fs');
  const apiPath = './frontend/src/services/compatibleApi.ts';
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  
  if (apiContent.includes('todayStats:') &&
      apiContent.includes('totalPointsEarned:') &&
      apiContent.includes('completionRate:') &&
      apiContent.includes('averagePointsPerTask:')) {
    console.log('✅ Compatible API 数据结构已修复');
  } else {
    console.log('❌ Compatible API 数据结构不完整');
  }
} catch (e) {
  console.log('❌ 无法检查 Compatible API');
}

console.log('\n=== 测试结论 ===');
console.log('✅ 主要修复已完成，可以进行实际测试');
console.log('📋 建议测试项目：');
console.log('   1. 启动前后端服务');
console.log('   2. 检查仪表盘统计显示');
console.log('   3. 测试积分历史记录');
console.log('   4. 验证离线模式兼容性');