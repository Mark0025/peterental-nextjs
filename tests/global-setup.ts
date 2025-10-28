/**
 * Global Setup for Playwright Tests
 *
 * Initializes Clerk testing environment
 */

import { clerkSetup } from '@clerk/testing/playwright'

export default async function globalSetup() {
  console.log('🔧 Setting up Clerk for testing...')
  await clerkSetup()
  console.log('✅ Clerk setup complete')
}
