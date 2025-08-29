import { chromium, FullConfig } from '@playwright/test';

/**
 * Playwright 全局设置 - 性能优化和资源管理
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Playwright 全局设置启动...');
  
  // 设置环境变量优化性能
  process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
  
  // 检查并优化系统资源
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox']
  });
  
  // 预热浏览器实例
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 测试基本功能
  try {
    await page.goto('about:blank');
    console.log('✅ Edge 浏览器预热完成');
  } catch (error) {
    console.warn('⚠️ Edge 浏览器预热失败，将使用备用配置');
  }
  
  await context.close();
  await browser.close();
  
  console.log('✅ Playwright 全局设置完成');
}

export default globalSetup;