const { chromium } = require('playwright');

async function inspectReactLogin() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 1000 
  });
  
  const page = await browser.newPage();
  
  // 捕获所有控制台消息
  page.on('console', msg => {
    console.log(`🖥️  [${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  // 捕获页面错误
  page.on('pageerror', error => {
    console.log(`💥 页面错误: ${error.message}`);
  });
  
  try {
    console.log('🔍 正在检查React应用的登录页面');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 15000
    });
    
    console.log('⏱️  等待页面完全加载...');
    await page.waitForTimeout(5000);
    
    // 检查页面上是否真的有按钮
    console.log('🔍 分析页面结构...');
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasButtons: document.querySelectorAll('button').length,
        bodyText: document.body.innerText.substring(0, 500),
        hasQuickLogin: typeof window.quickLogin === 'function',
        reactMounted: !!document.querySelector('[data-reactroot]') || !!document.querySelector('#root > *')
      };
    });
    
    console.log('📋 页面信息:');
    console.log(`  标题: ${pageInfo.title}`);
    console.log(`  URL: ${pageInfo.url}`);
    console.log(`  按钮数量: ${pageInfo.hasButtons}`);
    console.log(`  React已挂载: ${pageInfo.reactMounted}`);
    console.log(`  quickLogin函数存在: ${pageInfo.hasQuickLogin}`);
    console.log(`  页面内容前500字符: ${pageInfo.bodyText}`);
    
    // 查找演示按钮
    const demoButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map((btn, index) => {
        const rect = btn.getBoundingClientRect();
        return {
          index,
          text: btn.textContent?.trim() || '',
          className: btn.className,
          onclick: btn.onclick ? btn.onclick.toString() : null,
          hasEventListeners: btn.getAttribute('onclick') !== null,
          visible: rect.width > 0 && rect.height > 0,
          position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          style: {
            display: window.getComputedStyle(btn).display,
            visibility: window.getComputedStyle(btn).visibility,
            pointerEvents: window.getComputedStyle(btn).pointerEvents,
            zIndex: window.getComputedStyle(btn).zIndex
          }
        };
      }).filter(btn => 
        btn.text.includes('演示') || btn.text.includes('学生') || btn.text.includes('家长')
      );
    });
    
    console.log('\n🎯 找到的演示按钮:');
    demoButtons.forEach((btn, i) => {
      console.log(`  按钮${i + 1}: "${btn.text}"`);
      console.log(`    可见: ${btn.visible}`);
      console.log(`    位置: ${JSON.stringify(btn.position)}`);
      console.log(`    样式: display=${btn.style.display}, visibility=${btn.style.visibility}`);
      console.log(`    事件: ${btn.hasEventListeners ? 'Yes' : 'No'}`);
      console.log(`    onclick: ${btn.onclick ? 'Yes' : 'No'}`);
    });
    
    if (demoButtons.length > 0) {
      console.log('\n🔘 尝试点击第一个演示按钮...');
      const firstBtn = demoButtons[0];
      
      // 尝试多种点击方式
      try {
        // 方法1：直接点击
        console.log('尝试方法1: 直接点击按钮元素');
        await page.locator('button').nth(firstBtn.index).click();
        console.log('✅ 直接点击执行完成');
        
        await page.waitForTimeout(3000);
        
        // 检查是否有变化
        const newUrl = page.url();
        console.log(`当前URL: ${newUrl}`);
        
        if (newUrl !== pageInfo.url) {
          console.log('✅ 页面发生了跳转！');
        } else {
          console.log('⚠️  页面没有跳转，尝试其他方法...');
          
          // 方法2：JavaScript点击
          console.log('尝试方法2: JavaScript点击');
          await page.evaluate((btnIndex) => {
            const button = document.querySelectorAll('button')[btnIndex];
            if (button) {
              button.click();
            }
          }, firstBtn.index);
          
          await page.waitForTimeout(3000);
          
          // 方法3：触发onclick事件
          console.log('尝试方法3: 手动调用quickLogin');
          await page.evaluate(() => {
            if (typeof window.quickLogin === 'function') {
              window.quickLogin('student');
            }
          });
          
          await page.waitForTimeout(3000);
          
          const finalUrl = page.url();
          console.log(`最终URL: ${finalUrl}`);
          
          if (finalUrl !== pageInfo.url) {
            console.log('✅ quickLogin手动调用成功！');
          } else {
            console.log('❌ 所有方法都无效');
          }
        }
        
      } catch (error) {
        console.log(`❌ 点击失败: ${error.message}`);
      }
    } else {
      console.log('❌ 没有找到演示按钮');
    }
    
    console.log('\n🔍 保持浏览器打开30秒供检查...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error.message);
  } finally {
    await browser.close();
  }
}

inspectReactLogin().catch(console.error);