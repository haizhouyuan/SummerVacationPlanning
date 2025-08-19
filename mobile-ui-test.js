// Mobile UI test script
const { chromium } = require('playwright');

async function testMobileUI() {
    console.log('🔍 Testing mobile UI optimizations...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    
    // Test different mobile viewports
    const mobileViewports = [
        { width: 375, height: 667, name: 'iPhone SE' },
        { width: 390, height: 844, name: 'iPhone 12' },
        { width: 360, height: 640, name: 'Galaxy S5' },
        { width: 768, height: 1024, name: 'iPad' },
    ];
    
    for (const viewport of mobileViewports) {
        console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        const context = await browser.newContext({
            viewport: viewport,
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
        });
        
        const page = await context.newPage();
        
        try {
            // Navigate to the app
            await page.goto('http://localhost:3001', { 
                waitUntil: 'networkidle',
                timeout: 15000 
            });
            
            console.log('✅ Page loaded successfully');
            
            // Test login page mobile layout
            const demoButton = page.locator('button:has-text("学生演示")');
            if (await demoButton.isVisible({ timeout: 5000 })) {
                // Check if button has proper touch target size
                const buttonBox = await demoButton.boundingBox();
                const hasProperTouchTarget = buttonBox && buttonBox.height >= 44;
                
                console.log(`Touch target check: ${hasProperTouchTarget ? '✅ Good' : '❌ Too small'} (${buttonBox?.height}px height)`);
                
                await demoButton.click();
                await page.waitForTimeout(2000);
                console.log('✅ Demo login successful');
            } else {
                console.log('⚠️ Demo button not found');
            }
            
            // Test dashboard mobile layout
            console.log('Testing dashboard layout...');
            await page.waitForTimeout(3000);
            
            // Check if text is readable (not too small)
            const mainTitle = page.locator('h1').first();
            if (await mainTitle.isVisible()) {
                const titleStyles = await mainTitle.evaluate(el => {
                    const styles = window.getComputedStyle(el);
                    return {
                        fontSize: styles.fontSize,
                        lineHeight: styles.lineHeight
                    };
                });
                
                const fontSize = parseInt(titleStyles.fontSize);
                console.log(`Title font size: ${fontSize}px ${fontSize >= 20 ? '✅' : '❌'}`);
            }
            
            // Test responsive grid layout
            const gridContainer = page.locator('.grid').first();
            if (await gridContainer.isVisible()) {
                const gridStyles = await gridContainer.evaluate(el => {
                    const styles = window.getComputedStyle(el);
                    return styles.gridTemplateColumns;
                });
                
                console.log(`Grid layout: ${gridStyles.includes('1fr') ? '✅ Single column' : '⚠️ Multiple columns'}`);
            }
            
            // Take screenshot for visual verification
            await page.screenshot({ 
                path: `mobile-test-${viewport.name.replace(/\s+/g, '-')}-${viewport.width}x${viewport.height}.png`,
                fullPage: true 
            });
            
            console.log(`✅ Screenshot saved for ${viewport.name}`);
            
        } catch (error) {
            console.error(`❌ Error testing ${viewport.name}:`, error.message);
        } finally {
            await context.close();
        }
    }
    
    await browser.close();
    console.log('\n🎉 Mobile UI testing completed!');
}

// Run the test if this is the main module
if (require.main === module) {
    testMobileUI().catch(console.error);
}

module.exports = testMobileUI;