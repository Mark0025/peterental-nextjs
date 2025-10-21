// User Types for Multi-User Support

export interface User {
  id: string // User email (unique identifier)
  email: string // Same as id
  displayName?: string // Optional display name
  calendarConnected: boolean
  calendarExpiresAt?: string // ISO 8601 datetime
  vapiAgents?: string[] // List of VAPI agent IDs this user can access
  createdAt: string // ISO 8601 datetime
  lastLogin: string // ISO 8601 datetime
  preferences?: UserPreferences
}

export interface UserPreferences {
  timezone?: string // e.g., "America/Chicago"
  defaultCalendarView?: 'day' | 'week' | 'month'
  notifications?: {
    email: boolean
    push: boolean
  }
  theme?: 'light' | 'dark' | 'system'
}

export interface AuthStatus {
  authorized: boolean
  expires_at?: string // ISO 8601 datetime
}

// User session/context
export interface UserSession {
  userId: string | null
  email: string | null
  isAuthenticated: boolean
  calendarConnected: boolean
  lastChecked: string // ISO 8601 datetime
}

// User management
export interface StoredUser {
  id: string
  email: string
  displayName?: string
  calendarConnected: boolean
  lastUsed: string // ISO 8601 datetime
}

// OAuth callback params
export interface OAuthCallbackParams {
  auth: 'success' | 'error'
  email?: string
  message?: string
  error?: string
}

