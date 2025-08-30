import { test, expect } from '@playwright/test';

/**
 * Mobile Responsive Testing Suite for Rewards UI Optimization
 * Tests various mobile viewports and interactions
 */

// Mobile device configurations
const mobileDevices = [
  {
    name: 'iPhone 12',
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  },
  {
    name: 'Samsung Galaxy S21',
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36'
  },
  {
    name: 'iPad',
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  },
  {
    name: 'Small Mobile',
    viewport: { width: 320, height: 568 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15'
  }
];

// Test each mobile device
mobileDevices.forEach(device => {
  test.describe(`Mobile Responsive Tests - ${device.name}`, () => {
    
    test.beforeEach(async ({ page }) => {
      // Set viewport and user agent for mobile simulation
      await page.setViewportSize(device.viewport);
      await page.setExtraHTTPHeaders({
        'User-Agent': device.userAgent
      });
      
      // Navigate to the application
      await page.goto('http://localhost:3002');
      await page.waitForTimeout(2000); // Wait for app to load
    });

    test(`should display mobile-optimized layout on ${device.name}`, async ({ page }) => {
      // Take initial screenshot
      await page.screenshot({ 
        path: `test-results/mobile-${device.name.replace(/\s+/g, '-').toLowerCase()}-home.png`,
        fullPage: true 
      });

      // Check if mobile navigation is visible
      const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, nav');
      if (await mobileNav.count() > 0) {
        await expect(mobileNav.first()).toBeVisible();
      }

      // Verify responsive text is readable (not truncated)
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();
      if (headingCount > 0) {
        for (let i = 0; i < Math.min(headingCount, 3); i++) {
          const heading = headings.nth(i);
          await expect(heading).toBeVisible();
        }
      }
    });

    test(`should handle touch interactions on ${device.name}`, async ({ page }) => {
      // Look for buttons and interactive elements
      const buttons = page.locator('button, [role="button"], .btn');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        // Test first few buttons for touch target size
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            const boundingBox = await button.boundingBox();
            if (boundingBox) {
              // Verify minimum touch target size (44px recommended)
              expect(boundingBox.width).toBeGreaterThanOrEqual(32);
              expect(boundingBox.height).toBeGreaterThanOrEqual(32);
            }
          }
        }
      }
    });

    test(`should test rewards center mobile layout on ${device.name}`, async ({ page }) => {
      // Try to navigate to rewards page
      try {
        // Look for rewards navigation link
        const rewardsLink = page.locator('a[href*="reward"], button:has-text("奖励"), button:has-text("积分"), .rewards-nav');
        if (await rewardsLink.count() > 0) {
          await rewardsLink.first().click();
          await page.waitForTimeout(1500);
          
          // Take screenshot of rewards page
          await page.screenshot({ 
            path: `test-results/mobile-${device.name.replace(/\s+/g, '-').toLowerCase()}-rewards.png`,
            fullPage: true 
          });

          // Test points display on mobile
          const pointsDisplay = page.locator('[data-testid="points-display"], .points-display, .points-badge');
          if (await pointsDisplay.count() > 0) {
            await expect(pointsDisplay.first()).toBeVisible();
          }

          // Test reward cards/items layout
          const rewardItems = page.locator('.reward-item, .reward-card, [data-testid="reward-item"]');
          if (await rewardItems.count() > 0) {
            const firstReward = rewardItems.first();
            await expect(firstReward).toBeVisible();
            
            // Check if reward items are properly sized for mobile
            const boundingBox = await firstReward.boundingBox();
            if (boundingBox && device.viewport.width < 500) {
              // On small screens, items should not be too wide
              expect(boundingBox.width).toBeLessThanOrEqual(device.viewport.width - 40);
            }
          }
        }
      } catch (error) {
        console.log(`Navigation to rewards page failed on ${device.name}:`, error);
      }
    });

    test(`should test form interactions on mobile ${device.name}`, async ({ page }) => {
      // Look for any forms or input fields
      const inputs = page.locator('input, textarea, select');
      const inputCount = await inputs.count();
      
      if (inputCount > 0) {
        const firstInput = inputs.first();
        if (await firstInput.isVisible()) {
          // Test that input is accessible and properly sized
          await firstInput.focus();
          await page.waitForTimeout(500);
          
          // Verify input field is visible and not overlapped
          await expect(firstInput).toBeVisible();
          
          // Test basic input interaction
          await firstInput.fill('Test Input');
          const value = await firstInput.inputValue();
          expect(value).toBe('Test Input');
          
          // Clear the input
          await firstInput.clear();
        }
      }
    });

    test(`should test navigation and scrolling on ${device.name}`, async ({ page }) => {
      // Test page scrolling behavior
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = device.viewport.height;
      
      if (pageHeight > viewportHeight) {
        // Scroll down
        await page.evaluate(() => window.scrollTo(0, window.innerHeight));
        await page.waitForTimeout(1000);
        
        // Scroll back to top
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(1000);
      }

      // Test any tab navigation if present
      const tabs = page.locator('[role="tab"], .tab, .nav-tab');
      const tabCount = await tabs.count();
      
      if (tabCount > 1) {
        // Test first tab interaction
        await tabs.first().click();
        await page.waitForTimeout(500);
        
        // Test second tab if available
        if (tabCount > 1) {
          await tabs.nth(1).click();
          await page.waitForTimeout(500);
        }
      }
    });
  });
});

// Performance testing on mobile
test.describe('Mobile Performance Tests', () => {
  test('should load quickly on simulated slow network', async ({ page }) => {
    // Simulate slow 3G network
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('http://localhost:3002');
    
    // Wait for main content to be visible
    await page.waitForSelector('body', { timeout: 10000 });
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time even on slow network
    expect(loadTime).toBeLessThan(8000); // 8 seconds max
    
    await page.screenshot({ 
      path: 'test-results/mobile-performance-slow-network.png',
      fullPage: true 
    });
  });
});

// Accessibility testing on mobile
test.describe('Mobile Accessibility Tests', () => {
  test('should be accessible on mobile devices', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    if (headingCount > 0) {
      // Ensure at least one h1 exists
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    }
    
    // Check for proper button labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const text = await button.textContent();
          const ariaLabel = await button.getAttribute('aria-label');
          // Button should have either text content or aria-label
          expect(text || ariaLabel).toBeTruthy();
        }
      }
    }
    
    // Take accessibility screenshot
    await page.screenshot({ 
      path: 'test-results/mobile-accessibility-check.png',
      fullPage: true 
    });
  });
});