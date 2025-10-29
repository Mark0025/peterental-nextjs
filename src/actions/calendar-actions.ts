'use server'

/**
 * Calendar Server Actions for PeteRental
 * Next.js 15.4 best practice - all API calls server-side
 * Uses Clerk JWT authentication - backend extracts user_id from token
 */

import { auth } from '@clerk/nextjs/server'
import type {
  CalendarAuthStatus,
  CreateEventRequest,
  CreateEventResponse,
  GetEventsResponse,
  GetAvailabilityResponse,
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set')
}

/**
 * Get authenticated headers with Clerk JWT token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { getToken } = await auth()
  
  // Try custom template first, fallback to default
  let token = await getToken({ template: 'pete-next' })
  if (!token) {
    token = await getToken()
  }

  if (!token) {
    throw new Error('Not authenticated - please sign in')
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Check if user has authorized calendar access
 * Backend gets user_id from JWT token automatically
 */
export async function checkCalendarAuth(): Promise<CalendarAuthStatus> {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(
      `${API_URL}/calendar/auth/status`,
      {
        headers,
        cache: 'no-store'
      }
    )

    if (response.status === 401) {
      throw new Error('Unauthorized - please sign in again')
    }

    if (!response.ok) {
      throw new Error(`Failed to check auth status: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error('[Server Action] checkCalendarAuth error:', error)
    throw error
  }
}

/**
 * Get OAuth authorization URL for Microsoft or Google Calendar
 * Backend requires Clerk JWT authentication and extracts user_id from token.
 * Backend generates OAuth URL and returns redirect (307).
 * We fetch it first, extract the Location header, then redirect browser to provider.
 */
export async function getCalendarAuthURL(provider: 'microsoft' | 'google' = 'microsoft'): Promise<string> {
  const headers = await getAuthHeaders()
  
  // Backend expects JWT in Authorization header
  // Backend will generate OAuth URL and return redirect (307)
  const endpoint = provider === 'google'
    ? `${API_URL}/calendar/google/auth/start`
    : `${API_URL}/calendar/auth/start`;
    
  const response = await fetch(endpoint, {
    method: 'GET',
    headers,
    redirect: 'manual', // Don't follow redirect automatically, we need the Location header
  })

  if (response.status === 401) {
    throw new Error('Unauthorized - please sign in again')
  }

  if (!response.ok && response.status !== 307) {
    const errorText = await response.text()
    throw new Error(`Failed to start OAuth flow: ${response.status} - ${errorText}`)
  }

  // Backend returns a redirect (307) to OAuth URL
  // Extract the Location header which contains the OAuth URL
  const location = response.headers.get('location')
  
  if (!location) {
    throw new Error('Backend did not return OAuth redirect URL (no Location header)')
  }

  // Return the OAuth URL to redirect to
  return location
}

/**
 * Get user's calendar events
 * Backend gets user_id from JWT token automatically
 */
export async function getCalendarEvents(
  daysAhead: number = 14
): Promise<GetEventsResponse> {
  try {
    const headers = await getAuthHeaders()
    const params = new URLSearchParams({
      days_ahead: daysAhead.toString(),
    })

    const response = await fetch(
      `${API_URL}/calendar/events?${params}`,
      {
        headers,
        cache: 'no-store'
      }
    )

    if (response.status === 401) {
      throw new Error('Unauthorized - please sign in again')
    }

    if (!response.ok) {
      throw new Error(`Failed to get events: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error('[Server Action] getCalendarEvents error:', error)
    throw error
  }
}

/**
 * Get available time slots
 * Backend gets user_id from JWT token automatically
 */
export async function getAvailability(
  daysAhead: number = 7,
  startHour: number = 9,
  endHour: number = 17
): Promise<GetAvailabilityResponse> {
  try {
    const headers = await getAuthHeaders()
    const params = new URLSearchParams({
      days_ahead: daysAhead.toString(),
      start_hour: startHour.toString(),
      end_hour: endHour.toString(),
    })

    const response = await fetch(
      `${API_URL}/calendar/availability?${params}`,
      {
        headers,
        cache: 'no-store'
      }
    )

    if (response.status === 401) {
      throw new Error('Unauthorized - please sign in again')
    }

    if (!response.ok) {
      throw new Error(`Failed to get availability: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error('[Server Action] getAvailability error:', error)
    throw error
  }
}

/**
 * Create a new calendar event (appointment)
 * Backend gets user_id from JWT token automatically
 */
export async function createCalendarEvent(
  request: Omit<CreateEventRequest, 'user_id'>
): Promise<CreateEventResponse> {
  try {
    const headers = await getAuthHeaders()

    // Convert request to query params (backend expects query params)
    const params = new URLSearchParams({
      subject: request.subject,
      start_time: request.start_time,
      end_time: request.end_time,
      ...(request.body && { body: request.body }),
      ...(request.attendee_email && { attendee_email: request.attendee_email }),
    })

    const response = await fetch(
      `${API_URL}/calendar/events?${params}`,
      {
        method: 'POST',
        headers,
        cache: 'no-store',
      }
    )

    if (response.status === 401) {
      throw new Error('Unauthorized - please sign in again')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || `Failed to create event: ${response.statusText}`
      )
    }

    return response.json()
  } catch (error) {
    console.error('[Server Action] createCalendarEvent error:', error)
    throw error
  }
}

/**
 * Get calendar statistics for current user
 * Backend gets user_id from JWT token automatically
 */
export async function getCalendarStats(): Promise<{
  total_events: number
  upcoming_events: number
  past_events: number
  available_slots_7_days: number
}> {
  try {
    const [events, availability] = await Promise.all([
      getCalendarEvents(30),
      getAvailability(7),
    ])

    const eventList = events.events || []
    const now = new Date()
    const upcomingEvents = eventList.filter(
      (event) => new Date(event.start_time) > now
    )
    const pastEvents = eventList.filter(
      (event) => new Date(event.start_time) <= now
    )

    return {
      total_events: eventList.length,
      upcoming_events: upcomingEvents.length,
      past_events: pastEvents.length,
      available_slots_7_days: availability.available_slots?.length || 0,
    }
  } catch (error) {
    console.error('[Server Action] getCalendarStats error:', error)
    throw error
  }
}

/**
 * Disconnect calendar (Microsoft or Google)
 * Deletes OAuth tokens and updates connection flag
 * Backend gets user_id from JWT token automatically
 */
export async function disconnectCalendar(provider: 'microsoft' | 'google' = 'microsoft'): Promise<{
  success: boolean
  message: string
}> {
  try {
    const headers = await getAuthHeaders()
    const endpoint = provider === 'google'
      ? `${API_URL}/calendar/google/auth/disconnect`
      : `${API_URL}/calendar/auth/disconnect`;
      
    const response = await fetch(
      endpoint,
      {
        method: 'DELETE',
        headers,
        cache: 'no-store',
      }
    )

    if (response.status === 401) {
      throw new Error('Unauthorized - please sign in again')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || `Failed to disconnect calendar: ${response.statusText}`
      )
    }

    const result = await response.json()
    console.log(`[Server Action] ${provider} calendar disconnected successfully:`, result)
    return result
  } catch (error) {
    console.error(`[Server Action] disconnect${provider}Calendar error:`, error)
    throw error
  }
}

