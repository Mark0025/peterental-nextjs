# Google Calendar Backend Integration Guide

## Overview

The frontend now supports **both Microsoft Calendar and Google Calendar** with identical UI and functionality. The backend must route calendar operations to the correct provider automatically.

**IMPORTANT:** Only **one calendar provider** can be connected at a time per user. When a user connects a new provider, the frontend automatically disconnects the existing provider. The backend should enforce this as well.

## Backend Requirements

### 1. Provider Detection

When processing calendar operations, the backend should:

```python
# Pseudocode
def handle_calendar_operation(user_id: str):
    user = get_user_from_db(user_id)
    provider = user.calendar_provider  # 'microsoft' or 'google'

    if provider == 'microsoft':
        return call_microsoft_graph_api(user)
    elif provider == 'google':
        return call_google_calendar_api(user)
    else:
        raise Exception("No calendar provider connected")
```

### 2. Endpoints That Need Provider Routing

These endpoints MUST support both providers transparently:

#### `/calendar/auth/status` (GET)
- Returns: `calendar_provider`, `authorized`, `expires_at`
- Should detect if user has Microsoft OR Google connected
- Response format stays the same regardless of provider

#### `/calendar/availability` (GET)
- Parameters: `days_ahead`, `start_hour`, `end_hour`
- Backend should:
  1. Get `user_id` from JWT token
  2. Check `calendar_provider` from database
  3. Call Microsoft Graph API or Google Calendar API
  4. Return same response format

#### `/calendar/events` (GET)
- Parameters: `days_ahead`
- Backend should route to correct provider
- Return same event format for both providers

#### `/calendar/events` (POST)
- Parameters: `subject`, `start_time`, `end_time`, `attendee_email`
- Backend should route to correct provider
- Return same response format

#### `/vapi/webhook` (POST)
**CRITICAL for Pete voice agent!**
- Receives VAPI function calls: `get_calendar_availability`, `create_calendar_event`
- Parameters include `user_id`
- Backend MUST:
  1. Look up user by email (`user_id`)
  2. Check `calendar_provider` field
  3. Route to Microsoft Graph API or Google Calendar API
  4. Return provider-agnostic response to VAPI

### 3. Database Schema

The `users` table should have these fields:

```sql
-- Microsoft Calendar fields
microsoft_calendar_connected: boolean
microsoft_calendar_email: string
microsoft_calendar_token: string (encrypted)
microsoft_calendar_refresh_token: string (encrypted)
microsoft_calendar_expires_at: timestamp

-- Google Calendar fields
google_calendar_connected: boolean
google_calendar_email: string
google_calendar_token: string (encrypted)
google_calendar_refresh_token: string (encrypted)
google_calendar_expires_at: timestamp

-- Provider tracking (IMPORTANT!)
calendar_provider: enum('microsoft', 'google', NULL)  -- ONLY ONE CAN BE SET!
calendar_name: string  -- Display name of connected calendar
calendar_id: string     -- Calendar ID from provider
calendar_verified: boolean  -- Whether we can access it
calendar_error: string  -- Last error encountered
```

**Single Provider Enforcement:**

When a user connects a new provider, the backend should:
1. Disconnect any existing provider (clear tokens, set `*_calendar_connected` to false)
2. Set the new provider's credentials
3. Update `calendar_provider` to the new provider
4. Only one provider should have `*_calendar_connected = true` at any time

Example logic:
```python
def connect_google_calendar(user_id, google_credentials):
    user = get_user(user_id)

    # Disconnect Microsoft if connected
    if user.microsoft_calendar_connected:
        disconnect_microsoft_calendar(user_id)

    # Connect Google
    user.google_calendar_connected = True
    user.google_calendar_token = google_credentials.token
    user.google_calendar_refresh_token = google_credentials.refresh_token
    user.calendar_provider = 'google'

    # Clear Microsoft data
    user.microsoft_calendar_connected = False
    user.microsoft_calendar_token = None
    user.microsoft_calendar_refresh_token = None

    db.commit()
```

### 4. OAuth Endpoints

Already implemented (confirmed working):

- `/calendar/auth/start` → Microsoft OAuth
- `/calendar/google/auth/start` → Google OAuth
- `/calendar/auth/disconnect` → Disconnect Microsoft
- `/calendar/google/auth/disconnect` → Disconnect Google

### 5. Google Calendar API Integration

The backend needs Google Calendar API client configured with:

**Required OAuth Scopes:**
```
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events
```

**API Operations:**

1. **Get Availability** (equivalent to Microsoft's `findMeetingTimes`):
```python
# Google Calendar API: Get busy times
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

def get_google_availability(user, days_ahead, start_hour, end_hour):
    creds = Credentials(token=user.google_calendar_token)
    service = build('calendar', 'v3', credentials=creds)

    # Get busy times using freeBusy query
    body = {
        "timeMin": start_time.isoformat(),
        "timeMax": end_time.isoformat(),
        "items": [{"id": "primary"}]
    }

    result = service.freebusy().query(body=body).execute()
    busy_times = result['calendars']['primary']['busy']

    # Convert busy times to available slots
    available_slots = calculate_free_slots(busy_times, start_hour, end_hour)

    return available_slots
```

2. **Create Event:**
```python
def create_google_event(user, subject, start_time, end_time, attendee_email=None):
    creds = Credentials(token=user.google_calendar_token)
    service = build('calendar', 'v3', credentials=creds)

    event = {
        'summary': subject,
        'start': {'dateTime': start_time, 'timeZone': 'UTC'},
        'end': {'dateTime': end_time, 'timeZone': 'UTC'},
    }

    if attendee_email:
        event['attendees'] = [{'email': attendee_email}]

    result = service.events().insert(
        calendarId='primary',
        body=event,
        sendUpdates='all'  # Send email invites
    ).execute()

    return result
```

3. **Token Refresh:**
```python
def refresh_google_token(user):
    creds = Credentials(
        token=user.google_calendar_token,
        refresh_token=user.google_calendar_refresh_token,
        token_uri='https://oauth2.googleapis.com/token',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )

    creds.refresh(Request())

    # Update database
    user.google_calendar_token = creds.token
    user.google_calendar_expires_at = creds.expiry
    db.commit()
```

### 6. Response Format Normalization

Both providers should return the same format:

**Availability Response:**
```json
{
  "available_slots": [
    {
      "start_time": "2025-11-01T09:00:00Z",
      "end_time": "2025-11-01T09:30:00Z"
    }
  ],
  "user_email": "user@example.com",
  "days_checked": 7
}
```

**Create Event Response:**
```json
{
  "success": true,
  "event_id": "abc123",
  "calendar_link": "https://calendar.google.com/... or https://outlook.office365.com/...",
  "message": "Event created successfully"
}
```

## Testing Checklist

- [ ] Connect Google Calendar via `/users` page
- [ ] Verify `calendar_provider` set to `'google'` in database
- [ ] Test `/calendar/availability` returns Google free/busy times
- [ ] Test `/calendar/events` (POST) creates Google Calendar event
- [ ] Test VAPI webhook calls route to Google Calendar
- [ ] Test token refresh for Google Calendar
- [ ] Verify email invites sent when creating events with attendees

## Frontend Contract

The frontend expects these endpoints to work **identically** regardless of provider:

✅ Frontend does NOT need to know which provider is connected
✅ Frontend calls same endpoints for both providers
✅ Backend handles all provider routing logic
✅ Same response formats for both providers

## Implementation Priority

**HIGH PRIORITY:**
1. `/vapi/webhook` provider routing (required for Pete voice agent)
2. `/calendar/availability` provider routing
3. `/calendar/events` (POST) provider routing

**MEDIUM PRIORITY:**
4. Token refresh for Google Calendar
5. Error handling and verification

**LOW PRIORITY:**
6. Calendar statistics aggregation
7. Advanced scheduling features

---

**Status:** Frontend ready, backend implementation required for full Google Calendar support.
