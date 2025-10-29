/**
 * User Synchronization between Clerk and Database
 * 
 * This handles:
 * - Creating users in your database when they sign up with Clerk
 * - Mapping Clerk user IDs to your internal UUID system
 * - Syncing user data between Clerk and your backend
 */

import { auth } from '@clerk/nextjs/server'

export interface DatabaseUser {
  id: string // Your internal UUID
  clerk_user_id: string // Clerk's user ID
  email: string
  first_name?: string | null
  last_name?: string | null
  created_at: string
  updated_at: string
  microsoft_calendar_connected: boolean
  microsoft_calendar_email?: string | null // Which Microsoft account is connected
  google_calendar_connected: boolean
  google_calendar_email?: string | null // Which Google account is connected
  // Calendar verification fields from backend
  calendar_provider?: 'microsoft' | 'google' | null // Which calendar provider is connected
  calendar_email?: string | null // Actual calendar email (not Clerk email)
  calendar_name?: string | null // Actual calendar name from Microsoft Graph API
  calendar_id?: string | null // Microsoft calendar ID
  calendar_verified?: boolean // true if backend can access calendar via Graph API
  calendar_error?: string | null // Error message if verification failed
  calendar_token_valid?: boolean // Token validity status
  calendar_expires_at?: string | null // Token expiry date
  calendar_expires_at_formatted?: string | null // Human-readable expiry
  calendar_email_matches_account?: boolean // Flag to detect if calendar email = account email
  calendar_link?: string | null // Link to view calendar in provider's web view
}

export interface ClerkUserData {
  id: string
  emailAddresses: Array<{ emailAddress: string }>
  firstName?: string
  lastName?: string
  createdAt: number
  updatedAt: number
}

/**
 * Get current user from Clerk and sync with database
 */
export async function getCurrentUser(): Promise<DatabaseUser | null> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return null
    }

    // Get user from your database by Clerk user ID
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/by-clerk-id/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch user from database:', response.statusText)
      return null
    }

    const user = await response.json()
    return user.data
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Create user in database when they sign up with Clerk
 * This should be called from a webhook or after successful sign-up
 */
export async function createUserInDatabase(clerkUserData: ClerkUserData): Promise<DatabaseUser | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const clerkSecret = process.env.CLERK_SECRET_KEY

    console.log('🔧 Creating user in database...')
    console.log('🌐 API URL:', apiUrl)
    console.log('🔑 Clerk Secret exists:', !!clerkSecret)

    const payload = {
      clerk_user_id: clerkUserData.id,
      email: clerkUserData.emailAddresses[0]?.emailAddress,
      first_name: clerkUserData.firstName,
      last_name: clerkUserData.lastName,
      created_at: new Date(clerkUserData.createdAt).toISOString(),
    }

    console.log('📦 Payload:', JSON.stringify(payload, null, 2))

    const response = await fetch(
      `${apiUrl}/users/create-from-clerk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clerkSecret}`,
        },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to create user in database')
      console.error('Status:', response.status, response.statusText)
      console.error('Error:', errorText)
      return null
    }

    const result = await response.json()
    console.log('✅ User created successfully:', result.data?.id)
    return result.data
  } catch (error) {
    console.error('💥 Exception creating user in database:', error)
    return null
  }
}

/**
 * Update user's calendar connection status
 */
export async function updateUserCalendarStatus(
  userId: string,
  provider: 'microsoft' | 'google',
  connected: boolean
): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/calendar-status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
        body: JSON.stringify({
          provider,
          connected,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('Error updating calendar status:', error)
    return false
  }
}
