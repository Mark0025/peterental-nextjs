// Calendar API Methods

import type {
  CalendarAuthStatus,
  CalendarEvent,
  AvailabilitySlot,
  CreateEventRequest,
  CreateEventResponse,
  GetEventsResponse,
  GetAvailabilityResponse,
} from '@/types'
import { apiConfig } from '@/config/api'
import { handleAPIResponse } from './errors'

/**
 * Calendar API client
 */
export class CalendarAPI {
  constructor(private baseURL: string) {}
  
  /**
   * Check calendar authorization status for a user
   */
  async getAuthStatus(userId: string): Promise<CalendarAuthStatus> {
    const response = await fetch(
      `${this.baseURL}${apiConfig.endpoints.calendarAuthStatus}?user_id=${encodeURIComponent(userId)}`,
      {
        headers: apiConfig.defaultHeaders,
        next: { revalidate: apiConfig.cache.health }, // Cache for 1 minute
      }
    )
    
    return handleAPIResponse<CalendarAuthStatus>(response)
  }
  
  /**
   * Get calendar events for a user
   */
  async getEvents(
    userId: string,
    daysAhead: number = 14
  ): Promise<CalendarEvent[]> {
    const response = await fetch(
      `${this.baseURL}${apiConfig.endpoints.calendarEvents}?user_id=${encodeURIComponent(userId)}&days_ahead=${daysAhead}`,
      {
        headers: apiConfig.defaultHeaders,
        next: { revalidate: apiConfig.cache.events }, // Cache for 1 minute
      }
    )
    
    const data = await handleAPIResponse<GetEventsResponse>(response)
    
    // Handle both success/error response format
    if (data.status === 'error') {
      throw new Error(data.message || 'Failed to fetch events')
    }
    
    return data.events || []
  }
  
  /**
   * Create a calendar event
   */
  async createEvent(request: CreateEventRequest): Promise<CalendarEvent> {
    const response = await fetch(
      `${this.baseURL}${apiConfig.endpoints.calendarEvents}`,
      {
        method: 'POST',
        headers: apiConfig.defaultHeaders,
        body: JSON.stringify(request),
      }
    )
    
    const data = await handleAPIResponse<CreateEventResponse>(response)
    
    if (data.status === 'error' || !data.event) {
      throw new Error(data.message || 'Failed to create event')
    }
    
    return data.event
  }
  
  /**
   * Get available time slots for a user
   */
  async getAvailability(
    userId: string,
    daysAhead: number = 7
  ): Promise<AvailabilitySlot[]> {
    const response = await fetch(
      `${this.baseURL}${apiConfig.endpoints.calendarAvailability}?user_id=${encodeURIComponent(userId)}&days_ahead=${daysAhead}`,
      {
        headers: apiConfig.defaultHeaders,
        next: { revalidate: apiConfig.cache.availability }, // Cache for 5 minutes
      }
    )
    
    const data = await handleAPIResponse<GetAvailabilityResponse>(response)
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Failed to fetch availability')
    }
    
    return data.available_slots || []
  }
  
  /**
   * Get OAuth authorization URL
   */
  getAuthStartURL(userId: string): string {
    return `${this.baseURL}${apiConfig.endpoints.calendarAuthStart}?user_id=${encodeURIComponent(userId)}`
  }
}

