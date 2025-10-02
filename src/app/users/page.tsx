"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function UsersPage() {
  const [userEmail, setUserEmail] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<{ authorized: boolean; expires_at?: string } | null>(null);

  useEffect(() => {
    // Check URL params for OAuth callback
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get('auth');
    const email = params.get('email');

    if (authStatus === 'success' && email) {
      // OAuth succeeded - store user and show success
      localStorage.setItem("calendar_user_id", email);
      setCurrentUser(email);
      checkAuthStatus(email);
      // Clean URL
      window.history.replaceState({}, '', '/users');
    } else if (authStatus === 'error') {
      alert(`Authentication failed: ${params.get('message')}`);
      window.history.replaceState({}, '', '/users');
    }

    // Check if user is logged in (stored in localStorage)
    const storedUser = localStorage.getItem("calendar_user_id");
    if (storedUser && !authStatus) {
      setCurrentUser(storedUser);
      checkAuthStatus(storedUser);
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
    }
  };

  const handleAuthenticate = () => {
    if (!userEmail) {
      alert("Please enter your email address");
      return;
    }

    // Store user ID in localStorage
    localStorage.setItem("calendar_user_id", userEmail);
    setCurrentUser(userEmail);

    // Open OAuth flow
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const authUrl = `${apiUrl}/calendar/auth/start?user_id=${encodeURIComponent(userEmail)}`;
    window.open(authUrl, "_blank");

    // Check status after a delay
    setTimeout(() => {
      checkAuthStatus(userEmail);
    }, 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem("calendar_user_id");
    setCurrentUser(null);
    setAuthStatus(null);
    setUserEmail("");
  };

  const handleRefreshStatus = () => {
    if (currentUser) {
      checkAuthStatus(currentUser);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage Microsoft Calendar authenticated users
          </p>
        </div>

        <div className="grid gap-6">
          {/* Current User Status */}
          {currentUser && (
            <Card>
              <CardHeader>
                <CardTitle>Current User</CardTitle>
                <CardDescription>Your calendar connection status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{currentUser}</p>
                    {authStatus && (
                      <div className="mt-2">
                        {authStatus.authorized ? (
                          <Badge className="bg-green-600">Authorized</Badge>
                        ) : (
                          <Badge variant="destructive">Not Authorized</Badge>
                        )}
                        {authStatus.expires_at && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Expires: {new Date(authStatus.expires_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-x-2">
                    <Button onClick={handleRefreshStatus} variant="outline">
                      Refresh Status
                    </Button>
                    <Button onClick={handleLogout} variant="destructive">
                      Logout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add User Card - Only show if not authenticated */}
          {!currentUser && (
            <Card>
              <CardHeader>
                <CardTitle>Connect Microsoft Calendar</CardTitle>
                <CardDescription>Authenticate to grant calendar access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="email" className="text-sm font-medium">
                    Your Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter your email and click below to authenticate with Microsoft:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Enter your email address above</li>
                  <li>Click &quot;Authenticate with Microsoft&quot;</li>
                  <li>Sign in with your Microsoft account</li>
                  <li>Grant calendar permissions</li>
                  <li>Return here to see your connection status</li>
                </ol>
                <div className="pt-4">
                  <Button
                    onClick={handleAuthenticate}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!userEmail}
                  >
                    Authenticate with Microsoft
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Re-authenticate Card - Show if authenticated */}
          {currentUser && authStatus && !authStatus.authorized && (
            <Card>
              <CardHeader>
                <CardTitle>Re-authenticate Required</CardTitle>
                <CardDescription>Your token has expired or is invalid</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTitle>Authentication Needed</AlertTitle>
                  <AlertDescription>
                    Your Microsoft Calendar connection needs to be refreshed. Click below to re-authenticate.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                    const authUrl = `${apiUrl}/calendar/auth/start?user_id=${encodeURIComponent(currentUser)}`;
                    window.open(authUrl, "_blank");
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Re-authenticate with Microsoft
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Authentication Flow Info */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication System</CardTitle>
              <CardDescription>Microsoft OAuth integration for calendar access</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTitle>How It Works</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Your email identifies your calendar session</li>
                    <li>Microsoft OAuth grants secure calendar access</li>
                    <li>Tokens are stored on the server and refreshed automatically</li>
                    <li>You stay logged in until you click &quot;Logout&quot;</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Token Management */}
          <Card>
            <CardHeader>
              <CardTitle>Token Management</CardTitle>
              <CardDescription>How authentication tokens are stored and managed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Server Storage:</h3>
                <p className="text-sm text-muted-foreground">
                  Tokens stored securely in <code className="font-mono">data/calendar_tokens.json</code>
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Stored Information:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Access token (expires in 1 hour, auto-refreshed)</li>
                  <li>Refresh token (long-lived, for token renewal)</li>
                  <li>User email and profile information</li>
                  <li>Token expiration timestamps</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Security Features:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Tokens stored server-side (not exposed to client)</li>
                  <li>Automatic token refresh before expiration</li>
                  <li>Secure OAuth 2.0 flow with MSAL</li>
                  <li>Permissions scoped to calendar operations only</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Multi-User Support */}
          <Card>
            <CardHeader>
              <CardTitle>Multi-User Support</CardTitle>
              <CardDescription>System capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="default">
                <AlertTitle>✅ Multi-User Enabled</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>The system supports multiple authenticated users simultaneously.</p>
                  <p className="mt-2">
                    Each user is identified by their email address, with tokens stored separately
                    on the server. Multiple people can connect their calendars independently.
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* VAPI Integration */}
          <Card>
            <CardHeader>
              <CardTitle>VAPI Integration</CardTitle>
              <CardDescription>How VAPI uses your calendar connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTitle>Voice AI Calendar Access</AlertTitle>
                <AlertDescription>
                  Once authenticated, VAPI can interact with your calendar through voice commands.
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="font-medium mb-2">Available VAPI Functions:</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong>Check Availability</strong> - &quot;What times am I free this week?&quot;
                    <br />
                    <code className="text-xs">POST /calendar/availability?user_id=your@email.com</code>
                  </li>
                  <li>
                    <strong>Schedule Appointment</strong> - &quot;Book a showing for 2pm tomorrow&quot;
                    <br />
                    <code className="text-xs">POST /calendar/events?user_id=your@email.com</code>
                  </li>
                  <li>
                    <strong>Multi-Calendar Support</strong> - Each user&apos;s calendar is accessed independently
                    <br />
                    <code className="text-xs">Pass user_id parameter to specify which calendar</code>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">How It Works:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>User authenticates Microsoft Calendar (you&apos;re here! ✓)</li>
                  <li>Token is stored securely on the backend</li>
                  <li>VAPI makes API calls with user_id parameter</li>
                  <li>Backend uses stored token to access Microsoft Calendar</li>
                  <li>Results returned to VAPI for voice response</li>
                </ol>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  🎙️ Example VAPI Flow:
                </p>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>User:</strong> &quot;When am I free this week?&quot;</p>
                  <p><strong>VAPI:</strong> Calls <code>/calendar/availability</code> with your email</p>
                  <p><strong>Backend:</strong> Uses your stored token to check Microsoft Calendar</p>
                  <p><strong>VAPI:</strong> &quot;You&apos;re free Tuesday at 2pm, Wednesday at 10am...&quot;</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
