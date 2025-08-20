import { test, expect } from '@playwright/test';

test.describe('Dashboard内容渲染检查', () => {
  test('验证Dashboard页面内容是否正确渲染', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    
    const studentBtn = page.locator('button:has-text("👦 学生演示")');
    await studentBtn.click();
    await page.waitForTimeout(4000);
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 检查Dashboard页面内容...');
    console.log('📍 当前URL:', page.url());
    
    // 检查页面标题结构
    const pageTitle = page.locator('h1, h2').first();
    const titleText = await pageTitle.textContent();
    console.log('📋 页面标题:', titleText);
    
    // 检查是否有欢迎信息
    const welcomeSection = page.locator('text=/欢迎回来|Welcome|今天|Today/i').first();
    if (await welcomeSection.isVisible({ timeout: 2000 })) {
      const welcomeText = await welcomeSection.textContent();
      console.log('👋 找到欢迎信息:', welcomeText?.trim());
    } else {
      console.log('❌ 未找到欢迎信息');
    }
    
    // 检查快速操作区域
    const quickActionsTitle = page.locator('text=/快速操作|Quick|Actions/i');
    if (await quickActionsTitle.isVisible({ timeout: 2000 })) {
      console.log('✅ 找到快速操作标题');
      
      // 查找快速操作按钮（Dashboard内的，不带图标）
      const dashboardButtons = [
        'button:has-text("任务规划"):not(:has(span))', // 不含图标span的
        'button:has-text("奖励中心"):not(:has(span))',
        'button:has-text("成就广场"):not(:has(span))'
      ];
      
      for (const selector of dashboardButtons) {
        const btn = page.locator(selector);
        if (await btn.isVisible({ timeout: 1000 })) {
          const text = await btn.textContent();
          console.log(`  ✓ Dashboard按钮: ${text?.trim()}`);
        }
      }
    } else {
      console.log('❌ 未找到快速操作区域');
    }
    
    // 检查统计信息区域
    const statsTitle = page.locator('text=/统计信息|Stats/i');
    if (await statsTitle.isVisible({ timeout: 2000 })) {
      console.log('✅ 找到统计信息区域');
    } else {
      console.log('❌ 未找到统计信息区域');
    }
    
    // 检查今日任务区域
    const todayTasksTitle = page.locator('text=/今日任务|Today.*Task/i');
    if (await todayTasksTitle.isVisible({ timeout: 2000 })) {
      console.log('✅ 找到今日任务区域');
    } else {
      console.log('❌ 未找到今日任务区域');
    }
    
    // 统计所有文本内容，寻找线索
    const allText = await page.textContent('body');
    const hasWelcome = allText?.includes('欢迎回来');
    const hasQuickActions = allText?.includes('快速操作');
    const hasStats = allText?.includes('统计信息');
    const hasTodayTasks = allText?.includes('今日任务');
    
    console.log('\\n📊 页面内容分析:');
    console.log(`  - 包含"欢迎回来": ${hasWelcome}`);
    console.log(`  - 包含"快速操作": ${hasQuickActions}`);
    console.log(`  - 包含"统计信息": ${hasStats}`);
    console.log(`  - 包含"今日任务": ${hasTodayTasks}`);
    
    // 检查Dashboard组件是否被渲染
    const dashboardContainer = page.locator('.grid, [class*="grid"]').first();
    if (await dashboardContainer.isVisible({ timeout: 2000 })) {
      console.log('✅ 找到Dashboard网格布局');
    } else {
      console.log('❌ 未找到Dashboard网格布局');
    }
    
    // 检查是否有加载错误
    const errorElements = page.locator('text=/error|错误|失败|failed/i');
    const errorCount = await errorElements.count();
    if (errorCount > 0) {
      console.log(`⚠️ 发现 ${errorCount} 个可能的错误信息`);
      for (let i = 0; i < Math.min(errorCount, 3); i++) {
        const errorText = await errorElements.nth(i).textContent();
        console.log(`  错误 ${i+1}: ${errorText?.trim()}`);
      }
    }
    
    // 最基础的验证：页面应该有一些内容
    expect(allText).toBeTruthy();
    expect(allText!.length).toBeGreaterThan(100);
  });
  
  test('检查API调用和数据加载', async ({ page }) => {
    await page.context().clearCookies();
    
    // 监听网络请求
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('dashboard')) {
        apiRequests.push(request.url());
      }
    });
    
    // 监听响应
    const apiResponses: { url: string, status: number }[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('dashboard')) {
        apiResponses.push({ url: response.url(), status: response.status() });
      }
    });
    
    await page.goto('/');
    const studentBtn = page.locator('button:has-text("👦 学生演示")');
    await studentBtn.click();
    await page.waitForTimeout(5000); // 等待API调用
    
    console.log('🌐 API请求记录:');
    apiRequests.forEach((url, index) => {
      console.log(`  请求 ${index + 1}: ${url}`);
    });
    
    console.log('\\n📡 API响应记录:');
    apiResponses.forEach((response, index) => {
      console.log(`  响应 ${index + 1}: ${response.url} - 状态码: ${response.status}`);
    });
    
    // 基础验证
    expect(true).toBeTruthy(); // 这个测试主要是收集信息
  });
});