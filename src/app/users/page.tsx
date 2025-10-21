'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@/lib/hooks/use-user'
import { AuthStatus } from '@/components/features/auth/auth-status'
import { UserSelector } from '@/components/features/auth/user-selector'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

function UsersPageContent() {
  const searchParams = useSearchParams()
  const { setUser, addUser, refreshAuthStatus } = useUser()
  const [oauthResult, setOauthResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    // Handle OAuth callback
    const authStatus = searchParams.get('auth')
    const email = searchParams.get('email')
    const message = searchParams.get('message')

    if (authStatus === 'success' && email) {
      // OAuth succeeded
      setUser(email)
      addUser(email)
      setOauthResult({
        type: 'success',
        message: `Successfully connected calendar for ${email}`,
      })

      // Refresh auth status to get token expiry
      setTimeout(() => {
        refreshAuthStatus()
      }, 1000)

      // Log for debugging
      console.log('[UsersPage] OAuth success:', {
        email,
        timestamp: new Date().toISOString(),
      })

      // Clean URL after 3 seconds
      setTimeout(() => {
        window.history.replaceState({}, '', '/users')
      }, 3000)
    } else if (authStatus === 'error') {
      setOauthResult({
        type: 'error',
        message: message || 'Failed to connect calendar',
      })

      console.error('[UsersPage] OAuth error:', {
        message,
        timestamp: new Date().toISOString(),
      })

      // Clean URL after 5 seconds
      setTimeout(() => {
        window.history.replaceState({}, '', '/users')
      }, 5000)
    }
  }, [searchParams, setUser, addUser, refreshAuthStatus])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage users and Microsoft Calendar connections
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* OAuth Result Alert */}
          {oauthResult && (
            <div className="lg:col-span-2">
              <Alert
                variant={oauthResult.type === 'success' ? 'default' : 'destructive'}
                className={
                  oauthResult.type === 'success'
                    ? 'border-green-200 bg-green-50'
                    : ''
                }
              >
                {oauthResult.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {oauthResult.type === 'success'
                    ? 'Calendar Connected!'
                    : 'Connection Failed'}
                </AlertTitle>
                <AlertDescription>{oauthResult.message}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* User Selector */}
          <UserSelector />

          {/* Auth Status */}
          <AuthStatus />
        </div>

        {/* How It Works */}
        <div className="mt-8 rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">How It Works</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="font-bold text-blue-600">1.</div>
              <p>
                <strong>Add a User:</strong> Click &quot;Add User&quot; and enter
                the email address that will be used for Microsoft Calendar OAuth.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-blue-600">2.</div>
              <p>
                <strong>Connect Calendar:</strong> Click &quot;Connect Microsoft
                Calendar&quot; to authorize access to the user&apos;s calendar.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-blue-600">3.</div>
              <p>
                <strong>Switch Users:</strong> You can add multiple users and switch
                between them. Each user has their own calendar connection.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-blue-600">4.</div>
              <p>
                <strong>VAPI Integration:</strong> Once connected, the VAPI agent can
                access the user&apos;s calendar to book appointments.
              </p>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 rounded-lg border bg-gray-50 p-4">
          <p className="text-xs text-muted-foreground">
            <strong>Backend:</strong> {process.env.NEXT_PUBLIC_API_URL}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>OAuth Redirect:</strong> Users will be redirected to Microsoft
            for authentication, then back to this page.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <UsersPageContent />
    </Suspense>
  )
}
