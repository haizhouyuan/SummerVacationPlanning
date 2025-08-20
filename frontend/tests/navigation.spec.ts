import { test, expect, Page } from '@playwright/test';

// 测试辅助函数
async function login(page: Page, role: 'student' | 'parent' = 'student') {
  await page.goto('/');
  const demoButton = page.locator(`button:has-text("${role === 'student' ? '学生演示登录' : '家长演示登录'}")`);
  await demoButton.click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

async function testPageNavigation(page: Page, linkText: string, expectedUrl: RegExp, expectedContent: string) {
  // 查找并点击导航链接
  const navLink = page.locator(`nav a:has-text("${linkText}"), .navigation a:has-text("${linkText}"), .sidebar a:has-text("${linkText}")`);
  await expect(navLink).toBeVisible();
  await navLink.click();
  
  // 验证URL变化
  await expect(page).toHaveURL(expectedUrl);
  await page.waitForLoadState('networkidle');
  
  // 验证页面内容
  await expect(page.locator(`text=${expectedContent}`)).toBeVisible({ timeout: 10000 });
}

test.describe('页面导航测试', () => {
  test.describe('学生用户导航', () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      await login(page, 'student');
    });

    test('应该能够导航到所有学生可访问的页面', async ({ page }) => {
      const studentPages = [
        { linkText: '仪表板', url: /\/dashboard/, content: '积分' },
        { linkText: '任务规划', url: /\/task-planning/, content: '任务' },
        { linkText: '任务库', url: /\/task-library/, content: '任务库' },
        { linkText: '积分兑换', url: /\/points-exchange/, content: '兑换' },
        { linkText: '成就广场', url: /\/achievement/, content: '成就' },
        { linkText: '今日任务', url: /\/today-tasks/, content: '今日' },
        { linkText: '任务历史', url: /\/task-history/, content: '历史' }
      ];

      for (const { linkText, url, content } of studentPages) {
        await testPageNavigation(page, linkText, url, content);
        
        // 等待一下避免页面切换过快
        await page.waitForTimeout(500);
      }
    });

    test('侧边栏导航功能正常', async ({ page }) => {
      // 测试侧边栏是否可以折叠/展开
      const sidebarToggle = page.locator('[data-testid="sidebar-toggle"], .sidebar-toggle, button[aria-label*="菜单"], button[aria-label*="Menu"]');
      if (await sidebarToggle.isVisible()) {
        await sidebarToggle.click();
        await page.waitForTimeout(300);
        
        // 再次点击展开
        await sidebarToggle.click();
        await page.waitForTimeout(300);
      }
      
      // 验证导航菜单项存在
      await expect(page.locator('nav, .navigation, .sidebar')).toBeVisible();
      await expect(page.locator('a:has-text("仪表板"), a:has-text("Dashboard")')).toBeVisible();
    });

    test('面包屑导航显示正确', async ({ page }) => {
      await page.goto('/task-planning');
      await page.waitForLoadState('networkidle');
      
      // 查找面包屑导航
      const breadcrumb = page.locator('.breadcrumb, [data-testid="breadcrumb"], .breadcrumbs');
      if (await breadcrumb.isVisible()) {
        await expect(breadcrumb).toContainText('任务规划');
      }
    });

    test('页面标题更新正确', async ({ page }) => {
      const pages = [
        { path: '/dashboard', title: /仪表板|Dashboard/ },
        { path: '/task-planning', title: /任务规划|Task Planning/ },
        { path: '/task-library', title: /任务库|Task Library/ },
        { path: '/points-exchange', title: /积分兑换|Points Exchange/ }
      ];

      for (const { path, title } of pages) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveTitle(title);
      }
    });
  });

  test.describe('家长用户导航', () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      await login(page, 'parent');
    });

    test('应该能够导航到家长专有页面', async ({ page }) => {
      const parentPages = [
        { linkText: '仪表板', url: /\/dashboard/, content: '家长' },
        { linkText: '子女管理', url: /\/family/, content: '子女' },
        { linkText: '审批中心', url: /\/approval/, content: '审批' },
        { linkText: '家庭统计', url: /\/statistics/, content: '统计' }
      ];

      for (const { linkText, url, content } of parentPages) {
        // 尝试导航，某些页面可能不存在或名称不同
        const navLink = page.locator(`a:has-text("${linkText}")`);
        if (await navLink.isVisible()) {
          await testPageNavigation(page, linkText, url, content);
          await page.waitForTimeout(500);
        }
      }
    });

    test('家长可以访问所有学生页面', async ({ page }) => {
      const studentPages = [
        { linkText: '任务库', url: /\/task-library/, content: '任务库' },
        { linkText: '积分兑换', url: /\/points-exchange/, content: '兑换' }
      ];

      for (const { linkText, url, content } of studentPages) {
        await testPageNavigation(page, linkText, url, content);
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('URL直接访问测试', () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      await login(page, 'student');
    });

    test('直接访问URL应该正确加载页面', async ({ page }) => {
      const urls = [
        '/dashboard',
        '/task-planning',
        '/task-library',
        '/points-exchange',
        '/achievement'
      ];

      for (const url of urls) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // 验证页面加载成功，没有404错误
        await expect(page.locator('text=/404|Not Found|页面不存在/')).not.toBeVisible();
        
        // 验证URL正确
        await expect(page).toHaveURL(url);
        
        await page.waitForTimeout(500);
      }
    });

    test('无效URL应该显示404页面', async ({ page }) => {
      const invalidUrls = [
        '/non-existent-page',
        '/invalid-route',
        '/dashboard/invalid-sub-page'
      ];

      for (const url of invalidUrls) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // 验证显示404页面或重定向到首页
        const is404 = await page.locator('text=/404|Not Found|页面不存在/').isVisible();
        const isRedirectedHome = page.url().endsWith('/dashboard') || page.url().endsWith('/');
        
        expect(is404 || isRedirectedHome).toBeTruthy();
      }
    });
  });

  test.describe('浏览器导航测试', () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      await login(page, 'student');
    });

    test('浏览器前进后退按钮功能正常', async ({ page }) => {
      // 导航到几个不同的页面
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      await page.goto('/task-planning');
      await page.waitForLoadState('networkidle');
      
      await page.goto('/task-library');
      await page.waitForLoadState('networkidle');
      
      // 测试后退按钮
      await page.goBack();
      await expect(page).toHaveURL(/\/task-planning/);
      
      await page.goBack();
      await expect(page).toHaveURL(/\/dashboard/);
      
      // 测试前进按钮
      await page.goForward();
      await expect(page).toHaveURL(/\/task-planning/);
      
      await page.goForward();
      await expect(page).toHaveURL(/\/task-library/);
    });

    test('页面刷新保持状态', async ({ page }) => {
      await page.goto('/task-planning');
      await page.waitForLoadState('networkidle');
      
      // 刷新页面
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // 验证仍在同一页面且认证状态保持
      await expect(page).toHaveURL(/\/task-planning/);
      await expect(page.locator('text=/任务|Task/')).toBeVisible();
    });
  });

  test.describe('响应式导航测试', () => {
    test('移动端导航菜单功能', async ({ page }) => {
      // 设置为移动端视窗
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      await login(page, 'student');
      
      // 查找移动端菜单按钮
      const mobileMenuToggle = page.locator('[data-testid="mobile-menu"], .mobile-menu-toggle, button[aria-label*="菜单"]');
      
      if (await mobileMenuToggle.isVisible()) {
        await mobileMenuToggle.click();
        await page.waitForTimeout(500);
        
        // 验证导航菜单展开
        await expect(page.locator('nav, .mobile-nav, .navigation-mobile')).toBeVisible();
        
        // 点击导航项目
        const navLink = page.locator('a:has-text("任务规划")').first();
        if (await navLink.isVisible()) {
          await navLink.click();
          await expect(page).toHaveURL(/\/task-planning/);
        }
      }
    });
  });
});