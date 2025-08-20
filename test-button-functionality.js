const { chromium } = require('playwright');

async function testButtonFunctionality() {
  console.log('Starting comprehensive button functionality test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Block resources to reduce token usage
  await page.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (['image', 'media', 'font'].includes(type)) {
      return route.abort();
    }
    route.continue();
  });

  const results = {
    dashboard: 'PENDING',
    taskPlanning: 'PENDING', 
    taskLibrary: 'PENDING',
    pointsRewards: 'PENDING',
    taskHistory: 'PENDING'
  };

  try {
    // Navigate to the application
    console.log('1. Loading application at localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    
    // Test 1: Dashboard buttons responsiveness
    console.log('2. Testing Dashboard buttons...');
    try {
      // Look for demo login buttons first
      const studentDemoBtn = page.getByTestId('student-demo');
      if (await studentDemoBtn.isVisible({ timeout: 3000 })) {
        await studentDemoBtn.click();
        await page.waitForTimeout(2000);
        
        // Check if we're on dashboard and buttons are responsive
        const dashboardElements = await page.locator('[class*="dashboard"]').count();
        if (dashboardElements > 0) {
          results.dashboard = 'OK: Dashboard loaded and responsive';
        } else {
          results.dashboard = 'FAIL: Dashboard not loaded after demo login';
        }
      } else {
        results.dashboard = 'FAIL: Demo login button not found';
      }
    } catch (error) {
      results.dashboard = `FAIL: ${error.message.substring(0, 40)}`;
    }

    // Test 2: Task Planning Interface 
    console.log('3. Testing Task Planning interface...');
    try {
      // Navigate to task planning
      const taskPlanningNav = page.getByText('任务规划').or(page.getByRole('link', { name: /任务规划/ }));
      if (await taskPlanningNav.isVisible({ timeout: 3000 })) {
        await taskPlanningNav.click();
        await page.waitForTimeout(2000);
        
        // Look for single "规划任务" button
        const planTaskBtn = page.getByText('规划任务').or(page.getByRole('button', { name: /规划任务/ }));
        if (await planTaskBtn.isVisible({ timeout: 3000 })) {
          await planTaskBtn.click();
          await page.waitForTimeout(1000);
          results.taskPlanning = 'OK: Single planning button works';
        } else {
          results.taskPlanning = 'FAIL: Planning button not found or not single';
        }
      } else {
        results.taskPlanning = 'FAIL: Task planning navigation not found';
      }
    } catch (error) {
      results.taskPlanning = `FAIL: ${error.message.substring(0, 40)}`;
    }

    // Test 3: Task Library - no "fail to fetch" errors
    console.log('4. Testing Task Library...');
    try {
      const taskLibraryNav = page.getByText('任务库').or(page.getByRole('link', { name: /任务库/ }));
      if (await taskLibraryNav.isVisible({ timeout: 3000 })) {
        await taskLibraryNav.click();
        await page.waitForTimeout(3000);
        
        // Check for "fail to fetch" errors
        const failText = await page.getByText('fail to fetch').count();
        const errorText = await page.getByText('Error').count();
        
        if (failText === 0 && errorText === 0) {
          results.taskLibrary = 'OK: No fetch errors found';
        } else {
          results.taskLibrary = 'FAIL: Fetch errors detected';
        }
      } else {
        results.taskLibrary = 'FAIL: Task library navigation not found';
      }
    } catch (error) {
      results.taskLibrary = `FAIL: ${error.message.substring(0, 40)}`;
    }

    // Test 4: Points/Rewards Exchange
    console.log('5. Testing Points/Rewards Exchange...');
    try {
      const rewardsNav = page.getByText('积分兑换').or(page.getByText('奖励').or(page.getByRole('link', { name: /积分|奖励/ })));
      if (await rewardsNav.isVisible({ timeout: 3000 })) {
        await rewardsNav.click();
        await page.waitForTimeout(3000);
        
        // Check for "fail to fetch" errors
        const failText = await page.getByText('fail to fetch').count();
        const errorText = await page.getByText('Error').count();
        
        if (failText === 0 && errorText === 0) {
          results.pointsRewards = 'OK: No fetch errors found';
        } else {
          results.pointsRewards = 'FAIL: Fetch errors detected';
        }
      } else {
        results.pointsRewards = 'FAIL: Rewards navigation not found';
      }
    } catch (error) {
      results.pointsRewards = `FAIL: ${error.message.substring(0, 40)}`;
    }

    // Test 5: Task History Page Loading  
    console.log('6. Testing Task History page...');
    try {
      const historyNav = page.getByText('任务历史').or(page.getByText('历史').or(page.getByRole('link', { name: /历史/ })));
      if (await historyNav.isVisible({ timeout: 3000 })) {
        await historyNav.click();
        await page.waitForTimeout(3000);
        
        // Check if page loads without errors
        const failText = await page.getByText('fail to fetch').count();
        const errorText = await page.getByText('Error').count();
        const loadingText = await page.getByText('loading', { exact: false }).count();
        
        if (failText === 0 && errorText === 0 && loadingText === 0) {
          results.taskHistory = 'OK: Page loaded without errors';
        } else {
          results.taskHistory = 'FAIL: Page loading issues detected';
        }
      } else {
        results.taskHistory = 'FAIL: Task history navigation not found';
      }
    } catch (error) {
      results.taskHistory = `FAIL: ${error.message.substring(0, 40)}`;
    }

  } catch (error) {
    console.error('Critical error:', error);
  } finally {
    await browser.close();
  }

  // Output results
  console.log('\n=== TEST RESULTS ===');
  console.log(`Dashboard Buttons: ${results.dashboard}`);
  console.log(`Task Planning: ${results.taskPlanning}`);
  console.log(`Task Library: ${results.taskLibrary}`);
  console.log(`Points/Rewards: ${results.pointsRewards}`);
  console.log(`Task History: ${results.taskHistory}`);
  
  return results;
}

testButtonFunctionality().catch(console.error);