'use client'

/**
 * Client-side providers wrapper
 * 
 * This component wraps the app with context providers that need client-side JavaScript.
 * Keep this file minimal - only include providers, no UI logic.
 */

import { ReactNode } from 'react'
import { UserProvider } from '@/components/providers/user-provider'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <UserProvider>
      {/* Phase 5: VAPIProvider will be added here */}
      {/* Phase 7: ToastProvider will be added here */}
      {children}
    </UserProvider>
  )
}

