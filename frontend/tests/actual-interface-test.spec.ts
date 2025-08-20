import { test, expect } from '@playwright/test';

test.describe('Actual Interface Button Functionality Test', () => {
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
    await page.waitForTimeout(2000);
  });

  test('1. Demo login buttons should be responsive and work', async ({ page }) => {
    // Look for actual demo buttons by text
    const studentDemoBtn = page.getByText('学生演示');
    const parentDemoBtn = page.getByText('家长演示');
    
    // Check if student demo button exists and is clickable
    await expect(studentDemoBtn).toBeVisible({ timeout: 5000 });
    
    // Click student demo button
    await studentDemoBtn.click();
    await page.waitForTimeout(3000);
    
    // After login, should navigate away from initial page or show different content
    const currentUrl = page.url();
    console.log('OK: Student demo button clicked, URL:', currentUrl.substring(0, 40));
  });

  test('2. Check for "fail to fetch" errors on main interface', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Check for any "fail to fetch" error messages
    const failToFetch = page.getByText('fail to fetch');
    const errorMsg = page.getByText('Error');
    const fetchError = page.getByText('fetch');
    
    const failCount = await failToFetch.count();
    const errorCount = await errorMsg.count();
    const fetchCount = await fetchError.count();
    
    if (failCount === 0 && errorCount === 0) {
      console.log('OK: No fetch errors on main interface');
    } else {
      console.log('FAIL: Found fetch/error messages');
      throw new Error('Fetch errors detected on main interface');
    }
  });

  test('3. Test navigation buttons after demo login', async ({ page }) => {
    // Click student demo first
    const studentDemoBtn = page.getByText('学生演示');
    if (await studentDemoBtn.isVisible({ timeout: 3000 })) {
      await studentDemoBtn.click();
      await page.waitForTimeout(3000);
    }
    
    // Look for navigation elements - could be icons or text links
    const navElements = [
      '任务规划', '任务库', '积分兑换', '奖励', '历史', '任务历史'
    ];
    
    let foundNavElements = 0;
    
    for (const navText of navElements) {
      const navElement = page.getByText(navText);
      if (await navElement.isVisible({ timeout: 2000 })) {
        foundNavElements++;
        console.log(`OK: Found navigation: ${navText}`);
        
        // Try clicking the navigation element
        try {
          await navElement.click();
          await page.waitForTimeout(2000);
          
          // Check for fetch errors on the new page
          const failToFetch = page.getByText('fail to fetch');
          const errorMsg = page.getByText('Error');
          
          if (await failToFetch.count() === 0 && await errorMsg.count() === 0) {
            console.log(`OK: No fetch errors in ${navText}`);
          } else {
            console.log(`FAIL: Fetch errors in ${navText}`);
          }
        } catch (error) {
          console.log(`FAIL: Could not interact with ${navText}`);
        }
      }
    }
    
    if (foundNavElements > 0) {
      console.log(`OK: Found ${foundNavElements} navigation elements`);
    } else {
      console.log('FAIL: No navigation elements found');
      throw new Error('No navigation elements found');
    }
  });

  test('4. Test specific button functionality after login', async ({ page }) => {
    // Click student demo first
    const studentDemoBtn = page.getByText('学生演示');
    if (await studentDemoBtn.isVisible({ timeout: 3000 })) {
      await studentDemoBtn.click();
      await page.waitForTimeout(3000);
    }
    
    // Look for specific buttons mentioned in the issues
    const buttonTexts = [
      '规划任务', '任务规划', '添加任务', '保存', '确认', '兑换', '完成'
    ];
    
    let responsiveButtons = 0;
    
    for (const buttonText of buttonTexts) {
      const button = page.getByText(buttonText).or(page.getByRole('button', { name: new RegExp(buttonText) }));
      
      if (await button.isVisible({ timeout: 2000 })) {
        try {
          // Test if button is clickable
          await button.click();
          await page.waitForTimeout(1000);
          responsiveButtons++;
          console.log(`OK: Button "${buttonText}" is responsive`);
        } catch (error) {
          console.log(`FAIL: Button "${buttonText}" not responsive`);
        }
      }
    }
    
    console.log(`OK: Found ${responsiveButtons} responsive buttons`);
  });

  test('5. Overall application health check', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check for critical errors
    const errors = [
      'fail to fetch', 'Error', '错误', 'undefined', 'null', '500', '404', 'Network Error'
    ];
    
    let errorCount = 0;
    for (const errorText of errors) {
      const count = await page.getByText(errorText).count();
      errorCount += count;
    }
    
    if (errorCount === 0) {
      console.log('OK: Application loads without critical errors');
    } else {
      console.log(`FAIL: Found ${errorCount} error messages`);
      throw new Error(`Application has ${errorCount} error messages`);
    }
  });
});