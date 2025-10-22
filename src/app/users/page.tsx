'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCurrentUser } from '@/hooks/use-current-user'
import { getCalendarAuthURL } from '@/actions/calendar-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Calendar,
  Mic,
  Home,
  Settings,
  RefreshCw,
  ExternalLink
} from 'lucide-react'

function UsersPageContent() {
  const searchParams = useSearchParams()
  const { user, isLoading, error, refetch } = useCurrentUser()
  const [oauthResult, setOauthResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const handleConnectCalendar = async () => {
    if (!user) return

    try {
      const authUrl = await getCalendarAuthURL(user.clerk_user_id)
      window.location.href = authUrl
    } catch (error) {
      console.error('Failed to get calendar auth URL:', error)
      setOauthResult({
        type: 'error',
        message: 'Failed to start calendar connection'
      })
    }
  }

  useEffect(() => {
    // Handle OAuth callback
    const authStatus = searchParams.get('auth')
    const message = searchParams.get('message')

    if (authStatus === 'success') {
      setOauthResult({
        type: 'success',
        message: message || 'Successfully connected calendar',
      })

      // Refresh user data
      setTimeout(() => {
        refetch()
      }, 1000)

      // Clean URL after 3 seconds
      setTimeout(() => {
        window.history.replaceState({}, '', '/users')
      }, 3000)
    } else if (authStatus === 'error') {
      setOauthResult({
        type: 'error',
        message: message || 'Failed to connect calendar',
      })

      // Clean URL after 5 seconds
      setTimeout(() => {
        window.history.replaceState({}, '', '/users')
      }, 5000)
    }
  }, [searchParams, refetch])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading user profile...</span>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
            <p className="text-muted-foreground text-center mb-4">
              {error?.message || 'Failed to load user data'}
            </p>
            <Button onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              User Profile
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your account, calendar connections, and VAPI configurations
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>

        {/* OAuth Result Alert */}
        {oauthResult && (
          <div className="mb-6">
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

        {/* Main Content Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="vapi" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              VAPI Config
            </TabsTrigger>
            <TabsTrigger value="rentals" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Rentals
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Information
                  </CardTitle>
                  <CardDescription>
                    Your account details and authentication status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : 'Mark Carpenter' // Default for now
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Clerk User ID:</span>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {user.clerk_user_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database ID:</span>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {user.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Member Since:</span>
                    <span className="text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Account Settings
                  </CardTitle>
                  <CardDescription>
                    Your account is managed through Clerk authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p>• Profile management is handled by Clerk</p>
                    <p>• Sign out and back in to update your information</p>
                    <p>• Contact support for account changes</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Microsoft Calendar
                  </CardTitle>
                  <CardDescription>
                    Connect your Microsoft Calendar for appointment booking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge
                      variant={user.microsoft_calendar_connected ? "default" : "secondary"}
                      className={user.microsoft_calendar_connected
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                      }
                    >
                      {user.microsoft_calendar_connected ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                  {user.microsoft_calendar_connected ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-600">
                        ✅ Calendar is connected and ready for VAPI integration
                      </p>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Manage Permissions
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Connect your Microsoft Calendar to enable appointment booking
                      </p>
                      <Button className="w-full" onClick={handleConnectCalendar}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Connect Microsoft Calendar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Google Calendar
                  </CardTitle>
                  <CardDescription>
                    Connect your Google Calendar (coming soon)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      Not Available
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Google Calendar integration will be available soon
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    <Calendar className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* VAPI Config Tab */}
          <TabsContent value="vapi">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  VAPI Agent Configuration
                </CardTitle>
                <CardDescription>
                  Manage your voice AI agents and configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Agent Builder:</span>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Agent Builder
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Voice Testing:</span>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Test Voice Agent
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Your VAPI configurations are automatically
                    linked to your user account. Each agent you create will be
                    associated with your calendar and rental data.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rentals Tab */}
          <TabsContent value="rentals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Rental Properties
                </CardTitle>
                <CardDescription>
                  Manage your rental properties and bookings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Properties:</span>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Properties
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bookings:</span>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Bookings
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Integration:</strong> Your rental properties are automatically
                    available to VAPI agents for appointment booking and management.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Debug Info */}
        <div className="mt-8 rounded-lg border bg-gray-50 p-4">
          <p className="text-xs text-muted-foreground">
            <strong>Backend:</strong> {process.env.NEXT_PUBLIC_API_URL}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>User ID:</strong> {user.id}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>Clerk ID:</strong> {user.clerk_user_id}
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
