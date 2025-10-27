'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global Error Boundary Component
 *
 * Usage:
 * - Automatically used by Next.js when you create an error.tsx file
 * - Catches errors in the route segment and all nested children
 * - Provides user-friendly error UI with recovery options
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error to console in development
    console.error('Error Boundary caught:', error)

    // TODO: In production, log to error tracking service (e.g., Sentry, LogRocket)
    // if (process.env.NODE_ENV === 'production') {
    //   logErrorToService(error)
    // }
  }, [error])

  // Extract user-friendly error message
  const getUserFriendlyMessage = (error: Error): string => {
    // Authentication errors
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return 'You need to sign in to access this page.'
    }

    // Calendar connection errors
    if (error.message.includes('calendar') || error.message.includes('Calendar')) {
      return 'There was an issue connecting to your calendar. Please try reconnecting.'
    }

    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Unable to connect to the server. Please check your internet connection.'
    }

    // API errors
    if (error.message.includes('API') || error.message.includes('endpoint')) {
      return 'There was a problem communicating with the server.'
    }

    // Generic error
    return 'An unexpected error occurred. Our team has been notified.'
  }

  const friendlyMessage = getUserFriendlyMessage(error)
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Something Went Wrong</CardTitle>
              <CardDescription>
                We encountered an unexpected error
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* User-friendly error message */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{friendlyMessage}</AlertDescription>
          </Alert>

          {/* Development-only: Technical error details */}
          {isDevelopment && (
            <details className="rounded-lg border bg-gray-50 p-4">
              <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                Technical Details (Development Only)
              </summary>
              <div className="mt-3 space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Error Message:</p>
                  <pre className="mt-1 overflow-x-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
                    {error.message}
                  </pre>
                </div>
                {error.stack && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Stack Trace:</p>
                    <pre className="mt-1 overflow-x-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {error.digest && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Error Digest:</p>
                    <code className="mt-1 block rounded bg-gray-900 p-2 text-xs text-gray-100">
                      {error.digest}
                    </code>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Recovery suggestions */}
          <div className="rounded-lg border bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">Try these steps:</p>
            <ul className="mt-2 space-y-1 text-sm text-blue-800">
              <li>• Refresh the page and try again</li>
              <li>• Check your internet connection</li>
              <li>• Sign out and sign back in</li>
              <li>• Clear your browser cache</li>
              {error.message.includes('calendar') && (
                <li>• Reconnect your calendar on the Users page</li>
              )}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            onClick={reset}
            className="flex-1"
            variant="default"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            className="flex-1"
            variant="outline"
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
