'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { useUser } from '@/lib/hooks/use-user'
import { ConnectCalendarButton } from './connect-calendar-button'

export function AuthStatus() {
  const {
    userId,
    email,
    isAuthenticated,
    calendarConnected,
    calendarExpiresAt,
    isLoading,
    isCheckingAuth,
    error,
    refreshAuthStatus,
  } = useUser()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
          <CardDescription>Checking your connection...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isAuthenticated || !userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
          <CardDescription>No user logged in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-5 w-5 text-red-500" />
              <span>Not authenticated</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Please log in or connect a user to continue.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Microsoft Calendar connection</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshAuthStatus}
            disabled={isCheckingAuth}
          >
            <RefreshCw
              className={`h-4 w-4 ${isCheckingAuth ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div>
          <p className="text-sm font-medium text-muted-foreground">User</p>
          <p className="font-mono text-sm">{email || userId}</p>
        </div>

        {/* Calendar Status */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Calendar Status
          </p>
          {calendarConnected ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <Badge className="bg-green-600">Connected</Badge>
              </div>
              {calendarExpiresAt && (
                <p className="text-xs text-muted-foreground">
                  Token expires: {new Date(calendarExpiresAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <Badge variant="destructive">Not Connected</Badge>
              </div>
              <ConnectCalendarButton userId={userId} size="sm" />
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

