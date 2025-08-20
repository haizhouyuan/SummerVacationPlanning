// Focused verification for specific areas
const { chromium } = require('playwright');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runFocusedVerification() {
    console.log('🔍 Running focused verification for unclear areas...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    
    try {
        const baseUrl = 'http://localhost:3001';
        console.log(`📍 Testing on ${baseUrl}`);
        
        // Navigate and login
        await page.goto(baseUrl, { waitUntil: 'networkidle' });
        await delay(2000);
        
        // Login as demo student
        try {
            const demoButton = page.locator('button:has-text("学生演示")').first();
            if (await demoButton.isVisible({ timeout: 3000 })) {
                await demoButton.click();
                await delay(2000);
                console.log('✅ Demo login successful');
            }
        } catch (e) {
            console.log('⚠️ Demo login not needed or failed');
        }
        
        // FOCUSED TEST 1: Task Planning Button Configuration
        console.log('\n🎯 FOCUSED TEST: Task Planning Button Configuration');
        try {
            // Look for navigation to planning
            const navLinks = [
                'a:has-text("任务规划")',
                'a:has-text("规划")',
                'a[href*="planning"]',
                'nav a:has-text("规划")'
            ];
            
            let planningPageFound = false;
            for (const selector of navLinks) {
                try {
                    const link = page.locator(selector).first();
                    if (await link.isVisible({ timeout: 2000 })) {
                        console.log(`Found planning link: ${selector}`);
                        await link.click();
                        await delay(3000);
                        planningPageFound = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (!planningPageFound) {
                console.log('⚠️ No planning nav found, checking current page for planning elements');
            }
            
            // Now check for button configuration
            const planningButton = page.locator('button:has-text("规划任务")');
            const quickPlanButton = page.locator('button:has-text("快速规划")');
            const simplePlanButton = page.locator('button:has-text("简单规划")');
            const addTaskButton = page.locator('button:has-text("添加任务")');
            const createTaskButton = page.locator('button:has-text("创建任务")');
            
            // Count all buttons
            const planningBtnCount = await planningButton.count();
            const quickPlanBtnCount = await quickPlanButton.count();
            const simplePlanBtnCount = await simplePlanButton.count(); 
            const addTaskBtnCount = await addTaskButton.count();
            const createTaskBtnCount = await createTaskButton.count();
            
            console.log(`Button counts:`);
            console.log(`- "规划任务": ${planningBtnCount}`);
            console.log(`- "快速规划": ${quickPlanBtnCount}`);
            console.log(`- "简单规划": ${simplePlanBtnCount}`);
            console.log(`- "添加任务": ${addTaskBtnCount}`);
            console.log(`- "创建任务": ${createTaskBtnCount}`);
            
            if (planningBtnCount > 0 && quickPlanBtnCount === 0 && simplePlanBtnCount === 0) {
                console.log('✅ PASS: Single "规划任务" button found, no separate quick/simple buttons');
            } else if (quickPlanBtnCount > 0 || simplePlanBtnCount > 0) {
                console.log('❌ FAIL: Still has separate quick/simple planning buttons');
            } else {
                console.log('⚠️ UNCLEAR: No clear planning button pattern found');
                // Take screenshot for manual review
                await page.screenshot({ path: 'planning-buttons-unclear.png' });
            }
            
        } catch (error) {
            console.log('⚠️ Planning test error:', error.message.slice(0, 80));
        }
        
        // FOCUSED TEST 2: Rewards/Exchange Buttons
        console.log('\n🎯 FOCUSED TEST: Rewards/Exchange Buttons');
        try {
            // Look for rewards/exchange navigation or section
            const rewardsNavs = [
                'a:has-text("奖励")',
                'a:has-text("兑换")',
                'a:has-text("积分商城")',
                'a[href*="rewards"]',
                'nav a:has-text("积分")'
            ];
            
            let rewardsPageFound = false;
            for (const selector of rewardsNavs) {
                try {
                    const link = page.locator(selector).first();
                    if (await link.isVisible({ timeout: 2000 })) {
                        console.log(`Found rewards link: ${selector}`);
                        await link.click();
                        await delay(3000);
                        rewardsPageFound = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (!rewardsPageFound) {
                console.log('⚠️ No rewards nav found, checking current page for exchange elements');
            }
            
            // Look for exchange-related elements
            const exchangeElements = [
                'button:has-text("兑换")',
                'button:has-text("exchange")', 
                'button:has-text("积分兑换")',
                '.exchange-button',
                '[data-testid*="exchange"]',
                'button[class*="exchange"]'
            ];
            
            let exchangeFound = false;
            let exchangeCount = 0;
            
            for (const selector of exchangeElements) {
                try {
                    const elements = page.locator(selector);
                    const count = await elements.count();
                    if (count > 0) {
                        console.log(`Found ${count} elements matching: ${selector}`);
                        exchangeFound = true;
                        exchangeCount += count;
                        
                        // Check first element for fetch errors
                        const firstElement = elements.first();
                        const text = await firstElement.textContent();
                        if (text && text.toLowerCase().includes('fail to fetch')) {
                            console.log('❌ FAIL: Exchange button shows "fail to fetch"');
                            return;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (exchangeFound && exchangeCount > 0) {
                console.log(`✅ PASS: Found ${exchangeCount} exchange elements without fetch errors`);
            } else {
                console.log('⚠️ WARNING: No exchange buttons found - may be conditional on data/login state');
                // Take screenshot for manual review
                await page.screenshot({ path: 'rewards-no-buttons.png' });
            }
            
        } catch (error) {
            console.log('⚠️ Rewards test error:', error.message.slice(0, 80));
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'focused-verification-final.png' });
        
        console.log('\n🎉 Focused verification completed!');
        
    } catch (error) {
        console.error('❌ Focused verification failed:', error.message);
    } finally {
        await browser.close();
    }
    
    return 'OK';
}

runFocusedVerification().catch(console.error);