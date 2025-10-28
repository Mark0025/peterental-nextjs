/**
 * E2E Test: Authentication Flow
 *
 * Tests Clerk authentication including:
 * - Sign in with valid credentials
 * - Sign out
 * - Protected route access
 * - Session persistence
 */

import { test, expect } from '@playwright/test'
import { signIn, signOut } from './helpers/auth-clerk'
import { expect as playwrightExpect } from '@playwright/test'

const testUser = {
  email: process.env.TEST_USER_EMAIL || 'mark@localhousebuyers.net',
  password: process.env.TEST_USER_PASSWORD || ''
}

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/')
  })

  test('should sign in with valid credentials', async ({ page }) => {
    await signIn(page, testUser)

    // Verify we're on the home page and signed in
    await expect(page).toHaveURL('/')
    await verifySignedIn(page)

    // Check that navigation shows user button
    const userButton = page.locator('[data-testid="user-button"], .cl-userButtonTrigger')
    await expect(userButton).toBeVisible()
  })

  test('should access protected routes when authenticated', async ({ page }) => {
    await signIn(page, testUser)

    // Navigate to protected routes
    const protectedRoutes = ['/users', '/dashboard', '/appointments']

    for (const route of protectedRoutes) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      // Verify we're not redirected to sign-in
      expect(page.url()).not.toContain('/sign-in')

      // Verify page loaded successfully
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should sign out successfully', async ({ page }) => {
    await signIn(page, testUser)
    await verifySignedIn(page)

    await signOut(page)
    await verifySignedOut(page)
  })

  test('should redirect to sign-in for protected routes when not authenticated', async ({ page }) => {
    // Try to access protected route without signing in
    await page.goto('/users')

    // Should be redirected to sign-in or see sign-in prompt
    await page.waitForLoadState('networkidle')

    // Check for sign-in UI elements
    const hasSignInButton = await page.locator('text=Sign In').isVisible().catch(() => false)
    const hasClerkForm = await page.locator('input[name="identifier"], input[type="email"]').isVisible().catch(() => false)

    expect(hasSignInButton || hasClerkForm).toBeTruthy()
  })

  test('should persist session across page reloads', async ({ page }) => {
    await signIn(page, testUser)

    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify still signed in
    await verifySignedIn(page)
  })

  test('should display correct user email in navigation', async ({ page }) => {
    await signIn(page, testUser)

    // Wait for user data to load
    await page.waitForTimeout(2000)

    // Check navigation or user menu shows correct email
    const userButton = page.locator('[data-testid="user-button"], .cl-userButtonTrigger')
    await userButton.click()

    // Wait for menu to open
    await page.waitForTimeout(500)

    // Check if email is visible in menu
    await expect(page.locator(`text=${testUser.email}`)).toBeVisible({ timeout: 5000 })
  })
})
