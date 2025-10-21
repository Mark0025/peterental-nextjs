// Main type exports for PeteRental Frontend
// Import and re-export all types for easy access

// API Types
export type {
  APIResponse,
  HealthStatus,
  ServiceInfo,
  CalendarEvent,
  Attendee,
  AvailabilitySlot,
  CalendarAuthStatus,
  CreateEventRequest,
  CreateEventResponse,
  GetEventsResponse,
  GetAvailabilityResponse,
  VAPIAssistant,
  VAPITool,
  VAPIWebhookRequest,
  VAPIToolCall,
  VAPIWebhookResponse,
  VAPIToolResult,
  GetAssistantsResponse,
  RentalProperty,
  RentalData,
  SystemStatus,
  WebsiteStats,
  DateTimeString,
  EmailString,
  SuccessResponse,
  ErrorResponse,
} from './api'

export { APIError } from './api'

// User Types
export type {
  User,
  UserPreferences,
  AuthStatus,
  UserSession,
  StoredUser,
  OAuthCallbackParams,
} from './user'

// VAPI Types
export type {
  VAPIEventType,
  VAPIMessage,
  VAPITranscript,
  VAPICallState,
  AgentConfig,
  VAPIContextType,
  VAPIToolFunction,
  VAPIToolArguments,
  VAPIError,
} from './vapi'

// Calendar Types
export type {
  CalendarDay,
  CalendarWeek,
  CalendarMonth,
  AppointmentFormData,
  AppointmentFormErrors,
  CalendarView,
  CalendarFilters,
  TimeSlot,
  CalendarEventUI,
} from './calendar'

// Rental Types
export type {
  RentalPropertyUI,
  RentalFilters,
  PropertyType,
  AvailabilityStatus,
  RentalSortOption,
  RentalViewMode,
  RentalStats,
  RentalComparison,
} from './rental'

// Backwards compatibility (deprecated, use specific types)
/** @deprecated Use RentalProperty from '@/types/api' instead */
export type { RentalProperty as Rental } from './api'
