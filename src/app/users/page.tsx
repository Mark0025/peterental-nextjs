'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCurrentUser } from '@/hooks/use-current-user'
import { getCalendarAuthURL, disconnectCalendar } from '@/actions/calendar-actions'
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

  const handleConnectCalendar = async (provider: 'microsoft' | 'google' = 'microsoft') => {
    if (!user) return

    // Check if user already has a different provider connected
    const otherProvider = provider === 'microsoft' ? 'google' : 'microsoft'
    const hasOtherProvider = provider === 'microsoft'
      ? user.google_calendar_connected
      : user.microsoft_calendar_connected

    if (hasOtherProvider) {
      const otherProviderName = otherProvider === 'microsoft' ? 'Microsoft' : 'Google'
      const newProviderName = provider === 'microsoft' ? 'Microsoft' : 'Google'

      const confirmed = window.confirm(
        `You currently have ${otherProviderName} Calendar connected.\n\n` +
        `Connecting ${newProviderName} Calendar will automatically disconnect ${otherProviderName} Calendar.\n\n` +
        `Only one calendar provider can be active at a time.\n\n` +
        `Continue?`
      )

      if (!confirmed) return

      // Disconnect the other provider first
      console.log(`🔌 Auto-disconnecting ${otherProvider} calendar before connecting ${provider}`)
      try {
        await disconnectCalendar(otherProvider)
        console.log(`✅ ${otherProviderName} Calendar disconnected`)
      } catch (error) {
        console.error(`❌ Failed to disconnect ${otherProvider}:`, error)
        setOauthResult({
          type: 'error',
          message: `Failed to disconnect ${otherProviderName} Calendar. Please try again.`
        })
        return
      }
    }

    try {
      console.log(`🔗 Starting ${provider} calendar connection for user:`, user.clerk_user_id)

      // Pass current origin for OAuth callback (supports localhost and production)
      const redirectUrl = window.location.origin
      console.log(`📍 OAuth callback will redirect to: ${redirectUrl}`)

      const authUrl = await getCalendarAuthURL(provider, redirectUrl)
      console.log('🌐 Redirecting to OAuth URL:', authUrl)
      window.location.href = authUrl
    } catch (error) {
      console.error(`❌ Failed to get ${provider} calendar auth URL:`, error)
      setOauthResult({
        type: 'error',
        message: `Failed to start ${provider} calendar connection`
      })
    }
  }

  const handleDisconnectCalendar = async (provider: 'microsoft' | 'google' = 'microsoft') => {
    if (!user) return

    const providerName = provider === 'google' ? 'Google' : 'Microsoft';
    const email = provider === 'google' ? user.google_calendar_email : user.microsoft_calendar_email;

    const confirmed = window.confirm(
      `Are you sure you want to disconnect your ${providerName} Calendar (${email || 'connected account'})?\n\nThis will remove your calendar access and you'll need to reconnect to use calendar features.`
    )

    if (!confirmed) return

    try {
      console.log(`🔌 Disconnecting ${provider} calendar for user:`, user.clerk_user_id)
      setRefreshing(true)

      const result = await disconnectCalendar(provider)

      console.log('✅ Disconnect result:', result)
      setOauthResult({
        type: 'success',
        message: result.message || `${providerName} Calendar disconnected successfully`
      })

      // Refresh user data to update UI
      setTimeout(() => {
        refetch()
      }, 1000)
    } catch (error) {
      console.error(`❌ Failed to disconnect ${provider} calendar:`, error)
      setOauthResult({
        type: 'error',
        message: error instanceof Error ? error.message : `Failed to disconnect ${providerName} calendar`
      })
    } finally {
      setRefreshing(false)
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
              Manage your account, calendar connections, and Pete configurations
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
              Agent Config
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
                      {user.first_name
                        ? user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.first_name
                        : 'Name not provided'
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
              <Card className={user.google_calendar_connected ? "opacity-60" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Microsoft Calendar
                    {user.google_calendar_connected && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        Unavailable (Google connected)
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Connect your Microsoft Calendar for appointment booking
                    {user.google_calendar_connected && " (disconnect Google first)"}
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
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <p className="text-sm text-green-600 font-medium">
                            Calendar is connected and ready for Pete integration
                          </p>
                          {user.calendar_provider && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Provider:</span>
                              <Badge variant="outline" className="text-xs">
                                {user.calendar_provider === 'microsoft' && '🔵 Microsoft'}
                                {user.calendar_provider === 'google' && '🔴 Google'}
                                {user.calendar_provider !== 'microsoft' && user.calendar_provider !== 'google' && String(user.calendar_provider)}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3 rounded-lg border bg-gray-50 p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                Your Account Email (Clerk):
                              </div>
                              <div className="text-sm font-mono bg-white px-2 py-1 rounded border">
                                {user.email}
                              </div>
                            </div>
                          </div>

                          {user.calendar_email || user.microsoft_calendar_email ? (
                            <div className="space-y-2">
                              {/* Calendar Name - Most Important Visual Indicator */}
                              {user.calendar_name && (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                      <Calendar className="h-3 w-3" />
                                      <span>Calendar Name:</span>
                                    </div>
                                    <div className="text-sm font-semibold bg-blue-50 text-blue-900 px-3 py-2 rounded-lg border-2 border-blue-300">
                                      📅 {user.calendar_name}
                                    </div>
                                  </div>
                                  {user.calendar_verified === true && (
                                    <Badge className="bg-green-600 text-white" variant="default">
                                      ✓ Verified
                                    </Badge>
                                  )}
                                  {user.calendar_verified === false && (
                                    <Badge className="bg-red-600 text-white" variant="destructive">
                                      ✗ Not Verified
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Calendar Account Email */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                    <span>Connected Account Email:</span>
                                    {user.calendar_provider === 'microsoft' && <span>🔵</span>}
                                    {user.calendar_provider === 'google' && <span>🔴</span>}
                                    {user.calendar_provider !== 'microsoft' && user.calendar_provider !== 'google' && user.microsoft_calendar_email && <span>🔵</span>}
                                  </div>
                                  <div className="text-sm font-mono bg-green-50 text-green-800 px-2 py-1 rounded border border-green-200 font-semibold">
                                    {user.calendar_email || user.microsoft_calendar_email}
                                  </div>
                                </div>
                              </div>

                              {/* Calendar ID (if available) */}
                              {user.calendar_id && (
                                <div className="text-xs text-muted-foreground">
                                  Calendar ID: <span className="font-mono">{String(user.calendar_id).substring(0, 20)}...</span>
                                </div>
                              )}

                              {/* View Calendar Button */}
                              {user.calendar_link && (
                                <div className="mt-2">
                                  <a
                                    href={user.calendar_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                                  >
                                    <Calendar className="h-4 w-4" />
                                    View Calendar in {user.calendar_provider === 'google' ? 'Google' : 'Outlook'}
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : null}

                          {/* Verification Status Warning */}
                          {user.calendar_verified === false && (
                            <div className="rounded-md bg-red-50 border border-red-300 p-3">
                              <p className="text-xs text-red-900 font-bold mb-1">
                                ❌ Calendar NOT Verified
                              </p>
                              <p className="text-xs text-red-800 mb-1">
                                We cannot access your calendar. This connection may be invalid or expired.
                              </p>
                              {user.calendar_error && (
                                <p className="text-xs text-red-700 font-mono bg-red-100 px-2 py-1 rounded mt-1">
                                  Error: {user.calendar_error}
                                </p>
                              )}
                              <p className="text-xs text-red-700 mt-2">
                                <strong>Action required:</strong> Disconnect and reconnect your calendar.
                              </p>
                            </div>
                          )}

                          {/* Email Match Warning */}
                          {(user.calendar_email || user.microsoft_calendar_email) &&
                            (user.calendar_email === user.email || user.microsoft_calendar_email === user.email) && (
                              <div className="rounded-md bg-amber-50 border border-amber-200 p-2">
                                <p className="text-xs text-amber-800 font-medium">
                                  ⚠️ Warning: Calendar email matches your account email.
                                </p>
                                <p className="text-xs text-amber-700 mt-1">
                                  This may indicate the calendar is not actually connected. The connected calendar should be a <strong>different</strong> Microsoft/Google account email. If this email doesn&apos;t have a Microsoft account, please disconnect and reconnect with a valid Microsoft account.
                                </p>
                              </div>
                            )}

                          {/* Success Indicators */}
                          {(user.calendar_email || user.microsoft_calendar_email) &&
                            user.calendar_email !== user.email && user.microsoft_calendar_email !== user.email &&
                            user.calendar_verified !== false && (
                              <div className="rounded-md bg-green-50 border border-green-200 p-2">
                                <p className="text-xs text-green-800 font-medium mb-1">
                                  ✅ Valid Calendar Connection
                                </p>
                                <p className="text-xs text-green-700">
                                  Calendar connected to a <strong>different account</strong> than your Clerk email. {user.calendar_verified === true && 'Calendar access verified.'}
                                </p>
                              </div>
                            )}
                        </div>
                      </div>
                      {user.calendar_token_valid === false && (
                        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-2">
                          <p className="text-xs text-yellow-800">
                            ⚠️ Token may be expired or invalid. Try disconnecting and reconnecting.
                          </p>
                        </div>
                      )}
                      {/* Token Expiration - use formatted version if available */}
                      {user.calendar_expires_at_formatted ? (
                        <div className="text-xs text-muted-foreground">
                          Token expires: <span className="font-medium">{user.calendar_expires_at_formatted}</span>
                        </div>
                      ) : user.calendar_expires_at ? (
                        <div className="text-xs text-muted-foreground">
                          Token expires: {new Date(user.calendar_expires_at).toLocaleString()}
                        </div>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnectCalendar('microsoft')}
                        className="w-full"
                      >
                        Disconnect Calendar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Connect your Microsoft Calendar to enable appointment booking
                      </p>
                      <Button className="w-full" onClick={() => handleConnectCalendar('microsoft')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Connect Microsoft Calendar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={user.microsoft_calendar_connected ? "opacity-60" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Google Calendar
                    {user.microsoft_calendar_connected && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        Unavailable (Microsoft connected)
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Connect your Google Calendar for appointment booking
                    {user.microsoft_calendar_connected && " (disconnect Microsoft first)"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge
                      variant={user.google_calendar_connected ? "default" : "secondary"}
                      className={user.google_calendar_connected
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                      }
                    >
                      {user.google_calendar_connected ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                  {user.google_calendar_connected ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <p className="text-sm text-green-600 font-medium">
                            Calendar is connected and ready for Pete integration
                          </p>
                          {user.calendar_provider && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Provider:</span>
                              <Badge variant="outline" className="text-xs">
                                {user.calendar_provider === 'microsoft' && '🔵 Microsoft'}
                                {user.calendar_provider === 'google' && '🔴 Google'}
                                {user.calendar_provider !== 'microsoft' && user.calendar_provider !== 'google' && String(user.calendar_provider)}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3 rounded-lg border bg-gray-50 p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                Your Account Email (Clerk):
                              </div>
                              <div className="text-sm font-mono bg-white px-2 py-1 rounded border">
                                {user.email}
                              </div>
                            </div>
                          </div>

                          {user.google_calendar_email && (
                            <div className="space-y-2">
                              {/* Calendar Name - Most Important Visual Indicator */}
                              {user.calendar_name && (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                      <Calendar className="h-3 w-3" />
                                      <span>Calendar Name:</span>
                                    </div>
                                    <div className="text-sm font-semibold bg-blue-50 text-blue-900 px-3 py-2 rounded-lg border-2 border-blue-300">
                                      📅 {user.calendar_name}
                                    </div>
                                  </div>
                                  {user.calendar_verified === true && (
                                    <Badge className="bg-green-600 text-white" variant="default">
                                      ✓ Verified
                                    </Badge>
                                  )}
                                  {user.calendar_verified === false && (
                                    <Badge className="bg-red-600 text-white" variant="destructive">
                                      ✗ Not Verified
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Calendar Account Email */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                    <span>Connected Account Email:</span>
                                    <span>🔴</span>
                                  </div>
                                  <div className="text-sm font-mono bg-green-50 text-green-800 px-2 py-1 rounded border border-green-200 font-semibold">
                                    {user.google_calendar_email}
                                  </div>
                                </div>
                              </div>

                              {/* Calendar ID (if available) */}
                              {user.calendar_id && (
                                <div className="text-xs text-muted-foreground">
                                  Calendar ID: <span className="font-mono">{String(user.calendar_id).substring(0, 20)}...</span>
                                </div>
                              )}

                              {/* View Calendar Button */}
                              {user.calendar_link && (
                                <div className="mt-2">
                                  <a
                                    href={user.calendar_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                                  >
                                    <Calendar className="h-4 w-4" />
                                    View Calendar in Google
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Verification Status Warning */}
                          {user.calendar_verified === false && (
                            <div className="rounded-md bg-red-50 border border-red-300 p-3">
                              <p className="text-xs text-red-900 font-bold mb-1">
                                ❌ Calendar NOT Verified
                              </p>
                              <p className="text-xs text-red-800 mb-1">
                                We cannot access your calendar. This connection may be invalid or expired.
                              </p>
                              {user.calendar_error && (
                                <p className="text-xs text-red-700 font-mono bg-red-100 px-2 py-1 rounded mt-1">
                                  Error: {user.calendar_error}
                                </p>
                              )}
                              <p className="text-xs text-red-700 mt-2">
                                <strong>Action required:</strong> Disconnect and reconnect your calendar.
                              </p>
                            </div>
                          )}

                          {/* Email Match Warning */}
                          {user.google_calendar_email &&
                            user.google_calendar_email === user.email && (
                              <div className="rounded-md bg-amber-50 border border-amber-200 p-2">
                                <p className="text-xs text-amber-800 font-medium">
                                  ⚠️ Warning: Calendar email matches your account email.
                                </p>
                                <p className="text-xs text-amber-700 mt-1">
                                  This may indicate the calendar is not actually connected. The connected calendar should be a <strong>different</strong> Google account email. If this email doesn&apos;t have a Google account, please disconnect and reconnect with a valid Google account.
                                </p>
                              </div>
                            )}

                          {/* Success Indicators */}
                          {user.google_calendar_email &&
                            user.google_calendar_email !== user.email &&
                            user.calendar_verified !== false && (
                              <div className="rounded-md bg-green-50 border border-green-200 p-2">
                                <p className="text-xs text-green-800 font-medium mb-1">
                                  ✅ Valid Calendar Connection
                                </p>
                                <p className="text-xs text-green-700">
                                  Calendar connected to a <strong>different account</strong> than your Clerk email. {user.calendar_verified === true && 'Calendar access verified.'}
                                </p>
                              </div>
                            )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnectCalendar('google')}
                        className="w-full"
                      >
                        Disconnect Google Calendar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Connect your Google Calendar to enable appointment booking
                      </p>
                      <Button className="w-full" onClick={() => handleConnectCalendar('google')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Connect Google Calendar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pete Config Tab */}
          <TabsContent value="vapi">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Agent Configuration
                </CardTitle>
                <CardDescription>
                  Manage your Pete agents and voice configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <Link href="/agent-builder">
                    <Button className="w-full justify-start" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Open Agent Builder
                    </Button>
                  </Link>
                  <Link href="/vapi-agent">
                    <Button className="w-full justify-start" variant="outline">
                      <Mic className="h-4 w-4 mr-2" />
                      Test Pete Voice Agent
                    </Button>
                  </Link>
                  <Link href="/vapi-testing">
                    <Button className="w-full justify-start" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Pete Webhook Testing
                    </Button>
                  </Link>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Your agents are automatically linked to your account.
                    Each agent you create will have access to your calendar and rental data.
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
                  Manage your rental properties and sources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Your Properties:</span>
                    <Link href="/rentals">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Properties
                      </Button>
                    </Link>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Scraping Sources:</span>
                    <Link href="/rentals?tab=sources">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Sources
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Integration:</strong> Your rental properties are automatically
                    available to Pete agents for appointment booking and management.
                  </p>
                  <p className="text-xs text-green-700 mt-2">
                    • Add properties manually or configure scraping sources<br />
                    • All rentals are private to your account (user-scoped)
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
