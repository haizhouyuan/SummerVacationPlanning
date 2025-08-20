import { test, expect } from '@playwright/test';

test.describe('页面结构调试', () => {
  test('详细检查任务规划页面结构', async ({ page }) => {
    console.log('🔍 开始页面结构调试...');
    
    try {
      // 登录并跳转到任务规划页面
      await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      await page.evaluate(() => {
        if (typeof (window as any).quickLogin === 'function') {
          (window as any).quickLogin('student');
        }
      });
      
      await page.waitForTimeout(3000);
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);
      
      console.log('✅ 成功进入任务规划页面');
      
      // 1. 获取页面的所有按钮详细信息
      console.log('🔍 获取所有按钮详细信息...');
      
      const buttonDetails = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.map((btn, index) => ({
          index: index + 1,
          text: btn.textContent?.trim() || '',
          className: btn.className,
          id: btn.id,
          disabled: btn.disabled,
          visible: btn.offsetParent !== null,
          testId: btn.getAttribute('data-testid') || '',
          type: btn.type,
          onclick: btn.onclick ? 'has onclick' : 'no onclick'
        }));
      });
      
      console.log('📊 所有按钮详情:');
      buttonDetails.forEach(btn => {
        console.log(`  按钮${btn.index}: "${btn.text}" | 类名: ${btn.className} | 可见: ${btn.visible} | 禁用: ${btn.disabled}`);
      });
      
      // 2. 检查页面主要内容区域
      console.log('🔍 检查页面主要内容...');
      
      const pageContent = await page.evaluate(() => {
        const content = {
          headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent?.trim()),
          forms: Array.from(document.querySelectorAll('form')).length,
          inputs: Array.from(document.querySelectorAll('input')).length,
          selects: Array.from(document.querySelectorAll('select')).length,
          textareas: Array.from(document.querySelectorAll('textarea')).length,
          mainContent: document.querySelector('main, .main, [role="main"]')?.textContent?.substring(0, 200) || '未找到主内容',
          errorMessages: Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && /error|错误|fail|失败/i.test(el.textContent)
          ).map(el => el.textContent?.trim()).slice(0, 5)
        };
        return content;
      });
      
      console.log('📊 页面内容概览:');
      console.log(`  标题: ${pageContent.headings.join(', ')}`);
      console.log(`  表单: ${pageContent.forms} 个`);
      console.log(`  输入框: ${pageContent.inputs} 个`);
      console.log(`  下拉框: ${pageContent.selects} 个`);
      console.log(`  文本域: ${pageContent.textareas} 个`);
      console.log(`  主要内容: ${pageContent.mainContent}`);
      if (pageContent.errorMessages.length > 0) {
        console.log(`  错误信息: ${pageContent.errorMessages.join(', ')}`);
      }
      
      // 3. 检查是否有任务选择界面
      console.log('🔍 检查任务选择界面...');
      
      const taskSelection = await page.evaluate(() => {
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
        const radioButtons = Array.from(document.querySelectorAll('input[type="radio"]'));
        const clickableCards = Array.from(document.querySelectorAll('[role="button"], .clickable, .selectable'));
        
        return {
          checkboxes: checkboxes.length,
          radioButtons: radioButtons.length,
          clickableCards: clickableCards.length,
          taskCards: Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && /任务|task|学习|数学|英语/i.test(el.textContent)
          ).length
        };
      });
      
      console.log('📊 任务选择界面:');
      console.log(`  复选框: ${taskSelection.checkboxes} 个`);
      console.log(`  单选按钮: ${taskSelection.radioButtons} 个`);
      console.log(`  可点击卡片: ${taskSelection.clickableCards} 个`);
      console.log(`  任务相关元素: ${taskSelection.taskCards} 个`);
      
      // 4. 检查页面是否正确渲染
      console.log('🔍 检查页面渲染状态...');
      
      const renderState = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        
        return {
          bodyClassList: body.className,
          bodyChildrenCount: body.children.length,
          reactRoot: !!document.querySelector('#root, [data-reactroot]'),
          totalElements: document.querySelectorAll('*').length,
          hasStyles: !!document.querySelector('style, link[rel="stylesheet"]'),
          consoleErrors: (window as any).__consoleErrors || []
        };
      });
      
      console.log('📊 页面渲染状态:');
      console.log(`  Body类名: ${renderState.bodyClassList}`);
      console.log(`  Body子元素: ${renderState.bodyChildrenCount} 个`);
      console.log(`  React根节点: ${renderState.reactRoot ? '存在' : '不存在'}`);
      console.log(`  总元素数: ${renderState.totalElements}`);
      console.log(`  样式表: ${renderState.hasStyles ? '已加载' : '未加载'}`);
      
    } catch (error) {
      console.log('❌ 调试过程中出错:', error);
    }
    
    console.log('🎯 页面结构调试完成');
    expect(true).toBeTruthy();
  });
});