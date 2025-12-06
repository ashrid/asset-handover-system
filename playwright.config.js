import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],

  // Shared settings
  use: {
    // Base URL
    baseURL: 'http://localhost:3000',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on retry
    video: 'on-first-retry'
  },

  // Projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] }
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] }
    // },
    // Mobile
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] }
    // }
  ],

  // Web server configuration
  webServer: [
    {
      command: 'npm run dev:server',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30000
    },
    {
      command: 'npm run dev:client',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 30000
    }
  ],

  // Global timeout
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 5000
  }
});
