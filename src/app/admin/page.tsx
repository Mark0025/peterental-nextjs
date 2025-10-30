'use client'

import { useCurrentUser } from '@/hooks/use-current-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Shield, Users, Code, Activity, AlertCircle, Settings } from 'lucide-react'

export default function AdminPage() {
  const { user, isLoading } = useCurrentUser()

  // Temporary admin check
  const isAdmin = user?.email?.includes('mark@') || false

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to access the admin area.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-100">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-red-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-800 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground">
            System management, testing, and debugging tools
          </p>
          <Badge variant="destructive" className="mt-2">
            Admin Only
          </Badge>
        </div>

        {/* Admin Tools Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Testing */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <CardTitle>User Testing</CardTitle>
              </div>
              <CardDescription>
                View all users and test with different accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/testing">
                <Button className="w-full">
                  Open Testing Interface
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-2">
                Switch between users for testing purposes
              </p>
            </CardContent>
          </Card>

          {/* API Documentation */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-600" />
                <CardTitle>API Endpoints</CardTitle>
              </div>
              <CardDescription>
                Backend API documentation and testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/api-endpoints">
                <Button className="w-full" variant="outline">
                  View API Docs
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-2">
                Test backend endpoints and view responses
              </p>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                <CardTitle>System Status</CardTitle>
              </div>
              <CardDescription>
                Backend health and service monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/whats-working">
                <Button className="w-full" variant="outline">
                  View System Status
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-2">
                Check what&apos;s working and backend connectivity
              </p>
            </CardContent>
          </Card>

          {/* Debug Tools */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-600" />
                <CardTitle>Debug Clerk</CardTitle>
              </div>
              <CardDescription>
                Clerk authentication debugging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/debug-clerk">
                <Button className="w-full" variant="outline">
                  Debug Auth
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-2">
                View Clerk session and token information
              </p>
            </CardContent>
          </Card>

          {/* Test Suite */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                <CardTitle>Test Suite</CardTitle>
              </div>
              <CardDescription>
                Run integration tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/test-suite">
                <Button className="w-full" variant="outline">
                  Run Tests
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-2">
                Test backend integration and functionality
              </p>
            </CardContent>
          </Card>

          {/* Pete Agent Testing */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <CardTitle>Pete Agent</CardTitle>
              </div>
              <CardDescription>
                Test voice agent functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/vapi-agent">
                <Button className="w-full" variant="outline">
                  Test Voice Agent
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-2">
                Test Pete voice AI integration
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Warning Notice */}
        <Alert className="mt-8 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">Admin Area</AlertTitle>
          <AlertDescription className="text-red-800">
            These tools are for system administrators only. Changes made here can affect the entire application.
            Always test in a development environment before making production changes.
          </AlertDescription>
        </Alert>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Logged in as: {user?.email}</p>
          <p className="text-xs mt-1">Admin access granted</p>
        </div>
      </div>
    </div>
  )
}

