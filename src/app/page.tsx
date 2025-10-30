'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Pete AI Command Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Your central hub for AI-powered property management
          </p>
        </div>

        <div className="grid gap-6">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with Pete AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/users">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Profile
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Pete Testing Card */}
          <Card>
            <CardHeader>
              <CardTitle>Pete Testing & Configuration</CardTitle>
              <CardDescription>
                Test webhooks and configure Pete integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure and test your Pete webhooks, view function definitions, and
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

        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Backend: FastAPI + LangChain + Playwright + Pendulum</p>
          <p>Frontend: Next.js 15.5.4 + shadcn/ui + TypeScript</p>
        </div>
      </div>
    </div>
  )
}
