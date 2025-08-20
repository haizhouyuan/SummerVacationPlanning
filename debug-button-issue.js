const { chromium } = require('playwright');

async function debugButtonIssue() {
  console.log('🔍 启动详细的按钮调试...');
  
  const browser = await chromium.launch({ 
    headless: false,  // 保持浏览器可见
    slowMo: 2000,     // 慢动作，方便观察
    devtools: true    // 打开开发者工具
  });
  
  const page = await browser.newPage();
  
  // 监听所有控制台消息
  page.on('console', msg => {
    console.log(`🖥️  [${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  // 监听页面错误
  page.on('pageerror', error => {
    console.log(`💥 页面错误: ${error.message}`);
  });
  
  // 监听网络请求
  page.on('request', request => {
    if (request.url().includes('api') || request.url().includes('login')) {
      console.log(`📡 请求: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('api') || response.url().includes('login')) {
      console.log(`📡 响应: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('🌐 正在加载 http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('⏱️  等待页面完全加载...');
    await page.waitForTimeout(5000);
    
    // 截图当前页面状态
    await page.screenshot({ path: 'current-login-page.png', fullPage: true });
    console.log('📸 已保存当前页面截图: current-login-page.png');
    
    // 查找所有按钮
    console.log('🔍 正在分析页面上的所有按钮...');
    const allButtons = await page.locator('button').all();
    console.log(`📊 找到 ${allButtons.length} 个按钮`);
    
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const button = allButtons[i];
      const text = await button.textContent().catch(() => 'N/A');
      const isVisible = await button.isVisible().catch(() => false);
      const isEnabled = await button.isEnabled().catch(() => false);
      const boundingBox = await button.boundingBox().catch(() => null);
      
      console.log(`  按钮 ${i + 1}: "${text.trim()}" | 可见: ${isVisible} | 启用: ${isEnabled} | 位置: ${boundingBox ? `${boundingBox.x},${boundingBox.y}` : '无'}`);
      
      if (text.includes('学生演示') || text.includes('家长演示')) {
        console.log(`    🎯 找到演示按钮! 尝试获取更多信息...`);
        
        const onclick = await button.getAttribute('onclick').catch(() => null);
        const className = await button.getAttribute('class').catch(() => null);
        const style = await button.getAttribute('style').catch(() => null);
        
        console.log(`    📝 onclick: ${onclick}`);
        console.log(`    🎨 class: ${className}`);
        console.log(`    💫 style: ${style}`);
      }
    }
    
    // 特定查找演示按钮
    console.log('\n🎯 专门查找演示按钮...');
    const studentButtons = await page.locator('button', { hasText: '学生演示' }).all();
    const parentButtons = await page.locator('button', { hasText: '家长演示' }).all();
    
    console.log(`👨‍🎓 学生演示按钮数量: ${studentButtons.length}`);
    console.log(`👨‍👩‍👧‍👦 家长演示按钮数量: ${parentButtons.length}`);
    
    if (studentButtons.length > 0) {
      console.log('\n🔘 尝试点击学生演示按钮...');
      const studentBtn = studentButtons[0];
      
      // 检查按钮状态
      console.log('📋 按钮详细状态:');
      console.log(`  - 可见: ${await studentBtn.isVisible()}`);
      console.log(`  - 启用: ${await studentBtn.isEnabled()}`);
      console.log(`  - 可点击: ${await studentBtn.isEnabled()}`);
      
      // 滚动到按钮位置
      await studentBtn.scrollIntoViewIfNeeded();
      console.log('📜 已滚动到按钮位置');
      
      // 高亮显示按钮（添加红色边框）
      await studentBtn.evaluate(el => el.style.border = '3px solid red');
      console.log('🔴 已高亮显示按钮（红色边框）');
      
      await page.waitForTimeout(2000); // 等待观察
      
      try {
        // 尝试点击
        console.log('👆 执行点击...');
        await studentBtn.click({ timeout: 10000 });
        console.log('✅ 点击执行完成');
        
        // 等待响应
        console.log('⏳ 等待响应...');
        await page.waitForTimeout(8000);
        
        const currentUrl = page.url();
        console.log(`📍 当前页面URL: ${currentUrl}`);
        
        if (currentUrl.includes('/dashboard')) {
          console.log('🎉 成功！已跳转到仪表板');
        } else if (currentUrl === 'http://localhost:3000/' || currentUrl.includes('/login')) {
          console.log('⚠️  仍在登录页面，点击可能没有效果');
        } else {
          console.log(`ℹ️  跳转到了: ${currentUrl}`);
        }
        
      } catch (clickError) {
        console.log(`❌ 点击失败: ${clickError.message}`);
        
        // 尝试用JavaScript直接点击
        console.log('🔧 尝试用JavaScript直接点击...');
        try {
          await studentBtn.evaluate(el => el.click());
          console.log('✅ JavaScript点击执行完成');
          
          await page.waitForTimeout(5000);
          console.log(`📍 JavaScript点击后URL: ${page.url()}`);
        } catch (jsError) {
          console.log(`❌ JavaScript点击也失败: ${jsError.message}`);
        }
      }
    }
    
    console.log('\n🔍 浏览器将保持打开30秒供手动检查...');
    console.log('请在浏览器中手动尝试点击按钮，观察是否有反应');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ 调试过程出错:', error.message);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    console.log('🔚 调试完成，关闭浏览器');
    await browser.close();
  }
}

debugButtonIssue().catch(console.error);