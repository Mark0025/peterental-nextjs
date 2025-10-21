'use server'

/**
 * Rental Server Actions for PeteRental
 * Next.js 15.4 best practice - all API calls server-side
 */

import type { SystemStatus, RentalProperty } from '@/types'
import { apiClient } from '@/lib/api/client'

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
 * Get all available rentals
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

