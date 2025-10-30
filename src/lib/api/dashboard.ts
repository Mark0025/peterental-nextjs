// Dashboard API Methods - Aggregates stats from multiple endpoints

import type { SystemStatus } from '@/types'
import type { CalendarAuthStatus } from '@/types/api'
import { apiConfig } from '@/config/api'
import { handleAPIResponse } from './errors'

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  agents: {
    total: number
    active: number
    inactive: number
  }
  rentals: {
    total: number
    websites: number
    lastUpdated: string
  }
  calendar: {
    microsoft: {
      connected: boolean
      email: string | null
      name: string | null
      verified: boolean
    }
    google: {
      connected: boolean
      email: string | null
      name: string | null
      verified: boolean
    }
    anyConnected: boolean
  }
}

/**
 * Agent data from backend
 */
interface Agent {
  id: string
  agent_name: string
  vapi_assistant_id: string
  is_active?: boolean
  // ... other fields
}

/**
 * Dashboard API client
 * Combines multiple endpoints to create dashboard statistics
 */
export class DashboardAPI {
  constructor(private baseURL: string) {}
  
  /**
   * Get aggregated dashboard statistics
   * Fetches data from multiple endpoints in parallel
   * @param headers - Authenticated headers (must include JWT token)
   */
  async getStats(headers: HeadersInit): Promise<DashboardStats> {
    try {
      // Fetch all data in parallel for performance
      const [agentsRes, rentalStatusRes, msCalendarRes, googleCalendarRes] = 
        await Promise.all([
          fetch(`${this.baseURL}/agents`, {
            headers,
            next: { revalidate: 60 }, // Cache 1 minute
          }),
          fetch(`${this.baseURL}${apiConfig.endpoints.databaseStatus}`, {
            headers: apiConfig.defaultHeaders,
            next: { revalidate: 120 }, // Cache 2 minutes
          }),
          fetch(`${this.baseURL}${apiConfig.endpoints.calendarAuthStatus}`, {
            headers,
            next: { revalidate: 60 }, // Cache 1 minute
          }).catch(() => null), // Optional: Don't fail if calendar not connected
          fetch(`${this.baseURL}/calendar/google/auth/status`, {
            headers,
            next: { revalidate: 60 }, // Cache 1 minute
          }).catch(() => null), // Optional: Don't fail if calendar not connected
        ])
      
      // Parse responses
      const agents = await handleAPIResponse<Agent[]>(agentsRes)
      const rentalStatus = await handleAPIResponse<SystemStatus>(rentalStatusRes)
      
      let msCalendar: CalendarAuthStatus | null = null
      if (msCalendarRes && msCalendarRes.ok) {
        msCalendar = await handleAPIResponse<CalendarAuthStatus>(msCalendarRes)
      }
      
      let googleCalendar: CalendarAuthStatus | null = null
      if (googleCalendarRes && googleCalendarRes.ok) {
        googleCalendar = await handleAPIResponse<CalendarAuthStatus>(googleCalendarRes)
      }
      
      // Aggregate agent stats
      const agentStats = {
        total: agents.length,
        active: agents.filter((a) => a.is_active !== false).length,
        inactive: agents.filter((a) => a.is_active === false).length,
      }
      
      // Aggregate rental stats
      const rentalStats = {
        total: rentalStatus.database_stats?.total_rentals || 0,
        websites: rentalStatus.database_stats?.websites_tracked || 0,
        lastUpdated: rentalStatus.database_stats?.last_updated || new Date().toISOString(),
      }
      
      // Aggregate calendar stats
      const calendarStats = {
        microsoft: {
          connected: msCalendar?.authorized || false,
          email: msCalendar?.calendar_email || null,
          name: msCalendar?.calendar_name || null,
          verified: msCalendar?.calendar_verified || false,
        },
        google: {
          connected: googleCalendar?.authorized || false,
          email: googleCalendar?.calendar_email || null,
          name: googleCalendar?.calendar_name || null,
          verified: googleCalendar?.calendar_verified || false,
        },
        anyConnected: (msCalendar?.authorized || false) || (googleCalendar?.authorized || false),
      }
      
      return {
        agents: agentStats,
        rentals: rentalStats,
        calendar: calendarStats,
      }
    } catch (error) {
      console.error('[DashboardAPI] getStats error:', error)
      
      // Return safe defaults on error
      return {
        agents: { total: 0, active: 0, inactive: 0 },
        rentals: { total: 0, websites: 0, lastUpdated: new Date().toISOString() },
        calendar: {
          microsoft: { connected: false, email: null, name: null, verified: false },
          google: { connected: false, email: null, name: null, verified: false },
          anyConnected: false,
        },
      }
    }
  }
  
  /**
   * Get agent count only (faster)
   * @param headers - Authenticated headers (must include JWT token)
   */
  async getAgentCount(headers: HeadersInit): Promise<number> {
    try {
      const response = await fetch(`${this.baseURL}/agents`, {
        headers,
        next: { revalidate: 60 },
      })
      
      const agents = await handleAPIResponse<Agent[]>(response)
      return agents.length
    } catch {
      return 0
    }
  }
  
  /**
   * Get rental count only (faster)
   */
  async getRentalCount(): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseURL}${apiConfig.endpoints.databaseStatus}`,
        {
          headers: apiConfig.defaultHeaders,
          next: { revalidate: 120 },
        }
      )
      
      const status = await handleAPIResponse<SystemStatus>(response)
      return status.database_stats?.total_rentals || 0
    } catch {
      return 0
    }
  }
  
  /**
   * Check if any calendar is connected
   * @param headers - Authenticated headers (must include JWT token)
   */
  async isCalendarConnected(headers: HeadersInit): Promise<boolean> {
    try {
      const [msRes, googleRes] = await Promise.all([
        fetch(`${this.baseURL}${apiConfig.endpoints.calendarAuthStatus}`, {
          headers,
          next: { revalidate: 60 },
        }).catch(() => null),
        fetch(`${this.baseURL}/calendar/google/auth/status`, {
          headers,
          next: { revalidate: 60 },
        }).catch(() => null),
      ])
      
      let msConnected = false
      if (msRes && msRes.ok) {
        const msData = await handleAPIResponse<CalendarAuthStatus>(msRes)
        msConnected = msData.authorized || false
      }
      
      let googleConnected = false
      if (googleRes && googleRes.ok) {
        const googleData = await handleAPIResponse<CalendarAuthStatus>(googleRes)
        googleConnected = googleData.authorized || false
      }
      
      return msConnected || googleConnected
    } catch {
      return false
    }
  }
}

