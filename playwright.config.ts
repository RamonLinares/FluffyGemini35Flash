import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Mobile Chrome (Emulated)',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: 'npx vite --port 5199',
    url: 'http://localhost:5199',
    reuseExistingServer: false,
    timeout: 20 * 1000,
  },
});
