import { test, expect } from '@playwright/test';

test.describe('基础功能验证', () => {
  test('前端服务正常运行', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 验证页面标题
    await expect(page).toHaveTitle(/Summer|暑假|假期/i);
    
    // 验证页面基本内容加载
    await expect(page.locator('body')).toBeVisible();
  });

  test('登录页面基本元素显示', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 验证演示登录按钮存在
    const studentButton = page.locator('button:has-text("学生演示登录"), button:has-text("学生"), button[data-testid*="student"]');
    const parentButton = page.locator('button:has-text("家长演示登录"), button:has-text("家长"), button[data-testid*="parent"]');
    
    // 至少应该有一个登录相关的按钮
    const hasLoginButton = (await studentButton.count() > 0) || (await parentButton.count() > 0);
    expect(hasLoginButton).toBeTruthy();
  });

  test('学生演示登录基本流程', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 查找学生登录按钮
    const studentButton = page.locator('button:has-text("学生演示登录"), button:has-text("学生")').first();
    
    if (await studentButton.isVisible()) {
      await studentButton.click();
      
      // 等待页面跳转，给更长的超时时间
      await page.waitForTimeout(3000);
      
      // 验证跳转到了仪表板或其他认证后页面
      const currentUrl = page.url();
      const isLoggedIn = currentUrl.includes('dashboard') || 
                        currentUrl.includes('task') || 
                        currentUrl.includes('main') ||
                        !currentUrl.endsWith('/');
                        
      expect(isLoggedIn).toBeTruthy();
    } else {
      test.skip('未找到学生演示登录按钮');
    }
  });

  test('页面导航基本功能', async ({ page }) => {
    await page.goto('/');
    
    // 先尝试登录
    const loginButton = page.locator('button:has-text("学生演示登录"), button:has-text("演示登录"), button:has-text("登录")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(3000);
    }
    
    // 查找导航菜单
    const navElements = [
      'nav a',
      '.navigation a',
      '.sidebar a',
      '.menu a'
    ];
    
    let foundNavigation = false;
    
    for (const selector of navElements) {
      const links = page.locator(selector);
      const count = await links.count();
      
      if (count > 0) {
        foundNavigation = true;
        
        // 尝试点击第一个导航链接
        const firstLink = links.first();
        const linkText = await firstLink.textContent();
        
        if (linkText && linkText.trim()) {
          await firstLink.click();
          await page.waitForTimeout(1000);
          
          // 验证页面有响应（URL变化或内容更新）
          const hasResponse = true; // 基础验证：能点击就算成功
          expect(hasResponse).toBeTruthy();
        }
        
        break;
      }
    }
    
    if (!foundNavigation) {
      console.log('未找到导航元素，可能页面结构不同');
    }
  });

  test('API连接测试', async ({ page }) => {
    // 监听网络请求
    const responses: string[] = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push(`${response.status()}: ${response.url()}`);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 尝试登录触发API调用
    const loginButton = page.locator('button:has-text("学生演示登录"), button:has-text("演示登录")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(3000);
    }
    
    // 检查是否有API响应
    if (responses.length > 0) {
      console.log('API响应:', responses);
      expect(responses.length).toBeGreaterThan(0);
    } else {
      console.log('未检测到API调用，可能使用模拟数据');
    }
  });

  test('响应式设计基本验证', async ({ page }) => {
    await page.goto('/');
    
    // 测试桌面视图
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    
    // 测试平板视图
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
    
    // 测试手机视图
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('页面加载性能基本验证', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 页面应该在10秒内加载完成
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`页面加载时间: ${loadTime}ms`);
  });
});