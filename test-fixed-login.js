const { chromium } = require('playwright');

async function testFixedLogin() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext({
    // Clear cache
    ignoreHTTPSErrors: true,
  });
  
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    } else {
      console.log(`🖥️  Console: ${msg.text()}`);
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  try {
    console.log('🔄 Loading page with cache disabled...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 15000
    });
    
    // Force reload to bypass cache
    await page.reload({ waitUntil: 'networkidle' });
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'fixed-login-page.png' });
    
    // Wait for page to stabilize
    await page.waitForTimeout(3000);
    
    // Look for demo buttons using more specific selectors
    console.log('🔍 Looking for demo buttons...');
    const studentButtons = await page.locator('button:has-text("学生演示")').all();
    const parentButtons = await page.locator('button:has-text("家长演示")').all();
    
    console.log(`👨‍🎓 Found ${studentButtons.length} student demo buttons`);
    console.log(`👨‍👩‍👧‍👦 Found ${parentButtons.length} parent demo buttons`);
    
    if (studentButtons.length > 0) {
      console.log('🔘 Attempting to click student demo button...');
      await studentButtons[0].click({ timeout: 5000 });
      
      console.log('⏳ Waiting for navigation or response...');
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('🎉 SUCCESS: Login worked and redirected to dashboard!');
      } else if (currentUrl.includes('/login') || currentUrl === 'http://localhost:3000/') {
        console.log('⚠️  Still on login page - button click may not have worked');
      } else {
        console.log(`ℹ️  On different page: ${currentUrl}`);
      }
      
      // Take final screenshot
      await page.screenshot({ path: 'after-click.png' });
      console.log('📸 After-click screenshot saved');
    }
    
    console.log('🔍 Keeping browser open for manual inspection...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testFixedLogin().catch(console.error);