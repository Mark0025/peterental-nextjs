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
      console.error('❌ Auth result:', JSON.stringify(authResult, null, 2));
      return NextResponse.json({ error: 'No userId found in auth context' }, { status: 401 })
    }

    console.log('🚀 Frontend API: User ID:', userId, 'Timestamp:', new Date().toISOString());

    // Get Clerk JWT token for user authentication
    // Use custom template for backend compatibility
    let token = await authResult.getToken({ template: 'pete-next' })
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
    // This endpoint should validate Clerk JWT tokens properly
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
      let errorMessage = 'Backend error';
      try {
        const errorText = await response.text();
        console.error('❌ Backend response not ok:', response.status, response.statusText);
        console.error('❌ Backend error response:', errorText);
        
        // Check if it's HTML (502 error page)
        if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
          errorMessage = `Backend service unavailable (${response.status})`;
        } else {
          // Try to parse as JSON
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.detail || errorJson.error || errorText;
          } catch (parseError) {
            errorMessage = errorText || `Backend returned error: ${response.status} ${response.statusText}`;
          }
        }
      } catch (textError) {
        errorMessage = `Backend returned error: ${response.status} ${response.statusText}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('Backend response:', result);
    
    // Backend returns user data directly, not wrapped in success object
    if (!result.user_id) {
      console.error('Backend returned error:', result.error || 'No user data')
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
        // Use calendar_email if available (actual Microsoft/Google account)
        // Fallback to user_email (Clerk email) if calendar_email not provided
        calendarEmail = calendarData.calendar_email || calendarData.user_email || null;
        console.log(`✅ Calendar connected: ${calendarConnected}, Email: ${calendarEmail}`);
        console.log(`📊 Calendar provider: ${calendarData.provider || 'unknown'}, Token valid: ${calendarData.token_valid || false}`);
      } else {
        const calendarErrorText = await calendarResponse.text();
        console.log('❌ Calendar status check failed:', calendarResponse.status, calendarErrorText);
      }
    } catch (error) {
      console.error('💥 Error checking calendar status:', error);
    }

    // Map backend response to frontend format
    // Backend returns user data directly, not wrapped in 'data' property
    // Handle full_name parsing - backend may have multiple spaces (e.g., 'Mark  Carpenter')
    const nameParts = result.full_name?.trim().split(/\s+/) || []
    const firstName = nameParts[0] || null
    const lastName = nameParts.slice(1).join(' ') || null // Join remaining parts in case of multiple words
    
    const userData = {
      id: result.user_id.toString(),
      clerk_user_id: userId,
      email: result.email,
      first_name: firstName,
      last_name: lastName,
      created_at: result.created_at,
      updated_at: result.created_at, // Use created_at as fallback
      microsoft_calendar_connected: calendarConnected && (calendarData.provider === 'microsoft' || !calendarData.provider), // Default to Microsoft if no provider specified
      microsoft_calendar_email: calendarData.provider === 'microsoft' ? calendarEmail : null,
      google_calendar_connected: calendarConnected && calendarData.provider === 'google',
      google_calendar_email: calendarData.provider === 'google' ? calendarEmail : null,
      calendar_provider: calendarData.provider || (calendarConnected ? 'microsoft' : null), // Which provider (microsoft/google)
      calendar_token_valid: calendarData.token_valid || false,
      calendar_expires_at: calendarData.expires_at || null
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
