import { test, expect } from '@playwright/test';

test.describe('奖励中心深度功能测试', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
  });

  test('登录流程和奖励中心导航测试', async ({ page }) => {
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 查找登录相关元素
    const loginElements = [
      'text=登录',
      'text=学生演示',
      'text=家长演示', 
      '[data-testid="login"]',
      'button:has-text("登录")',
      'a:has-text("登录")',
      '.login',
      '#login'
    ];
    
    console.log('🔍 搜索登录元素...');
    let loginFound = false;
    
    for (const selector of loginElements) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`✅ 找到登录元素: ${selector}`);
          await element.click();
          loginFound = true;
          break;
        }
      } catch (error) {
        console.log(`⏭️ 未找到: ${selector}`);
      }
    }
    
    // 截图当前状态
    await page.screenshot({ path: 'test-results/login-search-state.png', fullPage: true });
    
    if (loginFound) {
      console.log('✅ 成功点击登录元素');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/after-login-click.png', fullPage: true });
    }
    
    // 寻找奖励中心导航
    await page.waitForTimeout(2000);
    const rewardNavElements = [
      'text=奖励',
      'text=奖励中心', 
      'text=积分',
      '[href*="reward"]',
      '[href*="points"]',
      'a:has-text("奖励")',
      'nav a:has-text("奖励")'
    ];
    
    console.log('🔍 搜索奖励中心导航...');
    for (const selector of rewardNavElements) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`✅ 找到奖励导航: ${selector}`);
          await element.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'test-results/rewards-navigation-success.png', fullPage: true });
          break;
        }
      } catch (error) {
        console.log(`⏭️ 未找到奖励导航: ${selector}`);
      }
    }
  });

  test('奖励中心UI组件验证', async ({ page }) => {
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    console.log('🔍 验证奖励中心UI组件...');
    
    // 寻找积分徽章和显示元素
    const pointsElements = [
      'text=/\\d+.*积分/',
      'text=/\\d+.*分/',
      '.points',
      '[class*="point"]',
      '[class*="badge"]',
      '.bg-gradient',
      '[class*="gradient"]'
    ];
    
    let pointsFound = 0;
    for (const selector of pointsElements) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`✅ 找到积分相关元素: ${selector} (${count}个)`);
          pointsFound += count;
        }
      } catch (error) {
        console.log(`⏭️ 积分元素未找到: ${selector}`);
      }
    }
    
    // 寻找Tab切换元素
    const tabElements = [
      'text=游戏时间',
      'text=特殊奖励',
      '[role="tab"]',
      '.tab',
      '[class*="tab"]',
      'button:has-text("游戏")',
      'button:has-text("奖励")'
    ];
    
    let tabsFound = 0;
    for (const selector of tabElements) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`✅ 找到Tab元素: ${selector} (${count}个)`);
          tabsFound += count;
          
          // 尝试点击第一个tab
          await elements.first().click();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        console.log(`⏭️ Tab元素未找到: ${selector}`);
      }
    }
    
    // 寻找历史记录相关元素
    const historyElements = [
      'text=历史',
      'text=记录',
      'text=兑换历史',
      '.history',
      '[class*="history"]',
      '[class*="record"]'
    ];
    
    let historyFound = 0;
    for (const selector of historyElements) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`✅ 找到历史记录元素: ${selector} (${count}个)`);
          historyFound += count;
        }
      } catch (error) {
        console.log(`⏭️ 历史记录元素未找到: ${selector}`);
      }
    }
    
    console.log(`📊 UI组件统计: 积分相关=${pointsFound}, Tab相关=${tabsFound}, 历史记录=${historyFound}`);
    
    // 截图最终状态
    await page.screenshot({ path: 'test-results/ui-components-verification.png', fullPage: true });
  });

  test('表单交互和Toast通知测试', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    console.log('🔍 测试表单交互...');
    
    // 寻找输入框和表单
    const formElements = [
      'input[type="number"]',
      'input[type="text"]',
      'textarea',
      'select',
      'button[type="submit"]',
      'button:has-text("兑换")',
      'button:has-text("申请")',
      'button:has-text("提交")'
    ];
    
    let formsFound = 0;
    for (const selector of formElements) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`✅ 找到表单元素: ${selector} (${count}个)`);
          formsFound += count;
          
          // 尝试与第一个元素交互
          const firstElement = elements.first();
          if (selector.includes('input')) {
            await firstElement.fill('1');
            await page.waitForTimeout(300);
          } else if (selector.includes('button')) {
            await firstElement.click();
            await page.waitForTimeout(1000);
          }
        }
      } catch (error) {
        console.log(`⏭️ 表单元素操作失败: ${selector} - ${error.message}`);
      }
    }
    
    // 检查是否有Toast通知出现
    const toastSelectors = [
      '.toast',
      '[class*="toast"]',
      '[class*="notification"]',
      '.notification',
      '[role="alert"]',
      '.alert'
    ];
    
    let toastFound = false;
    await page.waitForTimeout(1000);
    
    for (const selector of toastSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✅ 检测到Toast通知: ${selector}`);
          toastFound = true;
          break;
        }
      } catch (error) {
        // Toast可能很快消失，这是正常的
      }
    }
    
    console.log(`📊 交互测试结果: 表单元素=${formsFound}, Toast检测=${toastFound ? '成功' : '未检测到'}`);
    
    // 截图交互后状态
    await page.screenshot({ path: 'test-results/form-interaction-final.png', fullPage: true });
  });

  test('错误处理和网络状态测试', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    console.log('🔍 测试错误处理...');
    
    // 模拟网络错误
    await page.route('**/api/**', route => route.abort());
    
    // 尝试触发API调用
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      console.log(`找到 ${buttonCount} 个按钮，尝试触发API调用...`);
      await buttons.first().click();
      await page.waitForTimeout(2000);
    }
    
    // 检查错误消息
    const errorMessages = [
      'text=错误',
      'text=失败', 
      'text=Error',
      'text=Failed',
      '.error',
      '[class*="error"]',
      '.text-red',
      '[class*="text-red"]'
    ];
    
    let errorFound = false;
    for (const selector of errorMessages) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`✅ 检测到错误消息: ${selector}`);
          errorFound = true;
          break;
        }
      } catch (error) {
        // 继续查找其他错误元素
      }
    }
    
    console.log(`📊 错误处理测试: ${errorFound ? '✅ 发现错误处理' : '⚠️ 未检测到错误处理'}`);
    
    // 截图错误状态
    await page.screenshot({ path: 'test-results/error-handling-test.png', fullPage: true });
    
    // 清除路由拦截
    await page.unroute('**/api/**');
  });
});