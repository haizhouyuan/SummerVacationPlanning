const { chromium } = require('playwright');

async function testFrontendLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('📱 Loading frontend page...');
    await page.goto('http://localhost:3000');
    
    // Wait for login page to load
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Look for demo login buttons
    const demoButtons = await page.locator('text=演示').all();
    console.log(`Found ${demoButtons.length} demo buttons`);
    
    if (demoButtons.length > 0) {
      console.log('🔘 Clicking first demo button...');
      await demoButtons[0].click();
      
      // Wait a bit and check for any error messages
      await page.waitForTimeout(3000);
      
      const errorElements = await page.locator('text=错误').all();
      const failedElements = await page.locator('text=failed').all();
      
      if (errorElements.length > 0 || failedElements.length > 0) {
        console.log('❌ Error detected on page');
        const pageText = await page.textContent('body');
        console.log('Page content snippet:', pageText.substring(0, 500));
      } else {
        console.log('✅ No obvious errors found');
      }
      
      // Check current URL
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('🎉 Login successful - redirected to dashboard');
      } else {
        console.log('⚠️ Still on login page or elsewhere');
      }
    } else {
      console.log('⚠️ No demo buttons found');
      const pageText = await page.textContent('body');
      console.log('Page content:', pageText.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testFrontendLogin().catch(console.error);