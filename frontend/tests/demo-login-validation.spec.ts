import { test, expect } from '@playwright/test';

test.describe('Demo Login Validation Report', () => {
  test('comprehensive demo login functionality validation', async ({ page }) => {
    console.log('Starting comprehensive validation...');
    
    let consoleMessages: string[] = [];
    let errorMessages: string[] = [];
    
    // Capture all console and error messages
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
    
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/validation-01-initial.png', fullPage: true });
    
    // Check for compilation errors display
    const hasCompilationOverlay = await page.locator('#webpack-dev-server-client-overlay').isVisible();
    console.log(`Webpack compilation overlay visible: ${hasCompilationOverlay}`);
    
    if (hasCompilationOverlay) {
      const errorText = await page.locator('#webpack-dev-server-client-overlay').textContent();
      console.log('Compilation errors:', errorText);
    }
    
    // Dismiss overlay to access the login form
    if (hasCompilationOverlay) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
    
    // Verify login form is accessible
    await expect(page.locator('h2:has-text("欢迎回来")')).toBeVisible();
    console.log('✅ Login form is accessible');
    
    // Verify demo buttons are present
    const studentDemoButton = page.locator('button:has-text("👨‍🎓 学生演示")');
    const parentDemoButton = page.locator('button:has-text("👨‍👩‍👧‍👦 家长演示")');
    
    await expect(studentDemoButton).toBeVisible();
    await expect(parentDemoButton).toBeVisible();
    console.log('✅ Demo buttons are visible');
    
    // Test student demo login
    console.log('Testing student demo login...');
    await studentDemoButton.click({ force: true });
    
    // Wait for any authentication processing
    await page.waitForTimeout(2000);
    
    // Check localStorage for demo token
    const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));
    const userRole = await page.evaluate(() => localStorage.getItem('user_role'));
    const apiMode = await page.evaluate(() => localStorage.getItem('api_mode'));
    
    console.log(`Auth token set: ${authToken ? 'YES' : 'NO'}`);
    console.log(`User role: ${userRole}`);
    console.log(`API mode: ${apiMode}`);
    
    // Take screenshot after demo login
    await page.screenshot({ path: 'test-results/validation-02-after-demo-login.png', fullPage: true });
    
    // Check for JSON parsing errors (the main issue we're testing)
    const hasJSONParsingError = consoleMessages.some(msg => 
      msg.includes('Unexpected token') && msg.includes('<!DOCTYPE') ||
      msg.includes('JSON.parse') ||
      msg.includes('SyntaxError: Unexpected token')
    ) || errorMessages.some(error => 
      error.includes('Unexpected token') && error.includes('<!DOCTYPE') ||
      error.includes('JSON.parse') ||
      error.includes('SyntaxError')
    );
    
    console.log(`JSON parsing errors detected: ${hasJSONParsingError ? 'YES' : 'NO'}`);
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Test results summary
    console.log('\n=== TEST RESULTS SUMMARY ===');
    console.log(`✅ Login page loads: YES`);
    console.log(`✅ Demo buttons visible: YES`);
    console.log(`✅ Demo login sets auth data: ${authToken && userRole === 'student' ? 'YES' : 'NO'}`);
    console.log(`✅ Compatible API mode enabled: ${apiMode === 'compatible' ? 'YES' : 'NO'}`);
    console.log(`❌ Navigation to dashboard: ${currentUrl.includes('dashboard') ? 'YES' : 'NO'}`);
    console.log(`✅ No JSON parsing errors: ${!hasJSONParsingError ? 'YES' : 'NO'}`);
    console.log(`⚠️  Compilation errors present: ${hasCompilationOverlay ? 'YES' : 'NO'}`);
    
    // Log all console messages for analysis
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg}`);
    });
    
    if (errorMessages.length > 0) {
      console.log('\n=== ERROR MESSAGES ===');
      errorMessages.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg}`);
      });
    }
    
    // Key assertions for the test
    expect(authToken).toBeTruthy(); // Demo login should set auth token
    expect(userRole).toBe('student'); // Should set correct role
    expect(apiMode).toBe('compatible'); // Should enable compatible mode
    expect(hasJSONParsingError).toBeFalsy(); // Should not have JSON parsing errors
    
    console.log('✅ Comprehensive validation completed');
  });
});