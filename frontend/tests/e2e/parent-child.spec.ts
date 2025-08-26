/**
 * Parent-Child Interaction E2E Tests
 * 家长-孩子互动端到端测试
 */

import { test, expect } from '@playwright/test';

test.describe('Parent-Child Interaction Workflow', () => {
  let studentContext: any;
  let parentContext: any;

  test.beforeEach(async ({ browser }) => {
    // 创建独立的浏览器上下文
    studentContext = await browser.newContext();
    parentContext = await browser.newContext();
    
    const studentPage = await studentContext.newPage();
    const parentPage = await parentContext.newPage();
    
    // 注册学生用户
    await studentPage.goto('http://localhost:3000/register');
    const studentEmail = `child_${Date.now()}@example.com`;
    await studentPage.fill('[data-testid="username-input"]', '小明');
    await studentPage.fill('[data-testid="email-input"]', studentEmail);
    await studentPage.fill('[data-testid="password-input"]', 'ChildPass123!');
    await studentPage.selectOption('[data-testid="role-select"]', 'student');
    await studentPage.click('[data-testid="register-button"]');
    
    // 注册家长用户
    await parentPage.goto('http://localhost:3000/register');
    const parentEmail = `parent_${Date.now()}@example.com`;
    await parentPage.fill('[data-testid="username-input"]', '小明妈妈');
    await parentPage.fill('[data-testid="email-input"]', parentEmail);
    await parentPage.fill('[data-testid="password-input"]', 'ParentPass123!');
    await parentPage.selectOption('[data-testid="role-select"]', 'parent');
    await parentPage.click('[data-testid="register-button"]');
    
    // 建立家庭关系
    await this.establishFamilyRelationship(parentPage, studentPage, studentEmail);
  });

  test.afterEach(async () => {
    await studentContext?.close();
    await parentContext?.close();
  });

  // 建立家庭关系的辅助方法
  async establishFamilyRelationship(parentPage: any, studentPage: any, studentEmail: string) {
    // 家长发送邀请
    await parentPage.click('[data-testid="nav-family"]');
    await parentPage.click('[data-testid="add-child-button"]');
    await parentPage.fill('[data-testid="child-email-input"]', studentEmail);
    await parentPage.fill('[data-testid="child-nickname-input"]', '小明');
    await parentPage.click('[data-testid="send-invitation-button"]');
    
    // 学生接受邀请
    await studentPage.reload();
    await expect(studentPage.locator('[data-testid="family-invitation"]')).toBeVisible();
    await studentPage.click('[data-testid="accept-invitation-button"]');
    
    // 验证关系建立成功
    await expect(studentPage.locator('[data-testid="parent-info"]')).toContainText('小明妈妈');
    await expect(parentPage.locator('[data-testid="child-info"]')).toContainText('小明');
  }

  test('家长监控孩子任务进度', async () => {
    const studentPage = await studentContext.newPage();
    const parentPage = await parentContext.newPage();
    
    await studentPage.goto('http://localhost:3000/dashboard');
    await parentPage.goto('http://localhost:3000/dashboard');
    
    // 1. 孩子创建并开始任务
    await studentPage.click('[data-testid="nav-tasks"]');
    await studentPage.click('[data-testid="create-task-button"]');
    await studentPage.fill('[data-testid="task-title-input"]', '数学作业');
    await studentPage.selectOption('[data-testid="task-category-select"]', 'learning');
    await studentPage.selectOption('[data-testid="task-difficulty-select"]', 'medium');
    await studentPage.click('[data-testid="save-task-button"]');
    
    // 添加到今日计划
    await studentPage.click('[data-testid="nav-today"]');
    await studentPage.click('[data-testid="add-to-today-button"]');
    await studentPage.selectOption('[data-testid="task-select"]', '数学作业');
    await studentPage.fill('[data-testid="scheduled-time-input"]', '14:00');
    await studentPage.click('[data-testid="schedule-task-button"]');
    
    // 开始任务
    await studentPage.click('[data-testid="timeline-task"] [data-testid="start-task-button"]');
    
    // 2. 家长查看孩子的实时进度
    await parentPage.click('[data-testid="nav-children"]');
    await parentPage.click('[data-testid="child-card-小明"]');
    
    // 验证家长可以看到孩子的当前任务状态
    await expect(parentPage.locator('[data-testid="current-task"]')).toContainText('数学作业');
    await expect(parentPage.locator('[data-testid="task-status"]')).toContainText('进行中');
    await expect(parentPage.locator('[data-testid="start-time"]')).toBeVisible();
    
    // 查看孩子的今日时间轴
    await parentPage.click('[data-testid="child-timeline-tab"]');
    await expect(parentPage.locator('[data-testid="child-timeline"]')).toContainText('数学作业');
    await expect(parentPage.locator('[data-testid="child-timeline"]')).toContainText('14:00');
    
    // 3. 孩子完成任务
    await studentPage.click('[data-testid="timeline-task"] [data-testid="complete-task-button"]');
    await studentPage.fill('[data-testid="completion-notes"]', '完成了10道题目');
    await studentPage.click('[data-testid="confirm-completion-button"]');
    
    // 4. 家长收到完成通知
    await parentPage.reload();
    await expect(parentPage.locator('[data-testid="notification-badge"]')).toBeVisible();
    await expect(parentPage.locator('[data-testid="task-status"]')).toContainText('已完成');
  });

  test('家长审核孩子上传的任务证据', async () => {
    const studentPage = await studentContext.newPage();
    const parentPage = await parentContext.newPage();
    
    await studentPage.goto('http://localhost:3000/dashboard');
    await parentPage.goto('http://localhost:3000/dashboard');
    
    // 1. 孩子创建需要证据的任务并完成
    await studentPage.click('[data-testid="nav-tasks"]');
    await studentPage.click('[data-testid="create-task-button"]');
    await studentPage.fill('[data-testid="task-title-input"]', '整理房间');
    await studentPage.selectOption('[data-testid="task-category-select"]', 'chores');
    await studentPage.check('[data-testid="evidence-required-checkbox"]');
    await studentPage.click('[data-testid="save-task-button"]');
    
    // 添加到今日计划并完成
    await studentPage.click('[data-testid="nav-today"]');
    await studentPage.click('[data-testid="add-to-today-button"]');
    await studentPage.selectOption('[data-testid="task-select"]', '整理房间');
    await studentPage.click('[data-testid="schedule-task-button"]');
    
    await studentPage.click('[data-testid="timeline-task"] [data-testid="start-task-button"]');
    await studentPage.click('[data-testid="timeline-task"] [data-testid="complete-task-button"]');
    
    // 上传证据
    const fileInput = studentPage.locator('[data-testid="evidence-file-input"]');
    await fileInput.setInputFiles({
      name: 'clean-room.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    await studentPage.fill('[data-testid="evidence-description"]', '房间整理完毕的照片');
    await studentPage.click('[data-testid="upload-evidence-button"]');
    await studentPage.click('[data-testid="confirm-completion-button"]');
    
    // 2. 家长收到审核通知
    await parentPage.reload();
    await expect(parentPage.locator('[data-testid="notification-badge"]')).toBeVisible();
    
    // 进入审核页面
    await parentPage.click('[data-testid="nav-approvals"]');
    await parentPage.click('[data-testid="evidence-reviews-tab"]');
    
    // 验证待审核项目
    await expect(parentPage.locator('[data-testid="pending-evidence"]')).toContainText('整理房间');
    await expect(parentPage.locator('[data-testid="pending-evidence"]')).toContainText('小明');
    
    // 3. 查看证据详情
    await parentPage.click('[data-testid="review-evidence-button"]');
    await expect(parentPage.locator('[data-testid="evidence-modal"]')).toBeVisible();
    await expect(parentPage.locator('[data-testid="evidence-image"]')).toBeVisible();
    await expect(parentPage.locator('[data-testid="evidence-description"]')).toContainText('房间整理完毕');
    
    // 4. 批准证据
    await parentPage.fill('[data-testid="review-comment"]', '房间确实整理得很好！');
    await parentPage.click('[data-testid="approve-evidence-button"]');
    
    // 5. 验证批准成功
    await expect(parentPage.locator('[data-testid="success-message"]')).toContainText('已批准');
    
    // 孩子收到批准通知
    await studentPage.reload();
    await expect(studentPage.locator('[data-testid="notification-badge"]')).toBeVisible();
    await expect(studentPage.locator('[data-testid="points-display"]')).toContainText('积分'); // 获得积分
  });

  test('家长为孩子设置任务和目标', async () => {
    const studentPage = await studentContext.newPage();
    const parentPage = await parentContext.newPage();
    
    await parentPage.goto('http://localhost:3000/dashboard');
    
    // 1. 家长为孩子创建任务
    await parentPage.click('[data-testid="nav-children"]');
    await parentPage.click('[data-testid="child-card-小明"]');
    await parentPage.click('[data-testid="manage-child-tasks-tab"]');
    
    await parentPage.click('[data-testid="create-task-for-child-button"]');
    await parentPage.fill('[data-testid="task-title-input"]', '每日练字');
    await parentPage.fill('[data-testid="task-description-input"]', '练习写20个汉字');
    await parentPage.selectOption('[data-testid="task-category-select"]', 'learning');
    await parentPage.selectOption('[data-testid="task-difficulty-select"]', 'easy');
    await parentPage.fill('[data-testid="task-points-input"]', '40');
    await parentPage.check('[data-testid="evidence-required-checkbox"]');
    await parentPage.click('[data-testid="save-task-button"]');
    
    // 2. 设置周目标
    await parentPage.click('[data-testid="child-goals-tab"]');
    await parentPage.click('[data-testid="set-weekly-goal-button"]');
    await parentPage.selectOption('[data-testid="goal-category"]', 'learning');
    await parentPage.fill('[data-testid="goal-target"]', '5'); // 本周完成5个学习任务
    await parentPage.fill('[data-testid="goal-reward"]', '去游乐园');
    await parentPage.click('[data-testid="save-goal-button"]');
    
    // 3. 孩子查看家长设置的任务和目标
    await studentPage.goto('http://localhost:3000/dashboard');
    
    // 查看新任务
    await studentPage.click('[data-testid="nav-tasks"]');
    await expect(studentPage.locator('[data-testid="task-card"]')).toContainText('每日练字');
    await expect(studentPage.locator('[data-testid="task-creator"]')).toContainText('由家长创建');
    
    // 查看周目标
    await studentPage.click('[data-testid="nav-goals"]');
    await expect(studentPage.locator('[data-testid="weekly-goal"]')).toContainText('学习任务');
    await expect(studentPage.locator('[data-testid="goal-progress"]')).toContainText('0/5');
    await expect(studentPage.locator('[data-testid="goal-reward"]')).toContainText('去游乐园');
  });

  test('家长查看孩子的学习报告和统计', async () => {
    const studentPage = await studentContext.newPage();
    const parentPage = await parentContext.newPage();
    
    await studentPage.goto('http://localhost:3000/dashboard');
    
    // 1. 孩子完成多个任务
    const tasks = [
      { title: '阅读故事书', category: 'reading' },
      { title: '数学练习', category: 'learning' },
      { title: '户外运动', category: 'exercise' }
    ];
    
    for (const task of tasks) {
      await studentPage.click('[data-testid="nav-tasks"]');
      await studentPage.click('[data-testid="create-task-button"]');
      await studentPage.fill('[data-testid="task-title-input"]', task.title);
      await studentPage.selectOption('[data-testid="task-category-select"]', task.category);
      await studentPage.click('[data-testid="save-task-button"]');
      
      // 完成任务
      await studentPage.click('[data-testid="nav-today"]');
      await studentPage.click('[data-testid="add-to-today-button"]');
      await studentPage.selectOption('[data-testid="task-select"]', task.title);
      await studentPage.click('[data-testid="schedule-task-button"]');
      
      await studentPage.click('[data-testid="timeline-task"] [data-testid="start-task-button"]');
      await studentPage.click('[data-testid="timeline-task"] [data-testid="complete-task-button"]');
      await studentPage.click('[data-testid="confirm-completion-button"]');
      
      await studentPage.waitForTimeout(1000); // 等待任务完成
    }
    
    // 2. 家长查看学习报告
    await parentPage.goto('http://localhost:3000/dashboard');
    await parentPage.click('[data-testid="nav-children"]');
    await parentPage.click('[data-testid="child-card-小明"]');
    await parentPage.click('[data-testid="child-reports-tab"]');
    
    // 验证统计数据
    await expect(parentPage.locator('[data-testid="completed-tasks-count"]')).toContainText('3');
    await expect(parentPage.locator('[data-testid="total-points-earned"]')).not.toContainText('0');
    
    // 查看分类统计
    await expect(parentPage.locator('[data-testid="category-stats"]')).toContainText('阅读');
    await expect(parentPage.locator('[data-testid="category-stats"]')).toContainText('学习');
    await expect(parentPage.locator('[data-testid="category-stats"]')).toContainText('运动');
    
    // 查看时间分布图表
    await expect(parentPage.locator('[data-testid="time-distribution-chart"]')).toBeVisible();
    
    // 查看本周表现总结
    await parentPage.click('[data-testid="weekly-summary-tab"]');
    await expect(parentPage.locator('[data-testid="weekly-summary"]')).toContainText('表现良好');
    await expect(parentPage.locator('[data-testid="strength-areas"]')).toBeVisible();
    await expect(parentPage.locator('[data-testid="improvement-areas"]')).toBeVisible();
  });

  test('亲子互动和鼓励功能', async () => {
    const studentPage = await studentContext.newPage();
    const parentPage = await parentContext.newPage();
    
    await studentPage.goto('http://localhost:3000/dashboard');
    await parentPage.goto('http://localhost:3000/dashboard');
    
    // 1. 孩子完成任务
    await studentPage.click('[data-testid="nav-tasks"]');
    await studentPage.click('[data-testid="create-task-button"]');
    await studentPage.fill('[data-testid="task-title-input"]', '画画作品');
    await studentPage.selectOption('[data-testid="task-category-select"]', 'creativity');
    await studentPage.click('[data-testid="save-task-button"]');
    
    await studentPage.click('[data-testid="nav-today"]');
    await studentPage.click('[data-testid="add-to-today-button"]');
    await studentPage.selectOption('[data-testid="task-select"]', '画画作品');
    await studentPage.click('[data-testid="schedule-task-button"]');
    
    await studentPage.click('[data-testid="timeline-task"] [data-testid="start-task-button"]');
    await studentPage.click('[data-testid="timeline-task"] [data-testid="complete-task-button"]');
    await studentPage.click('[data-testid="confirm-completion-button"]');
    
    // 2. 家长给予鼓励和点赞
    await parentPage.click('[data-testid="nav-children"]');
    await parentPage.click('[data-testid="child-card-小明"]');
    await parentPage.click('[data-testid="child-activities-tab"]');
    
    // 看到孩子的最新活动
    await expect(parentPage.locator('[data-testid="activity-item"]')).toContainText('完成了画画作品');
    
    // 给予鼓励
    await parentPage.click('[data-testid="activity-item"] [data-testid="encourage-button"]');
    await parentPage.click('[data-testid="praise-excellent"]'); // 选择表扬类型
    await parentPage.fill('[data-testid="custom-message"]', '画得真好！继续努力！');
    await parentPage.click('[data-testid="send-encouragement-button"]');
    
    // 3. 孩子收到家长鼓励
    await studentPage.reload();
    await expect(studentPage.locator('[data-testid="notification-badge"]')).toBeVisible();
    
    await studentPage.click('[data-testid="notifications-panel"]');
    await expect(studentPage.locator('[data-testid="encouragement-message"]')).toContainText('画得真好！继续努力！');
    await expect(studentPage.locator('[data-testid="praise-badge"]')).toBeVisible();
    
    // 验证鼓励增加了额外积分
    await expect(studentPage.locator('[data-testid="bonus-points"]')).toContainText('+5');
  });

  test('家庭积分排行榜和竞赛', async () => {
    const studentPage = await studentContext.newPage();
    const parentPage = await parentContext.newPage();
    
    // 这个测试需要有多个孩子才能有效果
    // 为了演示，我们可以模拟一个家庭排行榜
    
    await parentPage.goto('http://localhost:3000/dashboard');
    
    // 1. 查看家庭排行榜
    await parentPage.click('[data-testid="nav-family"]');
    await parentPage.click('[data-testid="family-leaderboard-tab"]');
    
    // 验证排行榜显示
    await expect(parentPage.locator('[data-testid="leaderboard"]')).toBeVisible();
    await expect(parentPage.locator('[data-testid="child-ranking"]')).toContainText('小明');
    
    // 2. 创建家庭挑战
    await parentPage.click('[data-testid="family-challenges-tab"]');
    await parentPage.click('[data-testid="create-challenge-button"]');
    
    await parentPage.fill('[data-testid="challenge-title"]', '本月阅读挑战');
    await parentPage.fill('[data-testid="challenge-description"]', '看谁能读更多的书');
    await parentPage.selectOption('[data-testid="challenge-type"]', 'reading');
    await parentPage.fill('[data-testid="challenge-target"]', '10'); // 10本书
    await parentPage.selectOption('[data-testid="challenge-duration"]', '30'); // 30天
    await parentPage.click('[data-testid="create-challenge-button"]');
    
    // 3. 孩子参与挑战
    await studentPage.goto('http://localhost:3000/dashboard');
    await expect(studentPage.locator('[data-testid="challenge-notification"]')).toContainText('本月阅读挑战');
    
    await studentPage.click('[data-testid="join-challenge-button"]');
    await expect(studentPage.locator('[data-testid="challenge-progress"]')).toContainText('0/10');
    
    // 完成一个阅读任务来增加挑战进度
    await studentPage.click('[data-testid="nav-tasks"]');
    await studentPage.click('[data-testid="create-task-button"]');
    await studentPage.fill('[data-testid="task-title-input"]', '阅读第一本书');
    await studentPage.selectOption('[data-testid="task-category-select"]', 'reading');
    await studentPage.click('[data-testid="save-task-button"]');
    
    await studentPage.click('[data-testid="nav-today"]');
    await studentPage.click('[data-testid="add-to-today-button"]');
    await studentPage.selectOption('[data-testid="task-select"]', '阅读第一本书');
    await studentPage.click('[data-testid="schedule-task-button"]');
    
    await studentPage.click('[data-testid="timeline-task"] [data-testid="start-task-button"]');
    await studentPage.click('[data-testid="timeline-task"] [data-testid="complete-task-button"]');
    await studentPage.click('[data-testid="confirm-completion-button"]');
    
    // 验证挑战进度更新
    await studentPage.reload();
    await expect(studentPage.locator('[data-testid="challenge-progress"]')).toContainText('1/10');
  });
});