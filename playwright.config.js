// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: process.env.BASE_URL || 'https://wagserv.net',
    reducedMotion: 'reduce',          // freezes the cursor blink + modal animation
    ignoreHTTPSErrors: false,
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
