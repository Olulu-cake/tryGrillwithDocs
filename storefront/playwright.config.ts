import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  testIgnore: ['**/src/**', '**/node_modules/**', '**/tests/**'],
  timeout: 10000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on',
    actionTimeout: 10000,
  },
  webServer: {
    command: 'npm run start || npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
