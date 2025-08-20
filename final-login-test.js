const { chromium } = require('playwright');

async function finalLoginTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages to debug issues
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('error') || text.includes('Error') || text.includes('failed') || text.includes('Failed')) {
      console.log(`❌ Console: ${text}`);
    } else if (text.includes('success') || text.includes('Success') || text.includes('✅')) {
      console.log(`✅ Console: ${text}`);
    } else if (text.includes('login') || text.includes('Login') || text.includes('🔄')) {
      console.log(`🔄 Console: ${text}`);
    }
  });
  
  // Listen for network responses
  page.on('response', response => {
    if (response.url().includes('login') || response.url().includes('auth')) {
      console.log(`🌐 API Response: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('🚀 Loading fresh http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 20000
    });
    
    console.log('⏱️  Waiting for page to fully load...');
    await page.waitForTimeout(3000);
    
    // Look for student demo button
    console.log('👀 Looking for student demo button...');
    const studentBtn = page.locator('button').filter({ hasText: '学生演示' });
    const count = await studentBtn.count();
    console.log(`📊 Found ${count} student demo buttons`);
    
    if (count > 0) {
      console.log('🎯 Clicking student demo button...');
      
      // Try clicking the first visible button
      const firstBtn = studentBtn.first();
      await firstBtn.waitFor({ state: 'visible' });
      await firstBtn.click();
      
      console.log('⏳ Waiting for login response...');
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('🎉 SUCCESS! Login worked and redirected to dashboard!');
        console.log('✅ Demo buttons are working correctly!');
        
        // Take success screenshot
        await page.screenshot({ path: 'login-success.png' });
        
      } else {
        console.log('⚠️  Login may not have worked - still on:', currentUrl);
        
        // Take debug screenshot
        await page.screenshot({ path: 'login-debug.png' });
        
        // Check for error messages
        const errorText = await page.locator('text=/错误|error|failed|失败/i').first().textContent().catch(() => null);
        if (errorText) {
          console.log('❌ Error message found:', errorText);
        }
      }
    } else {
      console.log('❌ No student demo buttons found!');
      await page.screenshot({ path: 'no-buttons.png' });
    }
    
    console.log('🔍 Browser will stay open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
  }
}

finalLoginTest().catch(console.error);