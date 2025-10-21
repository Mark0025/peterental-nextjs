// Rentals API Methods

import type {
  RentalProperty,
  RentalData,
  SystemStatus,
} from '@/types'
import { apiConfig } from '@/config/api'
import { handleAPIResponse } from './errors'

/**
 * Rentals API client
 */
export class RentalsAPI {
  constructor(private baseURL: string) {}
  
  /**
   * Get database system status
   */
  async getStatus(): Promise<SystemStatus> {
    const response = await fetch(
      `${this.baseURL}${apiConfig.endpoints.databaseStatus}`,
      {
        headers: apiConfig.defaultHeaders,
        next: { revalidate: apiConfig.cache.systemStatus }, // Cache for 2 minutes
      }
    )
    
    return handleAPIResponse<SystemStatus>(response)
  }
  
  /**
   * Get all available rental properties
   */
  async getAvailable(): Promise<RentalProperty[]> {
    const response = await fetch(
      `${this.baseURL}${apiConfig.endpoints.databaseAvailable}`,
      {
        headers: apiConfig.defaultHeaders,
        next: { revalidate: apiConfig.cache.rentals }, // Cache for 5 minutes
      }
    )
    
    const data = await handleAPIResponse<RentalData>(response)
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Failed to fetch rentals')
    }
    
    return data.rentals || []
  }
  
  /**
   * Get rentals from a specific website
   */
  async getByWebsite(website: string): Promise<RentalProperty[]> {
    const response = await fetch(
      `${this.baseURL}${apiConfig.endpoints.databaseRentals}/${encodeURIComponent(website)}`,
      {
        headers: apiConfig.defaultHeaders,
        next: { revalidate: apiConfig.cache.rentals }, // Cache for 5 minutes
      }
    )
    
    const data = await handleAPIResponse<RentalData>(response)
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Failed to fetch rentals')
    }
    
    return data.rentals || []
  }
  
  /**
   * Get rental statistics
   */
  async getStats(): Promise<{
    total: number
    available: number
    websites: number
    lastUpdated: string
  }> {
    const status = await this.getStatus()
    
    return {
      total: status.database_stats.total_rentals,
      available: status.database_stats.total_rentals, // This could be refined
      websites: status.database_stats.websites_tracked,
      lastUpdated: status.database_stats.last_updated,
    }
  }
}

