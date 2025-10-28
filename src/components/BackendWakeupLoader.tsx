/**
 * Backend Wake-Up Loader
 *
 * Shows a friendly loading screen while the Render backend spins up.
 * Displays estimated time and retry count.
 */

'use client';

import { useBackendWakeup } from '@/hooks/useBackendWakeup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface BackendWakeupLoaderProps {
  children: React.ReactNode;
}

export function BackendWakeupLoader({ children }: BackendWakeupLoaderProps) {
  const { isWakingUp, error, retryCount } = useBackendWakeup();

  // Show loading state
  if (isWakingUp) {
    const estimatedTime = Math.max(30 - (retryCount * 3), 5); // Estimate remaining time

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Waking Up Backend
            </CardTitle>
            <CardDescription>
              The backend is starting up from sleep mode...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-600">
                Estimated time: ~{estimatedTime} seconds
              </div>
              <div className="text-xs text-gray-500">
                Attempt {retryCount + 1} of 10
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              <strong>Why is this happening?</strong>
              <br />
              The backend uses Render&apos;s free tier, which spins down after inactivity.
              This only happens on the first visit after a period of inactivity.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Backend Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Backend is ready, show children
  return <>{children}</>;
}
