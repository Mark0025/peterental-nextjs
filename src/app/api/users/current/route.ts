/**
 * API endpoint to get current user data
 * 
 * This endpoint:
 * - Gets the current user from Clerk
 * - Fetches their data from your database
 * - Returns the complete user profile
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Temporary mock response until backend is updated
    const mockUser = {
      id: `user_${userId}`,
      clerk_user_id: userId,
      email: "user@example.com",
      first_name: "Test",
      last_name: "User",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      microsoft_calendar_connected: false,
      google_calendar_connected: false
    }

    return NextResponse.json(mockUser)
  } catch (error) {
    console.error('Error fetching current user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
