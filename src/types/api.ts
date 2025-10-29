// API Types for PeteRental Backend
// Based on FRONTEND_INTEGRATION_GUIDE.md

// ============================================================================
// Generic API Response Types
// ============================================================================

export interface APIResponse<T> {
  status: 'success' | 'error'
  message?: string
  data?: T
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime_seconds?: number
}

export interface ServiceInfo {
  name: string
  version: string
  description: string
  endpoints: {
    health: string
    webhook: string
    database_status: string
    rentals: string
  }
}

// ============================================================================
// Calendar Types
// ============================================================================

export interface CalendarEvent {
  id: string
  subject: string
  start_time: string // ISO 8601 datetime
  end_time: string // ISO 8601 datetime
  location: string
  attendees: Attendee[]
  is_online_meeting: boolean
  web_link: string
  body?: string
}

export interface Attendee {
  name: string
  email: string
  status?: 'accepted' | 'declined' | 'tentative' | 'none'
}

export interface AvailabilitySlot {
  start_time: string // ISO 8601 datetime
  end_time: string // ISO 8601 datetime
  formatted_time: string // Human-readable time
  day: string // Day of week
}

export interface CalendarAuthStatus {
  user_id: string
  user_email?: string // Clerk user email
  calendar_email?: string // Actual Microsoft/Google calendar email (different from user_email)
  calendar_name?: string // ✨ Actual calendar name from Microsoft Graph API (e.g., "Calendar", "Mark's Work Calendar")
  calendar_id?: string // ✨ Microsoft calendar ID (unique identifier)
  calendar_link?: string // ✨ Clickable link to view calendar in provider's web view
  calendar_verified?: boolean // ✨ true only if we can successfully access the calendar via Graph API
  calendar_error?: string // Error message if calendar verification failed
  authorized: boolean
  token_valid?: boolean
  provider?: 'microsoft' | 'google' // Which calendar provider is connected
  authorization_url?: string
  expires_at?: string // ISO 8601 datetime
  expires_at_formatted?: string // Human-readable expiry time
  created_at?: string // When calendar was connected
  message?: string
}

export interface CreateEventRequest {
  user_id: string
  subject: string
  start_time: string // ISO 8601 datetime (any timezone format supported)
  end_time: string // ISO 8601 datetime
  body?: string
  attendee_email?: string
  attendees?: Attendee[]
  location?: string
  is_online_meeting?: boolean
}

export interface CreateEventResponse {
  status: 'success' | 'error'
  message?: string
  event?: CalendarEvent
}

export interface GetEventsResponse {
  status: 'success' | 'error'
  message?: string
  events?: CalendarEvent[]
}

export interface GetAvailabilityResponse {
  status: 'success' | 'error'
  message?: string
  available_slots?: AvailabilitySlot[]
}

// ============================================================================
// VAPI Types
// ============================================================================

export interface VAPIAssistant {
  id: string
  name: string
  model: string
  voice: string
  firstMessage: string
  tools: VAPITool[]
  createdAt: string
  updatedAt: string
}

export interface VAPITool {
  type: string
  function: {
    name: string
    description: string
    parameters: {
      type: string
      properties: Record<string, unknown>
      required: string[]
    }
  }
}

export interface VAPIWebhookRequest {
  message: {
    toolCalls: VAPIToolCall[]
  }
  website?: string
}

export interface VAPIToolCall {
  id: string
  function: {
    name: string
    arguments: Record<string, unknown>
  }
}

export interface VAPIWebhookResponse {
  results: VAPIToolResult[]
}

export interface VAPIToolResult {
  toolCallId: string
  result: string
}

export interface GetAssistantsResponse {
  status?: 'success' | 'error'
  assistants: VAPIAssistant[]
}

// ============================================================================
// Rental Property Types
// ============================================================================

export interface RentalProperty {
  address: string
  property_type?: string
  price: string
  bedrooms: string | number
  bathrooms: string | number
  square_feet?: string
  available_date: string
  availability_status?: string
  days_until_available?: number | string
  description?: string
  features?: string[]
  website?: string
}

export interface RentalData {
  status: 'success' | 'error'
  message?: string
  total_available: number
  current_date: string
  rentals: RentalProperty[]
}

export interface SystemStatus {
  status: 'success' | 'error'
  database_stats: {
    total_rentals: number
    websites_tracked: number
    last_updated: string
    websites: Record<string, WebsiteStats>
  }
}

export interface WebsiteStats {
  rental_count: number
  last_scraped: string
}

// ============================================================================
// API Error Types
// ============================================================================

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type DateTimeString = string // ISO 8601 format
export type EmailString = string // Email address

// Request/Response helpers
export type SuccessResponse<T> = {
  status: 'success'
  data: T
}

export type ErrorResponse = {
  status: 'error'
  message: string
  details?: unknown
}

