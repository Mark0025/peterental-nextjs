import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

async function getCalendarStatus() {
  try {
    const response = await fetch('http://localhost:8000/calendar/auth/status', {
      cache: 'no-store'
    });
    return response.json();
  } catch {
    return null;
  }
}

export default async function CalendarPage() {
  const calendarStatus = await getCalendarStatus();

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
              {calendarStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">Status:</span>
                    <Badge variant={calendarStatus.authenticated ? "default" : "secondary"}>
                      {calendarStatus.authenticated ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  {calendarStatus.authenticated && calendarStatus.user_email && (
                    <div className="flex items-center gap-4">
                      <span className="font-medium">Connected as:</span>
                      <span className="font-mono text-sm">{calendarStatus.user_email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertTitle>Unable to fetch status</AlertTitle>
                  <AlertDescription>
                    Make sure the Python backend is running on port 8000
                  </AlertDescription>
                </Alert>
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
                <a href="http://localhost:8000/calendar/auth/start" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    {calendarStatus?.authenticated ? "Reconnect Calendar" : "Connect Microsoft Calendar"}
                  </Button>
                </a>
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
