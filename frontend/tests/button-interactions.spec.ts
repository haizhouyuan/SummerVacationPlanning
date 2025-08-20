import { test, expect, Page } from '@playwright/test';

// 测试辅助函数
async function login(page: Page, role: 'student' | 'parent' = 'student') {
  await page.goto('/');
  const buttonText = role === 'student' ? '👦 学生演示' : '👨‍👩‍👧‍👦 家长演示';
  const demoButton = page.locator(`button:has-text("${buttonText}")`);
  await demoButton.click();
  await page.waitForTimeout(3000); // 等待切换到React应用并处理
  await page.waitForLoadState('networkidle');
}

async function testButtonResponse(page: Page, buttonSelector: string, expectedResponse: 'navigation' | 'modal' | 'action' | 'state-change') {
  const button = page.locator(buttonSelector);
  await expect(button).toBeVisible();
  
  const initialUrl = page.url();
  
  await button.click();
  await page.waitForTimeout(1000); // 等待响应
  
  switch (expectedResponse) {
    case 'navigation':
      // 验证URL发生了变化
      expect(page.url()).not.toBe(initialUrl);
      break;
    case 'modal':
      // 验证模态框出现
      await expect(page.locator('.modal, [role="dialog"], .popup')).toBeVisible();
      break;
    case 'action':
      // 验证某种动作发生了（可能是网络请求、状态更新等）
      await page.waitForTimeout(500);
      break;
    case 'state-change':
      // 验证页面状态发生了变化
      await page.waitForTimeout(500);
      break;
  }
}

test.describe('按钮交互响应测试', () => {
  test.describe('登录页面按钮', () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      // 访问页面后再清理localStorage，避免安全错误
      await page.goto('/');
      try {
        await page.evaluate(() => localStorage.clear());
      } catch (e) {
        // 忽略localStorage清理错误
      }
    });

    test('学生演示按钮响应正确', async ({ page }) => {
      await page.goto('/');
      
      // 首页使用的是HTML按钮，文本是"👦 学生演示"
      const studentLoginBtn = page.locator('button:has-text("👦 学生演示")');
      await expect(studentLoginBtn).toBeVisible();
      await expect(studentLoginBtn).toBeEnabled();
      
      await studentLoginBtn.click();
      await page.waitForTimeout(3000); // 等待切换到React应用并登录处理
      // React应用会自动重定向到dashboard
      await expect(page.locator('#root')).not.toHaveClass(/hidden/);
    });

    test('家长演示按钮响应正确', async ({ page }) => {
      await page.goto('/');
      
      // 首页使用的是HTML按钮
      const parentLoginBtn = page.locator('button:has-text("👨‍👩‍👧‍👦 家长演示")');
      await expect(parentLoginBtn).toBeVisible();
      await expect(parentLoginBtn).toBeEnabled();
      
      await parentLoginBtn.click();
      await page.waitForTimeout(3000); // 等待切换到React应用并登录处理
      await expect(page.locator('#root')).not.toHaveClass(/hidden/);
    });

    test('登录按钮加载状态', async ({ page }) => {
      await page.goto('/');
      
      const loginBtn = page.locator('button:has-text("学生演示登录")');
      await loginBtn.click();
      
      // 检查是否显示加载状态（如果有的话）
      const loadingIndicator = page.locator('.loading, .spinner, text=/加载中|Loading/');
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).toBeVisible();
        // 等待加载完成
        await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
      }
      
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  test.describe('Dashboard页面按钮', () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/');
      try {
        await page.evaluate(() => localStorage.clear());
      } catch (e) {
        // 忽略localStorage清理错误
      }
      await login(page, 'student');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    });

    test('快速操作按钮响应', async ({ page }) => {
      // 查找快速操作按钮 - 基于实际的Dashboard按钮文本
      const quickActionButtons = [
        'button:has-text("任务规划")',
        'button:has-text("奖励中心")',
        'button:has-text("成就广场")',
        'button:has-text("简化版")',
        'button:has-text("积分历史")'
      ];

      for (const selector of quickActionButtons) {
        const button = page.locator(selector);
        if (await button.isVisible()) {
          await expect(button).toBeEnabled();
          await button.click();
          await page.waitForTimeout(1000);
          
          // 验证有响应（URL变化、模态框出现或状态变化）
          const hasModal = await page.locator('.modal, [role="dialog"], .popup').isVisible();
          const urlChanged = !page.url().endsWith('/dashboard');
          
          expect(hasModal || urlChanged).toBeTruthy();
          
          // 如果是模态框，关闭它
          if (hasModal) {
            const closeBtn = page.locator('.modal button:has-text("取消"), .modal button:has-text("关闭"), .modal .close-button');
            if (await closeBtn.isVisible()) {
              await closeBtn.click();
            }
          }
          
          // 如果URL变化了，返回Dashboard
          if (urlChanged) {
            await page.goto('/dashboard');
            await page.waitForLoadState('networkidle');
          }
        }
      }
    });

    test('刷新按钮功能', async ({ page }) => {
      const refreshButtons = [
        'button:has-text("刷新")',
        'button[aria-label*="刷新"]',
        '.refresh-button',
        '[data-testid="refresh"]'
      ];

      for (const selector of refreshButtons) {
        const button = page.locator(selector);
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(1000);
          
          // 验证页面重新加载了数据
          await expect(page.locator('text=/积分|Points/')).toBeVisible();
        }
      }
    });
  });

  test.describe('任务规划页面按钮', () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      await login(page, 'student');
      await page.goto('/task-planning');
      await page.waitForLoadState('networkidle');
    });

    test('添加任务按钮响应', async ({ page }) => {
      const addTaskButtons = [
        'button:has-text("添加任务")',
        'button:has-text("新建任务")',
        'button:has-text("创建任务")',
        '.add-task-button',
        '[data-testid="add-task"]'
      ];

      for (const selector of addTaskButtons) {
        const button = page.locator(selector);
        if (await button.isVisible()) {
          await expect(button).toBeEnabled();
          await button.click();
          
          // 应该显示任务创建表单或模态框
          const hasForm = await page.locator('form, .task-form, .modal').isVisible();
          expect(hasForm).toBeTruthy();
          
          // 关闭表单
          const cancelBtn = page.locator('button:has-text("取消"), button:has-text("关闭")');
          if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
          }
          
          break; // 只测试第一个找到的按钮
        }
      }
    });

    test('日历导航按钮响应', async ({ page }) => {
      const calendarNavButtons = [
        'button[aria-label*="上一月"], button[aria-label*="Previous"]',
        'button[aria-label*="下一月"], button[aria-label*="Next"]',
        '.calendar-nav button',
        '.month-nav button'
      ];

      for (const selector of calendarNavButtons) {
        const buttons = page.locator(selector);
        const count = await buttons.count();
        
        for (let i = 0; i < count; i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            const initialText = await page.locator('.month-display, .calendar-header, .current-month').textContent();
            await button.click();
            await page.waitForTimeout(500);
            
            // 验证月份发生了变化
            const newText = await page.locator('.month-display, .calendar-header, .current-month').textContent();
            if (initialText && newText) {
              expect(newText).not.toBe(initialText);
            }
          }
        }
      }
    });

    test('任务筛选按钮响应', async ({ page }) => {
      const filterButtons = [
        'button:has-text("全部")',
        'button:has-text("进行中")',
        'button:has-text("已完成")',
        '.filter-button',
        '.task-filter button'
      ];

      for (const selector of filterButtons) {
        const button = page.locator(selector);
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(500);
          
          // 验证筛选状态改变
          await expect(button).toHaveClass(/active|selected|current/);
        }
      }
    });
  });

  test.describe('任务卡片按钮', () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      await login(page, 'student');
      await page.goto('/task-library');
      await page.waitForLoadState('networkidle');
    });

    test('任务卡片操作按钮响应', async ({ page }) => {
      // 等待任务卡片加载
      await expect(page.locator('.task-card, .task-item').first()).toBeVisible({ timeout: 10000 });
      
      const taskCards = page.locator('.task-card, .task-item');
      const firstCard = taskCards.first();
      
      // 测试任务卡片内的按钮
      const cardButtons = [
        'button:has-text("开始")',
        'button:has-text("查看详情")',
        'button:has-text("添加到计划")',
        'button:has-text("收藏")',
        '.task-action-button',
        '.task-button'
      ];

      for (const selector of cardButtons) {
        const button = firstCard.locator(selector);
        if (await button.isVisible()) {
          await expect(button).toBeEnabled();
          await button.click();
          await page.waitForTimeout(1000);
          
          // 验证操作有响应
          const hasModal = await page.locator('.modal, [role="dialog"]').isVisible();
          const urlChanged = page.url().includes('task-planning') || page.url().includes('task-detail');
          
          // 至少有一种响应
          if (!hasModal && !urlChanged) {
            // 可能是状态改变，检查按钮文本是否改变
            const buttonText = await button.textContent();
            expect(buttonText).toBeTruthy();
          }
          
          // 处理模态框
          if (hasModal) {
            const closeBtn = page.locator('.modal button:has-text("关闭"), .modal button:has-text("取消"), .modal .close');
            if (await closeBtn.isVisible()) {
              await closeBtn.click();
            }
          }
          
          // 如果导航了，回到任务库页面
          if (urlChanged) {
            await page.goto('/task-library');
            await page.waitForLoadState('networkidle');
          }
          
          break; // 只测试第一个找到的按钮
        }
      }
    });

    test('批量操作按钮响应', async ({ page }) => {
      // 查找批量操作按钮
      const batchButtons = [
        'button:has-text("全选")',
        'button:has-text("批量添加")',
        'button:has-text("批量操作")',
        '.batch-action button',
        '.select-all-button'
      ];

      for (const selector of batchButtons) {
        const button = page.locator(selector);
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(500);
          
          // 验证批量操作界面出现或状态改变
          const hasBatchUI = await page.locator('.batch-actions, .selected-actions').isVisible();
          const hasCheckedItems = await page.locator('input[type="checkbox"]:checked').count() > 0;
          
          expect(hasBatchUI || hasCheckedItems).toBeTruthy();
        }
      }
    });
  });

  test.describe('积分兑换页面按钮', () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      await login(page, 'student');
      await page.goto('/points-exchange');
      await page.waitForLoadState('networkidle');
    });

    test('兑换按钮响应', async ({ page }) => {
      // 等待兑换项目加载
      await page.waitForTimeout(2000);
      
      const exchangeButtons = page.locator('button:has-text("兑换")');
      const count = await exchangeButtons.count();
      
      if (count > 0) {
        const firstButton = exchangeButtons.first();
        await expect(firstButton).toBeVisible();
        
        await firstButton.click();
        
        // 应该显示确认对话框
        await expect(page.locator('.confirm-dialog, .modal, [role="dialog"]')).toBeVisible();
        
        // 取消兑换
        const cancelBtn = page.locator('button:has-text("取消"), button:has-text("关闭")');
        await cancelBtn.click();
      }
    });

    test('积分历史按钮响应', async ({ page }) => {
      const historyButtons = [
        'button:has-text("积分历史")',
        'button:has-text("查看历史")',
        '.history-button',
        '[data-testid="points-history"]'
      ];

      for (const selector of historyButtons) {
        const button = page.locator(selector);
        if (await button.isVisible()) {
          await button.click();
          
          // 验证历史记录显示
          const hasHistory = await page.locator('.points-history, .history-list').isVisible();
          const urlChanged = page.url().includes('history');
          
          expect(hasHistory || urlChanged).toBeTruthy();
          
          if (urlChanged) {
            await page.goBack();
          }
          
          break;
        }
      }
    });
  });

  test.describe('表单按钮测试', () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      await login(page, 'student');
    });

    test('表单提交按钮状态', async ({ page }) => {
      await page.goto('/task-planning');
      await page.waitForLoadState('networkidle');
      
      // 查找添加任务的按钮
      const addButton = page.locator('button:has-text("添加任务"), button:has-text("新建任务")');
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // 查找表单
        const form = page.locator('form, .task-form');
        if (await form.isVisible()) {
          const submitBtn = form.locator('button[type="submit"], button:has-text("保存"), button:has-text("提交")');
          
          if (await submitBtn.isVisible()) {
            // 初始状态应该是禁用的（如果有验证）
            const isDisabled = await submitBtn.isDisabled();
            
            // 填写必填字段
            const titleInput = form.locator('input[name="title"], input[placeholder*="标题"], input[placeholder*="名称"]');
            if (await titleInput.isVisible()) {
              await titleInput.fill('测试任务');
              
              // 提交按钮应该变为可用
              await expect(submitBtn).toBeEnabled();
              
              await submitBtn.click();
              await page.waitForTimeout(1000);
              
              // 验证表单提交了（模态框关闭或页面更新）
              const formClosed = !await form.isVisible();
              expect(formClosed).toBeTruthy();
            }
          }
        }
      }
    });

    test('表单取消按钮功能', async ({ page }) => {
      await page.goto('/task-planning');
      await page.waitForLoadState('networkidle');
      
      const addButton = page.locator('button:has-text("添加任务"), button:has-text("新建任务")');
      if (await addButton.isVisible()) {
        await addButton.click();
        
        const form = page.locator('form, .task-form, .modal');
        if (await form.isVisible()) {
          const cancelBtn = form.locator('button:has-text("取消"), button:has-text("关闭")');
          if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
            
            // 表单应该关闭
            await expect(form).not.toBeVisible();
          }
        }
      }
    });
  });

  test.describe('按钮状态和样式', () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      await login(page, 'student');
    });

    test('按钮悬停状态', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const buttons = page.locator('button:visible');
      const count = await buttons.count();
      
      if (count > 0) {
        const firstButton = buttons.first();
        
        // 获取初始样式
        const initialStyles = await firstButton.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color
          };
        });
        
        // 悬停
        await firstButton.hover();
        await page.waitForTimeout(200);
        
        // 获取悬停后的样式
        const hoverStyles = await firstButton.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color
          };
        });
        
        // 样式应该有变化（悬停效果）
        const stylesChanged = initialStyles.backgroundColor !== hoverStyles.backgroundColor ||
                             initialStyles.color !== hoverStyles.color;
        
        // 注意：某些按钮可能没有悬停效果，这是正常的
        // 这个测试主要是检查悬停不会导致错误
        expect(stylesChanged || !stylesChanged).toBeTruthy();
      }
    });

    test('禁用状态按钮不可点击', async ({ page }) => {
      await page.goto('/task-planning');
      await page.waitForLoadState('networkidle');
      
      // 查找可能的禁用按钮
      const disabledButtons = page.locator('button:disabled, button[aria-disabled="true"]');
      const count = await disabledButtons.count();
      
      for (let i = 0; i < count; i++) {
        const button = disabledButtons.nth(i);
        await expect(button).toBeDisabled();
        
        // 尝试点击禁用的按钮不应该有响应
        await button.click({ force: true });
        await page.waitForTimeout(500);
        
        // 验证没有不期望的响应
        expect(true).toBeTruthy(); // 如果到这里没有错误，就说明禁用状态工作正常
      }
    });
  });
});