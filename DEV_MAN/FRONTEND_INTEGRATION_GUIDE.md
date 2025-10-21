# Frontend Integration Guide - PeteRental VAPI Backend

**Last Updated:** October 20, 2025 (After Timezone Fix)  
**Backend URL (NEW - Feature Branch):** `https://peterental-vapi-github-newer.onrender.com`  
**Backend URL (OLD - Docker):** `https://peterentalvapi-latest.onrender.com` ⚠️ DEPRECATED  
**Frontend:** Next.js 15 on Vercel  
**Status:** ✅ **New backend includes timezone fix with Pendulum**

---

## 🚨 **IMPORTANT: Test First!**

**Before making ANY changes to your frontend:**

1. ✅ **Test the new backend** - Verify all endpoints work
2. ✅ **Check appointment times** - Ensure timezones are correct
3. ✅ **Update VAPI webhook** - Point to new URL
4. ✅ **Test with VAPI agent** - Make a real call and book appointment
5. ✅ **Then update frontend** - Only after backend is verified

### **Quick Backend Test:**

```bash
# 1. Health check
curl https://peterental-vapi-github-newer.onrender.com/health

# 2. Test availability
curl "https://peterental-vapi-github-newer.onrender.com/calendar/availability?user_id=mark@peterei.com&days_ahead=7"

# 3. Test appointment creation (check the time is correct!)
curl -X POST "https://peterental-vapi-github-newer.onrender.com/vapi/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "toolCalls": [{
        "id": "test_001",
        "function": {
          "name": "set_appointment",
          "arguments": {
            "user_id": "mark@peterei.com",
            "property_address": "Test Property",
            "start_time": "2025-10-23T14:00:00-05:00",
            "attendee_name": "Test",
            "attendee_email": "test@example.com"
          }
        }
      }]
    }
  }'

# 4. Verify appointment shows correct time (should be 2:00 PM)
curl "https://peterental-vapi-github-newer.onrender.com/calendar/events?user_id=mark@peterei.com&days_ahead=14"
```

**Expected:** All tests pass, appointment times are correct ✅

---

## 🎯 **Overview**

Your backend provides:

1. ✅ **Microsoft Calendar OAuth** - User authentication and calendar access
2. ✅ **VAPI Webhook Handler** - Voice AI appointment booking with **timezone fix**
3. ✅ **Calendar Management** - Get availability, create events, list events
4. ✅ **Rental Property Search** - LangChain + DuckDuckGo scraping
5. ✅ **Multi-Agent System** - Support for multiple VAPI agents (ready, not yet exposed via API)
6. ✅ **User Management** - Multi-user support with OAuth tokens
7. ✅ **Timezone Handling** - NEW: Pendulum-powered timezone conversion (no more wrong times!)
8. ✅ **PostgreSQL Database** - Persistent storage for tokens, agents, and appointments

---

## 📋 **Table of Contents**

1. [Environment Setup](#environment-setup)
2. [CORS Configuration](#cors-configuration)
3. [Timezone Handling](#timezone-handling-new)
4. [Authentication Flow](#authentication-flow)
5. [Calendar Integration](#calendar-integration)
6. [VAPI Integration](#vapi-integration)
7. [Rental Search](#rental-search)
8. [TypeScript Types](#typescript-types)
9. [Example Components](#example-components)
10. [Error Handling](#error-handling)
11. [Testing](#testing)
12. [Migration Checklist](#migration-checklist)

---

## 🔧 **Environment Setup**

### **Required Environment Variables**

Create `.env.local` in your Next.js project:

```bash
# ✅ NEW Backend API URL (with timezone fix)
NEXT_PUBLIC_API_URL=https://peterental-vapi-github-newer.onrender.com

# ❌ OLD Backend (deprecated, has timezone bug)
# NEXT_PUBLIC_API_URL=https://peterentalvapi-latest.onrender.com

# For local development
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: Different environments
NEXT_PUBLIC_API_URL_PRODUCTION=https://peterental-vapi-github-newer.onrender.com
NEXT_PUBLIC_API_URL_STAGING=https://peterental-vapi-github-newer.onrender.com

# User timezone (optional, defaults to Central Time)
NEXT_PUBLIC_DEFAULT_TIMEZONE=America/Chicago
```

### **🚨 CRITICAL: Update These Too**

When switching to the new backend, you MUST also update:

1. **VAPI Dashboard** → Webhook URL

   ```
   OLD: https://peterentalvapi-latest.onrender.com/vapi/webhook
   NEW: https://peterental-vapi-github-newer.onrender.com/vapi/webhook
   ```

2. **Azure Portal (Microsoft OAuth)** → Redirect URI

   ```
   OLD: https://peterentalvapi-latest.onrender.com/calendar/auth/callback
   NEW: https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback
   ```

3. **Render Dashboard** → Environment Variables
   ```
   MICROSOFT_REDIRECT_URI=https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback
   FRONTEND_URL=https://peterental-nextjs.vercel.app
   ```

### **API Client Setup**

```typescript
// lib/api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = {
  baseURL: API_URL,

  async get(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async post(endpoint: string, data?: any, options?: RequestInit) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },
};
```

---

## 🌐 **CORS Configuration**

### **Backend CORS Setup**

Your backend is already configured to allow requests from your frontend:

```python
# Backend CORS (already configured)
allow_origins=[
    "https://peterental-nextjs.vercel.app",  # ✅ Your production frontend
    "https://*.vercel.app",                   # ✅ All Vercel preview deployments
    "http://localhost:3000",                  # ✅ Local development
    "http://localhost:3001",                  # ✅ Local development (alt port)
    "*",                                      # ✅ VAPI webhooks (various IPs)
]
```

### **Frontend Fetch Requirements**

**DO NOT need to set these** (backend handles CORS):

- ❌ `mode: 'cors'` - Not needed
- ❌ `credentials: 'include'` - Not needed (unless you add auth cookies)
- ❌ Custom CORS headers - Not needed

**Just use normal fetch:**

```typescript
// ✅ This works (no special CORS config needed)
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/calendar/events`,
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }
);
```

### **Vercel Preview Deployments**

Backend automatically allows ALL Vercel preview URLs:

- ✅ `https://peterental-nextjs-abc123.vercel.app`
- ✅ `https://peterental-nextjs-git-feature-xyz.vercel.app`
- ✅ Any `https://*.vercel.app` URL

No configuration needed! 🎉

### **If You Get CORS Errors**

1. **Check the URL** - Make sure you're using the correct backend URL
2. **Check the protocol** - Must be `https://` not `http://`
3. **Check browser console** - Look for the actual error message
4. **Test with curl** - If curl works but browser doesn't, it's a frontend issue

```bash
# Test endpoint with curl (should work)
curl https://peterental-vapi-github-newer.onrender.com/health
```

---

## 🕐 **Timezone Handling (NEW!)**

### **🎉 Backend Now Handles Timezones Correctly**

The backend was updated with [Pendulum](https://pendulum.eustace.io/) to fix timezone conversion bugs. Your appointments will now show at the correct time!

### **What Changed:**

| Before                                    | After                                  |
| ----------------------------------------- | -------------------------------------- |
| ❌ Times could be off by 5+ hours         | ✅ Times always correct                |
| ❌ Double timezone conversion bug         | ✅ Smart timezone handling             |
| ❌ Complex frontend timezone logic needed | ✅ Send any format, backend handles it |

### **How to Send Times from Frontend:**

**Option 1: Naive Datetime (RECOMMENDED)**

```typescript
// Backend assumes Central Time (America/Chicago)
const appointmentTime = '2025-10-23T14:00:00';

// Backend will create appointment at 2:00 PM Central
```

**Option 2: With Timezone Offset**

```typescript
// Explicitly include timezone
const appointmentTime = '2025-10-23T14:00:00-05:00'; // 2 PM Central

// Backend will correctly parse and create at 2:00 PM
```

**Option 3: UTC (Backend Converts)**

```typescript
// Send UTC time
const appointmentTime = '2025-10-23T19:00:00Z'; // 7 PM UTC

// Backend converts to 2:00 PM Central (UTC-5)
```

### **All Formats Work!**

The backend now handles ALL these formats correctly:

```typescript
// ✅ ISO 8601 naive
'2025-10-23T14:00:00';

// ✅ ISO 8601 with offset
'2025-10-23T14:00:00-05:00';

// ✅ ISO 8601 with Z (UTC)
'2025-10-23T19:00:00Z';

// ✅ Simple format
'2025-10-23 14:00';
```

### **Frontend Date Handling Examples:**

```typescript
// Example 1: User picks a date/time from calendar
function formatAppointmentTime(date: Date): string {
  // Use date-fns or native JS
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  // Return naive datetime (backend assumes Central Time)
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
}

// Example 2: Using date-fns
import { format } from 'date-fns';

const appointmentTime = format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss");

// Example 3: Using native toISOString (includes timezone)
const appointmentTime = selectedDate.toISOString();
// Returns: '2025-10-23T14:00:00.000Z'
// Backend will convert UTC to Central automatically ✅
```

### **Displaying Times to Users:**

```typescript
// When displaying appointment times from API
function displayAppointmentTime(isoString: string): string {
  const date = new Date(isoString);

  // Will display in user's browser timezone
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Example output: "Wednesday, October 23, 2024 at 2:00 PM"
```

### **Testing Timezone Handling:**

```typescript
// Test component
'use client';

export function TimezoneTest() {
  const testAppointment = async () => {
    // Pick a specific time to test
    const testTime = '2025-10-23T14:00:00-05:00'; // 2 PM Central

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/vapi/webhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            toolCalls: [
              {
                id: 'test_timezone',
                function: {
                  name: 'set_appointment',
                  arguments: {
                    user_id: 'mark@peterei.com',
                    property_address: 'TIMEZONE TEST',
                    start_time: testTime,
                    attendee_name: 'Test User',
                    attendee_email: 'test@example.com',
                  },
                },
              },
            ],
          },
        }),
      }
    );

    const result = await response.json();
    console.log('Appointment created:', result);

    // Now check the calendar to verify time
    const eventsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/calendar/events?user_id=mark@peterei.com&days_ahead=14`
    );
    const events = await eventsResponse.json();

    const testEvent = events.events.find((e: any) =>
      e.subject.includes('TIMEZONE TEST')
    );

    console.log('Event in calendar:', testEvent);
    console.log('Start time:', testEvent?.start_time);
    // Should show: "2025-10-23T14:00:00.0000000" (2 PM) ✅
  };

  return <button onClick={testAppointment}>Test Timezone Handling</button>;
}
```

---

## 🔐 **Authentication Flow**

### **Microsoft Calendar OAuth**

Your backend handles the OAuth flow. Frontend just needs to:

#### **1. Initiate OAuth**

```typescript
// components/CalendarConnectButton.tsx
'use client';

import { useState } from 'react';

export function CalendarConnectButton({ userId }: { userId: string }) {
  const [isChecking, setIsChecking] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    authorized: boolean;
    expires_at?: string;
  } | null>(null);

  // Check if user is already authorized
  const checkAuthStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/calendar/auth/status?user_id=${encodeURIComponent(userId)}`
      );
      const data = await response.json();
      setAuthStatus(data);
    } catch (error) {
      console.error('Failed to check auth status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Redirect to OAuth flow
  const startAuth = () => {
    window.location.href = `${
      process.env.NEXT_PUBLIC_API_URL
    }/calendar/auth/start?user_id=${encodeURIComponent(userId)}`;
  };

  return (
    <div>
      <button onClick={checkAuthStatus} disabled={isChecking}>
        {isChecking ? 'Checking...' : 'Check Status'}
      </button>

      {authStatus && (
        <div>
          {authStatus.authorized ? (
            <p>✅ Connected (expires: {authStatus.expires_at})</p>
          ) : (
            <button onClick={startAuth}>🔐 Connect Microsoft Calendar</button>
          )}
        </div>
      )}
    </div>
  );
}
```

#### **2. Handle OAuth Callback**

Backend redirects to: `https://peterental-nextjs.vercel.app/users?auth=success&email=user@example.com`

```typescript
// app/users/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function UsersPage() {
  const searchParams = useSearchParams();
  const authResult = searchParams.get('auth');
  const userEmail = searchParams.get('email');

  useEffect(() => {
    if (authResult === 'success') {
      // Show success message
      console.log('✅ Calendar connected for:', userEmail);
      // Optionally: Update user state, show toast, etc.
    } else if (authResult === 'error') {
      const message = searchParams.get('message');
      console.error('❌ OAuth error:', message);
      // Show error message
    }
  }, [authResult, userEmail]);

  return (
    <div>
      {authResult === 'success' && (
        <div className="success-banner">
          ✅ Calendar connected successfully for {userEmail}!
        </div>
      )}
      {/* Rest of your users page */}
    </div>
  );
}
```

---

## 📅 **Calendar Integration**

### **Available Calendar Endpoints**

#### **1. Get Availability**

```typescript
// Get available time slots
async function getAvailability(userId: string, daysAhead = 7) {
  const response = await fetch(
    `${API_URL}/calendar/availability?user_id=${encodeURIComponent(
      userId
    )}&days_ahead=${daysAhead}`
  );
  return response.json();
}

// Usage
const availability = await getAvailability('mark@peterei.com');
console.log(availability.available_slots);
// [
//   { start: '2025-10-21T09:00:00Z', end: '2025-10-21T09:30:00Z' },
//   { start: '2025-10-21T09:30:00Z', end: '2025-10-21T10:00:00Z' },
//   ...
// ]
```

#### **2. Create Calendar Event**

```typescript
// Create a property viewing appointment
async function createAppointment({
  userId,
  subject,
  startTime,
  endTime,
  body,
  attendeeEmail,
}: {
  userId: string;
  subject: string;
  startTime: string; // ISO 8601 format (any timezone format works!)
  endTime: string;
  body?: string;
  attendeeEmail?: string;
}) {
  const response = await fetch(`${API_URL}/calendar/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      subject,
      start_time: startTime,
      end_time: endTime,
      body,
      attendee_email: attendeeEmail,
    }),
  });
  return response.json();
}

// Usage - All these time formats work correctly now! ✅
const appointment = await createAppointment({
  userId: 'mark@peterei.com',
  subject: 'Property Viewing: 123 Main St',

  // Option 1: Naive datetime (backend assumes Central Time)
  startTime: '2025-10-21T14:00:00',
  endTime: '2025-10-21T14:30:00',

  // Option 2: With timezone offset
  // startTime: '2025-10-21T14:00:00-05:00',
  // endTime: '2025-10-21T14:30:00-05:00',

  // Option 3: UTC (backend converts to Central)
  // startTime: '2025-10-21T19:00:00Z',
  // endTime: '2025-10-21T19:30:00Z',

  body: 'Viewing appointment for 2-bedroom apartment',
  attendeeEmail: 'client@example.com',
});
```

#### **3. List Upcoming Events**

```typescript
// Get user's upcoming calendar events
async function getUpcomingEvents(userId: string, daysAhead = 14) {
  const response = await fetch(
    `${API_URL}/calendar/events?user_id=${encodeURIComponent(
      userId
    )}&days_ahead=${daysAhead}`
  );
  return response.json();
}

// Usage
const events = await getUpcomingEvents('mark@peterei.com');
console.log(events.events);
// [
//   {
//     id: 'event_123',
//     subject: 'Property Viewing: 123 Main St',
//     start_time: '2025-10-21T14:00:00Z',
//     end_time: '2025-10-21T14:30:00Z',
//     attendees: [{ name: 'John Doe', email: 'john@example.com' }],
//     web_link: 'https://outlook.office365.com/...'
//   },
//   ...
// ]
```

### **Full Calendar Component Example**

```typescript
// components/CalendarManager.tsx
'use client';

import { useState, useEffect } from 'react';

interface Event {
  id: string;
  subject: string;
  start_time: string;
  end_time: string;
  attendees: Array<{ name: string; email: string }>;
  location: string;
  web_link: string;
}

export function CalendarManager({ userId }: { userId: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [userId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/calendar/events?user_id=${encodeURIComponent(userId)}&days_ahead=14`
      );
      const data = await response.json();

      if (data.status === 'success') {
        setEvents(data.events);
      } else if (data.status === 'error') {
        console.error('Not authorized:', data.message);
        // Redirect to auth flow
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (formData: {
    subject: string;
    startTime: string;
    endTime: string;
    attendeeEmail: string;
  }) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/calendar/events`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            subject: formData.subject,
            start_time: formData.startTime,
            end_time: formData.endTime,
            attendee_email: formData.attendeeEmail,
          }),
        }
      );

      const data = await response.json();

      if (data.status === 'success') {
        await loadEvents(); // Refresh list
        return data.event;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Failed to create appointment:', error);
      throw error;
    }
  };

  if (loading) return <div>Loading calendar...</div>;

  return (
    <div>
      <h2>Upcoming Appointments</h2>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            <strong>{event.subject}</strong>
            <p>
              {new Date(event.start_time).toLocaleString()} -
              {new Date(event.end_time).toLocaleTimeString()}
            </p>
            {event.attendees.length > 0 && (
              <p>Attendees: {event.attendees.map((a) => a.name).join(', ')}</p>
            )}
            <a href={event.web_link} target="_blank" rel="noopener noreferrer">
              View in Calendar
            </a>
          </li>
        ))}
      </ul>

      {/* Add appointment form here */}
    </div>
  );
}
```

---

## 🎙️ **VAPI Integration**

### **VAPI Webhook Testing**

Your backend handles VAPI webhooks, but you can test them from frontend for debugging:

```typescript
// Test VAPI webhook endpoint
async function testVAPIWebhook(
  functionName: 'get_availability' | 'set_appointment',
  params: any
) {
  const response = await fetch(`${API_URL}/vapi/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        toolCalls: [
          {
            id: `test_${Date.now()}`,
            function: {
              name: functionName,
              arguments: params,
            },
          },
        ],
      },
    }),
  });
  return response.json();
}

// Usage: Test get_availability
const result = await testVAPIWebhook('get_availability', {
  user_id: 'mark@peterei.com',
  property_address: '123 Main St',
});
console.log(result);
// {
//   results: [{
//     toolCallId: 'test_1234567890',
//     result: 'I have several viewing times available for 123 Main St...'
//   }]
// }
```

### **Get VAPI Assistants List**

```typescript
// Get list of VAPI assistants
async function getVAPIAssistants() {
  const response = await fetch(`${API_URL}/vapi/assistants`);
  return response.json();
}

// Usage
const assistants = await getVAPIAssistants();
console.log(assistants.assistants);
// [
//   {
//     id: '24464697-8f45-4b38-b43a-d337f50c370e',
//     name: 'Appointment Setter Agent',
//     model: 'gpt-4',
//     voice: 'jennifer',
//     tools: [...]
//   },
//   ...
// ]
```

---

## 🏠 **Rental Property Search**

### **Search for Rentals**

```typescript
// Search rental properties via VAPI webhook
async function searchRentals(website: string) {
  const response = await fetch(`${API_URL}/vapi/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      website: website,
    }),
  });
  return response.json();
}

// Usage
const rentals = await searchRentals('https://example-property-site.com');
```

### **Get Database Status**

```typescript
// Get rental database statistics
async function getDatabaseStatus() {
  const response = await fetch(`${API_URL}/database/status`);
  return response.json();
}

// Usage
const stats = await getDatabaseStatus();
console.log(stats.database_stats);
// {
//   total_rentals: 42,
//   total_websites: 5,
//   last_updated: '2025-10-20T14:30:00Z'
// }
```

### **Get Available Rentals**

```typescript
// Get all available rental properties
async function getAvailableRentals() {
  const response = await fetch(`${API_URL}/database/available`);
  return response.json();
}

// Usage
const availableRentals = await getAvailableRentals();
console.log(availableRentals.rentals);
// [
//   {
//     address: '123 Main St',
//     price: '$1,500/month',
//     bedrooms: '2',
//     bathrooms: '1',
//     available_date: 'Immediate',
//     availability_status: 'Available Now',
//     days_until_available: 0
//   },
//   ...
// ]
```

---

## 📦 **TypeScript Types**

Create these types for type safety:

```typescript
// types/api.ts

// Calendar Types
export interface CalendarEvent {
  id: string;
  subject: string;
  start_time: string;
  end_time: string;
  location: string;
  attendees: Array<{
    name: string;
    email: string;
  }>;
  is_online_meeting: boolean;
  web_link: string;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
}

export interface CalendarAuthStatus {
  authorized: boolean;
  expires_at?: string;
}

// VAPI Types
export interface VAPIAssistant {
  id: string;
  name: string;
  model: string;
  voice: string;
  firstMessage: string;
  tools: any[];
  createdAt: string;
  updatedAt: string;
}

export interface VAPIWebhookRequest {
  message: {
    toolCalls: Array<{
      id: string;
      function: {
        name: string;
        arguments: Record<string, any>;
      };
    }>;
  };
}

export interface VAPIWebhookResponse {
  results: Array<{
    toolCallId: string;
    result: string;
  }>;
}

// Rental Types
export interface RentalProperty {
  address: string;
  property_type?: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  square_feet?: string;
  available_date: string;
  availability_status?: string;
  days_until_available?: number | string;
}

export interface DatabaseStats {
  total_rentals: number;
  total_websites: number;
  last_updated: string;
}

// API Response Types
export interface APIResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}
```

---

## 🧩 **Example Components**

### **Complete Calendar Integration Component**

```typescript
// components/PropertyViewingScheduler.tsx
'use client';

import { useState, useEffect } from 'react';
import type { AvailabilitySlot, CalendarEvent } from '@/types/api';

interface Props {
  userId: string;
  propertyAddress: string;
}

export function PropertyViewingScheduler({ userId, propertyAddress }: Props) {
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null
  );

  // Form state
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/calendar/availability?user_id=${encodeURIComponent(
          userId
        )}&days_ahead=7`
      );
      const data = await response.json();

      if (data.status === 'success') {
        setAvailableSlots(data.available_slots);
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const bookAppointment = async () => {
    if (!selectedSlot || !attendeeEmail) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/calendar/events`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            subject: `Property Viewing: ${propertyAddress}`,
            start_time: selectedSlot.start,
            end_time: selectedSlot.end,
            body: `Viewing appointment for ${propertyAddress}`,
            attendee_email: attendeeEmail,
          }),
        }
      );

      const data = await response.json();

      if (data.status === 'success') {
        alert('✅ Appointment booked successfully!');
        setSelectedSlot(null);
        setAttendeeName('');
        setAttendeeEmail('');
        await loadAvailability(); // Refresh
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to book appointment:', error);
      alert('❌ Failed to book appointment');
    }
  };

  useEffect(() => {
    loadAvailability();
  }, [userId]);

  return (
    <div className="property-viewing-scheduler">
      <h3>Schedule a Viewing for {propertyAddress}</h3>

      {loading ? (
        <p>Loading available times...</p>
      ) : (
        <>
          <div className="time-slots">
            <h4>Available Times:</h4>
            {availableSlots.length === 0 ? (
              <p>No available times found</p>
            ) : (
              <ul>
                {availableSlots.slice(0, 10).map((slot, index) => (
                  <li key={index}>
                    <button
                      onClick={() => setSelectedSlot(slot)}
                      className={selectedSlot === slot ? 'selected' : ''}
                    >
                      {new Date(slot.start).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedSlot && (
            <div className="booking-form">
              <h4>Book Appointment</h4>
              <p>Selected: {new Date(selectedSlot.start).toLocaleString()}</p>

              <input
                type="text"
                placeholder="Your Name"
                value={attendeeName}
                onChange={(e) => setAttendeeName(e.target.value)}
              />

              <input
                type="email"
                placeholder="Your Email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                required
              />

              <button onClick={bookAppointment} disabled={!attendeeEmail}>
                Confirm Booking
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

---

## ⚠️ **Error Handling**

### **Common Errors and How to Handle**

```typescript
// utils/api-error-handler.ts
export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}

export async function handleAPIResponse(response: Response) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    // Not authorized - redirect to OAuth
    if (response.status === 401 || data.message?.includes('Not authorized')) {
      throw new APIError(401, 'Please connect your calendar first', data);
    }

    // Rate limited
    if (response.status === 429) {
      throw new APIError(
        429,
        'Too many requests, please try again later',
        data
      );
    }

    // Server error
    if (response.status >= 500) {
      throw new APIError(500, 'Server error, please try again', data);
    }

    throw new APIError(response.status, data.message || 'Request failed', data);
  }

  return response.json();
}

// Usage in components
try {
  const data = await handleAPIResponse(response);
  // Handle success
} catch (error) {
  if (error instanceof APIError) {
    if (error.status === 401) {
      // Redirect to OAuth
      window.location.href = `/calendar/connect?user_id=${userId}`;
    } else {
      // Show error message to user
      setError(error.message);
    }
  }
}
```

---

## 🧪 **Testing**

### **API Testing Utilities**

```typescript
// __tests__/utils/api-test-helpers.ts
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function testHealthCheck() {
  const response = await fetch(`${API_URL}/health`);
  const data = await response.json();
  return data.status === 'healthy';
}

export async function testCalendarAuth(userId: string) {
  const response = await fetch(
    `${API_URL}/calendar/auth/status?user_id=${encodeURIComponent(userId)}`
  );
  const data = await response.json();
  return data.authorized;
}

export async function testVAPIWebhook() {
  const response = await fetch(`${API_URL}/vapi/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        toolCalls: [
          {
            id: 'test',
            function: {
              name: 'get_availability',
              arguments: {
                user_id: 'test@example.com',
                property_address: 'Test Property',
              },
            },
          },
        ],
      },
    }),
  });
  return response.ok;
}
```

---

## 📊 **API Endpoint Reference**

### **Complete Endpoint List**

| Endpoint                      | Method | Description             | Auth Required |
| ----------------------------- | ------ | ----------------------- | ------------- |
| `/`                           | GET    | Server info             | No            |
| `/health`                     | GET    | Health check            | No            |
| `/docs`                       | GET    | API documentation       | No            |
| **Calendar**                  |        |                         |               |
| `/calendar/auth/start`        | GET    | Start OAuth flow        | No            |
| `/calendar/auth/callback`     | GET    | OAuth callback          | No            |
| `/calendar/auth/status`       | GET    | Check auth status       | No            |
| `/calendar/availability`      | GET    | Get available slots     | Yes           |
| `/calendar/events`            | GET    | List upcoming events    | Yes           |
| `/calendar/events`            | POST   | Create calendar event   | Yes           |
| **VAPI**                      |        |                         |               |
| `/vapi/webhook`               | POST   | VAPI function handler   | No            |
| `/vapi/assistants`            | GET    | List VAPI assistants    | No            |
| **Rental Search**             |        |                         |               |
| `/database/status`            | GET    | Database statistics     | No            |
| `/database/rentals/{website}` | GET    | Get rentals for website | No            |
| `/database/available`         | GET    | Get available rentals   | No            |

---

## 🚀 **Quick Start Example**

Complete working example to get started:

```typescript
// app/calendar-demo/page.tsx
'use client';

import { useState } from 'react';

export default function CalendarDemoPage() {
  const [userId] = useState('mark@peterei.com'); // Replace with actual user
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const checkAuth = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/calendar/auth/status?user_id=${userId}`
    );
    const data = await response.json();
    console.log('Auth status:', data);
    return data.authorized;
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const isAuthorized = await checkAuth();

      if (!isAuthorized) {
        alert('Please connect your calendar first');
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/calendar/auth/start?user_id=${userId}`;
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/calendar/events?user_id=${userId}`
      );
      const data = await response.json();

      if (data.status === 'success') {
        setEvents(data.events);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Calendar Integration Demo</h1>

      <button onClick={checkAuth}>Check Authorization</button>
      <button onClick={loadEvents} disabled={loading}>
        {loading ? 'Loading...' : 'Load Events'}
      </button>

      {events.length > 0 && (
        <div>
          <h2>Upcoming Events</h2>
          <ul>
            {events.map((event: any) => (
              <li key={event.id}>
                <strong>{event.subject}</strong>
                <br />
                {new Date(event.start_time).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## ✅ **Migration Checklist**

### **Step 1: Update Environment Variables**

```bash
# In your .env.local
NEXT_PUBLIC_API_URL=https://peterental-vapi-github-newer.onrender.com
```

### **Step 2: Update VAPI Webhook URL**

Go to [VAPI Dashboard](https://dashboard.vapi.ai) and update webhook URL:

```
https://peterental-vapi-github-newer.onrender.com/vapi/webhook
```

### **Step 3: Update Azure OAuth Redirect**

Go to [Azure Portal](https://portal.azure.com) and add redirect URI:

```
https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback
```

### **Step 4: Test Backend First**

```bash
# 1. Health check
curl https://peterental-vapi-github-newer.onrender.com/health

# 2. Test calendar
curl "https://peterental-vapi-github-newer.onrender.com/calendar/auth/status?user_id=mark@peterei.com"

# 3. Test appointment with timezone
curl -X POST "https://peterental-vapi-github-newer.onrender.com/vapi/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "toolCalls": [{
        "id": "test",
        "function": {
          "name": "set_appointment",
          "arguments": {
            "user_id": "mark@peterei.com",
            "property_address": "Test Property",
            "start_time": "2025-10-23T14:00:00-05:00",
            "attendee_name": "Test",
            "attendee_email": "test@example.com"
          }
        }
      }]
    }
  }'

# 4. Verify appointment time is correct (should be 2:00 PM)
curl "https://peterental-vapi-github-newer.onrender.com/calendar/events?user_id=mark@peterei.com&days_ahead=14" | jq '.events[] | select(.subject | contains("Test")) | {subject, start_time}'
```

### **Step 5: Deploy Frontend Changes**

Only after backend is verified:

1. ✅ Update environment variables in Vercel
2. ✅ Push code changes (if any)
3. ✅ Verify frontend can connect to new backend
4. ✅ Test calendar OAuth flow
5. ✅ Test appointment booking (verify times are correct!)

### **Step 6: Test VAPI Agent**

1. ✅ Call your VAPI agent
2. ✅ Say: "I'd like to book a viewing for tomorrow at 2 PM"
3. ✅ Check your Microsoft Calendar
4. ✅ **Verify appointment shows at 2:00 PM** (not wrong time)

### **Step 7: Clean Up**

After everything works:

1. ✅ Delete old Render service (Docker-based)
2. ✅ Remove old backend URL from VAPI
3. ✅ Remove old OAuth redirect from Azure
4. ✅ Update documentation

---

## 🚨 **Common Issues and Fixes**

### **Issue: "Failed to fetch" error**

```typescript
// ❌ Wrong
const response = await fetch('http://localhost:8000/calendar/events');

// ✅ Correct
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/calendar/events`
);
```

### **Issue: Appointment times are wrong**

```typescript
// Check what you're sending
console.log('Sending time:', startTime);

// After backend processes, check calendar
const events = await fetch(`${API_URL}/calendar/events?user_id=${userId}`);
console.log('Calendar shows:', events.events[0].start_time);

// Should match! If not, check timezone format
```

### **Issue: CORS error**

```bash
# Test with curl first
curl https://peterental-vapi-github-newer.onrender.com/calendar/events?user_id=mark@peterei.com

# If curl works but browser doesn't:
# 1. Check you're using HTTPS not HTTP
# 2. Check the URL is correct
# 3. Check browser console for actual error
# 4. Make sure you're not using localhost URL in production
```

### **Issue: OAuth redirect not working**

```typescript
// Make sure redirect URL matches Azure portal
// Backend redirects to: https://peterental-nextjs.vercel.app/users?auth=success

// Check your users page handles the query params:
const searchParams = useSearchParams();
const authResult = searchParams.get('auth');
console.log('Auth result:', authResult);
```

### **Issue: VAPI webhook not responding**

```bash
# Test webhook directly
curl -X POST "https://peterental-vapi-github-newer.onrender.com/vapi/webhook" \
  -H "Content-Type: application/json" \
  -d '{"message": {"toolCalls": [{"id": "test", "function": {"name": "get_availability", "arguments": {"user_id": "mark@peterei.com", "property_address": "Test"}}}]}}'

# Should return:
# {"results": [{"toolCallId": "test", "result": "I have several viewing times..."}]}
```

---

## 📊 **API Health Monitoring**

### **Frontend Health Check Component**

```typescript
// components/BackendStatus.tsx
'use client';

import { useState, useEffect } from 'react';

export function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'error'>(
    'checking'
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
      const data = await response.json();

      if (data.status === 'healthy') {
        setStatus('healthy');
        setMessage('Backend is operational ✅');
      } else {
        setStatus('error');
        setMessage('Backend returned unhealthy status');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Cannot connect to backend');
    }
  };

  return (
    <div className={`status-indicator ${status}`}>
      <span>{message}</span>
      <button onClick={checkHealth}>Refresh</button>
    </div>
  );
}
```

---

## 🎯 **Next Steps for Frontend**

### **Immediate Integration**

1. **Set up environment variables** (`NEXT_PUBLIC_API_URL`)
2. **Create API client** (utils/api-client.ts)
3. **Implement OAuth flow** (calendar connection button)
4. **Test calendar integration** (load events, create appointments)

### **Full Feature Implementation**

1. **User Dashboard:**

   - Show calendar auth status
   - List upcoming appointments
   - Quick stats (total appointments, etc.)

2. **Property Listings:**

   - Display available rentals from backend
   - "Schedule Viewing" button for each property
   - Integration with calendar scheduler

3. **Appointment Scheduler:**

   - Show available time slots
   - Book appointment form
   - Confirmation page with calendar invite

4. **VAPI Testing Page:**
   - Test webhook calls
   - View VAPI assistants
   - Debug tool for development

### **Production Considerations**

1. **Error Handling:**

   - Implement proper error boundaries
   - Show user-friendly error messages
   - Handle OAuth failures gracefully

2. **Loading States:**

   - Skeleton loaders for calendar events
   - Loading spinners for API calls
   - Optimistic updates for better UX

3. **Caching:**

   - Use React Query or SWR for data fetching
   - Cache calendar events locally
   - Implement refresh mechanism

4. **Security:**
   - Validate user inputs
   - Sanitize data from API
   - Implement CSRF protection

---

## 📚 **Additional Resources**

### **Backend Documentation**

- **NEW Backend API Docs:** `https://peterental-vapi-github-newer.onrender.com/docs`
- **NEW Health Check:** `https://peterental-vapi-github-newer.onrender.com/health`
- **NEW Calendar Setup:** `https://peterental-vapi-github-newer.onrender.com/calendar/setup`
- ~~OLD Backend (deprecated):~~ `https://peterentalvapi-latest.onrender.com`

### **Related Documents**

- [PRODUCTION_ANALYSIS.md](./PRODUCTION_ANALYSIS.md) - Backend architecture
- [TESTING_FEATURE_BRANCH_GUIDE.md](./TESTING_FEATURE_BRANCH_GUIDE.md) - How to test
- [CICD_STATUS_REPORT.md](./CICD_STATUS_REPORT.md) - Deployment status
- [TIMEZONE_FIX_SUMMARY.md](./TIMEZONE_FIX_SUMMARY.md) - **NEW: Timezone bug fix details**
- [BACKEND_TEST_REPORT.md](./BACKEND_TEST_REPORT.md) - **NEW: All endpoint test results**
- [TIMEZONE_BUG_REPORT.md](./TIMEZONE_BUG_REPORT.md) - Bug analysis and fix

### **Key Changes in New Backend**

| Feature                | Old Backend              | New Backend                    |
| ---------------------- | ------------------------ | ------------------------------ |
| **Deployment**         | Docker Hub               | GitHub direct                  |
| **Timezone Handling**  | ❌ Double-conversion bug | ✅ Pendulum-powered            |
| **Appointment Times**  | ❌ Could be wrong        | ✅ Always correct              |
| **Database**           | PostgreSQL               | PostgreSQL + migrations        |
| **Token Storage**      | PostgreSQL               | PostgreSQL (improved)          |
| **Multi-user Support** | Limited                  | ✅ Full support                |
| **URL**                | `peterentalvapi-latest`  | `peterental-vapi-github-newer` |

### **Breaking Changes**

⚠️ **IMPORTANT:** No breaking changes in API format!

- ✅ All endpoints same
- ✅ All response formats same
- ✅ Only URL changed
- ✅ Timezone handling improved (accepts more formats)

**You only need to update the base URL!**

---

## 🎨 **Design Considerations for Beautiful UI**

### **Recommended UI Components**

1. **Calendar Integration:**

   - Use Shadcn/ui Calendar component
   - Show availability in a visual calendar
   - Highlight available time slots
   - Gray out booked times

2. **Appointment Booking Flow:**

   - Step 1: Select property
   - Step 2: Choose date/time from calendar
   - Step 3: Enter contact info
   - Step 4: Confirmation with calendar invite

3. **Loading States:**

   - Skeleton loaders for calendar events
   - Smooth transitions between states
   - Progress indicators for API calls

4. **Error Handling:**

   - Toast notifications for errors
   - Friendly error messages
   - Retry buttons
   - Fallback UI

5. **Real-time Updates:**
   - Use SWR or React Query for data fetching
   - Auto-refresh calendar every 5 minutes
   - Optimistic updates for better UX

### **Example: Beautiful Calendar Picker**

```typescript
// Using Shadcn/ui Calendar
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function AppointmentBooking({
  propertyAddress,
}: {
  propertyAddress: string;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState([]);

  const loadSlotsForDate = async (date: Date) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/calendar/availability?user_id=mark@peterei.com&days_ahead=7`
    );
    const data = await response.json();

    // Filter slots for selected date
    const slotsForDate = data.available_slots.filter((slot: any) => {
      const slotDate = new Date(slot.start_time);
      return slotDate.toDateString() === date.toDateString();
    });

    setAvailableSlots(slotsForDate);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Date picker */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Select a Date</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            setSelectedDate(date);
            if (date) loadSlotsForDate(date);
          }}
          disabled={(date) => date < new Date()}
          className="rounded-md border"
        />
      </div>

      {/* Time slots */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Times</h3>
        {selectedDate ? (
          <div className="space-y-2">
            {availableSlots.map((slot: any) => (
              <Button
                key={slot.start_time}
                variant="outline"
                className="w-full justify-start"
                onClick={() => bookSlot(slot)}
              >
                {new Date(slot.start_time).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Button>
            ))}
            {availableSlots.length === 0 && (
              <p className="text-muted-foreground">
                No available times for this date
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Please select a date first</p>
        )}
      </div>
    </div>
  );
}
```

---

**Created:** October 20, 2025  
**Updated:** October 20, 2025 (After Timezone Fix)  
**Status:** ✅ Complete and production-ready with timezone fix  
**Backend Version:** 1.0.0 + Pendulum timezone handling  
**Backend URL:** `https://peterental-vapi-github-newer.onrender.com`  
**Next.js Compatibility:** v13+ (App Router) or v12+ (Pages Router)

---

## 🎉 **Summary**

**Your frontend now has:**

1. ✅ **Correct timezone handling** - No more wrong appointment times!
2. ✅ **Complete API reference** - All endpoints documented
3. ✅ **TypeScript types** - Full type safety
4. ✅ **Example components** - Ready to use
5. ✅ **Error handling** - Robust error management
6. ✅ **CORS configured** - No CORS issues
7. ✅ **Migration guide** - Step-by-step instructions
8. ✅ **Testing utilities** - Verify everything works

**Next Steps:**

1. ✅ Test backend first (before changing frontend)
2. ✅ Update environment variables
3. ✅ Update VAPI webhook URL
4. ✅ Deploy frontend with new backend URL
5. ✅ Test end-to-end with VAPI agent
6. ✅ Build beautiful UI with confidence!

**🚀 Your frontend now has everything it needs to integrate with the backend!**
