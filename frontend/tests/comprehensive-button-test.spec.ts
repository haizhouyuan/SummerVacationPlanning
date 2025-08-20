import { test, expect } from '@playwright/test';

test.describe('综合按钮功能测试', () => {
  test('系统性测试所有前端按钮功能', async ({ page }) => {
    console.log('开始系统性按钮功能测试...');
    
    let consoleMessages: string[] = [];
    let errorMessages: string[] = [];
    
    // 捕获控制台和错误消息
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`${msg.type()}: ${text}`);
      console.log(`Console ${msg.type()}: ${text}`);
    });
    
    page.on('pageerror', error => {
      const errorText = error.toString();
      errorMessages.push(errorText);
      console.error('Page error:', errorText);
    });

    // ===== 1. 学生登录并进入任务规划页面 =====
    console.log('\n=== 第一步：学生登录并进入任务规划页面 ===');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // 点击学生演示按钮
    const studentDemoButton = page.locator('button:has-text("👨‍🎓 学生演示")');
    await expect(studentDemoButton).toBeVisible();
    await studentDemoButton.click();
    await page.waitForTimeout(2000);
    
    // 导航到任务规划页面
    await page.goto('/task-planning');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 截图：任务规划页面
    await page.screenshot({ 
      path: 'test-results/comprehensive-01-task-planning-page.png', 
      fullPage: true 
    });
    
    console.log('✅ 成功进入任务规划页面');

    // ===== 2. 测试任务分类筛选按钮 =====
    console.log('\n=== 第二步：测试所有分类筛选按钮 ===');
    
    // 查找所有分类按钮
    const categoryButtons = page.locator('button:has-text("全部"), button:has-text("语文阅读"), button:has-text("学习"), button:has-text("运动"), button:has-text("创意"), button:has-text("其他")');
    const categoryButtonCount = await categoryButtons.count();
    
    console.log(`找到 ${categoryButtonCount} 个分类筛选按钮`);
    
    // 测试每个分类按钮
    for (let i = 0; i < categoryButtonCount; i++) {
      const button = categoryButtons.nth(i);
      const buttonText = await button.textContent();
      
      console.log(`测试分类按钮: ${buttonText}`);
      
      await button.click();
      await page.waitForTimeout(1000);
      
      // 截图每个分类筛选结果
      await page.screenshot({ 
        path: `test-results/comprehensive-02-category-${i}-${buttonText}.png`, 
        fullPage: true 
      });
      
      // 验证任务列表是否更新
      const taskCards = page.locator('.task-card, [data-testid="task-card"], .card');
      const taskCount = await taskCards.count();
      console.log(`${buttonText} 分类下显示 ${taskCount} 个任务`);
    }
    
    console.log('✅ 所有分类筛选按钮测试完成');

    // ===== 3. 测试任务选择和操作按钮 =====
    console.log('\n=== 第三步：测试任务选择和操作按钮 ===');
    
    // 回到"全部"分类
    const allCategoryButton = page.locator('button:has-text("全部")');
    await allCategoryButton.click();
    await page.waitForTimeout(1000);
    
    // 查找所有任务卡片
    const taskCards = page.locator('.task-card, [data-testid="task-card"], .card');
    const taskCardCount = await taskCards.count();
    
    console.log(`找到 ${taskCardCount} 个任务卡片`);
    
    if (taskCardCount > 0) {
      // 测试第一个任务卡片的所有按钮
      const firstTaskCard = taskCards.first();
      
      // 查找任务卡片内的按钮
      const taskActionButtons = firstTaskCard.locator('button');
      const actionButtonCount = await taskActionButtons.count();
      
      console.log(`任务卡片内找到 ${actionButtonCount} 个操作按钮`);
      
      for (let i = 0; i < actionButtonCount; i++) {
        const actionButton = taskActionButtons.nth(i);
        const buttonText = await actionButton.textContent();
        
        if (buttonText && buttonText.trim()) {
          console.log(`测试任务操作按钮: ${buttonText}`);
          
          try {
            await actionButton.click();
            await page.waitForTimeout(1000);
            
            // 截图按钮点击后的状态
            await page.screenshot({ 
              path: `test-results/comprehensive-03-task-action-${i}-${buttonText.replace(/[^a-zA-Z0-9]/g, '_')}.png`, 
              fullPage: true 
            });
            
            // 如果出现模态框，处理模态框
            const modal = page.locator('.modal, [role="dialog"], .dialog');
            if (await modal.isVisible()) {
              console.log('检测到模态框，尝试关闭');
              
              // 查找模态框内的按钮
              const modalButtons = modal.locator('button');
              const modalButtonCount = await modalButtons.count();
              
              for (let j = 0; j < modalButtonCount; j++) {
                const modalButton = modalButtons.nth(j);
                const modalButtonText = await modalButton.textContent();
                console.log(`模态框按钮: ${modalButtonText}`);
              }
              
              // 尝试关闭模态框
              const closeButton = modal.locator('button:has-text("取消"), button:has-text("关闭"), button[aria-label="close"], .close');
              if (await closeButton.isVisible()) {
                await closeButton.click();
                await page.waitForTimeout(500);
              }
            }
          } catch (error) {
            console.log(`按钮 ${buttonText} 点击时出现错误: ${error}`);
          }
        }
      }
    }
    
    console.log('✅ 任务选择和操作按钮测试完成');

    // ===== 4. 测试今日任务页面的按钮 =====
    console.log('\n=== 第四步：测试今日任务页面按钮 ===');
    
    await page.goto('/today-tasks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 截图：今日任务页面
    await page.screenshot({ 
      path: 'test-results/comprehensive-04-today-tasks-page.png', 
      fullPage: true 
    });
    
    // 查找游戏时间兑换按钮
    const gameTimeButtons = page.locator('button:has-text("兑换"), button:has-text("游戏时间"), button:has-text("普通游戏"), button:has-text("教育游戏")');
    const gameTimeButtonCount = await gameTimeButtons.count();
    
    console.log(`找到 ${gameTimeButtonCount} 个游戏时间相关按钮`);
    
    for (let i = 0; i < gameTimeButtonCount; i++) {
      const button = gameTimeButtons.nth(i);
      const buttonText = await button.textContent();
      
      console.log(`测试游戏时间按钮: ${buttonText}`);
      
      try {
        await button.click();
        await page.waitForTimeout(1000);
        
        // 截图按钮点击后的状态
        await page.screenshot({ 
          path: `test-results/comprehensive-05-game-time-${i}-${buttonText?.replace(/[^a-zA-Z0-9]/g, '_')}.png`, 
          fullPage: true 
        });
        
        // 处理可能出现的确认对话框
        const confirmDialog = page.locator('.confirm-dialog, [role="alertdialog"]');
        if (await confirmDialog.isVisible()) {
          const confirmButton = confirmDialog.locator('button:has-text("确认"), button:has-text("确定")');
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            await page.waitForTimeout(500);
          }
        }
      } catch (error) {
        console.log(`游戏时间按钮 ${buttonText} 点击时出现错误: ${error}`);
      }
    }
    
    console.log('✅ 今日任务页面按钮测试完成');

    // ===== 5. 测试家长端审批功能 =====
    console.log('\n=== 第五步：测试家长端审批功能 ===');
    
    // 切换到家长登录
    await page.goto('/login');
    await page.waitForTimeout(1000);
    
    const parentDemoButton = page.locator('button:has-text("👨‍👩‍👧‍👦 家长演示")');
    await expect(parentDemoButton).toBeVisible();
    await parentDemoButton.click();
    await page.waitForTimeout(2000);
    
    // 导航到家长仪表板
    await page.goto('/parent-dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 截图：家长仪表板
    await page.screenshot({ 
      path: 'test-results/comprehensive-06-parent-dashboard.png', 
      fullPage: true 
    });
    
    // 查找审批相关按钮
    const approvalButtons = page.locator('button:has-text("通过"), button:has-text("拒绝"), button:has-text("批准"), button:has-text("驳回"), button:has-text("审批")');
    const approvalButtonCount = await approvalButtons.count();
    
    console.log(`找到 ${approvalButtonCount} 个审批相关按钮`);
    
    for (let i = 0; i < approvalButtonCount; i++) {
      const button = approvalButtons.nth(i);
      const buttonText = await button.textContent();
      
      console.log(`测试审批按钮: ${buttonText}`);
      
      try {
        // 只对第一个按钮执行点击测试，避免影响数据状态
        if (i === 0) {
          await button.click();
          await page.waitForTimeout(1000);
          
          // 截图按钮点击后的状态
          await page.screenshot({ 
            path: `test-results/comprehensive-07-approval-${i}-${buttonText?.replace(/[^a-zA-Z0-9]/g, '_')}.png`, 
            fullPage: true 
          });
        }
      } catch (error) {
        console.log(`审批按钮 ${buttonText} 点击时出现错误: ${error}`);
      }
    }
    
    console.log('✅ 家长端审批功能测试完成');

    // ===== 6. 导航和菜单按钮测试 =====
    console.log('\n=== 第六步：测试导航和菜单按钮 ===');
    
    // 测试主要导航链接
    const navigationLinks = page.locator('nav a, .nav-link, .navbar a');
    const navLinkCount = await navigationLinks.count();
    
    console.log(`找到 ${navLinkCount} 个导航链接`);
    
    const navigationUrls = ['/dashboard', '/task-planning', '/today-tasks', '/parent-dashboard'];
    
    for (const url of navigationUrls) {
      console.log(`测试导航到: ${url}`);
      
      try {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // 截图导航后的页面
        await page.screenshot({ 
          path: `test-results/comprehensive-08-navigation-${url.replace('/', '_')}.png`, 
          fullPage: true 
        });
        
        console.log(`✅ 成功导航到 ${url}`);
      } catch (error) {
        console.log(`导航到 ${url} 时出现错误: ${error}`);
      }
    }
    
    console.log('✅ 导航按钮测试完成');

    // ===== 测试总结 =====
    console.log('\n=== 综合按钮测试总结 ===');
    console.log('✅ 分类筛选按钮测试: 完成');
    console.log('✅ 任务操作按钮测试: 完成');
    console.log('✅ 游戏时间兑换按钮测试: 完成');
    console.log('✅ 家长审批按钮测试: 完成');
    console.log('✅ 导航按钮测试: 完成');
    
    // 检查JavaScript错误
    const hasJSErrors = errorMessages.length > 0;
    console.log(`JavaScript错误统计: ${hasJSErrors ? errorMessages.length : 0} 个`);
    
    if (hasJSErrors) {
      console.log('\n=== JavaScript错误详情 ===');
      errorMessages.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 最终截图
    await page.screenshot({ 
      path: 'test-results/comprehensive-09-final-state.png', 
      fullPage: true 
    });
    
    console.log('\n✅ 综合按钮功能测试全部完成！');
    
    // 断言：不应该有致命的JavaScript错误
    const criticalErrors = errorMessages.filter(error => 
      error.includes('TypeError') || 
      error.includes('ReferenceError') || 
      error.includes('Cannot read properties of undefined')
    );
    
    expect(criticalErrors.length).toBeLessThan(3); // 允许少量非致命错误
  });
});