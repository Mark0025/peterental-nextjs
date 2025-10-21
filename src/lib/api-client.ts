// API Client for PeteRental Python Backend
// This file maintained for backwards compatibility
// New code should use '@/lib/api/client' directly

/**
 * @deprecated Import from '@/lib/api/client' instead
 * 
 * Old: import { apiClient } from "@/lib/api-client"
 * New: import { apiClient } from "@/lib/api/client"
 */

export { apiClient } from './api/client'

// Re-export types for convenience
export type {
  HealthStatus,
  ServiceInfo,
  SystemStatus,
  RentalData,
} from "@/types"
