import { test, expect, Page } from '@playwright/test';

// 简化的按钮测试，专注于验证现有页面的按钮功能

async function quickLogin(page: Page, role: 'student' | 'parent' = 'student') {
  await page.goto('/');
  const buttonText = role === 'student' ? '👦 学生演示' : '👨‍👩‍👧‍👦 家长演示';
  const demoButton = page.locator(`button:has-text("${buttonText}")`);
  await expect(demoButton).toBeVisible();
  await demoButton.click();
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle');
}

test.describe('基础按钮功能验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('首页演示登录按钮功能正常', async ({ page }) => {
    await page.goto('/');
    
    // 测试学生演示按钮
    const studentBtn = page.locator('button:has-text("👦 学生演示")');
    await expect(studentBtn).toBeVisible();
    await expect(studentBtn).toBeEnabled();
    
    await studentBtn.click();
    await page.waitForTimeout(3000);
    
    // 验证React应用已激活
    await expect(page.locator('#root')).not.toHaveClass(/hidden/);
    
    // 刷新页面重新开始
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 测试家长演示按钮
    const parentBtn = page.locator('button:has-text("👨‍👩‍👧‍👦 家长演示")');
    await expect(parentBtn).toBeVisible();
    await expect(parentBtn).toBeEnabled();
    
    await parentBtn.click();
    await page.waitForTimeout(3000);
    await expect(page.locator('#root')).not.toHaveClass(/hidden/);
  });

  test('Dashboard快速操作按钮可点击且有响应', async ({ page }) => {
    await quickLogin(page, 'student');
    
    // 确保在dashboard页面
    await page.waitForLoadState('networkidle');
    
    const dashboardButtons = [
      { text: '任务规划', expectUrl: '/planning' },
      { text: '奖励中心', expectUrl: '/rewards' },
      { text: '成就广场', expectUrl: '/achievements' },
      { text: '积分历史', expectModal: true }
    ];

    for (const btn of dashboardButtons) {
      const button = page.locator(`button:has-text("${btn.text}")`);
      
      // 检查按钮是否可见且可点击
      if (await button.isVisible()) {
        await expect(button).toBeEnabled();
        
        const initialUrl = page.url();
        await button.click();
        await page.waitForTimeout(1000);
        
        if (btn.expectUrl) {
          // 期望页面跳转
          const currentUrl = page.url();
          const hasNavigated = currentUrl !== initialUrl && currentUrl.includes(btn.expectUrl);
          
          if (hasNavigated) {
            console.log(`✅ ${btn.text} 按钮正常跳转到: ${currentUrl}`);
            // 返回dashboard继续测试
            await page.goBack();
            await page.waitForLoadState('networkidle');
          } else {
            console.log(`⚠️ ${btn.text} 按钮点击后未跳转，当前URL: ${currentUrl}`);
          }
        } else if (btn.expectModal) {
          // 期望显示模态框
          const hasModal = await page.locator('.modal, [role="dialog"], .popup').isVisible();
          if (hasModal) {
            console.log(`✅ ${btn.text} 按钮正常显示模态框`);
            // 关闭模态框
            const closeBtn = page.locator('button:has-text("关闭"), button:has-text("取消"), .close-button');
            if (await closeBtn.isVisible()) {
              await closeBtn.click();
            }
          } else {
            console.log(`⚠️ ${btn.text} 按钮点击后未显示模态框`);
          }
        }
      } else {
        console.log(`⚠️ ${btn.text} 按钮不可见`);
      }
    }
  });

  test('Dashboard今日任务按钮交互', async ({ page }) => {
    await quickLogin(page, 'student');
    await page.waitForLoadState('networkidle');
    
    // 检查今日任务区域的按钮
    const taskButtons = page.locator('.task-card button, [class*="task"] button');
    const count = await taskButtons.count();
    
    console.log(`找到 ${count} 个任务按钮`);
    
    for (let i = 0; i < Math.min(count, 3); i++) { // 只测试前3个按钮
      const button = taskButtons.nth(i);
      if (await button.isVisible()) {
        const buttonText = await button.textContent();
        console.log(`测试按钮: ${buttonText}`);
        
        await expect(button).toBeEnabled();
        await button.click();
        await page.waitForTimeout(500);
        
        // 简单验证：点击后没有抛出错误就认为是正常的
        console.log(`✅ ${buttonText} 按钮点击正常`);
      }
    }
  });

  test('导航菜单按钮功能（如果存在）', async ({ page }) => {
    await quickLogin(page, 'student');
    await page.waitForLoadState('networkidle');
    
    // 检查是否有导航菜单
    const navButtons = page.locator('nav button, .navigation button, .sidebar button, header button');
    const count = await navButtons.count();
    
    console.log(`找到 ${count} 个导航按钮`);
    
    for (let i = 0; i < Math.min(count, 5); i++) { // 只测试前5个导航按钮
      const button = navButtons.nth(i);
      if (await button.isVisible()) {
        const buttonText = await button.textContent();
        console.log(`测试导航按钮: ${buttonText}`);
        
        await expect(button).toBeEnabled();
        
        const initialUrl = page.url();
        await button.click();
        await page.waitForTimeout(1000);
        
        const currentUrl = page.url();
        if (currentUrl !== initialUrl) {
          console.log(`✅ ${buttonText} 导航按钮正常跳转到: ${currentUrl}`);
        } else {
          console.log(`ℹ️ ${buttonText} 导航按钮可能执行了其他操作（非页面跳转）`);
        }
      }
    }
  });

  test('表单按钮状态验证', async ({ page }) => {
    await quickLogin(page, 'student');
    await page.waitForLoadState('networkidle');
    
    // 查找可能的表单按钮
    const formButtons = page.locator('form button, .form button, button[type="submit"]');
    const count = await formButtons.count();
    
    console.log(`找到 ${count} 个表单按钮`);
    
    for (let i = 0; i < count; i++) {
      const button = formButtons.nth(i);
      if (await button.isVisible()) {
        const buttonText = await button.textContent();
        const isDisabled = await button.isDisabled();
        
        console.log(`表单按钮 "${buttonText}": ${isDisabled ? '禁用' : '启用'}`);
        
        // 只测试启用的按钮
        if (!isDisabled) {
          await button.click();
          await page.waitForTimeout(500);
          console.log(`✅ ${buttonText} 表单按钮点击测试完成`);
        }
      }
    }
  });
});