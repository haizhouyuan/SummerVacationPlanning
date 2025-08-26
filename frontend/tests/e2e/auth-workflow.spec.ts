/**
 * Authentication E2E Tests
 * 认证流程端到端测试
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Workflow', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('完整用户注册和登录流程', async ({ page }) => {
    // 1. 访问注册页面
    await page.click('[data-testid="register-link"]');
    await expect(page).toHaveURL(/.*\/register/);
    
    // 2. 填写注册表单
    const uniqueEmail = `test_${Date.now()}@example.com`;
    await page.fill('[data-testid="username-input"]', '测试用户');
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.selectOption('[data-testid="role-select"]', 'student');
    
    // 3. 提交注册
    await page.click('[data-testid="register-button"]');
    
    // 4. 验证注册成功并跳转到仪表板
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('[data-testid="user-welcome"]')).toContainText('测试用户');
    
    // 5. 登出
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL(/.*\/login/);
    
    // 6. 重新登录
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');
    
    // 7. 验证登录成功
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('[data-testid="user-welcome"]')).toContainText('测试用户');
  });

  test('登录表单验证', async ({ page }) => {
    await page.click('[data-testid="login-link"]');
    
    // 测试空表单提交
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('邮箱不能为空');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('密码不能为空');
    
    // 测试无效邮箱格式
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'test123');
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('邮箱格式不正确');
    
    // 测试错误的登录凭据
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="login-error"]')).toContainText('邮箱或密码错误');
  });

  test('注册表单验证', async ({ page }) => {
    await page.click('[data-testid="register-link"]');
    
    // 测试密码强度验证
    await page.fill('[data-testid="username-input"]', '测试');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', '123');
    await page.click('[data-testid="register-button"]');
    
    await expect(page.locator('[data-testid="password-error"]'))
      .toContainText('密码至少8位，包含大小写字母和数字');
    
    // 测试用户名长度验证
    await page.fill('[data-testid="username-input"]', 'a');
    await page.fill('[data-testid="password-input"]', 'ValidPass123!');
    await page.click('[data-testid="register-button"]');
    await expect(page.locator('[data-testid="username-error"]'))
      .toContainText('用户名至少2个字符');
  });

  test('记住登录状态', async ({ page, context }) => {
    // 注册并登录用户
    await page.goto('http://localhost:3000/register');
    const uniqueEmail = `persistent_${Date.now()}@example.com`;
    
    await page.fill('[data-testid="username-input"]', '持久用户');
    await page.fill('[data-testid="email-input"]', uniqueEmail);
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.selectOption('[data-testid="role-select"]', 'student');
    await page.click('[data-testid="register-button"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // 创建新标签页，应该保持登录状态
    const newPage = await context.newPage();
    await newPage.goto('http://localhost:3000');
    
    // 应该直接跳转到仪表板
    await expect(newPage).toHaveURL(/.*\/dashboard/);
    await expect(newPage.locator('[data-testid="user-welcome"]')).toContainText('持久用户');
  });

  test('会话过期处理', async ({ page }) => {
    // 这个测试需要模拟token过期
    // 在实际应用中，可以通过修改token有效期或清除本地存储来测试
    await page.goto('http://localhost:3000/dashboard');
    
    // 清除认证token（模拟过期）
    await page.evaluate(() => {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
    });
    
    // 刷新页面，应该重定向到登录页
    await page.reload();
    await expect(page).toHaveURL(/.*\/login/);
    
    // 尝试访问受保护的页面
    await page.goto('http://localhost:3000/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
  });
});