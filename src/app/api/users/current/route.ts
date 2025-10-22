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

    // Get user from your database by Clerk user ID
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/by-clerk-id/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('Backend response not ok:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch user from database' },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    if (!result.success) {
      console.error('Backend returned error:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to fetch user from database' },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error fetching current user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
