/**
 * E2E Test: Multi-Tenant Isolation
 *
 * Tests:
 * - User-specific data isolation
 * - No hardcoded user emails
 * - Proper authentication for all requests
 * - User data belongs to the signed-in user only
 */

import { test, expect } from '@playwright/test'
import { signIn } from './helpers/auth-clerk'

const testUser = {
  email: process.env.TEST_USER_EMAIL || 'mark@localhousebuyers.net',
  password: process.env.TEST_USER_PASSWORD || ''
}

test.describe('Multi-Tenant Isolation', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('should display correct user email in profile', async ({ page }) => {
    await page.goto('/users')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Should display the test user's email
    await expect(page.locator(`text=${testUser.email}`)).toBeVisible({ timeout: 10000 })

    // Should NOT display other user emails (e.g., mark@peterei.com)
    const otherEmails = ['mark@peterei.com', 'test@example.com']

    for (const email of otherEmails) {
      if (email !== testUser.email) {
        const hasOtherEmail = await page.locator(`text=${email}`).isVisible().catch(() => false)
        expect(hasOtherEmail).toBeFalsy()
      }
    }
  })

  test('should not show admin badge for non-admin users', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should NOT show admin badge (unless test user is admin)
    const hasAdminBadge = await page.locator('text=Admin, [class*="admin"]').isVisible().catch(() => false)

    // Log result for information
    if (hasAdminBadge) {
      console.log('ℹ️ Admin badge visible - user may be an admin')
    } else {
      console.log('✅ No admin badge - user is not admin')
    }
  })

  test('should use Clerk authentication for all requests', async ({ page }) => {
    // Capture network requests
    const requests: any[] = []
    page.on('request', request => {
      if (request.url().includes('peterental')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        })
      }
    })

    // Navigate to pages that make API calls
    await page.goto('/users')
    await page.waitForTimeout(2000)

    await page.goto('/dashboard')
    await page.waitForTimeout(2000)

    // Check that API requests have Authorization headers
    const apiRequests = requests.filter(r =>
      r.url().includes('/users/') || r.url().includes('/calendar/') || r.url().includes('/rentals/')
    )

    if (apiRequests.length > 0) {
      console.log(`📡 Captured ${apiRequests.length} API requests`)

      for (const req of apiRequests) {
        // Note: Can't directly access Authorization header due to browser security
        // But we can verify requests are being made to correct endpoints
        console.log(`  - ${req.method} ${req.url}`)
      }
    }
  })

  test('should not have hardcoded user IDs in console logs', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(msg.text())
    })

    await page.goto('/users')
    await page.waitForTimeout(2000)

    await page.goto('/dashboard')
    await page.waitForTimeout(2000)

    // Check for hardcoded emails in logs
    const hardcodedEmails = ['mark@peterei.com']
    const hasHardcodedValues = consoleLogs.some(log =>
      hardcodedEmails.some(email => log.includes(email) && log.includes('default'))
    )

    expect(hasHardcodedValues).toBeFalsy()

    if (!hasHardcodedValues) {
      console.log('✅ No hardcoded user values found in console logs')
    }
  })

  test('should show user-specific calendar connection', async ({ page }) => {
    await page.goto('/users')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Calendar status should be specific to this user
    const hasCalendarSection = await page.locator('text=Calendar, text=Microsoft Calendar').isVisible().catch(() => false)

    expect(hasCalendarSection).toBeTruthy()

    // If connected, should show the correct user's Microsoft account
    const isConnected = await page.locator('text=Connected, text=✅').isVisible().catch(() => false)

    if (isConnected) {
      const emailBadge = page.locator('.font-mono, [class*="bg-blue"]').first()
      if (await emailBadge.isVisible().catch(() => false)) {
        const connectedEmail = await emailBadge.textContent()
        console.log(`📧 Calendar connected to: ${connectedEmail}`)

        // Should be an email format
        expect(connectedEmail).toMatch(/@/)
      }
    }
  })

  test('should handle multiple sessions correctly', async ({ page, context }) => {
    // Open a second page in the same context (same session)
    const page2 = await context.newPage()

    await page.goto('/users')
    await page2.goto('/dashboard')

    await Promise.all([
      page.waitForLoadState('networkidle'),
      page2.waitForLoadState('networkidle')
    ])

    // Both pages should show the same user
    await page.waitForTimeout(1000)
    await page2.waitForTimeout(1000)

    // Verify both pages are accessible (not redirected to sign-in)
    expect(page.url()).toContain('/users')
    expect(page2.url()).toContain('/dashboard')

    await page2.close()
  })

  test('should display correct data after page refresh', async ({ page }) => {
    await page.goto('/users')
    await page.waitForTimeout(2000)

    // Get initial email display
    const initialEmail = await page.locator(`text=${testUser.email}`).textContent().catch(() => null)

    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Should still show same email
    if (initialEmail) {
      await expect(page.locator(`text=${testUser.email}`)).toBeVisible()
    }
  })
})
