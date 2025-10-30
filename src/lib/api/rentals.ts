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

  /**
   * Create a new rental property (manual entry)
   * @param rentalData - Rental property data
   * @param headers - Authenticated headers (must include JWT token)
   */
  async createRental(
    rentalData: {
      property_address: string
      price: number
      bedrooms: number
      bathrooms: number
      square_feet?: number
      description?: string
      available_date?: string
      contact_info?: string
    },
    headers: HeadersInit
  ): Promise<RentalProperty> {
    const response = await fetch(`${this.baseURL}/rentals`, {
      method: 'POST',
      headers: {
        ...apiConfig.defaultHeaders,
        ...headers,
      },
      body: JSON.stringify(rentalData),
      cache: 'no-store',
    })

    return handleAPIResponse<RentalProperty>(response)
  }

  /**
   * Update an existing rental property
   * @param rentalId - Rental ID
   * @param updates - Fields to update (property_address is readonly)
   * @param headers - Authenticated headers (must include JWT token)
   */
  async updateRental(
    rentalId: number,
    updates: {
      price?: number
      bedrooms?: number
      bathrooms?: number
      square_feet?: number
      description?: string
      available_date?: string
      contact_info?: string
    },
    headers: HeadersInit
  ): Promise<RentalProperty> {
    const response = await fetch(`${this.baseURL}/rentals/${rentalId}`, {
      method: 'PATCH',
      headers: {
        ...apiConfig.defaultHeaders,
        ...headers,
      },
      body: JSON.stringify(updates),
      cache: 'no-store',
    })

    return handleAPIResponse<RentalProperty>(response)
  }

  /**
   * Delete a rental property
   * @param rentalId - Rental ID
   * @param headers - Authenticated headers (must include JWT token)
   */
  async deleteRental(rentalId: number, headers: HeadersInit): Promise<void> {
    const response = await fetch(`${this.baseURL}/rentals/${rentalId}`, {
      method: 'DELETE',
      headers: {
        ...apiConfig.defaultHeaders,
        ...headers,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      try {
        const error = await handleAPIResponse<{ message?: string }>(response)
        throw new Error(error?.message || 'Failed to delete rental')
      } catch {
        throw new Error('Failed to delete rental')
      }
    }
  }

  /**
   * Get rental sources (websites for scraping)
   * @param headers - Authenticated headers (must include JWT token)
   */
  async getSources(headers: HeadersInit): Promise<Array<{
    id: number
    user_id: string
    website: string
    url: string
    is_active: boolean
    last_scraped_at: string | null
    created_at: string
  }>> {
    const response = await fetch(`${this.baseURL}/database/sources`, {
      method: 'GET',
      headers: {
        ...apiConfig.defaultHeaders,
        ...headers,
      },
      next: { revalidate: 60 },
    })

    return handleAPIResponse(response)
  }

  /**
   * Add a new rental source (website for scraping)
   * @param sourceData - Source website data
   * @param headers - Authenticated headers (must include JWT token)
   */
  async addSource(
    sourceData: {
      website: string
      url: string
    },
    headers: HeadersInit
  ): Promise<{
    id: number
    user_id: string
    website: string
    url: string
    is_active: boolean
    created_at: string
  }> {
    const response = await fetch(`${this.baseURL}/database/sources`, {
      method: 'POST',
      headers: {
        ...apiConfig.defaultHeaders,
        ...headers,
      },
      body: JSON.stringify(sourceData),
      cache: 'no-store',
    })

    return handleAPIResponse(response)
  }

  /**
   * Delete a rental source
   * @param sourceId - Source ID
   * @param headers - Authenticated headers (must include JWT token)
   */
  async deleteSource(sourceId: number, headers: HeadersInit): Promise<void> {
    const response = await fetch(
      `${this.baseURL}/database/sources/${sourceId}`,
      {
        method: 'DELETE',
        headers: {
          ...apiConfig.defaultHeaders,
          ...headers,
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      try {
        const error = await handleAPIResponse<{ message?: string }>(response)
        throw new Error(error?.message || 'Failed to delete source')
      } catch {
        throw new Error('Failed to delete source')
      }
    }
  }
}

