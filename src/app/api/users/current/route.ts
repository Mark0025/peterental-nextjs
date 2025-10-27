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

    console.log('Frontend API: User ID:', userId);

    // Get Clerk JWT token for user authentication
    const token = await getToken()
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 })
    }

    // Get user from your database using the /users/me endpoint
    // This endpoint auto-creates users if they don't exist
    // Uses Clerk JWT token for user authentication
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
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

    // Check calendar auth status - this is the REAL source of truth
    // Backend database field 'has_microsoft_calendar' is not being updated properly
    console.log('🔍 Checking calendar auth status for user:', userId);
    let calendarConnected = false;
    let calendarEmail: string | null = null;
    try {
      const calendarResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/calendar/auth/status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        }
      );
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        console.log('📅 Calendar auth status response:', JSON.stringify(calendarData, null, 2));
        calendarConnected = calendarData.authorized || false;
        calendarEmail = calendarData.user_email || null;
        console.log(`✅ Calendar connected: ${calendarConnected}, Email: ${calendarEmail}`);
      } else {
        console.log('❌ Calendar status check failed:', calendarResponse.status);
      }
    } catch (error) {
      console.error('💥 Error checking calendar status:', error);
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
      microsoft_calendar_connected: calendarConnected, // Use auth status, NOT database field
      microsoft_calendar_email: calendarEmail, // Which Microsoft account is connected
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
