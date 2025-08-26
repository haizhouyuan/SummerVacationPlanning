/**
 * Points and Rewards E2E Tests
 * 积分和奖励端到端测试
 */

import { test, expect } from '@playwright/test';

test.describe('Points and Rewards Workflow', () => {
  let studentContext: any;
  let parentContext: any;

  test.beforeEach(async ({ browser }) => {
    // 创建学生和家长的浏览器上下文
    studentContext = await browser.newContext();
    parentContext = await browser.newContext();
    
    const studentPage = await studentContext.newPage();
    const parentPage = await parentContext.newPage();
    
    // 注册学生用户
    await studentPage.goto('http://localhost:3000/register');
    const studentEmail = `student_${Date.now()}@example.com`;
    await studentPage.fill('[data-testid="username-input"]', '测试学生');
    await studentPage.fill('[data-testid="email-input"]', studentEmail);
    await studentPage.fill('[data-testid="password-input"]', 'TestPass123!');
    await studentPage.selectOption('[data-testid="role-select"]', 'student');
    await studentPage.click('[data-testid="register-button"]');
    
    // 注册家长用户
    await parentPage.goto('http://localhost:3000/register');
    const parentEmail = `parent_${Date.now()}@example.com`;
    await parentPage.fill('[data-testid="username-input"]', '测试家长');
    await parentPage.fill('[data-testid="email-input"]', parentEmail);
    await parentPage.fill('[data-testid="password-input"]', 'TestPass123!');
    await parentPage.selectOption('[data-testid="role-select"]', 'parent');
    await parentPage.click('[data-testid="register-button"]');
    
    // 建立家长-孩子关系（这部分逻辑需要根据实际应用调整）
    await parentPage.click('[data-testid="nav-family"]');
    await parentPage.click('[data-testid="add-child-button"]');
    await parentPage.fill('[data-testid="child-email-input"]', studentEmail);
    await parentPage.click('[data-testid="send-invitation-button"]');
    
    // 学生接受邀请
    await studentPage.reload();
    await studentPage.click('[data-testid="accept-invitation-button"]');
  });

  test.afterEach(async () => {
    await studentContext?.close();
    await parentContext?.close();
  });

  test('积分获取和游戏时间兑换流程', async () => {
    const studentPage = await studentContext.newPage();
    await studentPage.goto('http://localhost:3000/dashboard');
    
    // 1. 检查初始积分
    const initialPoints = await studentPage.locator('[data-testid="points-display"]').textContent();
    
    // 2. 完成任务获得积分
    await studentPage.click('[data-testid="nav-tasks"]');
    await studentPage.click('[data-testid="create-task-button"]');
    await studentPage.fill('[data-testid="task-title-input"]', '赚取积分任务');
    await studentPage.selectOption('[data-testid="task-category-select"]', 'exercise');
    await studentPage.selectOption('[data-testid="task-difficulty-select"]', 'medium');
    await studentPage.click('[data-testid="save-task-button"]');
    
    // 添加到今日计划并完成
    await studentPage.click('[data-testid="nav-today"]');
    await studentPage.click('[data-testid="add-to-today-button"]');
    await studentPage.selectOption('[data-testid="task-select"]', '赚取积分任务');
    await studentPage.click('[data-testid="schedule-task-button"]');
    
    await studentPage.click('[data-testid="timeline-task"] [data-testid="start-task-button"]');
    await studentPage.click('[data-testid="timeline-task"] [data-testid="complete-task-button"]');
    await studentPage.click('[data-testid="confirm-completion-button"]');
    
    // 3. 验证积分增加
    await studentPage.reload();
    const newPoints = await studentPage.locator('[data-testid="points-display"]').textContent();
    // 这里需要实际的数字比较逻辑
    
    // 4. 兑换游戏时间
    await studentPage.click('[data-testid="nav-rewards"]');
    await expect(studentPage).toHaveURL(/.*\/rewards/);
    
    await studentPage.click('[data-testid="game-time-category"]');
    await studentPage.click('[data-testid="normal-game-time-card"]');
    
    // 选择游戏时间长度
    await studentPage.selectOption('[data-testid="game-time-duration"]', '30');
    await studentPage.click('[data-testid="exchange-button"]');
    
    // 5. 确认兑换
    await expect(studentPage.locator('[data-testid="exchange-modal"]')).toBeVisible();
    await studentPage.click('[data-testid="confirm-exchange-button"]');
    
    // 6. 验证兑换成功
    await expect(studentPage.locator('[data-testid="success-message"]')).toContainText('兑换成功');
    await expect(studentPage.locator('[data-testid="game-time-remaining"]')).toContainText('30分钟');
    
    // 7. 检查积分扣除
    const finalPoints = await studentPage.locator('[data-testid="points-display"]').textContent();
    // 验证积分确实被扣除了
  });

  test('特殊奖励申请和家长审批流程', async () => {
    const studentPage = await studentContext.newPage();
    const parentPage = await parentContext.newPage();
    
    await studentPage.goto('http://localhost:3000/dashboard');
    await parentPage.goto('http://localhost:3000/dashboard');
    
    // 1. 学生申请特殊奖励
    await studentPage.click('[data-testid="nav-rewards"]');
    await studentPage.click('[data-testid="special-rewards-category"]');
    await studentPage.click('[data-testid="request-special-reward-button"]');
    
    // 填写申请表单
    await studentPage.fill('[data-testid="reward-name-input"]', '新玩具');
    await studentPage.fill('[data-testid="reward-points-input"]', '100');
    await studentPage.fill('[data-testid="reward-reason-input"]', '这个月表现很好，完成了所有计划任务');
    await studentPage.click('[data-testid="submit-request-button"]');
    
    // 验证申请提交成功
    await expect(studentPage.locator('[data-testid="success-message"]')).toContainText('申请已提交');
    await expect(studentPage.locator('[data-testid="pending-requests"]')).toContainText('新玩具');
    
    // 2. 家长收到通知并审核
    await parentPage.reload();
    await expect(parentPage.locator('[data-testid="notification-badge"]')).toBeVisible();
    
    await parentPage.click('[data-testid="nav-approvals"]');
    await expect(parentPage.locator('[data-testid="pending-approval"]')).toContainText('新玩具');
    await expect(parentPage.locator('[data-testid="pending-approval"]')).toContainText('测试学生');
    
    // 查看申请详情
    await parentPage.click('[data-testid="view-request-button"]');
    await expect(parentPage.locator('[data-testid="request-details"]')).toContainText('这个月表现很好');
    
    // 3. 家长批准申请
    await parentPage.fill('[data-testid="approval-comment"]', '同意奖励，表现确实很好');
    await parentPage.click('[data-testid="approve-button"]');
    
    // 验证批准成功
    await expect(parentPage.locator('[data-testid="success-message"]')).toContainText('已批准');
    
    // 4. 学生收到批准通知
    await studentPage.reload();
    await expect(studentPage.locator('[data-testid="notification-badge"]')).toBeVisible();
    
    await studentPage.click('[data-testid="nav-rewards"]');
    await expect(studentPage.locator('[data-testid="approved-rewards"]')).toContainText('新玩具');
    await expect(studentPage.locator('[data-testid="approved-rewards"]')).toContainText('已批准');
    
    // 5. 验证积分扣除
    const finalPoints = await studentPage.locator('[data-testid="points-display"]').textContent();
    // 验证积分被正确扣除
  });

  test('奖励兑换历史和积分记录', async () => {
    const studentPage = await studentContext.newPage();
    await studentPage.goto('http://localhost:3000/dashboard');
    
    // 先完成一个任务获得积分
    await studentPage.click('[data-testid="nav-tasks"]');
    await studentPage.click('[data-testid="create-task-button"]');
    await studentPage.fill('[data-testid="task-title-input"]', '积分任务');
    await studentPage.selectOption('[data-testid="task-category-select"]', 'reading');
    await studentPage.click('[data-testid="save-task-button"]');
    
    await studentPage.click('[data-testid="nav-today"]');
    await studentPage.click('[data-testid="add-to-today-button"]');
    await studentPage.selectOption('[data-testid="task-select"]', '积分任务');
    await studentPage.click('[data-testid="schedule-task-button"]');
    
    await studentPage.click('[data-testid="timeline-task"] [data-testid="start-task-button"]');
    await studentPage.click('[data-testid="timeline-task"] [data-testid="complete-task-button"]');
    await studentPage.click('[data-testid="confirm-completion-button"]');
    
    // 兑换奖励
    await studentPage.click('[data-testid="nav-rewards"]');
    await studentPage.click('[data-testid="game-time-category"]');
    await studentPage.click('[data-testid="normal-game-time-card"]');
    await studentPage.selectOption('[data-testid="game-time-duration"]', '15');
    await studentPage.click('[data-testid="exchange-button"]');
    await studentPage.click('[data-testid="confirm-exchange-button"]');
    
    // 查看积分历史
    await studentPage.click('[data-testid="nav-profile"]');
    await studentPage.click('[data-testid="points-history-tab"]');
    
    // 验证记录显示
    await expect(studentPage.locator('[data-testid="points-history"]')).toContainText('完成任务');
    await expect(studentPage.locator('[data-testid="points-history"]')).toContainText('兑换游戏时间');
    await expect(studentPage.locator('[data-testid="points-history"]')).toContainText('+'); // 获得积分
    await expect(studentPage.locator('[data-testid="points-history"]')).toContainText('-'); // 消费积分
    
    // 查看兑换历史
    await studentPage.click('[data-testid="rewards-history-tab"]');
    await expect(studentPage.locator('[data-testid="rewards-history"]')).toContainText('游戏时间');
    await expect(studentPage.locator('[data-testid="rewards-history"]')).toContainText('15分钟');
  });

  test('积分不足时的处理', async () => {
    const studentPage = await studentContext.newPage();
    await studentPage.goto('http://localhost:3000/dashboard');
    
    // 尝试兑换超过当前积分的奖励
    await studentPage.click('[data-testid="nav-rewards"]');
    await studentPage.click('[data-testid="special-rewards-category"]');
    
    // 查找一个高积分的奖励
    await studentPage.click('[data-testid="high-value-reward"]');
    
    // 验证兑换按钮被禁用或显示警告
    await expect(studentPage.locator('[data-testid="exchange-button"]')).toBeDisabled();
    await expect(studentPage.locator('[data-testid="insufficient-points-warning"]')).toBeVisible();
    await expect(studentPage.locator('[data-testid="insufficient-points-warning"]')).toContainText('积分不足');
    
    // 显示需要多少积分
    await expect(studentPage.locator('[data-testid="points-needed"]')).toBeVisible();
  });

  test('奖励类别和筛选功能', async () => {
    const studentPage = await studentContext.newPage();
    await studentPage.goto('http://localhost:3000/rewards');
    
    // 测试不同奖励类别
    const categories = [
      { id: 'game-time', name: '游戏时间' },
      { id: 'toys', name: '玩具奖励' },
      { id: 'activities', name: '活动奖励' },
      { id: 'special', name: '特殊奖励' }
    ];
    
    for (const category of categories) {
      await studentPage.click(`[data-testid="${category.id}-category"]`);
      await expect(studentPage.locator('[data-testid="category-title"]')).toContainText(category.name);
      await expect(studentPage.locator('[data-testid="reward-card"]')).toHaveCount.gte(1);
    }
    
    // 测试积分范围筛选
    await studentPage.selectOption('[data-testid="points-filter"]', '0-50');
    await expect(studentPage.locator('[data-testid="reward-card"] [data-testid="points-cost"]')).not.toContainText('100');
    
    await studentPage.selectOption('[data-testid="points-filter"]', '50+');
    // 验证显示的都是50积分以上的奖励
  });

  test('家长设置奖励限制', async () => {
    const parentPage = await parentContext.newPage();
    await parentPage.goto('http://localhost:3000/dashboard');
    
    // 进入家长控制面板
    await parentPage.click('[data-testid="nav-parent-controls"]');
    await parentPage.click('[data-testid="reward-settings-tab"]');
    
    // 设置每日游戏时间限制
    await parentPage.fill('[data-testid="daily-game-time-limit"]', '60');
    await parentPage.check('[data-testid="require-approval-special-rewards"]');
    await parentPage.click('[data-testid="save-settings-button"]');
    
    // 验证设置保存成功
    await expect(parentPage.locator('[data-testid="success-message"]')).toContainText('设置已保存');
    
    // 测试限制生效
    const studentPage = await studentContext.newPage();
    await studentPage.goto('http://localhost:3000/rewards');
    
    // 尝试兑换超过限制的游戏时间
    await studentPage.click('[data-testid="game-time-category"]');
    await studentPage.click('[data-testid="normal-game-time-card"]');
    await studentPage.selectOption('[data-testid="game-time-duration"]', '90'); // 超过60分钟限制
    
    // 应该显示警告或被禁用
    await expect(studentPage.locator('[data-testid="limit-warning"]')).toContainText('超过每日限制');
  });
});