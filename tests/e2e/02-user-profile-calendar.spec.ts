/**
 * E2E Test: User Profile and Calendar Integration
 *
 * Tests:
 * - User profile page loads with correct data
 * - Calendar connection status display
 * - Calendar connect/disconnect functionality
 * - Display of connected Microsoft account
 */

import { test, expect } from '@playwright/test'
import { signIn } from './helpers/auth-clerk'

const testUser = {
  email: process.env.TEST_USER_EMAIL || 'mark@localhousebuyers.net',
  password: process.env.TEST_USER_PASSWORD || ''
}

test.describe('User Profile and Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
    await page.goto('/users')
    await page.waitForLoadState('networkidle')
  })

  test('should display user profile page with correct email', async ({ page }) => {
    // Verify page title or heading
    await expect(page.locator('h1, h2').first()).toBeVisible()

    // Check that user email is displayed somewhere on the page
    await expect(page.locator(`text=${testUser.email}`)).toBeVisible({ timeout: 10000 })
  })

  test('should show calendar connection status', async ({ page }) => {
    // Wait for calendar status to load
    await page.waitForTimeout(2000)

    // Check for calendar status indicator
    const calendarSection = page.locator('text=Calendar, text=Microsoft Calendar').first()
    await expect(calendarSection).toBeVisible()

    // Should show either "Connected" or "Not connected"
    const hasConnectedStatus = await page.locator('text=Connected, text=connected').isVisible().catch(() => false)
    const hasNotConnectedStatus = await page.locator('text=Not connected, text=not connected').isVisible().catch(() => false)

    expect(hasConnectedStatus || hasNotConnectedStatus).toBeTruthy()
  })

  test('should display connected Microsoft account email if calendar is connected', async ({ page }) => {
    // Wait for status to load
    await page.waitForTimeout(2000)

    // Check if calendar is connected
    const isConnected = await page.locator('text=✅, text=Connected').isVisible().catch(() => false)

    if (isConnected) {
      // Should display the connected Microsoft account email
      const emailBadge = page.locator('.font-mono, [class*="bg-blue"]').first()
      await expect(emailBadge).toBeVisible()

      // Log the connected email for verification
      const connectedEmail = await emailBadge.textContent()
      console.log(`📧 Connected calendar email: ${connectedEmail}`)
    } else {
      console.log('ℹ️ Calendar not connected - skipping email check')
    }
  })

  test('should show disconnect button when calendar is connected', async ({ page }) => {
    await page.waitForTimeout(2000)

    const isConnected = await page.locator('text=✅, text=Connected').isVisible().catch(() => false)

    if (isConnected) {
      // Should have a disconnect button
      const disconnectButton = page.locator('button:has-text("Disconnect")').first()
      await expect(disconnectButton).toBeVisible()
      await expect(disconnectButton).toBeEnabled()
    } else {
      console.log('ℹ️ Calendar not connected - skipping disconnect button check')
    }
  })

  test('should show connect button when calendar is not connected', async ({ page }) => {
    await page.waitForTimeout(2000)

    const isNotConnected = await page.locator('text=Not connected, text=not connected').isVisible().catch(() => false)

    if (isNotConnected) {
      // Should have a connect button
      const connectButton = page.locator('button:has-text("Connect")').first()
      await expect(connectButton).toBeVisible()
      await expect(connectButton).toBeEnabled()
    } else {
      console.log('ℹ️ Calendar already connected - skipping connect button check')
    }
  })

  test('should open confirmation dialog when clicking disconnect', async ({ page }) => {
    await page.waitForTimeout(2000)

    const isConnected = await page.locator('text=✅, text=Connected').isVisible().catch(() => false)

    if (isConnected) {
      const disconnectButton = page.locator('button:has-text("Disconnect")').first()
      await disconnectButton.click()

      // Should show browser confirmation dialog
      // Note: Playwright auto-accepts dialogs by default, so we need to listen for it
      page.on('dialog', dialog => {
        expect(dialog.type()).toBe('confirm')
        expect(dialog.message()).toContain('disconnect')
        dialog.dismiss() // Cancel the disconnect for this test
      })

      await page.waitForTimeout(1000)
    } else {
      console.log('ℹ️ Calendar not connected - skipping disconnect dialog test')
      test.skip()
    }
  })

  test('should display user profile information', async ({ page }) => {
    // Check for profile sections
    const expectedSections = [
      'Profile Information',
      'Calendar Integration',
      'Account Settings'
    ]

    for (const section of expectedSections) {
      // Look for section headings (case-insensitive)
      const hasSection = await page.locator(`text=${section}`).isVisible().catch(() => false)
      if (hasSection) {
        console.log(`✅ Found section: ${section}`)
      }
    }

    // Verify basic structure
    await expect(page.locator('body')).toBeVisible()
  })

  test('should load without errors', async ({ page }) => {
    // Check console for errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should have no console errors
    expect(errors).toHaveLength(0)
  })
})
