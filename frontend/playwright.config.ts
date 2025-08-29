import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置 - 优化 Edge 浏览器和性能
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* 性能优化: 设置超时时间 */
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* 性能优化: 导航和操作超时 */
    navigationTimeout: 20000,
    actionTimeout: 10000,

    /* 性能优化: 禁用某些资源以提升速度 */
    extraHTTPHeaders: {
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    }
  },

  /* Configure projects for major browsers - 优先 Edge */
  projects: [
    {
      name: 'msedge',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'msedge',
        // Edge 浏览器优化配置
        launchOptions: {
          executablePath: process.env.EDGE_EXECUTABLE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-background-timer-throttling',
            '--disable-background-networking',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--window-size=1280,720',
            // 性能优化参数
            '--disable-images',
            '--disable-javascript-harmony-shipping',
            '--disable-background-media-suspend',
            '--disable-ipc-flooding-protection'
          ]
        }
      },
    },

    // 备用浏览器配置（仅在 Edge 不可用时使用）
    {
      name: 'chromium-fallback',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-images',
            '--disable-background-timer-throttling'
          ]
        }
      },
    },

    {
      name: 'firefox-fallback',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit-fallback',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },

  /* 全局设置 - 性能和资源优化 */
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
});