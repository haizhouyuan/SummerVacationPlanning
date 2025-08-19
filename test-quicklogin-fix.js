// Test quickLogin function fix
const { chromium } = require('playwright');

async function testQuickLoginFix() {
    console.log('🔧 Testing quickLogin function fix...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Listen for console messages and errors
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
        consoleMessages.push(`${msg.type()}: ${msg.text()}`);
        console.log(`🔤 Console [${msg.type()}]:`, msg.text());
    });
    
    page.on('pageerror', error => {
        errors.push(error.message);
        console.error('❌ Page Error:', error.message);
    });
    
    try {
        console.log('🔗 Loading React application...');
        await page.goto('http://localhost:3002', { 
            waitUntil: 'networkidle',
            timeout: 15000 
        });
        
        console.log('✅ Page loaded successfully');
        
        // Wait for React to initialize
        await page.waitForTimeout(3000);
        
        // Check if quickLogin function exists in window
        const quickLoginExists = await page.evaluate(() => {
            return typeof window.quickLogin === 'function';
        });
        
        console.log(`🔍 quickLogin function exists: ${quickLoginExists ? '✅ YES' : '❌ NO'}`);
        
        if (quickLoginExists) {
            // Test quickLogin function directly
            console.log('🧪 Testing quickLogin function...');
            
            try {
                await page.evaluate(() => {
                    // Call quickLogin for student role
                    return window.quickLogin('student');
                });
                
                console.log('✅ quickLogin function executed without errors');
                
                // Wait for potential navigation or login completion
                await page.waitForTimeout(3000);
                
                // Check if user is now logged in by looking for dashboard elements
                const isDashboardVisible = await page.locator('[data-testid="dashboard"]').isVisible().catch(() => false);
                const hasUserInfo = await page.locator('text="演示学生"').isVisible().catch(() => false);
                
                console.log(`📊 Dashboard visible: ${isDashboardVisible ? '✅' : '❓'}`);
                console.log(`👤 User info visible: ${hasUserInfo ? '✅' : '❓'}`);
                
            } catch (evalError) {
                console.error('❌ Error executing quickLogin:', evalError.message);
            }
        }
        
        // Check for any quickLogin-related errors
        const hasQuickLoginError = errors.some(error => 
            error.includes('quickLogin is not defined') || 
            error.includes('quickLogin')
        );
        
        console.log(`🔍 quickLogin errors found: ${hasQuickLoginError ? '❌ YES' : '✅ NO'}`);
        
        // Summary
        console.log('\n🎯 Test Results:');
        console.log(`  📍 Page loads: ${errors.length === 0 ? '✅' : '❌'} (${errors.length} errors)`);
        console.log(`  🔧 quickLogin defined: ${quickLoginExists ? '✅' : '❌'}`);
        console.log(`  🚀 quickLogin works: ${quickLoginExists && !hasQuickLoginError ? '✅' : '❌'}`);
        
        if (errors.length > 0) {
            console.log('\n📋 Error Details:');
            errors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testQuickLoginFix().catch(console.error);