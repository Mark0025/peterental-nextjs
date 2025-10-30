// Rental-specific types

import type { RentalProperty } from './api'

// Extended rental types for UI
export interface RentalPropertyUI extends RentalProperty {
  isSelected?: boolean
  isFavorite?: boolean
  viewCount?: number
  lastViewed?: string
}

// Rental filters
export interface RentalFilters {
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  maxBedrooms?: number
  minBathrooms?: number
  maxBathrooms?: number
  propertyType?: PropertyType[]
  availabilityStatus?: AvailabilityStatus[]
  maxDaysUntilAvailable?: number
  websites?: string[]
  searchQuery?: string
}

// Property types
export type PropertyType =
  | 'apartment'
  | 'house'
  | 'condo'
  | 'townhouse'
  | 'studio'
  | 'other'

// Availability status
export type AvailabilityStatus =
  | 'available_now'
  | 'available_soon'
  | 'available_later'
  | 'unavailable'

// Sort options
export type RentalSortOption =
  | 'price_asc'
  | 'price_desc'
  | 'bedrooms_asc'
  | 'bedrooms_desc'
  | 'available_date_asc'
  | 'available_date_desc'
  | 'newest_first'

// Rental view mode
export type RentalViewMode = 'grid' | 'list' | 'table'

// Rental statistics
export interface RentalStats {
  total: number
  availableNow: number
  comingSoon: number
  averagePrice: number
  priceRange: {
    min: number
    max: number
  }
  bedroomDistribution: Record<number, number>
}

// Rental comparison
export interface RentalComparison {
  properties: RentalPropertyUI[]
  differences: {
    price: boolean
    bedrooms: boolean
    bathrooms: boolean
    availability: boolean
  }
}

