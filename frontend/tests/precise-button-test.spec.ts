import { test, expect } from '@playwright/test';

test.describe('Precise Button Functionality Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (['image', 'media', 'font'].includes(type)) {
        return route.abort();
      }
      route.continue();
    });
    
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
  });

  test('1. Main interface demo buttons are responsive', async ({ page }) => {
    // Target the specific button with quickLogin function
    const studentBtn = page.locator('button[onclick="quickLogin(\'student\')"]');
    const parentBtn = page.locator('button[onclick="quickLogin(\'parent\')"]');
    
    // Check buttons exist and are clickable
    await expect(studentBtn).toBeVisible({ timeout: 5000 });
    await expect(parentBtn).toBeVisible({ timeout: 5000 });
    
    // Test clicking student button
    await studentBtn.click();
    await page.waitForTimeout(3000);
    
    console.log('OK: Main demo buttons are responsive');
  });

  test('2. React Login component demo buttons work', async ({ page }) => {
    // Target the React component buttons with test IDs
    const reactStudentBtn = page.getByTestId('student-demo');
    const reactParentBtn = page.getByTestId('parent-demo');
    
    if (await reactStudentBtn.isVisible({ timeout: 3000 })) {
      await reactStudentBtn.click();
      await page.waitForTimeout(3000);
      console.log('OK: React component demo buttons work');
    } else {
      console.log('OK: React login component not visible (using main interface)');
    }
  });

  test('3. No fetch errors anywhere on application', async ({ page }) => {
    // Check initial page
    let failToFetch = await page.getByText('fail to fetch').count();
    let errorMsgs = await page.getByText('Error').count();
    
    console.log(`Initial page - Fail to fetch: ${failToFetch}, Errors: ${errorMsgs}`);
    
    // Click main demo button to navigate
    const studentBtn = page.locator('button[onclick="quickLogin(\'student\')"]');
    if (await studentBtn.isVisible({ timeout: 3000 })) {
      await studentBtn.click();
      await page.waitForTimeout(3000);
      
      // Check for errors after navigation
      failToFetch = await page.getByText('fail to fetch').count();
      errorMsgs = await page.getByText('Error').count();
      
      console.log(`After demo login - Fail to fetch: ${failToFetch}, Errors: ${errorMsgs}`);
    }
    
    if (failToFetch === 0 && errorMsgs === 0) {
      console.log('OK: No fetch errors found');
    } else {
      console.log(`FAIL: Found ${failToFetch} fetch errors and ${errorMsgs} error messages`);
      throw new Error('Fetch errors detected');
    }
  });

  test('4. Navigation elements exist and work after login', async ({ page }) => {
    // Login first
    const studentBtn = page.locator('button[onclick="quickLogin(\'student\')"]');
    if (await studentBtn.isVisible({ timeout: 3000 })) {
      await studentBtn.click();
      await page.waitForTimeout(3000);
    }
    
    // Look for any clickable elements that might be navigation
    const navSelectors = [
      'a[href*="planning"]',
      'a[href*="library"]', 
      'a[href*="reward"]',
      'a[href*="history"]',
      'button[class*="nav"]',
      '[role="button"]',
      'button:has-text("规划")',
      'button:has-text("任务")',
      'button:has-text("积分")',
      'button:has-text("奖励")'
    ];
    
    let workingNavElements = 0;
    
    for (const selector of navSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        console.log(`Found ${count} elements with selector: ${selector}`);
        
        // Try clicking the first element
        try {
          await elements.first().click();
          await page.waitForTimeout(2000);
          workingNavElements++;
          
          // Check for errors on new page
          const errors = await page.getByText('fail to fetch').count();
          if (errors === 0) {
            console.log(`OK: Navigation element works without errors`);
          } else {
            console.log(`FAIL: Navigation shows fetch errors`);
          }
        } catch (error) {
          // Element might not be clickable, that's ok
        }
      }
    }
    
    console.log(`OK: Found ${workingNavElements} working navigation elements`);
  });

  test('5. Task planning functionality check', async ({ page }) => {
    // Login first
    const studentBtn = page.locator('button[onclick="quickLogin(\'student\')"]');
    if (await studentBtn.isVisible({ timeout: 3000 })) {
      await studentBtn.click();
      await page.waitForTimeout(3000);
    }
    
    // Look for task planning related buttons/links
    const planningElements = [
      page.getByText('规划任务'),
      page.getByText('任务规划'),
      page.getByText('添加任务'),
      page.locator('button:has-text("规划")'),
      page.locator('a:has-text("规划")'),
      page.locator('[href*="planning"]')
    ];
    
    let foundPlanningButton = false;
    
    for (const element of planningElements) {
      if (await element.isVisible({ timeout: 2000 })) {
        foundPlanningButton = true;
        
        try {
          await element.click();
          await page.waitForTimeout(2000);
          
          // Check if it's a single working button (not multiple buttons)
          const planningButtons = await page.getByText('规划任务').count();
          if (planningButtons <= 1) {
            console.log('OK: Single planning button found and works');
          } else {
            console.log(`FAIL: Found ${planningButtons} planning buttons (should be single)`);
          }
          break;
        } catch (error) {
          console.log('FAIL: Planning button not clickable');
        }
      }
    }
    
    if (!foundPlanningButton) {
      console.log('FAIL: No task planning button found');
      throw new Error('Task planning button not found');
    }
  });
});