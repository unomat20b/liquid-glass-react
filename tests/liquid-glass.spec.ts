import { test, expect } from '@playwright/test'

test('страница открывается', async ({ page }) => {
  await page.goto('http://localhost:3000') // или другой адрес демки
  await expect(page).toHaveTitle(/Liquid Glass/i)
})