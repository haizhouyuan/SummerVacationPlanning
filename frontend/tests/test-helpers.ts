import { Page } from '@playwright/test';

/**
 * 安全地清除localStorage，避免权限错误
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.clear();
        }
      } catch (error) {
        console.log('localStorage清除失败，但继续测试:', error);
      }
    });
  } catch (error) {
    console.log('页面evaluate失败，跳过localStorage清除:', error);
  }
}

/**
 * 安全地设置localStorage项目
 */
export async function setLocalStorage(page: Page, key: string, value: string): Promise<boolean> {
  try {
    const result = await page.evaluate(({ key, value }) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(key, value);
          return true;
        }
      } catch (error) {
        console.log('localStorage设置失败:', error);
      }
      return false;
    }, { key, value });
    return result;
  } catch (error) {
    console.log('页面evaluate失败，无法设置localStorage:', error);
    return false;
  }
}

/**
 * 安全地获取localStorage项目
 */
export async function getLocalStorage(page: Page, key: string): Promise<string | null> {
  try {
    const result = await page.evaluate((key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return localStorage.getItem(key);
        }
      } catch (error) {
        console.log('localStorage读取失败:', error);
      }
      return null;
    }, key);
    return result;
  } catch (error) {
    console.log('页面evaluate失败，无法读取localStorage:', error);
    return null;
  }
}

/**
 * 导航到首页并等待加载完成
 */
export async function navigateToHomePage(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

/**
 * 模拟用户登录（兼容模式）
 */
export async function mockUserLogin(page: Page, role: 'student' | 'parent' = 'student'): Promise<boolean> {
  const mockUser = {
    id: role === 'student' ? 'student_001' : 'parent_001',
    username: role === 'student' ? 'student_demo' : 'parent_demo',
    role: role,
    displayName: role === 'student' ? '演示学生' : '演示家长',
    email: role === 'student' ? 'student@demo.com' : 'parent@demo.com',
    points: role === 'student' ? 150 : 0,
    currentStreak: role === 'student' ? 3 : 0,
    medals: { bronze: true, silver: false, gold: false, diamond: false },
    children: role === 'parent' ? ['student_001'] : null
  };
  
  const token = `demo_token_${role}_${Date.now()}`;
  
  // 设置用户数据和token
  const userSet = await setLocalStorage(page, 'user', JSON.stringify(mockUser));
  const tokenSet = await setLocalStorage(page, 'auth_token', token);
  
  if (userSet && tokenSet) {
    console.log(`模拟${role}登录成功`);
    return true;
  } else {
    console.log(`模拟${role}登录失败`);
    return false;
  }
}

/**
 * 测试页面是否需要认证
 */
export async function testPageRequiresAuth(page: Page, path: string): Promise<boolean> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  
  // 检查是否重定向到登录页面
  const currentUrl = page.url();
  return currentUrl.endsWith('/') || currentUrl.includes('login');
}

/**
 * 等待并处理可能的对话框
 */
export async function handleAnyDialogs(page: Page): Promise<void> {
  try {
    page.on('dialog', async dialog => {
      console.log(`处理对话框: ${dialog.message()}`);
      await dialog.accept();
    });
  } catch (error) {
    // 忽略对话框处理错误
  }
}

/**
 * 检查页面是否包含指定文本
 */
export async function pageContainsText(page: Page, text: string | RegExp): Promise<boolean> {
  try {
    const locator = typeof text === 'string' 
      ? page.locator(`text=${text}`)
      : page.locator(`text=${text.source}`);
    
    return await locator.isVisible({ timeout: 5000 });
  } catch (error) {
    return false;
  }
}

/**
 * 等待页面稳定加载
 */
export async function waitForPageStable(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // 额外等待确保页面稳定
}

/**
 * 查找并点击按钮，支持多种选择器
 */
export async function clickButtonByText(page: Page, buttonText: string): Promise<boolean> {
  const selectors = [
    `button:has-text("${buttonText}")`,
    `button[aria-label*="${buttonText}"]`,
    `[role="button"]:has-text("${buttonText}")`,
    `input[type="button"][value*="${buttonText}"]`,
    `input[type="submit"][value*="${buttonText}"]`
  ];
  
  for (const selector of selectors) {
    const button = page.locator(selector);
    if (await button.isVisible()) {
      await button.click();
      await page.waitForTimeout(500);
      return true;
    }
  }
  
  return false;
}

/**
 * 检查导航菜单是否存在
 */
export async function hasNavigationMenu(page: Page): Promise<boolean> {
  const navSelectors = [
    'nav',
    '.navigation',
    '.navbar',
    '.menu',
    '.sidebar',
    '[role="navigation"]'
  ];
  
  for (const selector of navSelectors) {
    const nav = page.locator(selector);
    if (await nav.isVisible()) {
      return true;
    }
  }
  
  return false;
}

/**
 * 获取页面错误信息
 */
export async function getPageErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  page.on('requestfailed', request => {
    errors.push(`Request failed: ${request.url()}`);
  });
  
  return errors;
}