"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Force cache bust - v2.0

interface TestResult {
  endpoint: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

export default function VAPITestingPage() {
  const [userEmail, setUserEmail] = useState("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    // Load stored user email
    const storedUser = localStorage.getItem("calendar_user_id");
    if (storedUser) {
      setUserEmail(storedUser);
    }

    // Set webhook URL based on environment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    setWebhookUrl(`${apiUrl}/vapi/webhook`);
  }, []);

  const testAvailability = async () => {
    if (!userEmail) {
      alert("Please enter your email");
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/calendar/availability?user_id=${encodeURIComponent(userEmail)}&days_ahead=7`,
        { method: "GET" }
      );
      const data = await response.json();
      setTestResult({ endpoint: "availability", success: response.ok, data });
    } catch (error) {
      setTestResult({
        endpoint: "availability",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setLoading(false);
    }
  };

  const testAuthStatus = async () => {
    if (!userEmail) {
      alert("Please enter your email");
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/calendar/auth/status?user_id=${encodeURIComponent(userEmail)}`
      );
      const data = await response.json();
      setTestResult({ endpoint: "auth/status", success: response.ok, data });
    } catch (error) {
      setTestResult({
        endpoint: "auth/status",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            VAPI Integration Testing
          </h1>
          <p className="text-muted-foreground mt-2">
            Test and configure your VAPI calendar integration
          </p>
        </div>

        <div className="grid gap-6">
          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>VAPI Webhook Configuration</CardTitle>
              <CardDescription>Use this webhook URL in your VAPI dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Webhook URL</label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button onClick={() => copyToClipboard(webhookUrl)} variant="outline">
                    Copy
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertTitle>Configure in VAPI Dashboard</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
                    <li>Go to your VAPI dashboard</li>
                    <li>Navigate to Functions or Tools section</li>
                    <li>Add custom function with this webhook URL</li>
                    <li>Configure function parameters (user_id, days_ahead, etc.)</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Test User Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>Enter your email to test calendar functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="test-email" className="text-sm font-medium">
                    User Email (must be authenticated)
                  </label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="mt-2"
                  />
                  {userEmail && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Testing with: {userEmail}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={testAuthStatus}
                    disabled={loading || !userEmail}
                    variant="outline"
                  >
                    Test Auth Status
                  </Button>
                  <Button
                    onClick={testAvailability}
                    disabled={loading || !userEmail}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Test Get Availability
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  Endpoint: {testResult.endpoint}
                  <Badge className={testResult.success ? "ml-2 bg-green-600" : "ml-2 bg-red-600"}>
                    {testResult.success ? "Success" : "Failed"}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(testResult.data || testResult.error, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* VAPI Function Definitions */}
          <Card>
            <CardHeader>
              <CardTitle>VAPI Function Definitions</CardTitle>
              <CardDescription>Copy these to configure VAPI functions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Get Availability Function</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "name": "get_calendar_availability",
  "description": "Get available time slots in the user's calendar",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": {
        "type": "string",
        "description": "User's email address"
      },
      "days_ahead": {
        "type": "number",
        "description": "Number of days to check (default: 7)"
      }
    },
    "required": ["user_id"]
  },
  "url": "${webhookUrl}",
  "method": "GET"
}`}
                </pre>
              </div>

              <div>
                <h3 className="font-medium mb-2">Create Event Function</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "name": "create_calendar_event",
  "description": "Schedule an appointment in the user's calendar",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": {
        "type": "string",
        "description": "User's email address"
      },
      "subject": {
        "type": "string",
        "description": "Event title/subject"
      },
      "start_time": {
        "type": "string",
        "description": "ISO 8601 start time"
      },
      "end_time": {
        "type": "string",
        "description": "ISO 8601 end time"
      },
      "attendee_email": {
        "type": "string",
        "description": "Attendee email (optional)"
      }
    },
    "required": ["user_id", "subject", "start_time", "end_time"]
  },
  "url": "${webhookUrl}",
  "method": "POST"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
              <CardDescription>Common issues and solutions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <strong className="text-green-600">✅ Multi-Provider Support</strong>
                  <p className="text-muted-foreground">
                    → Works with both Microsoft Calendar and Google Calendar
                    <br />
                    → Backend automatically detects which provider you connected
                    <br />
                    → Same functions work for both providers (transparent to VAPI)
                  </p>
                </div>
                <div>
                  <strong className="text-red-600">❌ Not Authorized</strong>
                  <p className="text-muted-foreground">
                    → Go to the Users page and connect Microsoft Calendar or Google Calendar
                  </p>
                </div>
                <div>
                  <strong className="text-red-600">❌ User not found</strong>
                  <p className="text-muted-foreground">
                    → Make sure the email matches exactly what you used during OAuth
                  </p>
                </div>
                <div>
                  <strong className="text-red-600">❌ Token expired</strong>
                  <p className="text-muted-foreground">
                    → Tokens auto-refresh, but you may need to re-authenticate
                  </p>
                </div>
                <div>
                  <strong className="text-yellow-600">⚠️ VAPI not receiving response</strong>
                  <p className="text-muted-foreground">
                    → Check webhook URL is correct and backend is accessible
                    <br />
                    → Verify VAPI function parameters match API expectations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
