import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function APIEndpointsPage() {
  const endpoints = [
    {
      method: "GET",
      path: "/",
      description: "Service info and status",
      status: "Active"
    },
    {
      method: "GET",
      path: "/health",
      description: "Health check for deployment monitoring",
      status: "Active"
    },
    {
      method: "GET",
      path: "/database/status",
      description: "Database stats and website tracking",
      status: "Active"
    },
    {
      method: "GET",
      path: "/database/rentals/{website}",
      description: "Get rentals for specific website",
      status: "Active"
    },
    {
      method: "GET",
      path: "/database/available",
      description: "Get all available rentals with availability dates",
      status: "Active"
    },
    {
      method: "POST",
      path: "/vapi/webhook",
      description: "VAPI webhook handler for rental searches",
      status: "Active"
    },
    {
      method: "GET",
      path: "/calendar/setup",
      description: "Microsoft Calendar setup page",
      status: "Active"
    },
    {
      method: "GET",
      path: "/calendar/auth/start",
      description: "Start Microsoft OAuth flow",
      status: "Active"
    },
    {
      method: "GET",
      path: "/calendar/auth/callback",
      description: "Microsoft OAuth callback handler",
      status: "Active"
    },
    {
      method: "GET",
      path: "/calendar/auth/status",
      description: "Check Microsoft Calendar authentication status",
      status: "Active"
    },
    {
      method: "POST",
      path: "/calendar/events",
      description: "Create calendar appointment",
      status: "Active"
    },
    {
      method: "GET",
      path: "/calendar/availability",
      description: "Get available time slots",
      status: "Active"
    },
    {
      method: "POST",
      path: "/vapi/chat/completions",
      description: "VAPI chat completions endpoint",
      status: "Active"
    },
    {
      method: "GET",
      path: "/vapi/personas",
      description: "List available VAPI personas",
      status: "Active"
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "default";
      case "POST":
        return "secondary";
      case "PUT":
        return "outline";
      case "DELETE":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            API Endpoints
          </h1>
          <p className="text-muted-foreground mt-2">
            Backend API endpoints running on port 8000
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available Endpoints ({endpoints.length})</CardTitle>
            <CardDescription>
              FastAPI backend with VAPI integration, rental search, and Microsoft Calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((endpoint, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Badge variant={getMethodColor(endpoint.method)}>
                        {endpoint.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{endpoint.path}</TableCell>
                    <TableCell>{endpoint.description}</TableCell>
                    <TableCell>
                      <Badge variant="default">{endpoint.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Base URL</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-sm">http://localhost:8000</p>
              <p className="text-xs text-muted-foreground mt-2">
                Production: https://peterentalvapi-latest.onrender.com
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono text-sm"
              >
                http://localhost:8000/docs
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                Interactive OpenAPI (Swagger) documentation
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
