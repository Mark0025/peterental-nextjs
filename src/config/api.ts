// API configuration

export const apiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  
  // Endpoints
  endpoints: {
    // Health & Info
    health: "/health",
    info: "/",
    
    // Calendar
    calendarAuthStart: "/calendar/auth/start",
    calendarAuthCallback: "/calendar/auth/callback",
    calendarAuthStatus: "/calendar/auth/status",
    calendarEvents: "/calendar/events",
    calendarAvailability: "/calendar/availability",
    
    // VAPI
    vapiWebhook: "/vapi/webhook",
    vapiAssistants: "/vapi/assistants",
    
    // Rentals
    databaseStatus: "/database/status",
    databaseRentals: "/database/rentals",
    databaseAvailable: "/database/available",
  },
  
  // Default request options
  defaultHeaders: {
    "Content-Type": "application/json",
  },
  
  // Cache settings (for Next.js fetch)
  cache: {
    health: 60, // 1 minute
    events: 60, // 1 minute
    availability: 300, // 5 minutes
    rentals: 300, // 5 minutes
    systemStatus: 120, // 2 minutes
  },
} as const

export type APIConfig = typeof apiConfig

