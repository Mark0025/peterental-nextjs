/**
 * Hook to get current authenticated user
 * 
 * This hook:
 * - Gets the current user from Clerk
 * - Fetches their data from your database
 * - Provides loading states and error handling
 */

'use client'

import { useAuth } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { DatabaseUser } from '@/lib/auth/user-sync'

export function useCurrentUser() {
  const { userId, isLoaded } = useAuth()
  const [user, setUser] = useState<DatabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUser = async () => {
    if (!userId || !isLoaded) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/users/current`)
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }
      
      const userData = await response.json()
      setUser(userData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [userId, isLoaded])

  return {
    user,
    isLoading: !isLoaded || isLoading,
    error,
    refetch: fetchUser,
    isSignedIn: !!userId && isLoaded,
  }
}
