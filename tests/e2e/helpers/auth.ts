/**
 * Authentication Helper for E2E Tests
 *
 * Handles Clerk authentication flow for Playwright tests
 */

import { Page, expect } from '@playwright/test'

export interface TestUser {
  email: string
  password: string
}

/**
 * Sign in to Clerk using email/password
 * Handles the full Clerk OAuth flow
 * Updated to handle already-signed-in state
 */
export async function signIn(page: Page, user: TestUser) {
  console.log(`🔐 Signing in as: ${user.email}`)

  // Navigate to home page (will redirect to sign-in if not authenticated)
  await page.goto('/')

  // Wait for page to load
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000) // Give Clerk time to initialize

  // Check multiple indicators that user is already signed in
  const userButton = page.locator('[data-testid="user-button"], .cl-userButtonTrigger, .cl-userButton')
  const userMenu = page.locator('[data-testid="user-menu"], .cl-userMenu')
  const profileLink = page.locator('a[href="/users"]')

  const isSignedIn = await Promise.race([
    userButton.isVisible().catch(() => false),
    userMenu.isVisible().catch(() => false),
    profileLink.isVisible().catch(() => false),
  ])

  if (isSignedIn) {
    console.log('✅ Already signed in - reusing session')
    return
  }

  console.log('📝 Not signed in - attempting login')

  // Check if we're on a protected page that redirected to Clerk
  const currentUrl = page.url()
  console.log(`Current URL: ${currentUrl}`)

  // Look for "Sign In" button (PeteRental shows an auth gate first)
  console.log('🔍 Looking for Sign In button...')
  const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first()
  const hasSignInButton = await signInButton.isVisible({ timeout: 5000 }).catch(() => false)

  if (hasSignInButton) {
    console.log('🔘 Clicking Sign In button on auth gate')
    await signInButton.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Give Clerk modal time to appear
  } else {
    console.log('⚠️ No Sign In button found, may already be on Clerk form')
  }

  // Wait for Clerk sign-in form with more flexible selectors
  console.log('⏳ Waiting for Clerk sign-in form...')
  try {
    await page.waitForSelector(
      'input[name="identifier"], input[type="email"], input[autocomplete="username"]',
      { timeout: 15000 } // Increased timeout for Clerk to load
    )
    console.log('✅ Found Clerk sign-in form')
  } catch (error) {
    console.log('❌ Could not find sign-in form')
    console.log(`Page URL: ${page.url()}`)
    console.log('Taking debug screenshot...')
    await page.screenshot({ path: 'debug-signin-form-not-found.png', fullPage: true })
    throw new Error(`Could not find Clerk sign-in form. Page is at: ${page.url()}`)
  }

  // Enter email
  console.log('📧 Entering email')
  const emailInput = page.locator('input[name="identifier"], input[type="email"], input[autocomplete="username"]').first()
  await emailInput.fill(user.email)
  await page.waitForTimeout(500)

  // Click continue/next button
  console.log('➡️ Clicking Continue')
  const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next"), button[type="submit"]').first()
  await continueButton.click()
  await page.waitForTimeout(1000)

  // Wait for password field
  console.log('🔑 Waiting for password field')
  await page.waitForSelector('input[name="password"], input[type="password"]', { timeout: 10000 })

  // Enter password
  console.log('🔒 Entering password')
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first()
  await passwordInput.fill(user.password)
  await page.waitForTimeout(500)

  // Click sign in button
  console.log('✅ Submitting credentials')
  const submitButton = page.locator('button:has-text("Continue"), button:has-text("Sign in"), button[type="submit"]').first()
  await submitButton.click()

  // Wait for successful sign-in (redirect to home page)
  console.log('⏳ Waiting for sign-in to complete')
  await page.waitForURL('/', { timeout: 15000 }).catch(() => {
    console.log('⚠️ Did not redirect to home, checking for auth')
  })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // Verify sign-in success by checking for user button
  const isNowSignedIn = await userButton.isVisible().catch(() => false)
  if (!isNowSignedIn) {
    console.log('❌ Sign-in verification failed')
    await page.screenshot({ path: 'debug-signin-verification-failed.png', fullPage: true })
    throw new Error('Sign-in completed but user button not found')
  }

  console.log('✅ Sign-in successful')
}

/**
 * Sign out from Clerk
 */
export async function signOut(page: Page) {
  console.log('🚪 Signing out...')

  // Click user button to open menu
  const userButton = page.locator('[data-testid="user-button"], .cl-userButtonTrigger').first()
  await userButton.click()

  // Wait for menu to open
  await page.waitForTimeout(500)

  // Click sign out
  const signOutButton = page.locator('text=Sign out, text=Logout').first()
  await signOutButton.click()

  // Wait for redirect to sign-in page
  await page.waitForLoadState('networkidle')

  console.log('✅ Signed out successfully')
}

/**
 * Verify user is signed in
 */
export async function verifySignedIn(page: Page) {
  const userButton = page.locator('[data-testid="user-button"], .cl-userButtonTrigger')
  await expect(userButton).toBeVisible({ timeout: 5000 })
}

/**
 * Verify user is signed out
 */
export async function verifySignedOut(page: Page) {
  const signInButton = page.locator('text=Sign In').first()
  await expect(signInButton).toBeVisible({ timeout: 5000 })
}
