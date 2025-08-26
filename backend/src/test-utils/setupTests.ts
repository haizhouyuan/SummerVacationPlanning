/**
 * Jest Setup for Backend Tests
 * 后端测试Jest设置
 */

import 'jest';

// 全局测试设置
beforeAll(() => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.MONGODB_URI = 'memory://test';
  
  // 抑制console.log输出以保持测试输出清洁
  if (process.env.SUPPRESS_LOGS !== 'false') {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  }
});

afterAll(() => {
  // 恢复console输出
  if (process.env.SUPPRESS_LOGS !== 'false') {
    const logSpy = jest.spyOn(console, 'log');
    const infoSpy = jest.spyOn(console, 'info');
    const warnSpy = jest.spyOn(console, 'warn');
    
    if (logSpy.mockRestore) logSpy.mockRestore();
    if (infoSpy.mockRestore) infoSpy.mockRestore();
    if (warnSpy.mockRestore) warnSpy.mockRestore();
  }
});

// 扩展Jest匹配器
expect.extend({
  toBeValidUser(received) {
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
  
  toBeValidTask(received) {
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
  }
});

// 全局类型扩展
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUser(): R;
      toBeValidTask(): R;
    }
  }
}