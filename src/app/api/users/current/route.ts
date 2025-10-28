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
  let userId: string | null = null;
  
  try {
    const authResult = await auth()
    userId = authResult.userId;

    if (!userId) {
      console.error('❌ No userId found in auth context');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('🚀 Frontend API: User ID:', userId, 'Timestamp:', new Date().toISOString());

    // Get Clerk JWT token for user authentication
    // Try different token templates for backend compatibility
    let token = await authResult.getToken({ template: 'peterental-backend' })
    if (!token) {
      // Fallback to default token
      token = await authResult.getToken()
    }
    if (!token) {
      console.error('❌ Failed to get JWT token for userId:', userId);
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 })
    }

    console.log('✅ JWT token obtained, length:', token.length);
    console.log('🔍 JWT token preview:', token.substring(0, 50) + '...');

    // Get user from your database using the /users/me endpoint
    // This endpoint auto-creates users if they don't exist
    // Uses Clerk JWT token for user authentication
    console.log('🔄 Calling backend:', `${process.env.NEXT_PUBLIC_API_URL}/users/me`);
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('📡 Backend response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend response not ok:', response.status, response.statusText);
      console.error('❌ Backend error response:', errorText);
      return NextResponse.json(
        { error: `Backend returned error: ${errorText || 'undefined'}` },
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
      console.log('🔄 Calling calendar status endpoint:', `${process.env.NEXT_PUBLIC_API_URL}/calendar/auth/status`);
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
      console.log('📅 Calendar response status:', calendarResponse.status, calendarResponse.statusText);
      
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        console.log('📅 Calendar auth status response:', JSON.stringify(calendarData, null, 2));
        calendarConnected = calendarData.authorized || false;
        calendarEmail = calendarData.user_email || null;
        console.log(`✅ Calendar connected: ${calendarConnected}, Email: ${calendarEmail}`);
      } else {
        const calendarErrorText = await calendarResponse.text();
        console.log('❌ Calendar status check failed:', calendarResponse.status, calendarErrorText);
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

    console.log('✅ Successfully returning user data for userId:', userId);
    return NextResponse.json(userData)
  } catch (error) {
    console.error('💥 Error fetching current user:', error)
    console.error('💥 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: userId || 'unknown'
    });
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
