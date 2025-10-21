'use client'

import { useUser } from '@/lib/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { Loader2, RefreshCw } from 'lucide-react'

export default function HomePage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            PeteRental Voice AI
          </h1>
          <p className="text-muted-foreground mt-2">
            Voice AI platform for rental property management
          </p>
        </div>

        <div className="grid gap-6">
          {/* Authentication Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar Authentication Status</CardTitle>
              <CardDescription>
                Microsoft Calendar connection for VAPI integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || isCheckingAuth ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking authentication status...</span>
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : isAuthenticated && userId ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{email || userId}</p>
                      <div className="mt-2">
                        {calendarConnected ? (
                          <>
                            <Badge className="bg-green-600">✓ Connected</Badge>
                            {calendarExpiresAt && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Token expires:{' '}
                                {new Date(calendarExpiresAt).toLocaleString()}
                              </p>
                            )}
                          </>
                        ) : (
                          <Badge variant="destructive">Not Authorized</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshAuthStatus}
                        disabled={isCheckingAuth}
                      >
                        {isCheckingAuth ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Refresh
                          </>
                        )}
                      </Button>
                      <Link href="/users">
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    No calendar connected. Connect your Microsoft Calendar to enable
                    VAPI integration.
                  </p>
                  <Link href="/users">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Connect Calendar
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* VAPI Testing Card */}
          <Card>
            <CardHeader>
              <CardTitle>VAPI Testing & Configuration</CardTitle>
              <CardDescription>
                Test webhooks and configure VAPI integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure and test your VAPI webhooks, view function definitions, and
                troubleshoot integration issues.
              </p>
              <div className="flex gap-2">
                <Link href="/vapi-testing">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Webhook Testing
                  </Button>
                </Link>
                <Link href="/vapi-agent">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    🎤 Voice Agent
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Rental Dashboard Card */}
          <Card>
            <CardHeader>
              <CardTitle>Rental Properties Dashboard</CardTitle>
              <CardDescription>
                View tracked rental listings and availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monitor rental property listings, availability, and pricing across
                tracked websites.
              </p>
              <Link href="/dashboard">
                <Button variant="outline">View Rentals</Button>
              </Link>
            </CardContent>
          </Card>

          {/* API Endpoints Card */}
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>Backend API documentation and testing</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View available API endpoints, test requests, and see response examples.
              </p>
              <Link href="/api-endpoints">
                <Button variant="outline">View API Docs</Button>
              </Link>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/calendar">
                  <Button variant="outline" className="w-full">
                    Calendar Events
                  </Button>
                </Link>
                <Link href="/whats-working">
                  <Button variant="outline" className="w-full">
                    What&apos;s Working
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Backend: FastAPI + LangChain + Playwright + Pendulum</p>
          <p>Frontend: Next.js 15.5.4 + shadcn/ui + TypeScript</p>
          <p className="mt-1 text-xs">
            {isAuthenticated && userId && `Logged in as: ${email || userId}`}
          </p>
        </div>
      </div>
    </div>
  )
}
