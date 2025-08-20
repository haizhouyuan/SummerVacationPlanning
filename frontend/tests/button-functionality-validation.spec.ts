import { test, expect } from '@playwright/test';

test.describe('Button Functionality Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Block resources to reduce token usage
    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (['image', 'media', 'font'].includes(type)) {
        return route.abort();
      }
      route.continue();
    });
    
    await page.goto('http://localhost:3000');
  });

  test('1. Dashboard buttons should be responsive', async ({ page }) => {
    // Look for demo login buttons
    const studentDemo = page.getByTestId('student-demo');
    const teacherDemo = page.getByTestId('teacher-demo');
    
    if (await studentDemo.isVisible({ timeout: 3000 })) {
      await studentDemo.click();
      await page.waitForTimeout(2000);
      
      // Verify dashboard loads and has responsive elements
      const dashboardContent = page.locator('[class*="dashboard"], [data-testid*="dashboard"]');
      await expect(dashboardContent.first()).toBeVisible({ timeout: 5000 });
      console.log('OK: Dashboard buttons responsive');
    } else if (await teacherDemo.isVisible({ timeout: 3000 })) {
      await teacherDemo.click();
      await page.waitForTimeout(2000);
      console.log('OK: Teacher demo login works');
    } else {
      console.log('FAIL: No demo login buttons found');
      throw new Error('Demo login buttons not found');
    }
  });

  test('2. Task planning should have single working button', async ({ page }) => {
    // Login first if needed
    const studentDemo = page.getByTestId('student-demo');
    if (await studentDemo.isVisible({ timeout: 2000 })) {
      await studentDemo.click();
      await page.waitForTimeout(1000);
    }
    
    // Navigate to task planning
    const taskPlanningLink = page.getByText('任务规划').or(page.locator('a[href*="planning"]'));
    if (await taskPlanningLink.isVisible({ timeout: 3000 })) {
      await taskPlanningLink.click();
      await page.waitForTimeout(2000);
      
      // Look for single "规划任务" button
      const planTaskBtn = page.getByText('规划任务').or(page.getByRole('button', { name: /规划任务/ }));
      await expect(planTaskBtn).toBeVisible({ timeout: 5000 });
      
      // Click to test functionality
      await planTaskBtn.click();
      await page.waitForTimeout(1000);
      console.log('OK: Single planning button works');
    } else {
      console.log('FAIL: Task planning navigation not found');
      throw new Error('Task planning nav not found');
    }
  });

  test('3. Task library should not show fail to fetch errors', async ({ page }) => {
    // Login first if needed
    const studentDemo = page.getByTestId('student-demo');
    if (await studentDemo.isVisible({ timeout: 2000 })) {
      await studentDemo.click();
      await page.waitForTimeout(1000);
    }
    
    // Navigate to task library
    const taskLibraryLink = page.getByText('任务库').or(page.locator('a[href*="library"]'));
    if (await taskLibraryLink.isVisible({ timeout: 3000 })) {
      await taskLibraryLink.click();
      await page.waitForTimeout(3000);
      
      // Check for error messages
      const failToFetch = page.getByText('fail to fetch');
      const errorMsg = page.getByText('Error', { exact: false });
      
      await expect(failToFetch).not.toBeVisible({ timeout: 2000 });
      await expect(errorMsg).not.toBeVisible({ timeout: 2000 });
      console.log('OK: No fetch errors in task library');
    } else {
      console.log('FAIL: Task library navigation not found');
      throw new Error('Task library nav not found');
    }
  });

  test('4. Points/rewards page should not show fail to fetch errors', async ({ page }) => {
    // Login first if needed
    const studentDemo = page.getByTestId('student-demo');
    if (await studentDemo.isVisible({ timeout: 2000 })) {
      await studentDemo.click();
      await page.waitForTimeout(1000);
    }
    
    // Navigate to rewards/points page
    const rewardsLink = page.getByText('积分兑换').or(page.getByText('奖励').or(page.locator('a[href*="reward"]')));
    if (await rewardsLink.isVisible({ timeout: 3000 })) {
      await rewardsLink.click();
      await page.waitForTimeout(3000);
      
      // Check for error messages
      const failToFetch = page.getByText('fail to fetch');
      const errorMsg = page.getByText('Error', { exact: false });
      
      await expect(failToFetch).not.toBeVisible({ timeout: 2000 });
      await expect(errorMsg).not.toBeVisible({ timeout: 2000 });
      console.log('OK: No fetch errors in rewards page');
    } else {
      console.log('FAIL: Rewards navigation not found');
      throw new Error('Rewards nav not found');
    }
  });

  test('5. Task history page should load properly', async ({ page }) => {
    // Login first if needed
    const studentDemo = page.getByTestId('student-demo');
    if (await studentDemo.isVisible({ timeout: 2000 })) {
      await studentDemo.click();
      await page.waitForTimeout(1000);
    }
    
    // Navigate to task history
    const historyLink = page.getByText('任务历史').or(page.getByText('历史').or(page.locator('a[href*="history"]')));
    if (await historyLink.isVisible({ timeout: 3000 })) {
      await historyLink.click();
      await page.waitForTimeout(3000);
      
      // Check page loads without errors
      const failToFetch = page.getByText('fail to fetch');
      const errorMsg = page.getByText('Error', { exact: false });
      const loadingStuck = page.getByText('Loading...').or(page.getByText('加载中...'));
      
      await expect(failToFetch).not.toBeVisible({ timeout: 2000 });
      await expect(errorMsg).not.toBeVisible({ timeout: 2000 });
      
      // Make sure it's not stuck loading
      await page.waitForTimeout(2000);
      const stillLoading = await loadingStuck.isVisible({ timeout: 1000 });
      if (stillLoading) {
        throw new Error('Page stuck in loading state');
      }
      
      console.log('OK: Task history page loaded properly');
    } else {
      console.log('FAIL: Task history navigation not found');
      throw new Error('Task history nav not found');
    }
  });
});