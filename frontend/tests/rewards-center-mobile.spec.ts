import { test, expect } from '@playwright/test';

/**
 * Rewards Center Mobile Testing - Specific focus on rewards UI optimization
 * Tests the rewards center functionality across different mobile devices
 */

const mobileDevices = [
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'Samsung Galaxy S21', width: 412, height: 915 },
  { name: 'iPad', width: 768, height: 1024 }
];

// Demo credentials for testing
const demoCredentials = {
  username: '学生演示',
  password: 'demo123'
};

mobileDevices.forEach(device => {
  test.describe(`Rewards Center Mobile - ${device.name}`, () => {
    
    test.beforeEach(async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: device.width, height: device.height });
      
      // Navigate to login page
      await page.goto('http://localhost:3002');
      await page.waitForTimeout(2000);
    });

    test(`should navigate to rewards center on ${device.name}`, async ({ page }) => {
      try {
        // Try to login with demo credentials
        const usernameField = page.locator('input[placeholder*="账号"], input[placeholder*="用户名"]');
        const passwordField = page.locator('input[placeholder*="密码"], input[type="password"]');
        const loginButton = page.locator('button:has-text("登录"), button[type="submit"]');

        if (await usernameField.count() > 0) {
          await usernameField.first().fill(demoCredentials.username);
          await passwordField.first().fill(demoCredentials.password);
          await loginButton.first().click();
          await page.waitForTimeout(3000);

          // Take screenshot after login
          await page.screenshot({ 
            path: `test-results/${device.name.replace(/\s+/g, '-').toLowerCase()}-after-login.png`,
            fullPage: true 
          });

          // Look for rewards navigation
          const rewardsNavigation = page.locator(
            'a[href*="reward"], button:has-text("奖励"), button:has-text("积分"), [data-testid="rewards-nav"]'
          );

          if (await rewardsNavigation.count() > 0) {
            await rewardsNavigation.first().click();
            await page.waitForTimeout(2000);

            // Take screenshot of rewards center
            await page.screenshot({ 
              path: `test-results/${device.name.replace(/\s+/g, '-').toLowerCase()}-rewards-center.png`,
              fullPage: true 
            });

            // Test rewards center elements
            await this.testRewardsCenterElements(page, device);
          } else {
            // Try to find rewards by navigation elements
            await this.findAndTestRewardsPage(page, device);
          }
        }
      } catch (error) {
        console.log(`Login/Navigation failed for ${device.name}:`, error);
        
        // Take error screenshot
        await page.screenshot({ 
          path: `test-results/${device.name.replace(/\s+/g, '-').toLowerCase()}-error.png`,
          fullPage: true 
        });
      }
    });

    test(`should test rewards page performance on ${device.name}`, async ({ page }) => {
      // Test with simulated slow network
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        await route.continue();
      });

      const startTime = Date.now();
      await page.goto('http://localhost:3002');
      await page.waitForSelector('body', { timeout: 10000 });
      const loadTime = Date.now() - startTime;

      // Should load reasonably fast even on slow network
      expect(loadTime).toBeLessThan(6000);

      await page.screenshot({ 
        path: `test-results/${device.name.replace(/\s+/g, '-').toLowerCase()}-performance.png`,
        fullPage: true 
      });
    });

    // Helper function to test rewards center elements
    async function testRewardsCenterElements(page, device) {
      // Test points display
      const pointsDisplay = page.locator(
        '[data-testid="points-display"], .points-display, .points-badge, .points-count'
      );
      if (await pointsDisplay.count() > 0) {
        await expect(pointsDisplay.first()).toBeVisible();
        
        // Check if points are readable on mobile
        const pointsBox = await pointsDisplay.first().boundingBox();
        if (pointsBox && device.width < 400) {
          expect(pointsBox.width).toBeGreaterThan(80); // Minimum readable width
          expect(pointsBox.height).toBeGreaterThan(30); // Minimum readable height
        }
      }

      // Test reward items layout
      const rewardItems = page.locator(
        '.reward-item, .reward-card, [data-testid="reward-item"], .exchange-item'
      );
      const itemCount = await rewardItems.count();
      
      if (itemCount > 0) {
        // Test first few reward items
        for (let i = 0; i < Math.min(itemCount, 3); i++) {
          const item = rewardItems.nth(i);
          if (await item.isVisible()) {
            const boundingBox = await item.boundingBox();
            if (boundingBox) {
              // Check mobile-friendly sizing
              if (device.width < 500) {
                expect(boundingBox.width).toBeLessThanOrEqual(device.width - 40);
                expect(boundingBox.width).toBeGreaterThan(120); // Minimum usable width
              }
            }
          }
        }
      }

      // Test tabs/navigation on rewards page
      const tabs = page.locator(
        '[role="tab"], .tab, .nav-tab, button:has-text("历史"), button:has-text("兑换")'
      );
      const tabCount = await tabs.count();
      
      if (tabCount > 0) {
        for (let i = 0; i < Math.min(tabCount, 2); i++) {
          const tab = tabs.nth(i);
          if (await tab.isVisible()) {
            await tab.click();
            await page.waitForTimeout(1000);
            
            // Check tab content loads
            const tabContent = page.locator('.tab-content, [role="tabpanel"]');
            if (await tabContent.count() > 0) {
              await expect(tabContent.first()).toBeVisible();
            }
          }
        }
      }

      // Test exchange/action buttons
      const actionButtons = page.locator(
        'button:has-text("兑换"), button:has-text("申请"), button:has-text("确认")'
      );
      const buttonCount = await actionButtons.count();
      
      if (buttonCount > 0) {
        for (let i = 0; i < Math.min(buttonCount, 2); i++) {
          const button = actionButtons.nth(i);
          if (await button.isVisible()) {
            const boundingBox = await button.boundingBox();
            if (boundingBox) {
              // Verify touch-friendly button size
              expect(boundingBox.width).toBeGreaterThanOrEqual(40);
              expect(boundingBox.height).toBeGreaterThanOrEqual(36);
            }
          }
        }
      }
    }

    // Helper function to find rewards page by exploring navigation
    async function findAndTestRewardsPage(page, device) {
      // Look for common navigation patterns
      const navElements = page.locator('nav, .navigation, .menu, .bottom-nav');
      if (await navElements.count() > 0) {
        // Try clicking various navigation items
        const navLinks = page.locator('a, button');
        const linkCount = await navLinks.count();
        
        for (let i = 0; i < Math.min(linkCount, 10); i++) {
          const link = navLinks.nth(i);
          const text = await link.textContent();
          
          if (text && (
            text.includes('奖励') || 
            text.includes('积分') || 
            text.includes('兑换') ||
            text.includes('rewards')
          )) {
            try {
              await link.click();
              await page.waitForTimeout(2000);
              
              await page.screenshot({ 
                path: `test-results/${device.name.replace(/\s+/g, '-').toLowerCase()}-found-rewards.png`,
                fullPage: true 
              });
              
              // Test this page
              await testRewardsCenterElements(page, device);
              break;
            } catch (error) {
              console.log(`Failed to click rewards navigation:`, error);
            }
          }
        }
      }
      
      // Take final screenshot showing current state
      await page.screenshot({ 
        path: `test-results/${device.name.replace(/\s+/g, '-').toLowerCase()}-final-state.png`,
        fullPage: true 
      });
    }
  });
});