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
  first_name?: string
  last_name?: string
  created_at: string
  updated_at: string
  microsoft_calendar_connected: boolean
  google_calendar_connected: boolean
  // Add other fields as needed
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/create-from-clerk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
        body: JSON.stringify({
          clerk_user_id: clerkUserData.id,
          email: clerkUserData.emailAddresses[0]?.emailAddress,
          first_name: clerkUserData.firstName,
          last_name: clerkUserData.lastName,
          created_at: new Date(clerkUserData.createdAt).toISOString(),
        }),
      }
    )

    if (!response.ok) {
      console.error('Failed to create user in database:', response.statusText)
      return null
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error creating user in database:', error)
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
