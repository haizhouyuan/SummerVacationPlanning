/**
 * Playwright MCP 工具助手函数
 * 确保所有返回值都是简短字符串，避免token超限
 */

export type PlaywrightResult = 'OK' | 'FAIL' | string;

/**
 * 统一点击操作 - 通过TestId
 */
export async function clickByTestId(page: any, testId: string): Promise<PlaywrightResult> {
  try {
    await page.getByTestId(testId).click();
    return 'OK';
  } catch (error) {
    return `FAIL: ${testId} not found`;
  }
}

/**
 * 统一点击操作 - 通过Role和Name
 */
export async function clickByRole(page: any, role: string, name: string): Promise<PlaywrightResult> {
  try {
    await page.getByRole(role, { name }).click();
    return 'OK';
  } catch (error) {
    return `FAIL: ${role}[${name}] not found`;
  }
}

/**
 * 文本断言 - 等待文本出现
 */
export async function expectVisibleText(page: any, text: string, timeout: number = 3000): Promise<PlaywrightResult> {
  try {
    await page.waitForFunction(
      (searchText: string) => document.body.innerText?.includes(searchText),
      text,
      { timeout }
    );
    return 'OK';
  } catch (error) {
    return `FAIL: Text "${text}" not visible`;
  }
}

/**
 * 输入文本 - 通过TestId
 */
export async function typeByTestId(page: any, testId: string, text: string): Promise<PlaywrightResult> {
  try {
    await page.getByTestId(testId).fill(text);
    return 'OK';
  } catch (error) {
    return `FAIL: Cannot type in ${testId}`;
  }
}

/**
 * 获取元素文本 - 限制长度
 */
export async function getTextByTestId(page: any, testId: string, maxLength: number = 50): Promise<PlaywrightResult> {
  try {
    const text = await page.getByTestId(testId).textContent();
    if (!text) return 'FAIL: No text found';
    
    const cleanText = text.trim();
    return cleanText.length > maxLength 
      ? `${cleanText.slice(0, maxLength)}...` 
      : cleanText;
  } catch (error) {
    return `FAIL: Element ${testId} not found`;
  }
}

/**
 * 等待元素可见
 */
export async function waitForVisible(page: any, testId: string, timeout: number = 3000): Promise<PlaywrightResult> {
  try {
    await page.getByTestId(testId).waitFor({ state: 'visible', timeout });
    return 'OK';
  } catch (error) {
    return `FAIL: ${testId} not visible`;
  }
}

/**
 * 检查元素是否存在
 */
export async function checkExists(page: any, testId: string): Promise<PlaywrightResult> {
  try {
    const count = await page.getByTestId(testId).count();
    return count > 0 ? 'OK' : 'FAIL: Not found';
  } catch (error) {
    return 'FAIL: Check failed';
  }
}

/**
 * 资源拦截器 - 减少页面加载负担
 */
export async function setupResourceBlocking(page: any): Promise<PlaywrightResult> {
  try {
    await page.route('**/*', (route: any) => {
      const resourceType = route.request().resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });
    return 'OK';
  } catch (error) {
    return 'FAIL: Resource blocking setup failed';
  }
}

/**
 * 安全的evaluate执行器 - 只返回标量
 */
export async function evaluateScalar(page: any, fn: string | Function, ...args: any[]): Promise<PlaywrightResult> {
  try {
    const result = await page.evaluate(fn, ...args);
    
    // 只允许返回基本类型
    if (['string', 'number', 'boolean'].includes(typeof result) || result === null) {
      const stringResult = String(result);
      return stringResult.length > 64 ? stringResult.slice(0, 64) + '...' : stringResult;
    }
    
    return 'OK'; // 复杂对象一律返回OK
  } catch (error) {
    return 'FAIL: Evaluate error';
  }
}

/**
 * 登录状态检查
 */
export async function checkLoginStatus(page: any): Promise<PlaywrightResult> {
  try {
    // 检查是否有登录状态指示器
    const loginIndicator = await page.getByTestId('user-display').count();
    if (loginIndicator > 0) {
      return 'OK: Logged in';
    }
    
    // 检查是否在登录页面
    const loginForm = await page.getByTestId('login-submit').count();
    if (loginForm > 0) {
      return 'OK: On login page';
    }
    
    return 'FAIL: Unknown state';
  } catch (error) {
    return 'FAIL: Status check failed';
  }
}