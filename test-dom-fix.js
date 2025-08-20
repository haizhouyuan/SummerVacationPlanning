// Test DOM removeChild fix
const { chromium } = require('playwright');

async function testDOMFix() {
    console.log('🔧 Testing DOM removeChild fix...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Listen for console messages and errors
    const errors = [];
    const removeChildErrors = [];
    
    page.on('pageerror', error => {
        errors.push(error.message);
        if (error.message.includes('removeChild') || error.message.includes('NotFoundError')) {
            removeChildErrors.push(error.message);
            console.error('❌ DOM Error:', error.message);
        }
    });
    
    page.on('console', msg => {
        if (msg.type() === 'error' && (msg.text().includes('removeChild') || msg.text().includes('NotFoundError'))) {
            removeChildErrors.push(msg.text());
            console.error('❌ Console DOM Error:', msg.text());
        } else if (msg.type() === 'warn' && msg.text().includes('Failed to remove element safely')) {
            console.log('✅ Safe removal warning (expected):', msg.text());
        }
    });
    
    try {
        console.log('🔗 Loading React application...');
        await page.goto('http://localhost:3002', { 
            waitUntil: 'networkidle',
            timeout: 15000 
        });
        
        console.log('✅ Page loaded successfully');
        
        // Wait for potential DOM operations
        await page.waitForTimeout(3000);
        
        // Test login to trigger potential DOM operations
        console.log('🧪 Testing demo login (may trigger DOM operations)...');
        
        try {
            await page.evaluate(() => {
                if (typeof window.quickLogin === 'function') {
                    return window.quickLogin('student');
                }
            });
            
            console.log('✅ Demo login attempted');
            
            // Wait for any async DOM operations
            await page.waitForTimeout(5000);
            
        } catch (evalError) {
            console.log('⚠️ Demo login failed, continuing with test...');
        }
        
        // Check for specific removeChild errors
        const hasRemoveChildErrors = removeChildErrors.length > 0;
        
        console.log(`🔍 DOM removeChild errors found: ${hasRemoveChildErrors ? '❌' : '✅'} (${removeChildErrors.length})`);
        
        // Summary
        console.log('\n🎯 DOM Fix Test Results:');
        console.log(`  📍 Page loads: ${errors.length === 0 ? '✅' : '❌'} (${errors.length} total errors)`);
        console.log(`  🛡️ removeChild errors: ${!hasRemoveChildErrors ? '✅ FIXED' : '❌ STILL PRESENT'} (${removeChildErrors.length})`);
        console.log(`  🔧 Safe DOM operations: ${!hasRemoveChildErrors ? '✅' : '❌'}`);
        
        if (removeChildErrors.length > 0) {
            console.log('\n📋 removeChild Error Details:');
            removeChildErrors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testDOMFix().catch(console.error);