'use server'

/**
 * Rental Server Actions for PeteRental
 * Next.js 15.4 best practice - all API calls server-side
 */

import type { SystemStatus, RentalProperty } from '@/types'
import { apiClient } from '@/lib/api/client'
import { auth } from '@clerk/nextjs/server'

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
 * Get system status
 */
export async function getRentalsStatus(): Promise<SystemStatus> {
  try {
    const status = await apiClient.rentals.getStatus()
    return status
  } catch (error) {
    console.error('[Server Action] getRentalsStatus error:', error)
    throw error
  }
}

/**
 * Get all available rentals (user-scoped)
 */
export async function getAvailableRentals(): Promise<RentalProperty[]> {
  try {
    const rentals = await apiClient.rentals.getAvailable()
    return rentals
  } catch (error) {
    console.error('[Server Action] getAvailableRentals error:', error)
    throw error
  }
}

/**
 * Create a new rental property
 */
export async function createRental(rentalData: {
  property_address: string
  price: number
  bedrooms: number
  bathrooms: number
  square_feet?: number
  description?: string
  available_date?: string
  contact_info?: string
}): Promise<RentalProperty> {
  try {
    const headers = await getAuthHeaders()
    const rental = await apiClient.rentals.createRental(rentalData, headers)
    return rental
  } catch (error) {
    console.error('[Server Action] createRental error:', error)
    throw error
  }
}

/**
 * Update an existing rental property
 */
export async function updateRental(
  rentalId: number,
  updates: {
    price?: number
    bedrooms?: number
    bathrooms?: number
    square_feet?: number
    description?: string
    available_date?: string
    contact_info?: string
  }
): Promise<RentalProperty> {
  try {
    const headers = await getAuthHeaders()
    const rental = await apiClient.rentals.updateRental(rentalId, updates, headers)
    return rental
  } catch (error) {
    console.error('[Server Action] updateRental error:', error)
    throw error
  }
}

/**
 * Delete a rental property
 */
export async function deleteRental(rentalId: number): Promise<void> {
  try {
    const headers = await getAuthHeaders()
    await apiClient.rentals.deleteRental(rentalId, headers)
  } catch (error) {
    console.error('[Server Action] deleteRental error:', error)
    throw error
  }
}

/**
 * Get rental sources (websites for scraping)
 */
export async function getRentalSources(): Promise<Array<{
  id: number
  user_id: string
  website: string
  url: string
  is_active: boolean
  last_scraped_at: string | null
  created_at: string
}>> {
  try {
    const headers = await getAuthHeaders()
    const sources = await apiClient.rentals.getSources(headers)
    return sources
  } catch (error) {
    console.error('[Server Action] getRentalSources error:', error)
    throw error
  }
}

/**
 * Add a new rental source (website for scraping)
 */
export async function addRentalSource(sourceData: {
  website: string
  url: string
}): Promise<{
  id: number
  user_id: string
  website: string
  url: string
  is_active: boolean
  created_at: string
}> {
  try {
    const headers = await getAuthHeaders()
    const source = await apiClient.rentals.addSource(sourceData, headers)
    return source
  } catch (error) {
    console.error('[Server Action] addRentalSource error:', error)
    throw error
  }
}

/**
 * Delete a rental source
 */
export async function deleteRentalSource(sourceId: number): Promise<void> {
  try {
    const headers = await getAuthHeaders()
    await apiClient.rentals.deleteSource(sourceId, headers)
  } catch (error) {
    console.error('[Server Action] deleteRentalSource error:', error)
    throw error
  }
}

