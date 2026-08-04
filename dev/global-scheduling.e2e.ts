import { expect, test } from '@playwright/test'

import { devUser } from './helpers/credentials.js'

test('editing a scheduled global rebuilds form state without a server error', async ({ page }) => {
  await page.goto('/admin/login')
  await page.fill('#field-email', devUser.email)
  await page.fill('#field-password', devUser.password)
  await page.click('.form-submit button')
  await expect(page).toHaveTitle(/Dashboard/)

  await page.goto('/admin/globals/home')
  await expect(page.locator('#field-title')).toBeVisible()

  const formStateResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())

    return response.request().method() === 'POST' && url.pathname === '/admin/globals/home'
  })

  await page.fill('#field-title', `Edited home ${Date.now()}`)

  const response = await formStateResponse
  expect(response.status()).toBeLessThan(400)
  await expect(response.text()).resolves.not.toContain('Invalid value type')
})
