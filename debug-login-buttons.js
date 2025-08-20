const { chromium } = require('playwright');

async function debugLoginButtons() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const page = await browser.newPage();
  
  // Listen for all console messages
  page.on('console', msg => {
    console.log(`🖥️  Console: ${msg.text()}`);
  });
  
  // Listen for errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  try {
    console.log('📱 Loading http://localhost:3000...');
    await page.goto('http://localhost:3000');
    
    // Take screenshot
    await page.screenshot({ path: 'login-page.png' });
    console.log('📸 Screenshot saved as login-page.png');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Find all buttons
    const allButtons = await page.locator('button').all();
    console.log(`🔘 Found ${allButtons.length} buttons on page`);
    
    // Check button details
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();
      
      console.log(`Button ${i + 1}: "${text}" - Visible: ${isVisible}, Enabled: ${isEnabled}`);
    }
    
    // Look specifically for demo buttons
    const studentButton = page.locator('text=学生演示');
    const parentButton = page.locator('text=家长演示');
    
    const studentExists = await studentButton.count();
    const parentExists = await parentButton.count();
    
    console.log(`👨‍🎓 Student demo button exists: ${studentExists > 0}`);
    console.log(`👨‍👩‍👧‍👦 Parent demo button exists: ${parentExists > 0}`);
    
    if (studentExists > 0) {
      console.log('🔘 Trying to click student button...');
      try {
        await studentButton.click();
        console.log('✅ Student button clicked successfully');
        
        // Wait and check for changes
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        console.log('📍 Current URL after click:', currentUrl);
        
      } catch (error) {
        console.log('❌ Failed to click student button:', error.message);
      }
    }
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugLoginButtons().catch(console.error);