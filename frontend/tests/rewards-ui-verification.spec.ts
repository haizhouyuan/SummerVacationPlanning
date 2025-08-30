import { test, expect } from '@playwright/test';

test.describe('奖励中心UI优化验证', () => {
  test.beforeEach(async ({ page }) => {
    // 设置较长的超时时间
    test.setTimeout(30000);
    
    // 导航到应用主页
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
  });

  test('页面基础加载测试', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/暑假计划助手/);
    
    // 验证页面基本元素加载
    await expect(page.locator('body')).toBeVisible();
    
    // 截图保存页面状态
    await page.screenshot({ path: 'test-results/initial-page-load.png', fullPage: true });
    
    console.log('✅ 页面基础加载测试通过');
  });

  test('导航和菜单测试', async ({ page }) => {
    // 等待页面完全加载
    await page.waitForTimeout(2000);
    
    // 寻找导航元素
    const navigation = page.locator('nav, [role="navigation"], .navigation');
    if (await navigation.count() > 0) {
      await expect(navigation.first()).toBeVisible();
      console.log('✅ 找到导航菜单');
      
      // 截图导航状态
      await page.screenshot({ path: 'test-results/navigation-menu.png', fullPage: true });
    }
  });

  test('奖励中心页面搜索测试', async ({ page }) => {
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    // 搜索奖励中心相关元素
    const rewardsElements = [
      'text=奖励',
      'text=积分', 
      'text=兑换',
      '[data-testid*="reward"]',
      '[class*="reward"]',
      '[class*="points"]'
    ];
    
    let foundElements = 0;
    
    for (const selector of rewardsElements) {
      try {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          foundElements++;
          console.log(`✅ 找到奖励相关元素: ${selector}`);
        }
      } catch (error) {
        console.log(`⏭️ 未找到元素: ${selector}`);
      }
    }
    
    console.log(`总计找到 ${foundElements} 个奖励相关元素`);
    
    // 截图当前页面状态
    await page.screenshot({ path: 'test-results/rewards-elements-search.png', fullPage: true });
  });

  test('响应式设计测试', async ({ page }) => {
    // 桌面视图
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/desktop-view-1920x1080.png', fullPage: true });
    console.log('✅ 桌面视图 (1920x1080) 截图完成');
    
    // 平板视图
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/tablet-view-768x1024.png', fullPage: true });
    console.log('✅ 平板视图 (768x1024) 截图完成');
    
    // 手机视图
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/mobile-view-390x844.png', fullPage: true });
    console.log('✅ 手机视图 (390x844) 截图完成');
    
    // 极小屏幕测试
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/small-mobile-320x568.png', fullPage: true });
    console.log('✅ 极小屏幕 (320x568) 截图完成');
  });

  test('性能基础测试', async ({ page }) => {
    const startTime = Date.now();
    
    // 导航到页面
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`页面加载时间: ${loadTime}ms`);
    
    // 验证加载时间是否在预期范围内 (< 3000ms)
    expect(loadTime).toBeLessThan(3000);
    
    // 截图最终状态
    await page.screenshot({ path: 'test-results/performance-final-state.png', fullPage: true });
  });
});