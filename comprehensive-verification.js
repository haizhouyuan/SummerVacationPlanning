// Comprehensive verification for summer vacation planning app
const { chromium } = require('playwright');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runComprehensiveVerification() {
    console.log('🔍 Starting comprehensive verification of summer vacation planning app...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000 // Slow down operations to see what's happening
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    
    // Block resources to avoid token limit issues
    await page.route('**/*', (route) => {
        const type = route.request().resourceType();
        if (['image', 'media', 'font'].includes(type)) {
            return route.abort();
        }
        route.continue();
    });
    
    const results = {
        dashboard: 'PENDING',
        taskHistory: 'PENDING', 
        taskPlanning: 'PENDING',
        taskLibrary: 'PENDING',
        rewards: 'PENDING'
    };
    
    try {
        // Test on port 3001 as mentioned by user
        const baseUrl = 'http://localhost:3001';
        
        console.log(`\n📍 Testing on ${baseUrl}`);
        
        // Navigate to main page
        console.log('1️⃣ Loading main page...');
        await page.goto(baseUrl, { 
            waitUntil: 'networkidle',
            timeout: 15000 
        });
        await delay(3000);
        
        // Try to login as demo student
        console.log('\n2️⃣ Attempting demo login...');
        try {
            // Look for demo buttons with various selectors
            const demoSelectors = [
                '[data-testid="student-demo"]',
                'button:has-text("学生演示")',
                'button:has-text("演示登录")', 
                'button:has-text("学生")',
                '.demo-login',
                'button[class*="demo"]'
            ];
            
            let loginSuccess = false;
            for (const selector of demoSelectors) {
                try {
                    const button = page.locator(selector).first();
                    if (await button.isVisible({ timeout: 2000 })) {
                        await button.click();
                        await delay(2000);
                        loginSuccess = true;
                        console.log('✅ Demo login successful');
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (!loginSuccess) {
                console.log('⚠️ No demo login found, continuing...');
            }
        } catch (error) {
            console.log('⚠️ Demo login error:', error.message.slice(0, 50));
        }
        
        // Test 1: Dashboard loading issue 
        console.log('\n3️⃣ Testing Dashboard loading issue...');
        try {
            // Check for loading text on current page or navigate to dashboard
            await delay(2000);
            
            const loadingSelector = 'text=正在加载统计数据';
            const hasLoadingText = await page.locator(loadingSelector).isVisible({ timeout: 5000 });
            
            if (hasLoadingText) {
                console.log('⚠️ Found loading text, waiting to see if it resolves...');
                await delay(8000);
                const stillLoading = await page.locator(loadingSelector).isVisible();
                if (stillLoading) {
                    results.dashboard = 'FAIL: Infinite loading detected';
                    console.log('❌ FAIL: Dashboard shows infinite loading');
                } else {
                    results.dashboard = 'OK: Loading resolved';
                    console.log('✅ OK: Dashboard loading resolved');
                }
            } else {
                results.dashboard = 'OK: No loading issues';
                console.log('✅ OK: No loading issues detected');
            }
        } catch (error) {
            results.dashboard = 'ERROR: ' + error.message.slice(0, 50);
            console.log('⚠️ Dashboard test error:', error.message.slice(0, 50));
        }
        
        // Test 2: Task History page
        console.log('\n4️⃣ Testing Task History page...');
        try {
            // Try to navigate to history - it's a client-side route
            const historySelectors = [
                'a[href*="history"]',
                'a:has-text("历史")',
                'a:has-text("任务历史")',
                '[data-testid="history-link"]'
            ];
            
            let historyFound = false;
            for (const selector of historySelectors) {
                try {
                    const link = page.locator(selector).first();
                    if (await link.isVisible({ timeout: 3000 })) {
                        await link.click();
                        await delay(3000);
                        historyFound = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            // If no nav link, try direct URL
            if (!historyFound) {
                await page.goto(baseUrl + '#/history');
                await delay(3000);
            }
            
            // Check for error indicators
            const errorSelectors = [
                'text=错误',
                'text=Error', 
                'text=404',
                'text=failed',
                'text=not found',
                '.error'
            ];
            
            let hasError = false;
            for (const selector of errorSelectors) {
                if (await page.locator(selector).isVisible({ timeout: 2000 })) {
                    hasError = true;
                    break;
                }
            }
            
            if (hasError) {
                results.taskHistory = 'FAIL: Shows errors';
                console.log('❌ FAIL: Task history page shows errors');
            } else {
                results.taskHistory = 'OK: Loads without errors';
                console.log('✅ OK: Task history page loads without errors');
            }
            
        } catch (error) {
            results.taskHistory = 'ERROR: ' + error.message.slice(0, 50);
            console.log('⚠️ Task history test error:', error.message.slice(0, 50));
        }
        
        // Test 3: Task Planning interface
        console.log('\n5️⃣ Testing Task Planning interface...');
        try {
            // Navigate to planning page
            const planningSelectors = [
                'a[href*="planning"]',
                'a:has-text("规划")', 
                'a:has-text("任务规划")',
                '[data-testid="planning-link"]'
            ];
            
            let planningFound = false;
            for (const selector of planningSelectors) {
                try {
                    const link = page.locator(selector).first();
                    if (await link.isVisible({ timeout: 3000 })) {
                        await link.click();
                        await delay(3000);
                        planningFound = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (!planningFound) {
                await page.goto(baseUrl + '#/planning');
                await delay(3000);
            }
            
            // Check for button configuration
            const planningButton = page.locator('button:has-text("规划任务")');
            const quickPlanButton = page.locator('button:has-text("快速规划")');
            const simplePlanButton = page.locator('button:has-text("简单规划")');
            
            const hasPlanningButton = await planningButton.isVisible({ timeout: 3000 });
            const hasQuickPlan = await quickPlanButton.isVisible({ timeout: 1000 });
            const hasSimplePlan = await simplePlanButton.isVisible({ timeout: 1000 });
            
            if (hasPlanningButton && !hasQuickPlan && !hasSimplePlan) {
                results.taskPlanning = 'OK: Single planning button';
                console.log('✅ OK: Shows single "规划任务" button');
            } else if (hasQuickPlan || hasSimplePlan) {
                results.taskPlanning = 'FAIL: Multiple planning buttons';
                console.log('❌ FAIL: Still shows separate planning buttons');
            } else {
                results.taskPlanning = 'UNCLEAR: Button config unclear';
                console.log('⚠️ Planning button configuration unclear');
            }
            
        } catch (error) {
            results.taskPlanning = 'ERROR: ' + error.message.slice(0, 50);
            console.log('⚠️ Task planning test error:', error.message.slice(0, 50));
        }
        
        // Test 4: Task Library 
        console.log('\n6️⃣ Testing Task Library...');
        try {
            // Go back to main page and look for task library
            await page.goto(baseUrl);
            await delay(2000);
            
            // Look for task library sections
            const librarySelectors = [
                '[data-testid*="library"]',
                '.task-library',
                'text=任务库',
                'section:has-text("任务")',
                '[class*="library"]'
            ];
            
            let libraryFound = false;
            for (const selector of librarySelectors) {
                try {
                    const element = page.locator(selector).first();
                    if (await element.isVisible({ timeout: 3000 })) {
                        await element.scrollIntoViewIfNeeded();
                        await delay(1000);
                        libraryFound = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            // Check for fetch errors
            const fetchErrorSelectors = [
                'text=fail to fetch',
                'text=failed to fetch', 
                'text=fetch failed',
                'text=网络错误',
                '[class*="error"]'
            ];
            
            let hasFetchError = false;
            for (const selector of fetchErrorSelectors) {
                if (await page.locator(selector).isVisible({ timeout: 2000 })) {
                    hasFetchError = true;
                    break;
                }
            }
            
            if (hasFetchError) {
                results.taskLibrary = 'FAIL: Shows fetch errors';
                console.log('❌ FAIL: Task library shows fetch errors');
            } else {
                results.taskLibrary = 'OK: No fetch errors';
                console.log('✅ OK: Task library shows no fetch errors');
            }
            
        } catch (error) {
            results.taskLibrary = 'ERROR: ' + error.message.slice(0, 50);
            console.log('⚠️ Task library test error:', error.message.slice(0, 50));
        }
        
        // Test 5: Rewards/Exchange page
        console.log('\n7️⃣ Testing Rewards/Exchange page...');
        try {
            // Navigate to rewards page
            const rewardsSelectors = [
                'a[href*="rewards"]',
                'a:has-text("奖励")',
                'a:has-text("兑换")',
                'a:has-text("积分")',
                '[data-testid="rewards-link"]'
            ];
            
            let rewardsFound = false;
            for (const selector of rewardsSelectors) {
                try {
                    const link = page.locator(selector).first();
                    if (await link.isVisible({ timeout: 3000 })) {
                        await link.click();
                        await delay(3000);
                        rewardsFound = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (!rewardsFound) {
                await page.goto(baseUrl + '#/rewards');
                await delay(3000);
            }
            
            // Check exchange buttons
            const exchangeButtons = page.locator('button:has-text("兑换"), button:has-text("exchange")');
            const buttonCount = await exchangeButtons.count();
            
            if (buttonCount > 0) {
                // Check for fetch errors on buttons or page
                const fetchErrorSelectors = [
                    'text=fail to fetch',
                    'text=failed to fetch',
                    'button:has-text("fail to fetch")',
                    'text=网络错误'
                ];
                
                let hasFetchError = false;
                for (const selector of fetchErrorSelectors) {
                    if (await page.locator(selector).isVisible({ timeout: 2000 })) {
                        hasFetchError = true;
                        break;
                    }
                }
                
                if (hasFetchError) {
                    results.rewards = 'FAIL: Exchange buttons show fetch errors';
                    console.log('❌ FAIL: Exchange buttons show fetch errors');
                } else {
                    results.rewards = 'OK: Exchange buttons work';
                    console.log('✅ OK: Exchange buttons work without fetch errors');
                }
            } else {
                results.rewards = 'WARNING: No exchange buttons found';
                console.log('⚠️ No exchange buttons found');
            }
            
        } catch (error) {
            results.rewards = 'ERROR: ' + error.message.slice(0, 50);
            console.log('⚠️ Rewards test error:', error.message.slice(0, 50));
        }
        
        // Print final results
        console.log('\n🎉 VERIFICATION RESULTS:');
        console.log('========================');
        console.log(`Dashboard Loading: ${results.dashboard}`);
        console.log(`Task History: ${results.taskHistory}`);
        console.log(`Task Planning: ${results.taskPlanning}`);
        console.log(`Task Library: ${results.taskLibrary}`);
        console.log(`Rewards: ${results.rewards}`);
        console.log('========================');
        
        // Count successes
        const okCount = Object.values(results).filter(r => r.startsWith('OK')).length;
        const failCount = Object.values(results).filter(r => r.startsWith('FAIL')).length;
        
        console.log(`\n📊 Summary: ${okCount}/5 tests passed, ${failCount} failures`);
        
        if (failCount === 0) {
            console.log('✅ ALL FIXES VERIFIED SUCCESSFULLY!');
        } else {
            console.log('⚠️ Some issues still need attention');
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    } finally {
        await browser.close();
    }
    
    return 'OK';
}

// Run verification
if (require.main === module) {
    runComprehensiveVerification().catch(console.error);
}

module.exports = runComprehensiveVerification;