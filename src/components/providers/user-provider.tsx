'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
// import type { AuthStatus } from '@/types'
// import { apiClient } from '@/lib/api/client' // Unused after switching to server actions

interface UserContextType {
  // Current user
  userId: string | null
  email: string | null
  isAuthenticated: boolean
  calendarConnected: boolean
  calendarExpiresAt: string | null

  // Loading states
  isLoading: boolean
  isCheckingAuth: boolean

  // Error state
  error: string | null

  // Actions
  setUser: (userId: string) => void
  logout: () => void
  checkAuthStatus: () => Promise<void>
  refreshAuthStatus: () => Promise<void>

  // Multi-user support
  availableUsers: string[]
  addUser: (userId: string) => void
  removeUser: (userId: string) => void
  switchUser: (userId: string) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// LocalStorage keys
const STORAGE_KEYS = {
  CURRENT_USER: 'peterental_current_user',
  AVAILABLE_USERS: 'peterental_available_users',
  LAST_CHECKED: 'peterental_last_auth_check',
} as const

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  // State
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarExpiresAt, setCalendarExpiresAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableUsers, setAvailableUsers] = useState<string[]>([])

  /**
   * Load user from localStorage on mount
   */
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Load current user
        const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)

        // Load available users
        const storedUsers = localStorage.getItem(STORAGE_KEYS.AVAILABLE_USERS)
        const users = storedUsers ? JSON.parse(storedUsers) : []
        setAvailableUsers(users)

        if (storedUser) {
          setUserId(storedUser)
          setEmail(storedUser) // Email is used as userId

          // Check if we need to refresh auth status
          const lastChecked = localStorage.getItem(STORAGE_KEYS.LAST_CHECKED)
          const shouldCheck = !lastChecked ||
            Date.now() - parseInt(lastChecked) > 5 * 60 * 1000 // 5 minutes

          if (shouldCheck) {
            await checkAuthStatus()
          } else {
            setIsLoading(false)
          }
        } else {
          // Try default user from env
          const defaultUser = process.env.NEXT_PUBLIC_DEFAULT_USER_ID
          if (defaultUser) {
            setUser(defaultUser)
          } else {
            setIsLoading(false)
          }
        }
      } catch (err) {
        console.error('Error loading user from storage:', err)
        setError('Failed to load user data')
        setIsLoading(false)
      }
    }

    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Check calendar authorization status
   * Backend gets user from JWT token automatically
   */
  const checkAuthStatus = useCallback(async () => {
    setIsCheckingAuth(true)
    setError(null)

    try {
      // Use server action - uses Clerk JWT authentication
      const { checkCalendarAuth } = await import('@/actions/calendar-actions')
      const authStatus = await checkCalendarAuth()

      setCalendarConnected(authStatus.authorized)
      setCalendarExpiresAt(authStatus.expires_at || null)

      // Update last checked timestamp
      localStorage.setItem(STORAGE_KEYS.LAST_CHECKED, Date.now().toString())

      // Log for debugging
      console.log('[UserProvider] Auth status checked:', {
        authorized: authStatus.authorized,
        expiresAt: authStatus.expires_at,
        userEmail: authStatus.user_email,
      })
    } catch (err) {
      console.error('[UserProvider] Failed to check auth status:', err)
      setError(err instanceof Error ? err.message : 'Failed to check auth status')
      setCalendarConnected(false)
    } finally {
      setIsCheckingAuth(false)
      setIsLoading(false)
    }
  }, [])

  /**
   * Force refresh auth status
   */
  const refreshAuthStatus = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEYS.LAST_CHECKED)
    await checkAuthStatus()
  }, [checkAuthStatus])

  /**
   * Set current user
   */
  const setUser = useCallback((newUserId: string) => {
    setUserId(newUserId)
    setEmail(newUserId) // Email is used as userId
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, newUserId)

    // Add to available users if not already there
    const users = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.AVAILABLE_USERS) || '[]'
    ) as string[]

    if (!users.includes(newUserId)) {
      const updatedUsers = [...users, newUserId]
      localStorage.setItem(STORAGE_KEYS.AVAILABLE_USERS, JSON.stringify(updatedUsers))
      setAvailableUsers(updatedUsers)
    }

    // Reset auth status
    setCalendarConnected(false)
    setCalendarExpiresAt(null)
    localStorage.removeItem(STORAGE_KEYS.LAST_CHECKED)

    console.log('[UserProvider] User set:', newUserId)
  }, [])

  /**
   * Logout current user
   */
  const logout = useCallback(() => {
    setUserId(null)
    setEmail(null)
    setCalendarConnected(false)
    setCalendarExpiresAt(null)
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    localStorage.removeItem(STORAGE_KEYS.LAST_CHECKED)

    console.log('[UserProvider] User logged out')
  }, [])

  /**
   * Add a new user to available users
   */
  const addUser = useCallback((newUserId: string) => {
    const users = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.AVAILABLE_USERS) || '[]'
    ) as string[]

    if (!users.includes(newUserId)) {
      const updatedUsers = [...users, newUserId]
      localStorage.setItem(STORAGE_KEYS.AVAILABLE_USERS, JSON.stringify(updatedUsers))
      setAvailableUsers(updatedUsers)

      console.log('[UserProvider] User added:', newUserId)
    }
  }, [])

  /**
   * Remove a user from available users
   */
  const removeUser = useCallback((userToRemove: string) => {
    const users = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.AVAILABLE_USERS) || '[]'
    ) as string[]

    const updatedUsers = users.filter(u => u !== userToRemove)
    localStorage.setItem(STORAGE_KEYS.AVAILABLE_USERS, JSON.stringify(updatedUsers))
    setAvailableUsers(updatedUsers)

    // If removing current user, logout
    if (userId === userToRemove) {
      logout()
    }

    console.log('[UserProvider] User removed:', userToRemove)
  }, [userId, logout])

  /**
   * Switch to a different user
   */
  const switchUser = useCallback((newUserId: string) => {
    setUser(newUserId)
    // Will trigger checkAuthStatus via useEffect
  }, [setUser])

  // Check auth status when userId changes
  useEffect(() => {
    if (userId && !isLoading) {
      checkAuthStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isLoading])

  const value: UserContextType = {
    // Current user
    userId,
    email,
    isAuthenticated: !!userId,
    calendarConnected,
    calendarExpiresAt,

    // Loading states
    isLoading,
    isCheckingAuth,

    // Error
    error,

    // Actions
    setUser,
    logout,
    checkAuthStatus,
    refreshAuthStatus,

    // Multi-user
    availableUsers,
    addUser,
    removeUser,
    switchUser,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

/**
 * Hook to use user context
 */
export function useUser() {
  const context = useContext(UserContext)

  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }

  return context
}

/**
 * Hook to require authenticated user
 */
export function useRequireAuth() {
  const { isAuthenticated, userId, calendarConnected } = useUser()

  return {
    isAuthenticated,
    userId,
    calendarConnected,
    requiresAuth: !isAuthenticated,
    requiresCalendar: isAuthenticated && !calendarConnected,
  }
}

