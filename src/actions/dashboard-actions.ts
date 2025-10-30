'use server'

/**
 * Dashboard Server Actions for PeteRental
 * Aggregates data from multiple backend endpoints
 */

import { auth } from '@clerk/nextjs/server'
import { apiClient } from '@/lib/api/client'
import type { DashboardStats } from '@/lib/api/dashboard'

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
 * Get aggregated dashboard statistics
 * Combines agents, rentals, and calendar data
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const headers = await getAuthHeaders()
    const stats = await apiClient.dashboard.getStats(headers)
    return stats
  } catch (error) {
    console.error('[Server Action] getDashboardStats error:', error)
    
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
 */
export async function getAgentCount(): Promise<number> {
  try {
    const headers = await getAuthHeaders()
    return await apiClient.dashboard.getAgentCount(headers)
  } catch (error) {
    console.error('[Server Action] getAgentCount error:', error)
    return 0
  }
}

/**
 * Get rental count only (faster)
 */
export async function getRentalCount(): Promise<number> {
  try {
    return await apiClient.dashboard.getRentalCount()
  } catch (error) {
    console.error('[Server Action] getRentalCount error:', error)
    return 0
  }
}

/**
 * Check if calendar is connected
 */
export async function isCalendarConnected(): Promise<boolean> {
  try {
    const headers = await getAuthHeaders()
    return await apiClient.dashboard.isCalendarConnected(headers)
  } catch (error) {
    console.error('[Server Action] isCalendarConnected error:', error)
    return false
  }
}

