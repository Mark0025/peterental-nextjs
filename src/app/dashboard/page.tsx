import { getDashboardStats } from "@/actions/dashboard-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Users, Home, Activity, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Your personalized analytics and activity overview
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Agents Metric */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.agents.total}</div>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-green-600">{stats.agents.active} active</Badge>
                {stats.agents.inactive > 0 && (
                  <Badge variant="secondary">{stats.agents.inactive} inactive</Badge>
                )}
              </div>
              <Link href="/agent-builder">
                <Button variant="link" className="px-0 mt-2 h-auto">
                  Manage agents →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Rentals Metric */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rentals.total}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Tracking {stats.rentals.websites} website{stats.rentals.websites !== 1 ? 's' : ''}
              </p>
              <Link href="/rentals">
                <Button variant="link" className="px-0 mt-2 h-auto">
                  View properties →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Calendar Metric */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calendar</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {stats.calendar.microsoft.connected && (
                  <div>
                    <Badge className="bg-blue-600">Microsoft</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.calendar.microsoft.email}
                    </p>
                  </div>
                )}
                {stats.calendar.google.connected && (
                  <div>
                    <Badge className="bg-green-600">Google</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.calendar.google.email}
                    </p>
          </div>
        )}
                {!stats.calendar.anyConnected && (
                  <Badge variant="outline" className="w-fit">Not connected</Badge>
                )}
              </div>
              <Link href="/users">
                <Button variant="link" className="px-0 mt-2 h-auto">
                  {stats.calendar.anyConnected ? 'Manage' : 'Connect'} calendar →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
              <CardDescription>Your latest actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.rentals.total > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Properties Updated</p>
                      <p className="text-xs text-muted-foreground">
                        Last updated: {new Date(stats.rentals.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {stats.agents.total > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Agents Active</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.agents.active} agent{stats.agents.active !== 1 ? 's' : ''} running
                      </p>
                    </div>
                  </div>
                )}
                {stats.calendar.anyConnected && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Calendar Connected</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.calendar.microsoft.connected && 'Microsoft'} 
                        {stats.calendar.microsoft.connected && stats.calendar.google.connected && ' & '}
                        {stats.calendar.google.connected && 'Google'}
                      </p>
                    </div>
          </div>
        )}
                {!stats.agents.total && !stats.rentals.total && !stats.calendar.anyConnected && (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <CardTitle>Quick Actions</CardTitle>
              </div>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Link href="/agent-builder">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Create New Agent
                  </Button>
                </Link>
                <Link href="/rentals">
                  <Button variant="outline" className="w-full justify-start">
                    <Home className="h-4 w-4 mr-2" />
                    Browse Properties
                  </Button>
                </Link>
                <Link href="/calendar/events">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Calendar
                  </Button>
                </Link>
                <Link href="/users">
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Backend: FastAPI + LangChain + Playwright</p>
          <p>Frontend: Next.js 15.5.4 + shadcn/ui + TypeScript</p>
        </div>
      </div>
    </div>
  );
}
