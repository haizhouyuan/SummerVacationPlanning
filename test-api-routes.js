// 测试API路由完整性
const fs = require('fs');
const path = require('path');

console.log('🔍 检查API路由完整性...\n');

// 检查路由文件
const routesDir = '/mnt/d/SummerVacationPlanning/backend/src/routes';
const controllerDir = '/mnt/d/SummerVacationPlanning/backend/src/controllers';

// 预期的路由文件
const expectedRoutes = [
  'mongoAuthRoutes.ts',
  'taskRoutes.ts',
  'dailyTaskRoutes.ts',
  'redemptionRoutes.ts',
  'rewardsRoutes.ts'
];

// 预期的控制器文件
const expectedControllers = [
  'authController.ts',
  'taskController.ts',
  'dailyTaskController.ts',
  'redemptionController.ts',
  'rewardsController.ts'
];

console.log('📋 路由文件检查:');
let routesMissing = 0;
expectedRoutes.forEach(route => {
  const filePath = path.join(routesDir, route);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${route} - 存在`);
  } else {
    console.log(`  ❌ ${route} - 缺失`);
    routesMissing++;
  }
});

console.log('\n📋 控制器文件检查:');
let controllersMissing = 0;
expectedControllers.forEach(controller => {
  const filePath = path.join(controllerDir, controller);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${controller} - 存在`);
  } else {
    console.log(`  ❌ ${controller} - 缺失`);
    controllersMissing++;
  }
});

// 检查核心功能API端点
console.log('\n🎯 核心API端点预期列表:');

const expectedEndpoints = {
  '认证系统': [
    'POST /api/auth/register',
    'POST /api/auth/login',
    'GET /api/auth/profile',
    'PUT /api/auth/profile',
    'GET /api/auth/dashboard-stats',
    'GET /api/auth/children',
    'GET /api/auth/family-leaderboard'
  ],
  '任务管理': [
    'GET /api/tasks',
    'GET /api/tasks/:id',
    'POST /api/tasks',
    'PUT /api/tasks/:id',
    'DELETE /api/tasks/:id',
    'GET /api/tasks/recommended'
  ],
  '每日任务': [
    'GET /api/daily-tasks',
    'POST /api/daily-tasks',
    'PUT /api/daily-tasks/:id',
    'DELETE /api/daily-tasks/:id',
    'GET /api/daily-tasks/stats/weekly',
    'GET /api/daily-tasks/pending-approval',
    'PUT /api/daily-tasks/:id/approve'
  ],
  '奖励兑换': [
    'GET /api/redemptions',
    'POST /api/redemptions',
    'PUT /api/redemptions/:id',
    'DELETE /api/redemptions/:id',
    'GET /api/redemptions/stats'
  ],
  '游戏时间': [
    'POST /api/rewards/game-time/calculate',
    'GET /api/rewards/game-time/today',
    'POST /api/rewards/game-time/use',
    'POST /api/rewards/game-time/exchange',
    'GET /api/rewards/game-time/exchanges',
    'GET /api/rewards/special'
  ]
};

Object.entries(expectedEndpoints).forEach(([category, endpoints]) => {
  console.log(`\n  ${category}:`);
  endpoints.forEach(endpoint => {
    console.log(`    📍 ${endpoint}`);
  });
});

// 检查推荐系统集成
console.log('\n🤖 智能推荐系统检查:');
const recommendationServicePath = '/mnt/d/SummerVacationPlanning/backend/src/services/recommendationService.ts';
const taskPlanningPath = '/mnt/d/SummerVacationPlanning/frontend/src/pages/TaskPlanning.tsx';

if (fs.existsSync(recommendationServicePath)) {
  console.log('  ✅ 推荐算法服务 - 已实现');
} else {
  console.log('  ❌ 推荐算法服务 - 缺失');
}

if (fs.existsSync(taskPlanningPath)) {
  const content = fs.readFileSync(taskPlanningPath, 'utf8');
  if (content.includes('getRecommendedTasks') && content.includes('智能推荐')) {
    console.log('  ✅ 前端推荐集成 - 已完成');
  } else {
    console.log('  ❌ 前端推荐集成 - 未完成');
  }
} else {
  console.log('  ❌ 任务规划页面 - 缺失');
}

// 数据库优化检查
console.log('\n📊 数据库优化检查:');
const indexScriptPath = '/mnt/d/SummerVacationPlanning/backend/scripts/create-indexes.js';
if (fs.existsSync(indexScriptPath)) {
  console.log('  ✅ 数据库索引优化脚本 - 已创建');
} else {
  console.log('  ❌ 数据库索引优化脚本 - 缺失');
}

// 总结
console.log('\n🎯 测试总结:');
console.log(`  路由文件: ${expectedRoutes.length - routesMissing}/${expectedRoutes.length} 完整`);
console.log(`  控制器文件: ${expectedControllers.length - controllersMissing}/${expectedControllers.length} 完整`);

const totalScore = ((expectedRoutes.length - routesMissing) + (expectedControllers.length - controllersMissing)) / (expectedRoutes.length + expectedControllers.length);

if (totalScore === 1) {
  console.log('\n🏆 API架构完整性: 100% ✅');
} else if (totalScore >= 0.8) {
  console.log(`\n⚠️  API架构完整性: ${Math.round(totalScore * 100)}% - 需要修复缺失文件`);
} else {
  console.log(`\n❌ API架构完整性: ${Math.round(totalScore * 100)}% - 严重缺失，需要重建`);
}

console.log('\n📝 注意: 这只是静态文件检查，实际API功能需要启动服务器进行测试');