/**
 * Clerk-Based Authentication Helper for E2E Tests
 *
 * Uses @clerk/testing for programmatic authentication
 * This bypasses all UI interactions and uses Clerk's official testing API
 */

import { Page } from '@playwright/test'
import { clerk } from '@clerk/testing/playwright'

export interface TestUser {
  email: string
  password: string
}

/**
 * Sign in using Clerk's testing API
 * No UI interaction - uses programmatic authentication
 */
export async function signIn(page: Page, user: TestUser) {
  console.log(`🔐 Signing in programmatically as: ${user.email}`)

  // Navigate to an unprotected page that loads Clerk
  await page.goto('/')
  console.log('📍 Navigated to homepage')

  // Wait for Clerk to initialize
  await clerk.loaded({ page })
  console.log('✅ Clerk loaded')

  // NOTE: Clerk testing API requires email/password auth to be enabled
  // Since you're using Google OAuth, we need to sign in by email directly
  // This requires CLERK_SECRET_KEY to be set
  try {
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'email_code', // Alternative: use email code strategy
        identifier: user.email,
      }
    })
    console.log('✅ Signed in successfully via Clerk API')
  } catch (error) {
    console.error('❌ Clerk sign-in failed:', error)
    throw error
  }
}

/**
 * Sign out using Clerk's testing API
 */
export async function signOut(page: Page) {
  console.log('🚪 Signing out via Clerk API...')

  try {
    await clerk.signOut({ page })
    console.log('✅ Signed out successfully')
  } catch (error) {
    console.error('❌ Sign-out failed:', error)
    throw error
  }
}

/**
 * Verify Clerk is loaded and ready
 */
export async function verifyClerkLoaded(page: Page) {
  await clerk.loaded({ page })
  console.log('✅ Clerk verified as loaded')
}
