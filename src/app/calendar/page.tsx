"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CalendarPage() {
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Microsoft Calendar Integration
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage calendar connections and availability
          </p>
        </div>

        <div className="grid gap-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
              <CardDescription>Current Microsoft Calendar connection status</CardDescription>
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
                      <Button variant="outline">Manage Connection</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertTitle>No Calendar Connected</AlertTitle>
                    <AlertDescription>
                      Connect your Microsoft Calendar to enable VAPI integration.
                    </AlertDescription>
                  </Alert>
                  <Link href="/users">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Connect Calendar
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar Configuration</CardTitle>
              <CardDescription>Microsoft OAuth settings and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Required Permissions:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Calendars.ReadWrite - Read and write calendar events</li>
                  <li>User.Read - Read user profile information</li>
                  <li>offline_access - Refresh token support</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">OAuth Flow:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>User initiates authorization via /calendar/auth/start</li>
                  <li>Microsoft redirects to consent page</li>
                  <li>After approval, callback to /calendar/auth/callback</li>
                  <li>Tokens stored securely in data/calendar_tokens.json</li>
                </ol>
              </div>

              <div className="pt-4">
                <Alert variant="default">
                  <AlertDescription>
                    Use the <strong>Users</strong> page to authenticate with your Microsoft Calendar.
                    Multi-user support available with email-based identification.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* API Endpoints Card */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar API Endpoints</CardTitle>
              <CardDescription>Available calendar operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 font-mono text-sm">
                <div>
                  <Badge variant="default">GET</Badge>
                  <span className="ml-2">/calendar/auth/status</span>
                  <p className="text-xs text-muted-foreground ml-14">Check authentication status</p>
                </div>
                <div>
                  <Badge variant="default">GET</Badge>
                  <span className="ml-2">/calendar/auth/start</span>
                  <p className="text-xs text-muted-foreground ml-14">Start OAuth flow</p>
                </div>
                <div>
                  <Badge variant="default">GET</Badge>
                  <span className="ml-2">/calendar/availability</span>
                  <p className="text-xs text-muted-foreground ml-14">Get available time slots</p>
                </div>
                <div>
                  <Badge variant="secondary">POST</Badge>
                  <span className="ml-2">/calendar/events</span>
                  <p className="text-xs text-muted-foreground ml-14">Create new calendar event</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
