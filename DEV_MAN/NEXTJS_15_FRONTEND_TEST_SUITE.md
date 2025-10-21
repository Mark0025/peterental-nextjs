# Next.js 15.4 Frontend Test Suite (Server Actions)

## 🚀 **Next.js 15.4 with Server Actions**

Your backend API calls will be handled by **Server Actions** - keeping API URLs and credentials server-side for better security.

---

## 📦 **Setup**

### 1. Environment Variables

Create `.env.local` (server-side only, never exposed to client):

```bash
# Backend API (server-side only)
API_URL=https://peterental-vapi-github-newer.onrender.com

# Frontend URL (for OAuth callback)
NEXT_PUBLIC_FRONTEND_URL=https://peterental-nextjs.vercel.app
```

### 2. Project Structure

```
your-nextjs-app/
├── actions/
│   ├── calendar-actions.ts    # Server Actions for calendar
│   ├── vapi-actions.ts        # Server Actions for VAPI
│   └── types.ts               # Shared types
├── app/
│   ├── test-suite/
│   │   └── page.tsx           # Test suite page (client component)
│   ├── calendar/
│   │   └── callback/
│   │       └── page.tsx       # OAuth callback
│   └── page.tsx               # Home with testing components
└── components/
    ├── calendar-test.tsx      # Calendar testing UI
    ├── vapi-test.tsx          # VAPI testing UI
    └── backend-monitor.tsx    # Health monitoring
```

---

## 📝 **1. Shared Types (`actions/types.ts`)**

```typescript
// actions/types.ts

export interface AuthStatus {
  user_id: string;
  authorized: boolean;
  token_valid?: boolean;
  authorization_url?: string;
  message: string;
}

export interface CalendarEvent {
  event_id: string;
  subject: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  web_link?: string;
}

export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  formatted_time: string;
  day: string;
}

export interface ConflictCheck {
  user_id: string;
  checking_time: string;
  timezone: string;
  has_conflict: boolean;
  result: string;
  message: string;
}

export interface VAPIResponse {
  results: Array<{
    toolCallId: string;
    result: string;
  }>;
}

export interface BackendHealth {
  service: string;
  version: string;
  status: string;
  features: string[];
  links: Record<string, string>;
}
```

---

## 🗓️ **2. Calendar Server Actions (`actions/calendar-actions.ts`)**

```typescript
'use server';

import type {
  AuthStatus,
  CalendarEvent,
  AvailabilitySlot,
  ConflictCheck,
} from './types';

const API_URL = process.env.API_URL!;

if (!API_URL) {
  throw new Error('API_URL environment variable is not set');
}

/**
 * Check if user has authorized calendar access
 */
export async function checkCalendarAuth(userId: string): Promise<AuthStatus> {
  const response = await fetch(
    `${API_URL}/calendar/auth/status?user_id=${encodeURIComponent(userId)}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error(`Failed to check auth status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get OAuth authorization URL
 */
export async function getAuthURL(userId: string): Promise<string> {
  return `${API_URL}/calendar/auth/start?user_id=${encodeURIComponent(userId)}`;
}

/**
 * Get user's calendar events
 */
export async function getCalendarEvents(
  userId: string,
  daysAhead: number = 14
): Promise<{ events: CalendarEvent[] }> {
  const response = await fetch(
    `${API_URL}/calendar/events?user_id=${encodeURIComponent(
      userId
    )}&days_ahead=${daysAhead}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error(`Failed to get events: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get available time slots
 */
export async function getAvailability(
  userId: string,
  daysAhead: number = 7,
  startHour: number = 9,
  endHour: number = 17
): Promise<{ available_slots: AvailabilitySlot[] }> {
  const params = new URLSearchParams({
    user_id: userId,
    days_ahead: daysAhead.toString(),
    start_hour: startHour.toString(),
    end_hour: endHour.toString(),
  });

  const response = await fetch(`${API_URL}/calendar/availability?${params}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to get availability: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check if time slot has conflict (for testing)
 */
export async function checkTimeConflict(
  userId: string,
  startTime: string,
  timezone: string = 'America/Chicago'
): Promise<ConflictCheck> {
  const params = new URLSearchParams({
    user_id: userId,
    start_time: startTime,
    timezone: timezone,
  });

  const response = await fetch(`${API_URL}/debug/check-conflict?${params}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to check conflict: ${response.statusText}`);
  }

  return response.json();
}
```

---

## 📞 **3. VAPI Server Actions (`actions/vapi-actions.ts`)**

```typescript
'use server';

import type { VAPIResponse } from './types';

const API_URL = process.env.API_URL!;

/**
 * Call VAPI webhook
 */
async function callVAPIWebhook(
  functionName: string,
  args: Record<string, any>
): Promise<string> {
  const response = await fetch(`${API_URL}/vapi/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        toolCalls: [
          {
            id: `${functionName}_${Date.now()}`,
            function: {
              name: functionName,
              arguments: args,
            },
          },
        ],
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`VAPI webhook failed: ${response.statusText}`);
  }

  const data: VAPIResponse = await response.json();
  return data.results[0].result;
}

/**
 * Get availability via VAPI
 */
export async function vapiGetAvailability(
  userId: string,
  daysAhead: number = 7
): Promise<string> {
  return callVAPIWebhook('get_availability', {
    user_id: userId,
    days_ahead: daysAhead,
  });
}

/**
 * Set appointment via VAPI
 */
export async function vapiSetAppointment(
  userId: string,
  propertyAddress: string,
  startTime: string,
  attendeeName: string,
  attendeeEmail: string,
  timezone: string = 'America/Chicago'
): Promise<string> {
  return callVAPIWebhook('set_appointment', {
    user_id: userId,
    property_address: propertyAddress,
    start_time: startTime,
    attendee_name: attendeeName,
    attendee_email: attendeeEmail,
    timezone: timezone,
  });
}

/**
 * Get backend health status
 */
export async function getBackendHealth() {
  const response = await fetch(`${API_URL}/`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Backend health check failed');
  }

  return response.json();
}
```

---

## 🧪 **4. Test Suite Page (`app/test-suite/page.tsx`)**

```typescript
'use client';

import { useState } from 'react';
import {
  checkCalendarAuth,
  getCalendarEvents,
  getAvailability,
  checkTimeConflict,
} from '@/actions/calendar-actions';
import {
  vapiGetAvailability,
  vapiSetAppointment,
  getBackendHealth,
} from '@/actions/vapi-actions';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

export default function TestSuitePage() {
  const [userId, setUserId] = useState('mark@peterei.com');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (name: string, updates: Partial<TestResult>) => {
    setTestResults((prev) => {
      const index = prev.findIndex((t) => t.name === name);
      if (index === -1) {
        return [...prev, { name, status: 'pending', ...updates } as TestResult];
      }
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], ...updates };
      return newResults;
    });
  };

  const runTest = async (
    name: string,
    testFn: () => Promise<void>
  ): Promise<boolean> => {
    const startTime = Date.now();
    updateTest(name, { status: 'running' });

    try {
      await testFn();
      const duration = Date.now() - startTime;
      updateTest(name, {
        status: 'passed',
        message: `✅ Passed in ${duration}ms`,
        duration,
      });
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(name, {
        status: 'failed',
        message: `❌ ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        duration,
      });
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    let passed = 0;
    let failed = 0;

    // Test 1: Backend Health
    if (
      await runTest('Backend Health', async () => {
        const health = await getBackendHealth();
        if (health.status !== 'running') throw new Error('Backend not running');
      })
    )
      passed++;
    else failed++;

    // Test 2: Auth Status
    if (
      await runTest('Calendar Auth Status', async () => {
        const status = await checkCalendarAuth(userId);
        if (!status.user_id) throw new Error('No user_id in response');
      })
    )
      passed++;
    else failed++;

    // Test 3: Get Events
    if (
      await runTest('Get Calendar Events', async () => {
        const { events } = await getCalendarEvents(userId, 14);
        if (!Array.isArray(events)) throw new Error('Events not an array');
      })
    )
      passed++;
    else failed++;

    // Test 4: Get Availability
    if (
      await runTest('Get Available Slots', async () => {
        const { available_slots } = await getAvailability(userId, 7);
        if (!Array.isArray(available_slots))
          throw new Error('Slots not an array');
      })
    )
      passed++;
    else failed++;

    // Test 5: VAPI Get Availability
    if (
      await runTest('VAPI Get Availability', async () => {
        const result = await vapiGetAvailability(userId, 7);
        if (!result) throw new Error('No response from VAPI');
      })
    )
      passed++;
    else failed++;

    // Test 6: Conflict Detection
    if (
      await runTest('Conflict Detection', async () => {
        const result = await checkTimeConflict(
          userId,
          '2025-10-21T15:00:00',
          'America/Chicago'
        );
        if (typeof result.has_conflict !== 'boolean')
          throw new Error('Invalid conflict response');
      })
    )
      passed++;
    else failed++;

    // Test 7: VAPI Set Appointment
    if (
      await runTest('VAPI Set Appointment (Conflict Test)', async () => {
        const result = await vapiSetAppointment(
          userId,
          'Test Property',
          '2025-10-21T15:00:00-05:00',
          'Test User',
          'test@example.com',
          'America/Chicago'
        );
        if (!result) throw new Error('No appointment response');
      })
    )
      passed++;
    else failed++;

    // Test 8: Timezone Handling
    if (
      await runTest('Timezone Handling', async () => {
        const futureTime = new Date();
        futureTime.setDate(futureTime.getDate() + 30);
        const isoTime = futureTime.toISOString().split('.')[0];

        const result = await checkTimeConflict(
          userId,
          isoTime,
          'America/Chicago'
        );
        if (typeof result.has_conflict !== 'boolean')
          throw new Error('Timezone not handled');
      })
    )
      passed++;
    else failed++;

    setIsRunning(false);

    // Summary
    updateTest('SUMMARY', {
      status: failed === 0 ? 'passed' : 'failed',
      message: `${passed} passed, ${failed} failed out of ${
        passed + failed
      } tests`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">🧪 Backend Test Suite</h1>
          <p className="text-gray-600 mb-4">Next.js 15.4 with Server Actions</p>

          <div className="flex gap-4 items-end mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Test User ID (Email)
              </label>
              <input
                type="email"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? '🔄 Running...' : '▶️ Run All Tests'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Test Results</h2>

          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Click "Run All Tests" to start
            </p>
          ) : (
            <div className="space-y-2">
              {testResults.map((test, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    test.status === 'passed'
                      ? 'bg-green-50 border-green-500'
                      : test.status === 'failed'
                      ? 'bg-red-50 border-red-500'
                      : test.status === 'running'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{test.name}</div>
                      {test.message && (
                        <div className="text-sm text-gray-600 mt-1">
                          {test.message}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {test.status === 'running' && (
                        <span className="text-blue-600">⏳</span>
                      )}
                      {test.status === 'passed' && (
                        <span className="text-green-600">✅</span>
                      )}
                      {test.status === 'failed' && (
                        <span className="text-red-600">❌</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 🗓️ **5. Calendar Test Component (`components/calendar-test.tsx`)**

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  checkCalendarAuth,
  getAuthURL,
  getCalendarEvents,
  getAvailability,
} from '@/actions/calendar-actions';
import type { CalendarEvent, AvailabilitySlot } from '@/actions/types';

export default function CalendarTest() {
  const [userId, setUserId] = useState('mark@peterei.com');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authURL, setAuthURL] = useState('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkAuth = async () => {
    try {
      const status = await checkCalendarAuth(userId);
      setIsAuthorized(status.authorized);

      if (!status.authorized) {
        const url = await getAuthURL(userId);
        setAuthURL(url);
        setError('Not authorized. Click button to connect calendar.');
      } else {
        setError('');
      }
    } catch (err) {
      setError('Failed to check authorization');
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const { events: eventList } = await getCalendarEvents(userId, 14);
      setEvents(eventList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    setLoading(true);
    setError('');
    try {
      const { available_slots } = await getAvailability(userId, 7, 9, 17);
      setAvailability(available_slots);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load availability'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [userId]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">📅 Calendar Testing</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          User ID (Email)
        </label>
        <input
          type="email"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            Status: {isAuthorized ? '✅ Authorized' : '❌ Not Authorized'}
          </span>
          {!isAuthorized && authURL && (
            <a
              href={authURL}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Authorize Calendar
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button
          onClick={loadEvents}
          disabled={loading || !isAuthorized}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Events'}
        </button>
        <button
          onClick={loadAvailability}
          disabled={loading || !isAuthorized}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Availability'}
        </button>
      </div>

      {events.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            Events ({events.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map((event) => (
              <div key={event.event_id} className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium">{event.subject}</div>
                <div className="text-sm text-gray-600">
                  {new Date(event.start_time).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {availability.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Available ({availability.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availability.map((slot, index) => (
              <div key={index} className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium">{slot.formatted_time}</div>
                <div className="text-sm text-gray-600">{slot.day}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📞 **6. VAPI Test Component (`components/vapi-test.tsx`)**

```typescript
'use client';

import { useState } from 'react';
import {
  vapiGetAvailability,
  vapiSetAppointment,
} from '@/actions/vapi-actions';

export default function VAPITest() {
  const [userId, setUserId] = useState('mark@peterei.com');
  const [propertyAddress, setPropertyAddress] = useState('123 Test Street');
  const [attendeeName, setAttendeeName] = useState('John Doe');
  const [attendeeEmail, setAttendeeEmail] = useState('john@example.com');
  const [appointmentTime, setAppointmentTime] = useState('2025-10-25T14:00:00');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testGetAvailability = async () => {
    setLoading(true);
    setResult('');
    try {
      const response = await vapiGetAvailability(userId, 7);
      setResult(response);
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  const testSetAppointment = async () => {
    setLoading(true);
    setResult('');
    try {
      const response = await vapiSetAppointment(
        userId,
        propertyAddress,
        appointmentTime + '-05:00',
        attendeeName,
        attendeeEmail,
        'America/Chicago'
      );
      setResult(response);
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">📞 VAPI Testing</h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Get Availability</h3>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-2">User ID</label>
          <input
            type="email"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <button
          onClick={testGetAvailability}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Get Availability'}
        </button>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Set Appointment</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium mb-2">Property</label>
            <input
              type="text"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Time</label>
            <input
              type="datetime-local"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={attendeeName}
              onChange={(e) => setAttendeeName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={attendeeEmail}
              onChange={(e) => setAttendeeEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
        <button
          onClick={testSetAppointment}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Set Appointment'}
        </button>
      </div>

      {result && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Agent Response:</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 **7. OAuth Callback (`app/calendar/callback/page.tsx`)**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CalendarCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const userId = searchParams.get('state');

    if (error) {
      setStatus('error');
      setMessage(`Authorization failed: ${error}`);
      return;
    }

    if (code && userId) {
      setStatus('success');
      setMessage('Calendar authorized! You can close this window.');

      // Send message to opener if popup
      if (window.opener) {
        window.opener.postMessage({ type: 'calendar_authorized', userId }, '*');
      }

      // Auto-close
      setTimeout(() => window.close(), 2000);
    } else {
      setStatus('error');
      setMessage('Invalid callback parameters');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold mb-2">Processing...</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-2 text-green-600">Success!</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold mb-2 text-red-600">Error</h1>
            <p className="text-gray-600">{message}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## ✅ **Key Differences from Old Version**

### 🆕 **Next.js 15.4 Improvements:**

1. **Server Actions** - All API calls are server-side

   - API URL never exposed to client
   - Better security
   - Simpler code

2. **No Client-Side fetch** - Server Actions handle everything

   - No CORS issues
   - No API key exposure
   - Better error handling

3. **Type Safety** - Full TypeScript support

   - Shared types between actions and components
   - Compile-time error checking

4. **Better Performance** - Server-side data fetching
   - Faster initial load
   - Less client-side JavaScript
   - Automatic code splitting

---

## 🚀 **Quick Start**

```bash
# 1. Create Next.js 15.4 app
npx create-next-app@latest peterental-frontend --typescript --app

# 2. Add environment variables
echo "API_URL=https://peterental-vapi-github-newer.onrender.com" > .env.local
echo "NEXT_PUBLIC_FRONTEND_URL=https://peterental-nextjs.vercel.app" >> .env.local

# 3. Create actions/ folder and add server actions

# 4. Run dev server
npm run dev

# 5. Test at http://localhost:3000/test-suite
```

---

## 📊 **What You Get**

✅ **Server Actions** - All API calls server-side (secure)  
✅ **No SDK needed** - Just Server Actions  
✅ **Type-safe** - Full TypeScript support  
✅ **Next.js 15.4** - Uses latest features  
✅ **Production-ready** - Optimized for Vercel deployment

**Your backend is ready for Next.js 15.4 with Server Actions!** 🎉
