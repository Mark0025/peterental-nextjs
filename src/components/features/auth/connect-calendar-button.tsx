'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api/client'

interface ConnectCalendarButtonProps {
  userId: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function ConnectCalendarButton({
  userId,
  variant = 'default',
  size = 'default',
  className,
}: ConnectCalendarButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = () => {
    setIsConnecting(true)
    
    // Redirect to OAuth flow
    const authUrl = apiClient.calendar.getAuthStartURL(userId)
    
    // Log for debugging
    console.log('[ConnectCalendarButton] Redirecting to OAuth:', {
      userId,
      authUrl,
    })
    
    window.location.href = authUrl
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleConnect}
      disabled={isConnecting}
    >
      {isConnecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        '🔐 Connect Microsoft Calendar'
      )}
    </Button>
  )
}

