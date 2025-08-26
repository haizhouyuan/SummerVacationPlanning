/**
 * Performance and Boundary E2E Tests  
 * 性能和边界测试端到端测试
 */

import { test, expect } from '@playwright/test';

test.describe('Performance and Boundary Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // 注册测试用户
    await page.goto('http://localhost:3000/register');
    const uniqueEmail = `perf_user_${Date.now()}@example.com`;
    
    await page.fill('[data-testid="username-input"]', '性能测试用户');
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.selectOption('[data-testid="role-select"]', 'student');
    await page.click('[data-testid="register-button"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('大量任务数据的性能测试', async ({ page }) => {
    // 批量创建任务测试系统处理大量数据的能力
    console.time('创建100个任务');
    
    for (let i = 1; i <= 100; i++) {
      await page.click('[data-testid="nav-tasks"]');
      await page.click('[data-testid="create-task-button"]');
      await page.fill('[data-testid="task-title-input"]', `性能测试任务 ${i}`);
      await page.fill('[data-testid="task-description-input"]', `这是第${i}个性能测试任务，用于测试系统处理大量数据的能力`);
      await page.selectOption('[data-testid="task-category-select"]', 'other');
      await page.selectOption('[data-testid="task-difficulty-select"]', 'easy');
      await page.click('[data-testid="save-task-button"]');
      
      // 每10个任务检查一次页面响应
      if (i % 10 === 0) {
        await page.waitForTimeout(100);
        console.log(`已创建${i}个任务`);
      }
    }
    
    console.timeEnd('创建100个任务');
    
    // 测试任务列表加载性能
    console.time('加载任务列表');
    await page.reload();
    await page.click('[data-testid="nav-tasks"]');
    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(100);
    console.timeEnd('加载任务列表');
    
    // 测试搜索和筛选性能
    console.time('任务搜索');
    await page.fill('[data-testid="search-input"]', '性能测试任务 50');
    await page.waitForTimeout(500); // 等待搜索结果
    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(1);
    console.timeEnd('任务搜索');
    
    // 清空搜索
    await page.fill('[data-testid="search-input"]', '');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(100);
  });

  test('并发用户操作模拟', async ({ browser }) => {
    // 模拟多个用户同时操作
    const contexts = [];
    const pages = [];
    
    try {
      // 创建3个并发用户会话
      for (let i = 0; i < 3; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // 每个用户注册
        await page.goto('http://localhost:3000/register');
        const email = `concurrent_user_${i}_${Date.now()}@example.com`;
        await page.fill('[data-testid="username-input"]', `并发用户${i + 1}`);
        await page.fill('[data-testid="email-input"]', email);
        await page.fill('[data-testid="password-input"]', 'TestPass123!');
        await page.selectOption('[data-testid="role-select"]', 'student');
        await page.click('[data-testid="register-button"]');
        
        contexts.push(context);
        pages.push(page);
      }
      
      // 所有用户同时执行操作
      const operations = pages.map(async (page, index) => {
        // 每个用户创建任务
        await page.click('[data-testid="nav-tasks"]');
        await page.click('[data-testid="create-task-button"]');
        await page.fill('[data-testid="task-title-input"]', `用户${index + 1}的并发任务`);
        await page.selectOption('[data-testid="task-category-select"]', 'exercise');
        await page.click('[data-testid="save-task-button"]');
        
        // 添加到今日计划
        await page.click('[data-testid="nav-today"]');
        await page.click('[data-testid="add-to-today-button"]');
        await page.selectOption('[data-testid="task-select"]', `用户${index + 1}的并发任务`);
        await page.click('[data-testid="schedule-task-button"]');
        
        // 完成任务
        await page.click('[data-testid="timeline-task"] [data-testid="start-task-button"]');
        await page.click('[data-testid="timeline-task"] [data-testid="complete-task-button"]');
        await page.click('[data-testid="confirm-completion-button"]');
      });
      
      console.time('并发操作完成');
      await Promise.all(operations);
      console.timeEnd('并发操作完成');
      
      // 验证所有操作都成功完成
      for (let i = 0; i < pages.length; i++) {
        await expect(pages[i].locator('[data-testid="timeline-task"]')).toContainText('已完成');
      }
      
    } finally {
      // 清理资源
      for (const context of contexts) {
        await context.close();
      }
    }
  });

  test('极限文件上传测试', async ({ page }) => {
    // 创建需要证据的任务
    await page.click('[data-testid="nav-tasks"]');
    await page.click('[data-testid="create-task-button"]');
    await page.fill('[data-testid="task-title-input"]', '文件上传测试');
    await page.selectOption('[data-testid="task-category-select"]', 'exercise');
    await page.check('[data-testid="evidence-required-checkbox"]');
    await page.click('[data-testid="save-task-button"]');
    
    await page.click('[data-testid="nav-today"]');
    await page.click('[data-testid="add-to-today-button"]');
    await page.selectOption('[data-testid="task-select"]', '文件上传测试');
    await page.click('[data-testid="schedule-task-button"]');
    
    await page.click('[data-testid="timeline-task"] [data-testid="start-task-button"]');
    await page.click('[data-testid="timeline-task"] [data-testid="complete-task-button"]');
    
    // 测试大文件上传（接近限制）
    const largeFileBuffer = Buffer.alloc(9 * 1024 * 1024, 'x'); // 9MB 文件
    
    console.time('大文件上传');
    const fileInput = page.locator('[data-testid="evidence-file-input"]');
    await fileInput.setInputFiles({
      name: 'large-evidence.jpg',
      mimeType: 'image/jpeg',
      buffer: largeFileBuffer
    });
    
    await page.fill('[data-testid="evidence-description"]', '大文件证据上传测试');
    await page.click('[data-testid="upload-evidence-button"]');
    
    // 等待上传完成或失败
    await expect(
      page.locator('[data-testid="upload-progress"], [data-testid="upload-success"], [data-testid="upload-error"]')
    ).toBeVisible({ timeout: 30000 });
    console.timeEnd('大文件上传');
    
    // 测试多文件并发上传
    const fileInput2 = page.locator('[data-testid="evidence-file-input"]');
    const multipleFiles = Array(5).fill(0).map((_, i) => ({
      name: `evidence_${i + 1}.jpg`,
      mimeType: 'image/jpeg',
      buffer: Buffer.alloc(1024 * 1024, `file${i}`) // 1MB 每个文件
    }));
    
    console.time('多文件上传');
    await fileInput2.setInputFiles(multipleFiles);
    await page.click('[data-testid="upload-evidence-button"]');
    
    // 验证多文件上传处理
    await expect(page.locator('[data-testid="upload-queue"]')).toHaveCount(5);
    console.timeEnd('多文件上传');
  });

  test('数据边界值测试', async ({ page }) => {
    // 测试各种输入字段的边界值
    await page.click('[data-testid="nav-tasks"]');
    await page.click('[data-testid="create-task-button"]');
    
    // 测试最大长度标题
    const maxTitle = 'a'.repeat(200);
    await page.fill('[data-testid="task-title-input"]', maxTitle);
    await expect(page.locator('[data-testid="task-title-input"]')).toHaveValue(maxTitle);
    
    // 测试最大长度描述
    const maxDescription = 'b'.repeat(2000);
    await page.fill('[data-testid="task-description-input"]', maxDescription);
    
    // 测试极限积分值
    await page.fill('[data-testid="task-points-input"]', '9999');
    
    // 测试极限时间估算
    await page.fill('[data-testid="task-time-estimate-input"]', '999');
    
    // 提交表单
    await page.click('[data-testid="save-task-button"]');
    
    // 验证任务创建成功
    await expect(page.locator('[data-testid="task-card"]')).toContainText(maxTitle.substring(0, 50));
    
    // 测试特殊字符和Unicode
    await page.click('[data-testid="create-task-button"]');
    const unicodeTitle = '🎉测试🌟特殊字符💯📚Emoji和中文混合输入';
    await page.fill('[data-testid="task-title-input"]', unicodeTitle);
    await page.selectOption('[data-testid="task-category-select"]', 'creativity');
    await page.click('[data-testid="save-task-button"]');
    
    await expect(page.locator('[data-testid="task-card"]')).toContainText(unicodeTitle);
  });

  test('网络延迟和离线模拟', async ({ page, context }) => {
    // 模拟慢网络条件
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒延迟
      await route.continue();
    });
    
    console.time('慢网络下创建任务');
    await page.click('[data-testid="nav-tasks"]');
    await page.click('[data-testid="create-task-button"]');
    await page.fill('[data-testid="task-title-input"]', '慢网络测试任务');
    await page.selectOption('[data-testid="task-category-select"]', 'exercise');
    await page.click('[data-testid="save-task-button"]');
    
    // 验证加载指示器显示
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="task-card"]')).toContainText('慢网络测试任务');
    console.timeEnd('慢网络下创建任务');
    
    // 模拟网络中断
    await context.route('**/api/**', route => route.abort());
    
    await page.click('[data-testid="create-task-button"]');
    await page.fill('[data-testid="task-title-input"]', '离线测试任务');
    await page.click('[data-testid="save-task-button"]');
    
    // 验证错误处理
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('网络错误');
    
    // 恢复网络
    await context.unroute('**/api/**');
    
    // 测试重试机制
    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="task-card"]')).toContainText('离线测试任务');
  });

  test('内存泄漏和资源管理测试', async ({ page }) => {
    // 重复执行操作检查内存使用
    const initialMetrics = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0
      };
    });
    
    // 执行大量DOM操作
    for (let i = 1; i <= 50; i++) {
      await page.click('[data-testid="nav-tasks"]');
      await page.click('[data-testid="create-task-button"]');
      await page.fill('[data-testid="task-title-input"]', `内存测试任务 ${i}`);
      await page.selectOption('[data-testid="task-category-select"]', 'other');
      await page.click('[data-testid="save-task-button"]');
      
      // 删除任务（测试清理）
      await page.click('[data-testid="task-card"]:last-child [data-testid="delete-task-button"]');
      await page.click('[data-testid="confirm-delete-button"]');
      
      if (i % 10 === 0) {
        // 强制垃圾回收（如果支持）
        await page.evaluate(() => {
          if ((window as any).gc) {
            (window as any).gc();
          }
        });
        
        const currentMetrics = await page.evaluate(() => {
          return {
            usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
            totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0
          };
        });
        
        console.log(`第${i}次操作后内存使用:`, currentMetrics);
        
        // 检查内存增长是否合理
        const memoryGrowth = currentMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 不应超过50MB增长
      }
    }
  });

  test('响应式设计和视口测试', async ({ page }) => {
    // 测试不同视口大小下的界面
    const viewports = [
      { width: 375, height: 667, name: '手机竖屏' },
      { width: 768, height: 1024, name: '平板竖屏' },
      { width: 1024, height: 768, name: '平板横屏' },
      { width: 1920, height: 1080, name: '桌面' }
    ];
    
    for (const viewport of viewports) {
      console.log(`测试${viewport.name}视口: ${viewport.width}x${viewport.height}`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      // 验证导航菜单适应
      if (viewport.width < 768) {
        // 移动端应该有汉堡菜单
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      } else {
        // 桌面端应该显示完整导航
        await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
      }
      
      // 测试任务卡片布局
      await page.click('[data-testid="nav-tasks"]');
      await expect(page.locator('[data-testid="task-grid"]')).toBeVisible();
      
      // 验证文字可读性
      const fontSize = await page.locator('[data-testid="task-title"]').evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      });
      
      const fontSizeNum = parseInt(fontSize);
      expect(fontSizeNum).toBeGreaterThanOrEqual(14); // 最小字体大小
      
      // 测试表单元素可点击性
      await page.click('[data-testid="create-task-button"]');
      await expect(page.locator('[data-testid="task-form"]')).toBeVisible();
      
      // 验证表单元素大小适合触摸
      if (viewport.width < 768) {
        const buttonHeight = await page.locator('[data-testid="save-task-button"]').evaluate(el => {
          return el.getBoundingClientRect().height;
        });
        expect(buttonHeight).toBeGreaterThanOrEqual(44); // 最小触摸目标
      }
      
      await page.press('[data-testid="task-form"]', 'Escape'); // 关闭表单
    }
  });

  test('长时间会话和自动保存测试', async ({ page }) => {
    // 开始创建任务但不提交
    await page.click('[data-testid="nav-tasks"]');
    await page.click('[data-testid="create-task-button"]');
    await page.fill('[data-testid="task-title-input"]', '长时间编辑的任务');
    await page.fill('[data-testid="task-description-input"]', '这是一个需要长时间编辑的任务描述');
    
    // 模拟用户离开页面一段时间
    await page.evaluate(() => {
      // 模拟页面失去焦点
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    await page.waitForTimeout(30000); // 等待30秒
    
    // 验证自动保存功能（如果实现了）
    const savedTitle = await page.locator('[data-testid="task-title-input"]').inputValue();
    expect(savedTitle).toBe('长时间编辑的任务');
    
    // 测试会话保持
    await page.reload();
    await expect(page).toHaveURL(/.*\/dashboard/); // 应该仍然登录
    
    // 验证草稿恢复（如果实现了）
    await page.click('[data-testid="nav-tasks"]');
    if (await page.locator('[data-testid="draft-recovery"]').isVisible()) {
      await page.click('[data-testid="restore-draft-button"]');
      const restoredTitle = await page.locator('[data-testid="task-title-input"]').inputValue();
      expect(restoredTitle).toBe('长时间编辑的任务');
    }
  });
});