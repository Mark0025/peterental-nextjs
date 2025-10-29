// Main API Client for PeteRental Backend

import type { HealthStatus, ServiceInfo } from '@/types'
import { apiConfig } from '@/config/api'
import { handleAPIResponse, retryWithBackoff } from './errors'
import { CalendarAPI } from './calendar'
import { VAPIAPI } from './vapi'
import { RentalsAPI } from './rentals'
import { DashboardAPI } from './dashboard'

/**
 * Main API Client
 * 
 * Usage:
 * ```ts
 * import { apiClient } from '@/lib/api/client'
 * 
 * // Calendar
 * const events = await apiClient.calendar.getEvents(userId)
 * 
 * // VAPI
 * const agents = await apiClient.vapi.getAssistants()
 * 
 * // Rentals
 * const rentals = await apiClient.rentals.getAvailable()
 * ```
 */
export class APIClient {
  private baseURL: string
  
  // Sub-clients
  public readonly calendar: CalendarAPI
  public readonly vapi: VAPIAPI
  public readonly rentals: RentalsAPI
  public readonly dashboard: DashboardAPI
  
  constructor(baseURL: string = apiConfig.baseURL) {
    this.baseURL = baseURL
    
    // Initialize sub-clients
    this.calendar = new CalendarAPI(baseURL)
    this.vapi = new VAPIAPI(baseURL)
    this.rentals = new RentalsAPI(baseURL)
    this.dashboard = new DashboardAPI(baseURL)
  }
  
  /**
   * Health check
   */
  async health(): Promise<HealthStatus> {
    const response = await fetch(
      `${this.baseURL}${apiConfig.endpoints.health}`,
      {
        headers: apiConfig.defaultHeaders,
        next: { revalidate: apiConfig.cache.health }, // Cache for 1 minute
      }
    )
    
    return handleAPIResponse<HealthStatus>(response)
  }
  
  /**
   * Get service information
   */
  async getServiceInfo(): Promise<ServiceInfo> {
    const response = await fetch(
      `${this.baseURL}${apiConfig.endpoints.info}`,
      {
        headers: apiConfig.defaultHeaders,
        next: { revalidate: apiConfig.cache.health },
      }
    )
    
    return handleAPIResponse<ServiceInfo>(response)
  }
  
  /**
   * Check if backend is accessible
   */
  async isHealthy(): Promise<boolean> {
    try {
      const health = await this.health()
      return health.status === 'healthy'
    } catch {
      return false
    }
  }
  
  /**
   * Generic GET request with retry
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return retryWithBackoff(
      async () => {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers: {
            ...apiConfig.defaultHeaders,
            ...options?.headers,
          },
        })
        
        return handleAPIResponse<T>(response)
      },
      apiConfig.retries,
      apiConfig.retryDelay
    )
  }
  
  /**
   * Generic POST request with retry
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return retryWithBackoff(
      async () => {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'POST',
          ...options,
          headers: {
            ...apiConfig.defaultHeaders,
            ...options?.headers,
          },
          body: data ? JSON.stringify(data) : undefined,
        })
        
        return handleAPIResponse<T>(response)
      },
      apiConfig.retries,
      apiConfig.retryDelay
    )
  }
  
  /**
   * Get the base URL
   */
  getBaseURL(): string {
    return this.baseURL
  }
}

// Export singleton instance
export const apiClient = new APIClient()

// Export for testing/custom instances
export { CalendarAPI, VAPIAPI, RentalsAPI, DashboardAPI }

