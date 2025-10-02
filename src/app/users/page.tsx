import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function UsersPage() {
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
          <Card>
            <CardHeader>
              <CardTitle>Authentication System</CardTitle>
              <CardDescription>Microsoft OAuth integration for calendar access</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTitle>Microsoft Calendar OAuth</AlertTitle>
                <AlertDescription>
                  Users authenticate via Microsoft OAuth to grant calendar permissions.
                  Tokens are stored securely and refreshed automatically.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Add User Card */}
          <Card>
            <CardHeader>
              <CardTitle>Add New User</CardTitle>
              <CardDescription>Authenticate additional users for calendar access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To add a new user, they must complete the Microsoft OAuth flow:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click &quot;Authenticate with Microsoft&quot; below</li>
                <li>Sign in with their Microsoft account</li>
                <li>Grant calendar permissions</li>
                <li>Tokens will be stored for API access</li>
              </ol>
              <div className="pt-4">
                <a href="http://localhost:8000/calendar/auth/start" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Authenticate with Microsoft
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Token Storage Info */}
          <Card>
            <CardHeader>
              <CardTitle>Token Management</CardTitle>
              <CardDescription>How authentication tokens are stored and managed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Token Storage:</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  data/calendar_tokens.json
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Stored Information:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Access token (expires in 1 hour)</li>
                  <li>Refresh token (long-lived, for token renewal)</li>
                  <li>User email and profile information</li>
                  <li>Token expiration timestamps</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Security Features:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Tokens stored locally (not in database)</li>
                  <li>Automatic token refresh before expiration</li>
                  <li>Secure OAuth 2.0 flow with PKCE</li>
                  <li>Permissions scoped to calendar operations only</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Multi-User Support */}
          <Card>
            <CardHeader>
              <CardTitle>Multi-User Support</CardTitle>
              <CardDescription>Current implementation status</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="default">
                <AlertTitle>Single User Mode</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>The current implementation stores one user&apos;s tokens at a time.</p>
                  <p className="mt-2">
                    <strong>To add multi-user support:</strong> Modify the token storage to use a
                    database with user_id as key, allowing multiple authenticated users.
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
