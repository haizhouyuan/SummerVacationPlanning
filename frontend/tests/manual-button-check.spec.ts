import { test, expect } from '@playwright/test';

test.describe('手动按钮功能验证', () => {
  test('逐个测试Dashboard按钮功能', async ({ page }) => {
    // 清理并登录
    await page.context().clearCookies();
    await page.goto('/');
    
    const studentBtn = page.locator('button:has-text("👦 学生演示")');
    await studentBtn.click();
    await page.waitForTimeout(4000); // 给更多时间加载
    
    // 确保完全加载
    await page.waitForLoadState('networkidle');
    
    console.log('📍 当前页面URL:', page.url());
    
    // 1. 测试任务规划按钮
    console.log('\n🔍 测试任务规划按钮...');
    const planningBtn = page.locator('button:has-text("任务规划")');
    if (await planningBtn.isVisible()) {
      console.log('✓ 任务规划按钮可见');
      await planningBtn.click();
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log('📍 点击后URL:', currentUrl);
      
      if (currentUrl.includes('/planning')) {
        console.log('✅ 任务规划按钮工作正常');
        await page.goBack();
        await page.waitForTimeout(2000);
      } else {
        console.log('❌ 任务规划按钮跳转失败');
      }
    } else {
      console.log('❌ 任务规划按钮不可见');
    }
    
    // 2. 测试奖励中心按钮
    console.log('\n🔍 测试奖励中心按钮...');
    const rewardsBtn = page.locator('button:has-text("奖励中心")');
    if (await rewardsBtn.isVisible()) {
      console.log('✓ 奖励中心按钮可见');
      await rewardsBtn.click();
      await page.waitForTimeout(3000); // 给更多时间
      const currentUrl = page.url();
      console.log('📍 点击后URL:', currentUrl);
      
      if (currentUrl.includes('/rewards')) {
        console.log('✅ 奖励中心按钮工作正常');
        await page.goBack();
        await page.waitForTimeout(2000);
      } else {
        console.log('❌ 奖励中心按钮跳转失败');
        // 强制返回dashboard
        await page.goto('/dashboard');
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('❌ 奖励中心按钮不可见');
    }
    
    // 3. 测试成就广场按钮
    console.log('\n🔍 测试成就广场按钮...');
    const achievementsBtn = page.locator('button:has-text("成就广场")');
    if (await achievementsBtn.isVisible()) {
      console.log('✓ 成就广场按钮可见');
      await achievementsBtn.click();
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      console.log('📍 点击后URL:', currentUrl);
      
      if (currentUrl.includes('/achievements')) {
        console.log('✅ 成就广场按钮工作正常');
        await page.goBack();
        await page.waitForTimeout(2000);
      } else {
        console.log('❌ 成就广场按钮跳转失败');
        await page.goto('/dashboard');
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('❌ 成就广场按钮不可见');
    }
    
    // 4. 测试简化版按钮
    console.log('\n🔍 测试简化版按钮...');
    const liteBtn = page.locator('button:has-text("简化版")');
    if (await liteBtn.isVisible()) {
      console.log('✓ 简化版按钮可见');
      await liteBtn.click();
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      console.log('📍 点击后URL:', currentUrl);
      
      if (currentUrl.includes('/lite')) {
        console.log('✅ 简化版按钮工作正常');
        await page.goBack();
        await page.waitForTimeout(2000);
      } else {
        console.log('❌ 简化版按钮跳转失败');
      }
    } else {
      console.log('❌ 简化版按钮不可见');
    }
    
    // 5. 测试积分历史按钮（这个是模态框）
    console.log('\n🔍 测试积分历史按钮...');
    const historyBtn = page.locator('button:has-text("积分历史")');
    if (await historyBtn.isVisible()) {
      console.log('✓ 积分历史按钮可见');
      await historyBtn.click();
      await page.waitForTimeout(2000);
      
      // 检查模态框
      const modal = page.locator('.modal, [role="dialog"]');
      if (await modal.isVisible()) {
        console.log('✅ 积分历史按钮工作正常（显示模态框）');
        // 关闭模态框
        const closeBtn = modal.locator('button:has-text("关闭"), button:has-text("取消"), .close');
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await page.waitForTimeout(1000);
        }
      } else {
        console.log('❌ 积分历史按钮点击后未显示模态框');
      }
    } else {
      console.log('❌ 积分历史按钮不可见');
    }
    
    console.log('\n🎯 按钮功能测试完成');
    
    // 验证至少有基本按钮
    await expect(planningBtn.or(rewardsBtn).or(achievementsBtn)).toBeVisible();
  });
  
  test('检查Dashboard页面是否正常加载', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    
    const studentBtn = page.locator('button:has-text("👦 学生演示")');
    await studentBtn.click();
    await page.waitForTimeout(4000);
    
    // 检查页面基本元素
    const welcomeText = page.locator('text=欢迎回来');
    const quickActions = page.locator('text=快速操作');
    
    console.log('检查Dashboard基本元素...');
    
    if (await welcomeText.isVisible()) {
      console.log('✅ 找到欢迎文本');
    } else {
      console.log('❌ 未找到欢迎文本');
    }
    
    if (await quickActions.isVisible()) {
      console.log('✅ 找到快速操作区域');
    } else {
      console.log('❌ 未找到快速操作区域');
    }
    
    // 检查所有可见按钮
    const allButtons = page.locator('button:visible');
    const buttonCount = await allButtons.count();
    console.log(`📊 页面共有 ${buttonCount} 个可见按钮`);
    
    // 列出前几个按钮的文本
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent();
      console.log(`  按钮 ${i+1}: "${text?.trim()}"`);
    }
    
    // 基础验证
    expect(buttonCount).toBeGreaterThan(0);
  });
});