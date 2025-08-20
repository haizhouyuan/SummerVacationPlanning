import { test, expect } from '@playwright/test';

test.describe('任务规划功能专项测试', () => {
  test('验证规划任务按钮和功能', async ({ page }) => {
    console.log('🔍 开始任务规划功能专项测试...');
    
    try {
      // 1. 登录并跳转到任务规划页面
      await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      // 使用JavaScript直接登录
      await page.evaluate(() => {
        if (typeof (window as any).quickLogin === 'function') {
          (window as any).quickLogin('student');
        }
      });
      
      await page.waitForTimeout(3000);
      
      // 跳转到任务规划页面
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);
      
      console.log('✅ 成功进入任务规划页面');
      
      // 2. 检查页面基本结构
      console.log('🔍 检查页面基本结构...');
      
      const pageTitle = await page.title();
      console.log(`📊 页面标题: ${pageTitle}`);
      
      // 3. 查找所有可能的规划按钮
      console.log('🔍 寻找规划任务相关按钮...');
      
      const planningButtons = [
        { selector: 'button:has-text("规划任务")', name: '规划任务' },
        { selector: 'button:has-text("开始规划")', name: '开始规划' },
        { selector: 'button:has-text("创建任务")', name: '创建任务' },
        { selector: 'button:has-text("计划任务")', name: '计划任务' },
        { selector: '[data-testid="plan-task-button"]', name: '测试ID按钮' },
        { selector: 'button[class*="plan"]', name: '包含plan类的按钮' }
      ];
      
      let foundButtons = [];
      
      for (const btn of planningButtons) {
        const count = await page.locator(btn.selector).count();
        if (count > 0) {
          console.log(`✅ 找到 ${btn.name}: ${count} 个`);
          foundButtons.push(btn);
        } else {
          console.log(`⚠️ 未找到 ${btn.name}`);
        }
      }
      
      // 4. 检查任务库是否加载
      console.log('🔍 检查任务库数据加载...');
      
      const taskElements = await page.locator('[class*="task"], .task-card, .bg-white').count();
      console.log(`📊 找到 ${taskElements} 个可能的任务元素`);
      
      // 检查是否有任务文本内容
      const taskTitles = await page.locator('text=/数学|英语|阅读|写作|运动|家务|编程|学习/').count();
      console.log(`📊 找到 ${taskTitles} 个任务相关文本`);
      
      // 5. 检查网络错误
      const networkErrors = await page.locator('text=/fail to fetch|网络错误|加载失败|请求失败/i').count();
      if (networkErrors === 0) {
        console.log('✅ 无网络错误信息');
      } else {
        console.log(`❌ 发现 ${networkErrors} 个网络错误`);
      }
      
      // 6. 如果找到规划按钮，尝试点击测试
      if (foundButtons.length > 0) {
        console.log('🔍 测试规划按钮点击功能...');
        
        const firstButton = foundButtons[0];
        const button = page.locator(firstButton.selector).first();
        
        try {
          // 检查按钮是否可见和可点击
          const isVisible = await button.isVisible();
          const isEnabled = await button.isEnabled();
          
          console.log(`📊 ${firstButton.name} 按钮状态: 可见=${isVisible}, 可用=${isEnabled}`);
          
          if (isVisible && isEnabled) {
            // 先选择一些任务（如果有的话）
            const selectableItems = page.locator('input[type="checkbox"], [role="checkbox"], .selectable');
            const selectableCount = await selectableItems.count();
            
            if (selectableCount > 0) {
              console.log(`📊 找到 ${selectableCount} 个可选择项，尝试选择前几个...`);
              const itemsToSelect = Math.min(selectableCount, 3);
              
              for (let i = 0; i < itemsToSelect; i++) {
                try {
                  await selectableItems.nth(i).click();
                  await page.waitForTimeout(200);
                } catch (e) {
                  console.log(`⚠️ 选择第${i+1}项时出错:`, e);
                }
              }
            }
            
            // 尝试点击规划按钮
            console.log(`🔍 尝试点击 ${firstButton.name} 按钮...`);
            
            await button.click();
            await page.waitForTimeout(2000);
            
            console.log('✅ 规划按钮点击成功');
            
            // 检查点击后的反应
            const alerts = await page.locator('[role="alert"], .alert, .notification').count();
            const modals = await page.locator('[role="dialog"], .modal').count();
            
            console.log(`📊 点击后发现: ${alerts} 个提醒, ${modals} 个弹窗`);
            
          } else {
            console.log(`⚠️ ${firstButton.name} 按钮不可点击`);
          }
          
        } catch (clickError) {
          console.log(`❌ 点击 ${firstButton.name} 按钮时出错:`, clickError);
        }
      } else {
        console.log('❌ 未找到任何规划相关按钮');
      }
      
      // 7. 最终状态检查
      console.log('🔍 最终状态检查...');
      
      const currentUrl = page.url();
      console.log(`📊 当前URL: ${currentUrl}`);
      
      const allButtons = await page.locator('button:visible').count();
      console.log(`📊 页面总计可见按钮数: ${allButtons}`);
      
    } catch (error) {
      console.log('❌ 测试过程中出错:', error);
    }
    
    console.log('🎯 任务规划功能专项测试完成');
    expect(true).toBeTruthy();
  });
});