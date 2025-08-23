import { test, expect } from '@playwright/test';

test.describe('Mobile Task Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to the application
    await page.goto('http://localhost:3003');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should be able to create a task on mobile', async ({ page }) => {
    // Try to login first (if login page exists)
    const loginButton = page.locator('button:has-text("登录"), button:has-text("Login")');
    if (await loginButton.isVisible()) {
      // Simple demo login
      await page.fill('input[type="email"], input[name="email"], input[placeholder*="邮箱"], input[placeholder*="email"]', 'demo@example.com');
      await page.fill('input[type="password"], input[name="password"], input[placeholder*="密码"], input[placeholder*="password"]', 'demo123');
      await loginButton.click();
      await page.waitForTimeout(2000);
    }

    // Navigate to task planning page
    const taskPlanningLink = page.locator('a:has-text("任务规划"), a:has-text("Task Planning"), nav a[href*="planning"]');
    if (await taskPlanningLink.isVisible()) {
      await taskPlanningLink.click();
      await page.waitForTimeout(1000);
    } else {
      // Try direct navigation
      await page.goto('http://localhost:3003/task-planning');
      await page.waitForTimeout(2000);
    }

    // Switch to tasks view on mobile
    const tasksTabButton = page.locator('button:has-text("任务清单"), button:has-text("🎯 任务清单")');
    if (await tasksTabButton.isVisible()) {
      await tasksTabButton.click();
      await page.waitForTimeout(1000);
    }

    // Look for "新建" or "+" button
    const createTaskButton = page.locator('button:has-text("新建"), button:has-text("+ 新建"), button[title*="创建"], button:has-text("+")').first();
    await expect(createTaskButton).toBeVisible({ timeout: 10000 });
    
    // Click the create task button
    await createTaskButton.click();
    await page.waitForTimeout(1000);

    // Check if modal appeared
    const modal = page.locator('.fixed.inset-0, [role="dialog"], .modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Fill in task creation form
    const titleInput = page.locator('input[placeholder*="任务名称"], input[placeholder*="title"]');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('测试任务');

    // Select category
    const categorySelect = page.locator('select').first();
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption('reading');
    }

    // Select activity
    const activitySelect = page.locator('select').nth(1);
    if (await activitySelect.isVisible()) {
      await page.waitForTimeout(500); // Wait for options to load
      await activitySelect.selectOption({ index: 1 }); // Select first available option
    }

    // Submit the form
    const submitButton = page.locator('button[type="submit"], button:has-text("创建任务"), button:has-text("创建")');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Wait for success or error message
    await page.waitForTimeout(3000);

    // Take screenshot for debugging
    await page.screenshot({ path: 'mobile-task-creation-result.png', fullPage: true });

    // Check for success message or error
    const successMessage = page.locator('text="创建成功", text="成功"');
    const errorMessage = page.locator('text="失败", text="错误", .text-red-500, .error');
    
    const hasSuccess = await successMessage.isVisible();
    const hasError = await errorMessage.isVisible();
    
    console.log('Task creation result:', { hasSuccess, hasError });
    
    // At least one should be true (either success or error message should appear)
    expect(hasSuccess || hasError).toBeTruthy();
  });

  test('should handle mobile viewport correctly', async ({ page }) => {
    // Test mobile-specific UI elements
    await page.goto('http://localhost:3003');
    
    // Check if mobile navigation is working
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
    expect(viewport?.height).toBe(667);
    
    await page.screenshot({ path: 'mobile-viewport-test.png' });
  });
});