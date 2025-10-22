'use server'

/**
 * Calendar Server Actions for PeteRental
 * Next.js 15.4 best practice - all API calls server-side
 * Keeps API URLs and credentials secure
 */

import type {
  // CalendarEvent,
  // AvailabilitySlot,
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
 * Check if user has authorized calendar access
 */
export async function checkCalendarAuth(
  userId: string
): Promise<CalendarAuthStatus> {
  try {
    const response = await fetch(
      `${API_URL}/calendar/auth/status?user_id=${encodeURIComponent(userId)}`,
      { cache: 'no-store' }
    )

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
 * Get OAuth authorization URL
 */
export async function getCalendarAuthURL(userId: string): Promise<string> {
  return `${API_URL}/calendar/auth/start?user_id=${encodeURIComponent(userId)}`
}

/**
 * Get user's calendar events
 */
export async function getCalendarEvents(
  userId: string,
  daysAhead: number = 14
): Promise<GetEventsResponse> {
  try {
    const response = await fetch(
      `${API_URL}/calendar/events?user_id=${encodeURIComponent(
        userId
      )}&days_ahead=${daysAhead}`,
      { cache: 'no-store' }
    )

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
 */
export async function getAvailability(
  userId: string,
  daysAhead: number = 7,
  startHour: number = 9,
  endHour: number = 17
): Promise<GetAvailabilityResponse> {
  try {
    const params = new URLSearchParams({
      user_id: userId,
      days_ahead: daysAhead.toString(),
      start_hour: startHour.toString(),
      end_hour: endHour.toString(),
    })

    const response = await fetch(`${API_URL}/calendar/availability?${params}`, {
      cache: 'no-store',
    })

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
 */
export async function createCalendarEvent(
  request: CreateEventRequest
): Promise<CreateEventResponse> {
  try {
    const response = await fetch(`${API_URL}/calendar/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      cache: 'no-store',
    })

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
 * Check if time slot has conflict (for testing/validation)
 */
export async function checkTimeConflict(
  userId: string,
  startTime: string,
  timezone: string = 'America/Chicago'
): Promise<{
  user_id: string
  checking_time: string
  timezone: string
  has_conflict: boolean
  result: string
  message: string
}> {
  try {
    const params = new URLSearchParams({
      user_id: userId,
      start_time: startTime,
      timezone: timezone,
    })

    const response = await fetch(`${API_URL}/debug/check-conflict?${params}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to check conflict: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error('[Server Action] checkTimeConflict error:', error)
    throw error
  }
}

/**
 * Get calendar statistics for a user
 */
export async function getCalendarStats(userId: string): Promise<{
  total_events: number
  upcoming_events: number
  past_events: number
  available_slots_7_days: number
}> {
  try {
    const [events, availability] = await Promise.all([
      getCalendarEvents(userId, 30),
      getAvailability(userId, 7),
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

