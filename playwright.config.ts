import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { DEFAULT_BASE_URL } from './support/constants/app';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true, // tests are independent (unique emails) so they can run in parallel
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: process.env.CI ? 'never' : 'always' }]],
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.BASE_URL ?? DEFAULT_BASE_URL,
    channel: 'chrome', // real Chrome, not bundled Chromium
    locale: 'en-US',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    launchOptions: {
      ignoreDefaultArgs: ['--enable-automation'], // hide navigator.webdriver so canary is less likely to treat us as a bot
      args: ['--disable-blink-features=AutomationControlled'],
    },
    trace: 'retain-on-failure', // keep the trace only when a test fails — attached in the HTML report
    screenshot: 'only-on-failure',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },
  projects: [
    {
      name: 'chromium',
    },
  ],
});
