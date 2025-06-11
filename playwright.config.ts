// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
  testDir: 'tests', // можешь изменить
})