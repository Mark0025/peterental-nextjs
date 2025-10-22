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
import { useQuery } from '@tanstack/react-query'
import { DatabaseUser } from '@/lib/auth/user-sync'

export function useCurrentUser() {
  const { userId, isLoaded } = useAuth()

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<DatabaseUser | null>({
    queryKey: ['current-user', userId],
    queryFn: async () => {
      if (!userId) return null

      const response = await fetch(`/api/users/current`)
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }
      return response.json()
    },
    enabled: isLoaded && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    user,
    isLoading: !isLoaded || isLoading,
    error,
    refetch,
    isSignedIn: !!userId && isLoaded,
  }
}
