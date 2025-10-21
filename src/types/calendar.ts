// Calendar-specific types

import type { CalendarEvent, AvailabilitySlot } from './api'

// Extended calendar types for UI
export interface CalendarDay {
  date: Date
  events: CalendarEvent[]
  hasAvailability: boolean
  availableSlots: AvailabilitySlot[]
}

export interface CalendarWeek {
  weekNumber: number
  days: CalendarDay[]
}

export interface CalendarMonth {
  month: number // 0-11
  year: number
  weeks: CalendarWeek[]
}

// Appointment booking form
export interface AppointmentFormData {
  userId: string
  propertyAddress: string
  startTime: string // ISO 8601
  endTime: string // ISO 8601
  attendeeName?: string
  attendeeEmail: string
  attendeePhone?: string
  notes?: string
}

export interface AppointmentFormErrors {
  propertyAddress?: string
  startTime?: string
  endTime?: string
  attendeeEmail?: string
  general?: string
}

// Calendar view types
export type CalendarView = 'day' | 'week' | 'month' | 'list'

// Calendar filter options
export interface CalendarFilters {
  startDate: Date
  endDate: Date
  showOnlyAvailable?: boolean
  propertyType?: string
}

// Time slot selection
export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  reason?: string // Why unavailable (if not available)
}

// Calendar event with additional UI properties
export interface CalendarEventUI extends CalendarEvent {
  isSelected?: boolean
  isPast: boolean
  isToday: boolean
  isTomorrow: boolean
  color?: string
  icon?: string
}

