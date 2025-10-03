"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<{ authorized: boolean; expires_at?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("calendar_user_id");
    if (storedUser) {
      setCurrentUser(storedUser);
      checkAuthStatus(storedUser);
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async (userId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/calendar/auth/status?user_id=${encodeURIComponent(userId)}`);
      const data = await response.json();
      setAuthStatus(data);
    } catch (error) {
      console.error("Failed to check auth status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Pete VAPI Integration
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
              <CardDescription>Microsoft Calendar connection for VAPI integration</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Checking authentication status...</p>
              ) : currentUser ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{currentUser}</p>
                      {authStatus && (
                        <div className="mt-2">
                          {authStatus.authorized ? (
                            <>
                              <Badge className="bg-green-600">✓ Connected</Badge>
                              {authStatus.expires_at && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Token expires: {new Date(authStatus.expires_at).toLocaleString()}
                                </p>
                              )}
                            </>
                          ) : (
                            <Badge variant="destructive">Not Authorized</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Link href="/users">
                      <Button variant="outline">Manage</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    No calendar connected. Connect your Microsoft Calendar to enable VAPI integration.
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
              <CardDescription>Test webhooks and configure VAPI integration</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure and test your VAPI webhooks, view function definitions, and troubleshoot integration issues.
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
              <CardDescription>View tracked rental listings and availability</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monitor rental property listings, availability, and pricing across tracked websites.
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
                  <Button variant="outline" className="w-full">Calendar Events</Button>
                </Link>
                <Link href="/whats-working">
                  <Button variant="outline" className="w-full">What&apos;s Working</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Backend: FastAPI + LangChain + Playwright</p>
          <p>Frontend: Next.js 15 + shadcn/ui + TypeScript</p>
        </div>
      </div>
    </div>
  );
}
