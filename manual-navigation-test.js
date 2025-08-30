const { chromium } = require('playwright');

(async () => {
  console.log('🧪 开始导航修复验证测试...');
  
  try {
    // Launch browser with explicit path to Edge
    const browser = await chromium.launch({ 
      headless: false,
      executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Step 1: 访问页面
    console.log('📍 Step 1: 访问 http://localhost:3005');
    await page.goto('http://localhost:3005');
    await page.waitForTimeout(2000);
    
    // Step 2: 登录
    console.log('📍 Step 2: 点击学生演示登录');
    const studentButton = page.locator('button').filter({ hasText: '学生演示' });
    if (await studentButton.count() > 0) {
      await studentButton.click();
      console.log('✅ 成功点击学生演示按钮');
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ 未找到学生演示按钮');
      await page.screenshot({ path: 'navigation-test-login-fail.png' });
    }
    
    // Step 3: 验证进入dashboard
    console.log('📍 Step 3: 验证是否成功进入dashboard');
    const dashboardIndicator = page.locator('text=仪表板').or(page.locator('text=Dashboard')).or(page.locator('text=今日积分'));
    
    if (await dashboardIndicator.count() > 0) {
      console.log('✅ 成功进入dashboard');
      await page.screenshot({ path: 'navigation-test-dashboard-success.png' });
    } else {
      console.log('❌ 未能进入dashboard');
      await page.screenshot({ path: 'navigation-test-dashboard-fail.png' });
    }
    
    // Step 4: 点击奖励导航
    console.log('📍 Step 4: 点击奖励导航按钮');
    const rewardsButton = page.locator('nav a[href*="rewards"]').or(
      page.locator('button:has-text("奖励")').or(
        page.locator('text=奖励中心').or(
          page.locator('[data-testid*="rewards"]')
        )
      )
    );
    
    if (await rewardsButton.count() > 0) {
      await rewardsButton.first().click();
      console.log('✅ 成功点击奖励导航');
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ 未找到奖励导航按钮');
      await page.screenshot({ path: 'navigation-test-no-rewards-button.png' });
    }
    
    // Step 5: 验证是否进入RewardsCenter页面
    console.log('📍 Step 5: 验证是否进入优化的RewardsCenter页面');
    
    // Check for optimized UI elements
    const pointsBadge = page.locator('.bg-gradient-to-r, .text-yellow-500, .font-bold').filter({ hasText: /\d+/ });
    const statsLayout = page.locator('.grid-cols-3, .lg\\:grid-cols-3');
    const exchangePanel = page.locator('text=兑换').or(page.locator('text=申请特殊奖励'));
    
    let optimizedFeatureCount = 0;
    
    if (await pointsBadge.count() > 0) {
      console.log('✅ 发现醒目的积分徽章');
      optimizedFeatureCount++;
    } else {
      console.log('❌ 未发现醒目的积分徽章');
    }
    
    if (await statsLayout.count() > 0) {
      console.log('✅ 发现3列统计布局');
      optimizedFeatureCount++;
    } else {
      console.log('❌ 未发现3列统计布局');
    }
    
    if (await exchangePanel.count() > 0) {
      console.log('✅ 发现奖励兑换功能');
      optimizedFeatureCount++;
    } else {
      console.log('❌ 未发现奖励兑换功能');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'navigation-test-final-rewards-page.png' });
    
    // Final report
    console.log('\n📊 测试结果汇总:');
    console.log(`- 优化功能发现数量: ${optimizedFeatureCount}/3`);
    
    if (optimizedFeatureCount >= 2) {
      console.log('🎉 导航修复验证 SUCCESS: 成功导航到优化的RewardsCenter页面');
    } else {
      console.log('❌ 导航修复验证 FAILED: 可能仍在显示旧的Rewards页面');
    }
    
    console.log('\n📸 截图文件已保存:');
    console.log('- navigation-test-dashboard-success.png');
    console.log('- navigation-test-final-rewards-page.png');
    
    await page.waitForTimeout(5000);
    await browser.close();
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
})();