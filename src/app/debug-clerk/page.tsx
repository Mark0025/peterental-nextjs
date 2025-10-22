'use client'

import { useAuth } from '@clerk/nextjs'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DebugClerkPage() {
  const { isSignedIn, userId, getToken, isLoaded } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testToken = async () => {
    try {
      setError(null)
      const token = await getToken()
      setToken(token)
      console.log('Clerk Token:', token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Token Error:', err)
    }
  }

  const testBackend = async () => {
    if (!token) return
    
    try {
      const response = await fetch('/api/users/current')
      const data = await response.json()
      console.log('Backend Response:', data)
    } catch (err) {
      console.error('Backend Error:', err)
    }
  }

  if (!isLoaded) {
    return <div>Loading Clerk...</div>
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Clerk Debug Page</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Clerk Status</CardTitle>
            <CardDescription>Current authentication state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Signed In:</span>
              <Badge variant={isSignedIn ? "default" : "secondary"}>
                {isSignedIn ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">User ID:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                {userId || "None"}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Clerk Loaded:</span>
              <Badge variant={isLoaded ? "default" : "secondary"}>
                {isLoaded ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Test</CardTitle>
            <CardDescription>Test Clerk JWT token generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testToken} disabled={!isSignedIn}>
              Get Clerk Token
            </Button>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {token && (
              <div className="space-y-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800">
                  <strong>Token Generated Successfully!</strong>
                </div>
                <div className="space-y-2">
                  <span className="font-medium">Token (first 50 chars):</span>
                  <code className="block bg-gray-100 p-2 rounded text-xs break-all">
                    {token.substring(0, 50)}...
                  </code>
                </div>
                <Button onClick={testBackend} variant="outline">
                  Test Backend with Token
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Check if Clerk keys are configured</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Publishable Key:</span>
              <Badge variant={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "default" : "secondary"}>
                {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "Set" : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Secret Key:</span>
              <Badge variant={process.env.CLERK_SECRET_KEY ? "default" : "secondary"}>
                {process.env.CLERK_SECRET_KEY ? "Set" : "Missing"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
