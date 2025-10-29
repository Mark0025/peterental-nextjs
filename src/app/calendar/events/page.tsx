'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Calendar, Clock, Users, MapPin, Loader2, AlertCircle, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getCalendarEvents, getAvailability } from '@/actions/calendar-actions'
import type { GetEventsResponse, GetAvailabilityResponse } from '@/types'
import { useCurrentUser } from '@/hooks/use-current-user'
import Link from 'next/link'

type CalendarEvent = NonNullable<GetEventsResponse['events']>[number]
type AvailableSlot = NonNullable<GetAvailabilityResponse['available_slots']>[number]

export default function CalendarEventsPage() {
    const { user, isLoading: userLoading } = useCurrentUser()
    const searchParams = useSearchParams()
    const provider = (searchParams.get('provider') as 'microsoft' | 'google') || 'microsoft'

    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [availability, setAvailability] = useState<AvailableSlot[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'events' | 'availability'>('events')

    useEffect(() => {
        if (!user || userLoading) return

        const fetchCalendarData = async () => {
            setLoading(true)
            setError(null)

            try {
                if (activeTab === 'events') {
                    const response = await getCalendarEvents(14)
                    setEvents(response.events || [])
                } else {
                    const response = await getAvailability(7, 9, 17)
                    setAvailability(response.available_slots || [])
                }
            } catch (err) {
                console.error('Failed to fetch calendar data:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch calendar data')
            } finally {
                setLoading(false)
            }
        }

        fetchCalendarData()
    }, [user, userLoading, activeTab])

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="container mx-auto py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Not Authenticated</AlertTitle>
                    <AlertDescription>
                        Please sign in to view your calendar.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const isConnected = provider === 'google' ? user.google_calendar_connected : user.microsoft_calendar_connected

    if (!isConnected) {
        return (
            <div className="container mx-auto py-8">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Calendar Not Connected</AlertTitle>
                    <AlertDescription>
                        Please connect your {provider === 'google' ? 'Google' : 'Microsoft'} Calendar first.
                        <Link href="/users" className="ml-2 text-blue-600 hover:underline">
                            Go to Profile
                        </Link>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Calendar Events</h1>
                    <p className="text-muted-foreground">
                        {provider === 'google' ? 'Google Calendar' : 'Microsoft Calendar'} - {user.calendar_email || user.email}
                    </p>
                </div>
                <Link href="/appointments">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Book Appointment
                    </Button>
                </Link>
            </div>

            {/* Calendar Link */}
            {user.calendar_link && (
                <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertTitle>View Full Calendar</AlertTitle>
                    <AlertDescription>
                        <a
                            href={user.calendar_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            Open in {provider === 'google' ? 'Google Calendar' : 'Outlook'}
                        </a>
                    </AlertDescription>
                </Alert>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                <button
                    onClick={() => setActiveTab('events')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'events'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Upcoming Events
                </button>
                <button
                    onClick={() => setActiveTab('availability')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'availability'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Available Slots
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="ml-3 text-muted-foreground">Loading calendar data...</p>
                </div>
            ) : error ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : activeTab === 'events' ? (
                <div className="space-y-4">
                    {events.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-muted-foreground">No upcoming events in the next 14 days</p>
                            </CardContent>
                        </Card>
                    ) : (
                        events.map((event) => (
                            <Card key={event.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{event.subject}</CardTitle>
                                            <CardDescription className="flex items-center gap-4 mt-2">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(event.start_time).toLocaleTimeString()} - {new Date(event.end_time).toLocaleTimeString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(event.start_time).toLocaleDateString()}
                                                </span>
                                            </CardDescription>
                                        </div>
                                        <Badge variant="default">
                                            Event
                                        </Badge>
                                    </div>
                                </CardHeader>
                                {(event.location || event.attendees.length > 0 || event.body) && (
                                    <CardContent className="space-y-2">
                                        {event.location && (
                                            <div className="flex items-start gap-2 text-sm">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <span>{event.location}</span>
                                            </div>
                                        )}
                                        {event.attendees.length > 0 && (
                                            <div className="flex items-start gap-2 text-sm">
                                                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <span>{event.attendees.length} attendee(s)</span>
                                            </div>
                                        )}
                                        {event.body && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">{event.body}</p>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {availability.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-muted-foreground">No available slots in the next 7 days</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    All time slots between 9 AM - 5 PM are booked
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {availability.map((slot, index) => (
                                <Card key={index} className="hover:border-blue-300 transition-colors">
                                    <CardHeader>
                                        <CardTitle className="text-base">{new Date(slot.start_time).toLocaleDateString()}</CardTitle>
                                        <CardDescription className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(slot.start_time).toLocaleTimeString()} - {new Date(slot.end_time).toLocaleTimeString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" size="sm">
                                            Book This Slot
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

