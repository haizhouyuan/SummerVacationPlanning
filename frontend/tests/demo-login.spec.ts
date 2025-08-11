import { test, expect } from '@playwright/test';

test.describe('Demo Login Functionality', () => {
  let consoleMessages: string[] = [];
  let errorMessages: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Capture console messages
    consoleMessages = [];
    errorMessages = [];
    
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`${msg.type()}: ${text}`);
      console.log(`Console ${msg.type()}: ${text}`);
    });
    
    page.on('pageerror', error => {
      const errorText = error.toString();
      errorMessages.push(errorText);
      console.error('Page error:', errorText);
    });

    // Listen for network errors that might cause JSON parsing issues
    page.on('response', response => {
      if (!response.ok()) {
        console.log(`Failed response: ${response.status()} ${response.url()}`);
      }
    });
  });

  test('should successfully login with student demo and load dashboard without JSON parsing errors', async ({ page }) => {
    console.log('Starting demo login test...');
    
    // Step 1: Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('/login');
    
    // Wait for the login page to load
    await page.waitForLoadState('networkidle');
    
    // Try to dismiss webpack dev server overlay if present
    try {
      const overlay = page.locator('#webpack-dev-server-client-overlay');
      if (await overlay.isVisible()) {
        console.log('Dismissing webpack dev server overlay...');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      // Ignore if overlay not found
      console.log('No webpack overlay found or failed to dismiss');
    }
    
    // Verify we're on the login page
    await expect(page).toHaveURL(/.*\/login/);
    
    // Take a screenshot of the login page
    await page.screenshot({ path: 'test-results/01-login-page.png', fullPage: true });
    
    // Step 2: Find and click the student demo button
    console.log('Looking for student demo button...');
    
    // Wait for the button to be visible - try multiple selectors
    const studentDemoButton = page.locator('text=👨‍🎓 学生演示').or(
      page.locator('button').filter({ hasText: '学生演示' })
    ).or(
      page.locator('[data-testid="student-demo-button"]')
    ).or(
      page.locator('button:has-text("学生")')
    );
    
    await expect(studentDemoButton).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/02-before-demo-click.png', fullPage: true });
    
    // Step 3: Click the student demo button
    console.log('Clicking student demo button...');
    
    // Handle the webpack overlay issue by using force click
    await studentDemoButton.click({ force: true });
    
    // Wait for potential loading state
    await page.waitForTimeout(2000);
    
    // Check if we're stuck on "登录中..." (logging in)
    const loginLoadingText = page.locator('text=登录中');
    if (await loginLoadingText.isVisible()) {
      console.log('Found login loading text, waiting for it to disappear...');
      await expect(loginLoadingText).not.toBeVisible({ timeout: 15000 });
    }
    
    // Step 4: Verify navigation to dashboard
    console.log('Waiting for navigation to dashboard...');
    await page.waitForURL(/.*\/dashboard/, { timeout: 30000 });
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Step 5: Wait for dashboard to load completely
    console.log('Waiting for dashboard to load completely...');
    await page.waitForLoadState('networkidle');
    
    // Wait for key dashboard elements to appear
    await page.waitForSelector('text=欢迎', { timeout: 15000 });
    
    // Step 6: Verify dashboard content is loaded
    console.log('Verifying dashboard content...');
    
    // Check for welcome message with student name
    await expect(page.locator('text=演示学生')).toBeVisible();
    
    // Check for points display (should show around 240 points)
    const pointsElement = page.locator('[data-testid="points-display"]').or(
      page.locator('text=当前积分').or(
        page.locator('text=积分')
      )
    );
    await expect(pointsElement.first()).toBeVisible({ timeout: 10000 });
    
    // Check for level display (should show Level 3)
    const levelElement = page.locator('text=等级').or(
      page.locator('text=Level').or(
        page.locator('text=Lv')
      )
    );
    await expect(levelElement.first()).toBeVisible({ timeout: 10000 });
    
    // Step 7: Check for statistics data loading without JSON parsing errors
    console.log('Checking for statistics data...');
    
    // Wait a bit more for any async data loading
    await page.waitForTimeout(3000);
    
    // Look for weekly stats or achievements
    const weeklyStats = page.locator('text=本周').or(
      page.locator('text=周统计').or(
        page.locator('text=成就').or(
          page.locator('[data-testid="weekly-stats"]')
        )
      )
    );
    
    // At least one of these should be visible
    const hasWeeklyContent = await weeklyStats.first().isVisible();
    if (hasWeeklyContent) {
      console.log('Weekly stats/achievements found');
    }
    
    // Step 8: Take final screenshot
    await page.screenshot({ path: 'test-results/03-dashboard-success.png', fullPage: true });
    
    // Step 9: Verify no JSON parsing errors occurred
    console.log('Checking for JSON parsing errors...');
    
    const hasJSONParsingError = consoleMessages.some(msg => 
      msg.includes('Unexpected token') && msg.includes('<!DOCTYPE') ||
      msg.includes('JSON.parse') ||
      msg.includes('SyntaxError')
    ) || errorMessages.some(error => 
      error.includes('Unexpected token') && error.includes('<!DOCTYPE') ||
      error.includes('JSON.parse') ||
      error.includes('SyntaxError')
    );
    
    if (hasJSONParsingError) {
      console.error('JSON parsing error detected!');
      console.error('Console messages:', consoleMessages);
      console.error('Error messages:', errorMessages);
    }
    
    // Assert no JSON parsing errors
    expect(hasJSONParsingError).toBeFalsy();
    
    // Step 10: Final verification that we have a functioning dashboard
    console.log('Final verification...');
    
    // Check that we have some key dashboard elements
    const hasDashboardContent = await page.locator('text=欢迎').isVisible() ||
                               await page.locator('text=积分').isVisible() ||
                               await page.locator('text=等级').isVisible();
    
    expect(hasDashboardContent).toBeTruthy();
    
    console.log('Demo login test completed successfully!');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Total error messages: ${errorMessages.length}`);
    
    // Log all console messages for debugging
    if (consoleMessages.length > 0) {
      console.log('All console messages:');
      consoleMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
    }
  });

  test('should successfully login with parent demo', async ({ page }) => {
    console.log('Starting parent demo login test...');
    
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Find and click parent demo button
    const parentDemoButton = page.locator('text=👨‍👩‍👧‍👦 家长演示').or(
      page.locator('button').filter({ hasText: '家长演示' })
    ).or(
      page.locator('[data-testid="parent-demo-button"]')
    );
    
    await expect(parentDemoButton).toBeVisible({ timeout: 10000 });
    await parentDemoButton.click({ force: true });
    
    // Wait for navigation
    await page.waitForURL(/.*\/(dashboard|parent)/, { timeout: 30000 });
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/04-parent-dashboard.png', fullPage: true });
    
    // Verify parent content is loaded
    const hasParentContent = await page.locator('text=家长').isVisible() ||
                            await page.locator('text=管理').isVisible() ||
                            await page.locator('text=监控').isVisible();
    
    expect(hasParentContent).toBeTruthy();
    
    console.log('Parent demo login test completed successfully!');
  });
});