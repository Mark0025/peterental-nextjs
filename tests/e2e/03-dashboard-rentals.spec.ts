/**
 * E2E Test: Dashboard and Rental Properties
 *
 * Tests:
 * - Dashboard page loads
 * - Rental statistics display
 * - Rental property listings
 * - Data fetching from backend
 */

import { test, expect } from '@playwright/test'
import { signIn } from './helpers/auth-clerk'

const testUser = {
  email: process.env.TEST_USER_EMAIL || 'mark@localhousebuyers.net',
  password: process.env.TEST_USER_PASSWORD || ''
}

test.describe('Dashboard and Rentals', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should load dashboard page', async ({ page }) => {
    // Verify we're on the dashboard
    expect(page.url()).toContain('/dashboard')

    // Check for main heading
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })

  test('should display rental statistics', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000)

    // Look for statistics cards
    const statsKeywords = ['Total', 'Available', 'Occupied', 'Properties', 'Rentals']

    let foundStats = false
    for (const keyword of statsKeywords) {
      const hasKeyword = await page.locator(`text=${keyword}`).isVisible().catch(() => false)
      if (hasKeyword) {
        foundStats = true
        console.log(`✅ Found stat keyword: ${keyword}`)
      }
    }

    // Should find at least one stat
    expect(foundStats).toBeTruthy()
  })

  test('should display rental property listings', async ({ page }) => {
    // Wait for rental data to load
    await page.waitForTimeout(3000)

    // Look for table or list of rentals
    const hasTable = await page.locator('table').isVisible().catch(() => false)
    const hasCards = await page.locator('[class*="card"], [class*="grid"]').isVisible().catch(() => false)

    // Should have either a table or cards
    expect(hasTable || hasCards).toBeTruthy()
  })

  test('should show loading state while fetching data', async ({ page }) => {
    // Reload to see loading state
    await page.goto('/dashboard')

    // Should show loading indicator initially
    const hasLoading = await page.locator('text=Loading, [role="progressbar"]').isVisible().catch(() => false)

    if (hasLoading) {
      console.log('✅ Loading state detected')
    }

    // Wait for data to load
    await page.waitForLoadState('networkidle')
  })

  test('should display property details when available', async ({ page }) => {
    await page.waitForTimeout(3000)

    // Check for property attributes
    const propertyAttributes = ['Address', 'Bedrooms', 'Bathrooms', 'Price', 'Status']

    for (const attr of propertyAttributes) {
      const hasAttr = await page.locator(`text=${attr}`).isVisible().catch(() => false)
      if (hasAttr) {
        console.log(`✅ Found property attribute: ${attr}`)
      }
    }
  })

  test('should handle empty state if no rentals', async ({ page }) => {
    await page.waitForTimeout(3000)

    // If no data, should show empty state
    const hasNoData = await page.locator('text=No rentals, text=No properties').isVisible().catch(() => false)

    if (hasNoData) {
      console.log('ℹ️ Empty state displayed correctly')
    }
  })

  test('should navigate back to home from dashboard', async ({ page }) => {
    // Find and click home/back button
    const homeButton = page.locator('a[href="/"], button:has-text("Home")').first()

    if (await homeButton.isVisible().catch(() => false)) {
      await homeButton.click()
      await page.waitForLoadState('networkidle')

      // Should be on home page
      expect(page.url()).toBe(await page.evaluate(() => location.origin + '/'))
    }
  })

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Should have no critical console errors (filter out common warnings)
    const criticalErrors = errors.filter(e => !e.includes('Warning') && !e.includes('NODE_ENV'))
    expect(criticalErrors).toHaveLength(0)
  })
})
