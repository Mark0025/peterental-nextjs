'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, Calendar, Clock, MapPin, User, Plus, CheckCircle2 } from 'lucide-react'
import { getCalendarEvents, getAvailability, createCalendarEvent } from '@/actions/calendar-actions'
import type { CalendarEvent, AvailabilitySlot } from '@/types'
import Link from 'next/link'

export default function AppointmentsPage() {
    const { userId, isAuthenticated, calendarConnected } = useUser()
    const [appointments, setAppointments] = useState<CalendarEvent[]>([])
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showBookingForm, setShowBookingForm] = useState(false)

    // Booking form state
    const [propertyAddress, setPropertyAddress] = useState('')
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
    const [attendeeName, setAttendeeName] = useState('')
    const [attendeeEmail, setAttendeeEmail] = useState('')
    const [booking, setBooking] = useState(false)
    const [bookingSuccess, setBookingSuccess] = useState(false)

    useEffect(() => {
        if (userId && calendarConnected) {
            loadData()
        } else {
            setLoading(false)
        }
    }, [userId, calendarConnected])

    const loadData = async () => {
        setLoading(true)
        setError(null)

        try {
            const [eventsResponse, availabilityResponse] = await Promise.all([
                getCalendarEvents(30),
                getAvailability(7, 9, 17),
            ])

            setAppointments(eventsResponse.events || [])
            setAvailability(availabilityResponse.available_slots || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const handleBookAppointment = async () => {
        if (!propertyAddress || !selectedSlot || !attendeeName || !attendeeEmail) {
            setError('Please fill in all required fields')
            return
        }

        setBooking(true)
        setError(null)

        try {
            await createCalendarEvent({
                subject: `Property Viewing - ${propertyAddress}`,
                start_time: selectedSlot.start_time,
                end_time: selectedSlot.end_time,
                body: `Property viewing appointment for ${propertyAddress}\n\nAttendee: ${attendeeName} (${attendeeEmail})`,
                attendee_email: attendeeEmail,
            })

            setBookingSuccess(true)
            setShowBookingForm(false)

            // Reset form
            setPropertyAddress('')
            setSelectedSlot(null)
            setAttendeeName('')
            setAttendeeEmail('')

            // Reload data
            await loadData()

            // Reset success message after 3 seconds
            setTimeout(() => setBookingSuccess(false), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to book appointment')
        } finally {
            setBooking(false)
        }
    }

    const upcomingAppointments = appointments.filter(
        (apt) => new Date(apt.start_time) > new Date()
    )
    const pastAppointments = appointments.filter(
        (apt) => new Date(apt.start_time) <= new Date()
    )

    if (!isAuthenticated || !userId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-8">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                        <CardDescription>
                            Please add a user to manage appointments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/users">
                            <Button className="w-full">Go to User Management</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!calendarConnected) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-8">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Calendar Not Connected</CardTitle>
                        <CardDescription>
                            Connect your Microsoft Calendar to manage appointments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/users">
                            <Button className="w-full">Connect Calendar</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="container mx-auto p-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        📅 Appointments
                    </h1>
                    <p className="text-muted-foreground">
                        Manage property viewing appointments for {userId}
                    </p>
                </div>

                {/* Success Message */}
                {bookingSuccess && (
                    <Alert className="mb-6 border-green-500 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-900">Success!</AlertTitle>
                        <AlertDescription className="text-green-800">
                            Appointment booked successfully
                        </AlertDescription>
                    </Alert>
                )}

                {/* Error Message */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Actions */}
                <div className="mb-6 flex gap-4">
                    <Button
                        onClick={() => setShowBookingForm(!showBookingForm)}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {showBookingForm ? 'Cancel' : 'Book New Appointment'}
                    </Button>
                    <Button onClick={loadData} variant="outline" disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Calendar className="h-4 w-4 mr-2" />
                        )}
                        Refresh
                    </Button>
                </div>

                {/* Booking Form */}
                {showBookingForm && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Book New Appointment</CardTitle>
                            <CardDescription>
                                Schedule a property viewing with an available time slot
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Property Address
                                </label>
                                <Input
                                    value={propertyAddress}
                                    onChange={(e) => setPropertyAddress(e.target.value)}
                                    placeholder="123 Main St, Austin, TX"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Select Available Time Slot ({availability.length} available)
                                </label>
                                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                                    {availability.slice(0, 20).map((slot, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${selectedSlot === slot
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="text-sm font-medium">{slot.formatted_time}</div>
                                            <div className="text-xs text-muted-foreground">{slot.day}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Attendee Name
                                    </label>
                                    <Input
                                        value={attendeeName}
                                        onChange={(e) => setAttendeeName(e.target.value)}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Attendee Email
                                    </label>
                                    <Input
                                        type="email"
                                        value={attendeeEmail}
                                        onChange={(e) => setAttendeeEmail(e.target.value)}
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleBookAppointment}
                                disabled={
                                    booking ||
                                    !propertyAddress ||
                                    !selectedSlot ||
                                    !attendeeName ||
                                    !attendeeEmail
                                }
                                className="w-full"
                            >
                                {booking ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Booking...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Confirm Booking
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Appointments */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Appointments</CardTitle>
                            <CardDescription>
                                {loading ? 'Loading...' : `${upcomingAppointments.length} scheduled`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                </div>
                            ) : upcomingAppointments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>No upcoming appointments</p>
                                    <p className="text-sm mt-1">Book one above to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {upcomingAppointments.map((apt) => (
                                        <div
                                            key={apt.id}
                                            className="p-4 rounded-lg border bg-blue-50 border-blue-200"
                                        >
                                            <div className="font-medium text-gray-900 mb-2">
                                                {apt.subject}
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(apt.start_time).toLocaleString()}
                                                </div>
                                                {apt.location && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-3 w-3" />
                                                        {apt.location}
                                                    </div>
                                                )}
                                                {apt.attendees && apt.attendees.length > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-3 w-3" />
                                                        {apt.attendees.map((a) => a.name || a.email).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Past Appointments */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Past Appointments</CardTitle>
                            <CardDescription>
                                {loading ? 'Loading...' : `${pastAppointments.length} completed`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                </div>
                            ) : pastAppointments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>No past appointments</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {pastAppointments.slice(0, 10).map((apt) => (
                                        <div
                                            key={apt.id}
                                            className="p-4 rounded-lg border bg-gray-50 border-gray-200"
                                        >
                                            <div className="font-medium text-gray-700 mb-2">
                                                {apt.subject}
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(apt.start_time).toLocaleString()}
                                                </div>
                                                {apt.location && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-3 w-3" />
                                                        {apt.location}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

