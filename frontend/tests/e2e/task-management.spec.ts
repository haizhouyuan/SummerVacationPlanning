/**
 * Task Management E2E Tests
 * 任务管理端到端测试
 */

import { test, expect } from '@playwright/test';

test.describe('Task Management Workflow', () => {
  
  test.beforeEach(async ({ page }) => {
    // 注册并登录用户
    await page.goto('http://localhost:3000/register');
    const uniqueEmail = `task_user_${Date.now()}@example.com`;
    
    await page.fill('[data-testid="username-input"]', '任务测试用户');
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.selectOption('[data-testid="role-select"]', 'student');
    await page.click('[data-testid="register-button"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('创建和管理任务的完整流程', async ({ page }) => {
    // 1. 导航到任务页面
    await page.click('[data-testid="nav-tasks"]');
    await expect(page).toHaveURL(/.*\/tasks/);
    
    // 2. 创建新任务
    await page.click('[data-testid="create-task-button"]');
    await expect(page.locator('[data-testid="task-form"]')).toBeVisible();
    
    // 填写任务表单
    await page.fill('[data-testid="task-title-input"]', '测试运动任务');
    await page.fill('[data-testid="task-description-input"]', '进行30分钟的户外运动');
    await page.selectOption('[data-testid="task-category-select"]', 'exercise');
    await page.selectOption('[data-testid="task-difficulty-select"]', 'medium');
    await page.fill('[data-testid="task-time-estimate-input"]', '30');
    await page.check('[data-testid="evidence-required-checkbox"]');
    
    // 提交任务
    await page.click('[data-testid="save-task-button"]');
    
    // 3. 验证任务出现在列表中
    await expect(page.locator('[data-testid="task-card"]')).toContainText('测试运动任务');
    await expect(page.locator('[data-testid="task-card"]')).toContainText('运动');
    
    // 4. 编辑任务
    await page.click('[data-testid="task-card"] [data-testid="edit-task-button"]');
    await page.fill('[data-testid="task-title-input"]', '更新的运动任务');
    await page.click('[data-testid="save-task-button"]');
    
    // 验证更新成功
    await expect(page.locator('[data-testid="task-card"]')).toContainText('更新的运动任务');
    
    // 5. 删除任务
    await page.click('[data-testid="task-card"] [data-testid="delete-task-button"]');
    await page.click('[data-testid="confirm-delete-button"]');
    
    // 验证任务已删除
    await expect(page.locator('[data-testid="task-card"]')).not.toContainText('更新的运动任务');
  });

  test('任务分类和筛选功能', async ({ page }) => {
    await page.click('[data-testid="nav-tasks"]');
    
    // 创建不同类别的任务
    const tasks = [
      { title: '阅读任务', category: 'reading' },
      { title: '家务任务', category: 'chores' },
      { title: '学习任务', category: 'learning' }
    ];
    
    for (const task of tasks) {
      await page.click('[data-testid="create-task-button"]');
      await page.fill('[data-testid="task-title-input"]', task.title);
      await page.selectOption('[data-testid="task-category-select"]', task.category);
      await page.click('[data-testid="save-task-button"]');
      await page.waitForTimeout(500); // 等待任务创建
    }
    
    // 测试分类筛选
    await page.selectOption('[data-testid="category-filter"]', 'reading');
    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="task-card"]')).toContainText('阅读任务');
    
    // 显示所有任务
    await page.selectOption('[data-testid="category-filter"]', 'all');
    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(3);
  });

  test('每日任务计划和执行', async ({ page }) => {
    // 先创建一个基础任务
    await page.click('[data-testid="nav-tasks"]');
    await page.click('[data-testid="create-task-button"]');
    await page.fill('[data-testid="task-title-input"]', '每日阅读');
    await page.selectOption('[data-testid="task-category-select"]', 'reading');
    await page.click('[data-testid="save-task-button"]');
    
    // 导航到今日计划
    await page.click('[data-testid="nav-today"]');
    await expect(page).toHaveURL(/.*\/today/);
    
    // 添加任务到今日计划
    await page.click('[data-testid="add-to-today-button"]');
    await page.selectOption('[data-testid="task-select"]', '每日阅读');
    await page.fill('[data-testid="scheduled-time-input"]', '09:00');
    await page.click('[data-testid="schedule-task-button"]');
    
    // 验证任务出现在时间轴中
    await expect(page.locator('[data-testid="timeline-task"]')).toContainText('每日阅读');
    await expect(page.locator('[data-testid="timeline-task"]')).toContainText('09:00');
    
    // 开始执行任务
    await page.click('[data-testid="timeline-task"] [data-testid="start-task-button"]');
    await expect(page.locator('[data-testid="timeline-task"]')).toContainText('进行中');
    
    // 完成任务（无需证据）
    await page.click('[data-testid="timeline-task"] [data-testid="complete-task-button"]');
    await page.fill('[data-testid="completion-notes"]', '完成30分钟阅读');
    await page.click('[data-testid="confirm-completion-button"]');
    
    // 验证任务状态更新和积分增加
    await expect(page.locator('[data-testid="timeline-task"]')).toContainText('已完成');
    await expect(page.locator('[data-testid="points-display"]')).toContainText('积分');
  });

  test('任务证据上传功能', async ({ page }) => {
    // 创建需要证据的任务
    await page.click('[data-testid="nav-tasks"]');
    await page.click('[data-testid="create-task-button"]');
    await page.fill('[data-testid="task-title-input"]', '运动打卡');
    await page.selectOption('[data-testid="task-category-select"]', 'exercise');
    await page.check('[data-testid="evidence-required-checkbox"]');
    await page.click('[data-testid="save-task-button"]');
    
    // 添加到今日计划并开始
    await page.click('[data-testid="nav-today"]');
    await page.click('[data-testid="add-to-today-button"]');
    await page.selectOption('[data-testid="task-select"]', '运动打卡');
    await page.click('[data-testid="schedule-task-button"]');
    
    await page.click('[data-testid="timeline-task"] [data-testid="start-task-button"]');
    await page.click('[data-testid="timeline-task"] [data-testid="complete-task-button"]');
    
    // 上传证据
    await expect(page.locator('[data-testid="evidence-upload-section"]')).toBeVisible();
    
    // 模拟上传文件
    const fileInput = page.locator('[data-testid="evidence-file-input"]');
    await fileInput.setInputFiles({
      name: 'exercise-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    await page.fill('[data-testid="evidence-description"]', '户外跑步30分钟的照片');
    await page.click('[data-testid="upload-evidence-button"]');
    
    // 验证上传成功
    await expect(page.locator('[data-testid="evidence-preview"]')).toBeVisible();
    
    // 提交完成
    await page.click('[data-testid="confirm-completion-button"]');
    await expect(page.locator('[data-testid="timeline-task"]')).toContainText('待审核');
  });

  test('任务拖拽重新排序', async ({ page }) => {
    await page.click('[data-testid="nav-today"]');
    
    // 添加多个任务到时间轴
    const tasks = ['任务1', '任务2', '任务3'];
    for (let i = 0; i < tasks.length; i++) {
      // 先创建基础任务
      await page.click('[data-testid="nav-tasks"]');
      await page.click('[data-testid="create-task-button"]');
      await page.fill('[data-testid="task-title-input"]', tasks[i]);
      await page.selectOption('[data-testid="task-category-select"]', 'other');
      await page.click('[data-testid="save-task-button"]');
      
      // 添加到今日计划
      await page.click('[data-testid="nav-today"]');
      await page.click('[data-testid="add-to-today-button"]');
      await page.selectOption('[data-testid="task-select"]', tasks[i]);
      await page.fill('[data-testid="scheduled-time-input"]', `${9 + i}:00`);
      await page.click('[data-testid="schedule-task-button"]');
    }
    
    // 验证初始顺序
    const initialTasks = page.locator('[data-testid="timeline-task"]');
    await expect(initialTasks.first()).toContainText('任务1');
    
    // 执行拖拽操作（将第一个任务拖到最后）
    const firstTask = initialTasks.first();
    const lastTask = initialTasks.last();
    
    await firstTask.dragTo(lastTask);
    
    // 验证顺序已改变
    const reorderedTasks = page.locator('[data-testid="timeline-task"]');
    await expect(reorderedTasks.first()).toContainText('任务2');
  });

  test('任务模板和推荐功能', async ({ page }) => {
    await page.click('[data-testid="nav-tasks"]');
    
    // 测试任务模板
    await page.click('[data-testid="task-templates-button"]');
    await expect(page.locator('[data-testid="template-modal"]')).toBeVisible();
    
    // 选择运动模板
    await page.click('[data-testid="template-category-exercise"]');
    await expect(page.locator('[data-testid="exercise-templates"]')).toBeVisible();
    
    // 使用模板创建任务
    await page.click('[data-testid="template-item"]:first-child [data-testid="use-template-button"]');
    
    // 验证表单已预填充
    await expect(page.locator('[data-testid="task-title-input"]')).not.toBeEmpty();
    await expect(page.locator('[data-testid="task-description-input"]')).not.toBeEmpty();
    await expect(page.locator('[data-testid="task-category-select"]')).toHaveValue('exercise');
    
    // 保存任务
    await page.click('[data-testid="save-task-button"]');
    
    // 验证任务创建成功
    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(1);
  });

  test('任务统计和进度跟踪', async ({ page }) => {
    // 创建并完成一些任务
    const tasks = [
      { title: '阅读任务', category: 'reading' },
      { title: '运动任务', category: 'exercise' }
    ];
    
    for (const task of tasks) {
      // 创建任务
      await page.click('[data-testid="nav-tasks"]');
      await page.click('[data-testid="create-task-button"]');
      await page.fill('[data-testid="task-title-input"]', task.title);
      await page.selectOption('[data-testid="task-category-select"]', task.category);
      await page.click('[data-testid="save-task-button"]');
      
      // 添加到今日并完成
      await page.click('[data-testid="nav-today"]');
      await page.click('[data-testid="add-to-today-button"]');
      await page.selectOption('[data-testid="task-select"]', task.title);
      await page.click('[data-testid="schedule-task-button"]');
      
      await page.click('[data-testid="timeline-task"] [data-testid="start-task-button"]');
      await page.click('[data-testid="timeline-task"] [data-testid="complete-task-button"]');
      await page.click('[data-testid="confirm-completion-button"]');
    }
    
    // 查看统计页面
    await page.click('[data-testid="nav-stats"]');
    await expect(page).toHaveURL(/.*\/stats/);
    
    // 验证统计数据
    await expect(page.locator('[data-testid="completed-tasks-count"]')).toContainText('2');
    await expect(page.locator('[data-testid="total-points-earned"]')).not.toContainText('0');
    
    // 验证分类统计
    await expect(page.locator('[data-testid="category-stats-reading"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-stats-exercise"]')).toBeVisible();
  });
});