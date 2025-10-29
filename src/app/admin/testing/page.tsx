'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Settings, Database, Calendar, Home, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useCurrentUser } from '@/hooks/use-current-user'
import Link from 'next/link'

interface User {
    id: string
    clerk_user_id: string
    email: string
    first_name?: string
    last_name?: string
    microsoft_calendar_connected: boolean
    google_calendar_connected: boolean
    calendar_provider?: string
    calendar_verified?: boolean
    created_at: string
}

export default function AdminTestingPage() {
    const { user: currentUser, isLoading: userLoading } = useCurrentUser()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    useEffect(() => {
        fetchAllUsers()
    }, [])

    const fetchAllUsers = async () => {
        setLoading(true)
        setError(null)

        try {
            // TODO: Replace with actual admin API endpoint
            // const response = await fetch('/api/admin/users')
            // const data = await response.json()
            // setUsers(data.users)

            // Mock users for demonstration
            const mockUsers: User[] = [
                {
                    id: '1',
                    clerk_user_id: currentUser?.clerk_user_id || 'user_34Qq8GSCZfnEvFffTzIhx1hXJR8',
                    email: currentUser?.email || 'mark@localhousebuyers.net',
                    first_name: currentUser?.first_name || 'Mark',
                    last_name: currentUser?.last_name || 'Carpenter',
                    microsoft_calendar_connected: currentUser?.microsoft_calendar_connected || true,
                    google_calendar_connected: currentUser?.google_calendar_connected || false,
                    calendar_provider: currentUser?.calendar_provider || 'microsoft',
                    calendar_verified: currentUser?.calendar_verified || true,
                    created_at: currentUser?.created_at || new Date().toISOString()
                },
                {
                    id: '2',
                    clerk_user_id: 'user_test_alice_123',
                    email: 'alice@example.com',
                    first_name: 'Alice',
                    last_name: 'Smith',
                    microsoft_calendar_connected: false,
                    google_calendar_connected: true,
                    calendar_provider: 'google',
                    calendar_verified: true,
                    created_at: '2025-10-15T00:00:00Z'
                },
                {
                    id: '3',
                    clerk_user_id: 'user_test_bob_456',
                    email: 'bob@example.com',
                    first_name: 'Bob',
                    last_name: 'Johnson',
                    microsoft_calendar_connected: true,
                    google_calendar_connected: false,
                    calendar_provider: 'microsoft',
                    calendar_verified: false,
                    created_at: '2025-10-20T00:00:00Z'
                }
            ]

            setUsers(mockUsers)
        } catch (err) {
            console.error('Failed to fetch users:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }

    const handleUserSwitch = (user: User) => {
        setSelectedUser(user)
        // TODO: Implement user impersonation
        // This would typically involve:
        // 1. Setting a session/cookie to impersonate the user
        // 2. Refreshing the app state
        // 3. Redirecting to the user's dashboard
        console.log('Switching to user:', user.email)
    }

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.clerk_user_id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    // TODO: Add proper admin role check
    const isAdmin = currentUser?.email?.includes('mark@') || false

    if (!isAdmin) {
        return (
            <div className="container mx-auto py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>          Access Denied</AlertTitle>
                    <AlertDescription>
                        You don&apos;t have permission to access the admin testing interface.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Settings className="h-8 w-8" />
                    Admin Testing Interface
                </h1>
                <p className="text-muted-foreground mt-2">
                    Switch between users to test different configurations and data
                </p>
            </div>

            {/* Warning Banner */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Testing Environment</AlertTitle>
                <AlertDescription>
                    This interface is for testing purposes only. Changes made while impersonating users will affect real data.
                </AlertDescription>
            </Alert>

            {/* Current User Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Current User
                    </CardTitle>
                    <CardDescription>You are currently logged in as:</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">
                                {currentUser?.first_name} {currentUser?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                                {currentUser?.clerk_user_id}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {currentUser?.microsoft_calendar_connected && (
                                <Badge variant="default">🔵 Microsoft</Badge>
                            )}
                            {currentUser?.google_calendar_connected && (
                                <Badge variant="default">🔴 Google</Badge>
                            )}
                            {!currentUser?.microsoft_calendar_connected && !currentUser?.google_calendar_connected && (
                                <Badge variant="secondary">No Calendar</Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-4">
                <Link href="/dashboard">
                    <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Home className="h-8 w-8 text-blue-500" />
                                <div>
                                    <p className="font-medium">Dashboard</p>
                                    <p className="text-xs text-muted-foreground">View as current user</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/calendar/events">
                    <Card className="hover:border-green-300 transition-colors cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-8 w-8 text-green-500" />
                                <div>
                                    <p className="font-medium">Calendar</p>
                                    <p className="text-xs text-muted-foreground">View events</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/rentals">
                    <Card className="hover:border-purple-300 transition-colors cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Home className="h-8 w-8 text-purple-500" />
                                <div>
                                    <p className="font-medium">Rentals</p>
                                    <p className="text-xs text-muted-foreground">View properties</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/agent-builder">
                    <Card className="hover:border-orange-300 transition-colors cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Database className="h-8 w-8 text-orange-500" />
                                <div>
                                    <p className="font-medium">Agents</p>
                                    <p className="text-xs text-muted-foreground">VAPI config</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* User List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Users</CardTitle>
                            <CardDescription>
                                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
                            </CardDescription>
                        </div>
                        <Button onClick={fetchAllUsers} variant="outline" size="sm">
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by email, name, or Clerk ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Loading */}
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className={`border rounded-lg p-4 hover:border-blue-300 transition-colors ${selectedUser?.id === user.id ? 'border-blue-500 bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <p className="font-medium">
                                                        {user.first_name} {user.last_name}
                                                        {user.id === currentUser?.id && (
                                                            <Badge variant="default" className="ml-2">You</Badge>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">
                                                        {user.clerk_user_id}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mt-3">
                                                {/* Calendar Status */}
                                                {user.microsoft_calendar_connected && (
                                                    <Badge variant="outline" className="text-xs">
                                                        🔵 Microsoft {user.calendar_verified ? '✓' : '✗'}
                                                    </Badge>
                                                )}
                                                {user.google_calendar_connected && (
                                                    <Badge variant="outline" className="text-xs">
                                                        🔴 Google {user.calendar_verified ? '✓' : '✗'}
                                                    </Badge>
                                                )}
                                                {!user.microsoft_calendar_connected && !user.google_calendar_connected && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        No Calendar
                                                    </Badge>
                                                )}

                                                {/* Account Age */}
                                                <Badge variant="outline" className="text-xs">
                                                    Created: {new Date(user.created_at).toLocaleDateString()}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {user.id !== currentUser?.id && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleUserSwitch(user)}
                                                    >
                                                        <ArrowRight className="h-4 w-4 mr-1" />
                                                        Switch
                                                    </Button>
                                                    <Link href={`/users/${user.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            View
                                                        </Button>
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Implementation Notes */}
            <Card>
                <CardHeader>
                    <CardTitle>Implementation Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                        <strong>TODO:</strong> The following features need to be implemented:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Add admin role check to backend (check user permissions)</li>
                        <li>Create <code>/api/admin/users</code> endpoint to fetch all users</li>
                        <li>Implement user impersonation (session/cookie-based)</li>
                        <li>Add ability to edit user data (calendar connections, etc.)</li>
                        <li>Add company grouping (future feature)</li>
                        <li>Add audit log for admin actions</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}

