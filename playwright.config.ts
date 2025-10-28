import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

/**
 * Playwright Configuration for PeteRental E2E Tests
 *
 * Tests the complete user journey including:
 * - Clerk authentication
 * - Calendar connect/disconnect
 * - Multi-tenant isolation
 * - Dashboard and rental data
 * - User profile management
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Global setup file for Clerk testing
  globalSetup: require.resolve('./tests/global-setup.ts'),

  // Maximum time one test can run
  timeout: 90 * 1000,

  // Test configuration
  fullyParallel: false, // Run tests sequentially to avoid state conflicts
  forbidOnly: !!process.env.CI, // Fail CI if test.only is left in
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: 1, // Run one test at a time

  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  use: {
    // Base URL for tests
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Browser context options
    viewport: { width: 1280, height: 720 },

    // Don't reuse authentication state between tests
    storageState: undefined,

    // Slow down actions for debugging (ms)
    // actionTimeout: 0,
    // slowMo: 100, // Uncomment to slow down for debugging
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run local dev server before tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
