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
    const { userId, getToken } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get the user's JWT token from Clerk
    const token = await getToken()
    
    if (!token) {
      console.error('Clerk: Failed to get user token for userId:', userId);
      return NextResponse.json({ error: 'Failed to get user token' }, { status: 401 })
    }

    console.log('Frontend API: User ID:', userId);

    // Get user from your database using the /users/by-clerk-id endpoint with authorization
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/by-clerk-id/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend response not ok:', response.status, response.statusText);
      console.error('Backend error response:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch user from database' },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('Backend response:', result);
    
    if (!result.success) {
      console.error('Backend returned error:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to fetch user from database' },
        { status: 500 }
      )
    }

    // Check calendar auth status using the user's actual email
    let calendarConnected = false;
    try {
      const calendarResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/calendar/auth/status?user_id=${result.data.email}`,
        { cache: 'no-store' }
      );
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        calendarConnected = calendarData.authorized || false;
      }
    } catch (error) {
      console.error('Error checking calendar status:', error);
    }

    // Map backend response to frontend format
    const userData = {
      id: result.data.user_id.toString(),
      clerk_user_id: userId,
      email: result.data.email,
      first_name: result.data.full_name?.split(' ')[0] || null,
      last_name: result.data.full_name?.split(' ')[1] || null,
      created_at: result.data.created_at,
      updated_at: result.data.created_at, // Use created_at as fallback
      microsoft_calendar_connected: calendarConnected,
      google_calendar_connected: false // Not implemented yet
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching current user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
