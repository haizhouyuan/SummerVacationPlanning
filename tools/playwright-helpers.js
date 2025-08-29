/**
 * Playwright 性能优化工具集
 * 解决 MCP 返回数据量过大问题，提供高效的页面操作方法
 */

class PlaywrightHelpers {
  constructor(page) {
    this.page = page;
    this.maxResponseSize = 24000; // 24k tokens 限制
  }

  /**
   * 数据截断工具 - 确保返回值不超过限制
   */
  static clip(data, maxLength = 2000) {
    try {
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      if (str.length <= maxLength) return str;
      
      return str.slice(0, maxLength) + `…[截断 ${str.length - maxLength} 字符]`;
    } catch (error) {
      return '[无法序列化的数据]';
    }
  }

  /**
   * 安全的 evaluate - 只返回标量值
   */
  async evalScalar(fn, ...args) {
    const result = await this.page.evaluate(fn, ...args);
    
    // 只允许返回基本类型
    if (['string', 'number', 'boolean'].includes(typeof result) || result === null) {
      return PlaywrightHelpers.clip(String(result));
    }
    
    return 'OK'; // 复杂对象一律返回简单状态
  }

  /**
   * 按 testid 点击 - 最优性能
   */
  async clickByTestId(testId) {
    try {
      await this.page.getByTestId(testId).click();
      return 'OK';
    } catch (error) {
      return `ERROR: ${PlaywrightHelpers.clip(error.message, 100)}`;
    }
  }

  /**
   * 按角色和名称点击
   */
  async clickByRole(role, name) {
    try {
      await this.page.getByRole(role, { name }).click();
      return 'OK';
    } catch (error) {
      return `ERROR: ${PlaywrightHelpers.clip(error.message, 100)}`;
    }
  }

  /**
   * 按文本内容点击（性能优化版）
   */
  async clickByText(text, options = {}) {
    try {
      const { exact = false, timeout = 10000 } = options;
      
      if (exact) {
        await this.page.getByText(text, { exact: true }).click({ timeout });
      } else {
        // 使用 evaluate 进行文本搜索，但只返回状态
        const found = await this.evalScalar((searchText) => {
          const buttons = [...document.querySelectorAll('button, a, [role="button"]')];
          const target = buttons.find(el => 
            el.textContent && el.textContent.includes(searchText)
          );
          
          if (target) {
            target.click();
            return 'CLICKED';
          }
          return 'NOT_FOUND';
        }, text);
        
        return found;
      }
      
      return 'OK';
    } catch (error) {
      return `ERROR: ${PlaywrightHelpers.clip(error.message, 100)}`;
    }
  }

  /**
   * 等待并验证文本出现
   */
  async waitForText(text, options = {}) {
    try {
      const { timeout = 10000, visible = true } = options;
      
      await this.page.waitForFunction(
        (searchText) => document.body.textContent.includes(searchText),
        text,
        { timeout }
      );
      
      return 'OK';
    } catch (error) {
      return `TIMEOUT: 未找到文本 "${text}"`;
    }
  }

  /**
   * 获取元素文本（限制长度）
   */
  async getTextBySelector(selector, maxLength = 200) {
    try {
      const text = await this.page.$eval(selector, el => el.textContent?.trim() || '');
      return PlaywrightHelpers.clip(text, maxLength);
    } catch (error) {
      return `ERROR: ${PlaywrightHelpers.clip(error.message, 100)}`;
    }
  }

  /**
   * 检查元素是否可见
   */
  async isVisible(selector) {
    try {
      const visible = await this.page.isVisible(selector);
      return visible ? 'VISIBLE' : 'HIDDEN';
    } catch (error) {
      return 'NOT_FOUND';
    }
  }

  /**
   * 填写表单字段
   */
  async fillField(selector, value) {
    try {
      await this.page.fill(selector, value);
      return 'OK';
    } catch (error) {
      return `ERROR: ${PlaywrightHelpers.clip(error.message, 100)}`;
    }
  }

  /**
   * 资源过滤器 - 阻断大型资源
   */
  async enableResourceFilter() {
    await this.page.route('**/*', (route) => {
      const request = route.request();
      const resourceType = request.resourceType();
      const url = request.url();

      // 阻断图片、媒体、字体
      if (['image', 'media', 'font'].includes(resourceType)) {
        return route.abort();
      }

      // 阻断第三方追踪脚本
      if (url.includes('google-analytics') || 
          url.includes('googletagmanager') ||
          url.includes('facebook.com') ||
          url.includes('doubleclick')) {
        return route.abort();
      }

      // 阻断大型 JSON 响应（简单检测）
      if (resourceType === 'xhr' && request.method() === 'GET') {
        // 可以在这里添加更复杂的过滤逻辑
      }

      route.continue();
    });

    return 'RESOURCE_FILTER_ENABLED';
  }

  /**
   * 批量元素操作（限制返回数量）
   */
  async listButtons(limit = 10) {
    try {
      const buttons = await this.evalScalar((maxCount) => {
        const btns = [...document.querySelectorAll('button, a, [role="button"]')];
        return btns.slice(0, maxCount).map(btn => ({
          text: (btn.textContent || '').trim().slice(0, 50),
          testId: btn.getAttribute('data-testid') || '',
          visible: btn.offsetParent !== null
        }));
      }, limit);

      return PlaywrightHelpers.clip(buttons, 1000);
    } catch (error) {
      return `ERROR: ${PlaywrightHelpers.clip(error.message, 100)}`;
    }
  }

  /**
   * 页面状态快照（最小化信息）
   */
  async getPageStatus() {
    try {
      const status = await this.evalScalar(() => {
        return {
          url: window.location.href,
          title: document.title.slice(0, 100),
          readyState: document.readyState,
          hasErrors: !!window.console.error.length
        };
      });

      return PlaywrightHelpers.clip(status, 500);
    } catch (error) {
      return `ERROR: ${PlaywrightHelpers.clip(error.message, 100)}`;
    }
  }

  /**
   * 静默等待页面加载
   */
  async waitForPageReady(timeout = 30000) {
    try {
      await this.page.waitForLoadState('networkidle', { timeout });
      return 'READY';
    } catch (error) {
      return 'TIMEOUT';
    }
  }
}

/**
 * 工厂函数 - 创建优化的 Playwright 助手
 */
function createHelper(page) {
  return new PlaywrightHelpers(page);
}

/**
 * MCP 兼容的工具函数集
 */
const MCPTools = {
  // 基本操作
  click: async (page, selector, method = 'testid') => {
    const helper = createHelper(page);
    
    switch (method) {
      case 'testid':
        return helper.clickByTestId(selector);
      case 'text':
        return helper.clickByText(selector);
      case 'role':
        const [role, name] = selector.split(':', 2);
        return helper.clickByRole(role, name);
      default:
        return helper.clickByTestId(selector);
    }
  },

  // 文本操作
  getText: async (page, selector, maxLength = 200) => {
    const helper = createHelper(page);
    return helper.getTextBySelector(selector, maxLength);
  },

  // 等待操作
  waitFor: async (page, text, timeout = 10000) => {
    const helper = createHelper(page);
    return helper.waitForText(text, { timeout });
  },

  // 状态检查
  getStatus: async (page) => {
    const helper = createHelper(page);
    return helper.getPageStatus();
  },

  // 资源优化
  optimize: async (page) => {
    const helper = createHelper(page);
    return helper.enableResourceFilter();
  }
};

module.exports = {
  PlaywrightHelpers,
  createHelper,
  MCPTools
};