/**
 * Test Setup Utilities
 * 测试设置工具 - 全局测试配置和工具函数
 */

import { UserFactory } from './factories/userFactory';
import { TaskFactory } from './factories/taskFactory';
import { mockApiService, setupApiMocks, resetApiMocks } from './mocks/apiService';

// 全局测试设置
export const setupTestEnvironment = () => {
  // 设置默认Mock
  setupApiMocks();
  
  // 设置全局超时
  jest.setTimeout(30000);
  
  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  global.localStorage = localStorageMock;
  
  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  global.sessionStorage = sessionStorageMock;
  
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  
  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    observe() { return null; }
    disconnect() { return null; }
    unobserve() { return null; }
  };
  
  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() { return null; }
    disconnect() { return null; }
    unobserve() { return null; }
  };
};

// 全局测试清理
export const cleanupTestEnvironment = () => {
  resetApiMocks();
  
  // 清理localStorage
  if (global.localStorage) {
    global.localStorage.clear();
  }
  
  // 清理sessionStorage
  if (global.sessionStorage) {
    global.sessionStorage.clear();
  }
};

// 测试数据清理工具
export class TestDataCleaner {
  private static testData: any[] = [];
  
  static register(data: any) {
    this.testData.push(data);
  }
  
  static async cleanAll() {
    // 在实际实现中，这里会清理数据库中的测试数据
    this.testData = [];
  }
  
  static async cleanByUser(userId: string) {
    // 在实际实现中，这里会清理特定用户的测试数据
    this.testData = this.testData.filter(data => data.userId !== userId);
  }
}

// 测试工具函数
export const testUtils = {
  // 等待异步操作完成
  waitFor: (condition: () => boolean, timeout = 5000): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('等待超时'));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  },
  
  // 模拟延迟
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  // 生成随机字符串
  randomString: (length = 8): string => {
    return Math.random().toString(36).substring(2, length + 2);
  },
  
  // 生成随机邮箱
  randomEmail: (): string => {
    return `test_${testUtils.randomString()}@test.com`;
  }
};

// 导出工厂类供全局使用
export { UserFactory, TaskFactory };

// 导出Mock服务
export { mockApiService };

// 全局类型定义
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUser(): R;
      toBeValidTask(): R;
      toHaveValidTimestamp(): R;
    }
  }
}

// 自定义Jest匹配器
export const customMatchers = {
  toBeValidUser(received: any) {
    const pass = received && 
                 typeof received.id === 'string' &&
                 typeof received.username === 'string' &&
                 typeof received.email === 'string' &&
                 ['student', 'parent'].includes(received.role);
    
    return {
      pass,
      message: () => pass 
        ? `期望 ${received} 不是有效的用户对象`
        : `期望 ${received} 是有效的用户对象`
    };
  },
  
  toBeValidTask(received: any) {
    const pass = received &&
                 typeof received.id === 'string' &&
                 typeof received.title === 'string' &&
                 typeof received.points === 'number' &&
                 ['exercise', 'reading', 'chores', 'learning', 'creativity', 'other'].includes(received.category);
    
    return {
      pass,
      message: () => pass
        ? `期望 ${received} 不是有效的任务对象`
        : `期望 ${received} 是有效的任务对象`
    };
  },
  
  toHaveValidTimestamp(received: any) {
    const pass = received && 
                 (received instanceof Date || 
                  (typeof received === 'string' && !isNaN(Date.parse(received))));
    
    return {
      pass,
      message: () => pass
        ? `期望 ${received} 不是有效的时间戳`
        : `期望 ${received} 是有效的时间戳`
    };
  }
};