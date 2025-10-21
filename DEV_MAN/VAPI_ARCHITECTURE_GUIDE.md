# 🏗️ VAPI Architecture Guide: Frontend vs Backend

**Last Updated:** October 20, 2025  
**For:** Pete CRM - Multi-user rental management system (100+ users)  
**Current Stack:** Next.js 15.4 (Frontend) + Python FastAPI (Backend)

---

## 🎯 TL;DR - What Goes Where?

### ✅ Frontend (Next.js) - UI & User Interaction

- Voice UI components
- Call controls (start/stop)
- Real-time transcription display
- Assistant selection
- Call analytics visualization
- User preferences

### ✅ Backend (Python FastAPI) - Business Logic & Data

- VAPI webhook handling (function calls)
- Microsoft Calendar integration
- Database operations
- User authentication
- Business rules (availability, conflicts)
- Multi-user data management

### ⚙️ VAPI Dashboard - Agent Configuration

- Create assistants
- Configure voices & models
- Define functions/tools
- Set webhook URLs
- Manage API keys

---

## 📊 Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         Next.js 15 Frontend (Your Website)             │    │
│  │  • Voice UI (VAPI Web SDK)                            │    │
│  │  • Real-time transcription                            │    │
│  │  • Call controls                                      │    │
│  │  • Assistant selector                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                           ↕ ↕ ↕                                 │
│                     WebSocket / HTTP                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      VAPI.AI PLATFORM                           │
│  • Voice recognition (speech-to-text)                          │
│  • Natural language understanding (GPT-4)                      │
│  • Voice synthesis (text-to-speech)                            │
│  • Function call detection                                     │
│  • 16 Assistants (configured in dashboard)                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    When function called
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            YOUR PYTHON BACKEND (FastAPI)                        │
│  https://peterental-vapi-github-newer.onrender.com            │
│                                                                 │
│  ✅ Webhook: /vapi/webhook                                     │
│     • Receives function calls from VAPI                        │
│     • get_availability → check Microsoft Calendar              │
│     • set_appointment → create calendar event                  │
│                                                                 │
│  ✅ Calendar: /calendar/*                                      │
│     • OAuth with Microsoft                                     │
│     • Get events, create events                                │
│     • Check conflicts                                          │
│                                                                 │
│  ✅ Database: PostgreSQL                                       │
│     • User tokens                                              │
│     • Multi-user support (100+ users)                          │
│     • Appointment history                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Breakdown: Frontend vs Backend

### 1. Frontend (Next.js) - What You CAN Do

#### A. Voice UI & Interaction (Client-Side)

```typescript
// ✅ FRONTEND: Voice call controls
import Vapi from '@vapi-ai/web';

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

// Start call
await vapi.start('assistant-id');

// Stop call
await vapi.stop();

// Send text message
await vapi.send({
  type: 'add-message',
  message: { role: 'user', content: 'Hello' },
});
```

**What This Does:**

- Connects user's microphone/speaker to VAPI
- Handles WebRTC audio streaming
- Displays real-time transcription
- Shows call status

**What It DOESN'T Do:**

- Doesn't handle business logic
- Doesn't access calendar
- Doesn't make database changes
- Doesn't execute functions

#### B. Server Actions (Next.js Server-Side)

```typescript
// ✅ FRONTEND: Next.js Server Actions (backend-like)
'use server';

export async function getCalendarEvents(userId: string) {
  // This runs on Next.js server, not browser
  const response = await fetch(
    `${BACKEND_URL}/calendar/events?user_id=${userId}`
  );
  return response.json();
}
```

**What This Does:**

- Calls your Python backend from Next.js server
- Hides API URLs from browser
- Can use secret keys (not exposed to client)
- Acts as a proxy to your Python backend

**What It DOESN'T Do:**

- Doesn't handle VAPI webhooks (that's Python)
- Doesn't replace your Python backend
- Just a convenient way to call your backend

---

### 2. Backend (Python FastAPI) - What You MUST Do Here

#### A. VAPI Webhook Handler (Required!)

```python
# ✅ BACKEND: VAPI webhook
@app.post("/vapi/webhook")
async def vapi_webhook(request: VAPIWebhookRequest):
    """
    VAPI calls THIS when user says:
    "What times are available?" → get_availability
    "Book me for 2pm" → set_appointment
    """

    for tool_call in request.message.toolCalls:
        function_name = tool_call.function.name
        args = tool_call.function.arguments

        if function_name == "get_availability":
            # Check Microsoft Calendar
            slots = await get_calendar_availability(
                user_id=args['user_id'],
                days_ahead=args.get('days_ahead', 7)
            )

            return {
                "results": [{
                    "toolCallId": tool_call.id,
                    "result": f"Available times: {format_slots(slots)}"
                }]
            }

        elif function_name == "set_appointment":
            # Create calendar event
            event = await create_calendar_event(
                user_id=args['user_id'],
                property_address=args['property_address'],
                start_time=args['start_time'],
                attendee_name=args['attendee_name'],
                attendee_email=args['attendee_email']
            )

            return {
                "results": [{
                    "toolCallId": tool_call.id,
                    "result": f"Appointment booked at {event.start_time}"
                }]
            }
```

**Why This MUST Be in Python Backend:**

1. VAPI needs a public webhook URL (can't be browser)
2. Requires Microsoft Calendar access (OAuth tokens in DB)
3. Multi-user support (100+ users with different tokens)
4. Business logic (conflict detection, timezone handling)
5. Database writes (appointment history)

**Can This Be in Next.js?**

- ❌ NO, because VAPI needs a stable webhook endpoint
- ❌ Next.js API routes could work but you'd lose:
  - Your existing OAuth implementation
  - Database integration
  - Python timezone handling (Pendulum)
  - LangChain rental search

#### B. Calendar Integration (Required!)

```python
# ✅ BACKEND: Microsoft OAuth & Calendar
@app.get("/calendar/auth/start")
async def start_oauth(user_id: str):
    """Redirect user to Microsoft login"""

@app.get("/calendar/auth/callback")
async def oauth_callback(code: str, state: str):
    """Receive OAuth token from Microsoft"""
    # Store token in PostgreSQL

@app.get("/calendar/events")
async def get_events(user_id: str):
    """Get user's calendar events"""
    token = db.get_token(user_id)  # From PostgreSQL
    # Call Microsoft Graph API
```

**Why This MUST Be in Python Backend:**

1. OAuth requires server-side secret keys
2. Tokens stored in database (multi-user)
3. Microsoft Graph API calls (not possible from browser)

---

### 3. VAPI Dashboard - What You Configure There

#### A. Create Assistants

```
Go to: https://dashboard.vapi.ai/assistants

1. Click "Create Assistant"
2. Name: "Pete Rental Agent - Property A"
3. Model: GPT-4
4. Voice: Jennifer
5. First Message: "Hi! I can help you schedule a property viewing."
```

#### B. Add Functions/Tools

```
In Assistant Settings → Functions:

Function 1: get_availability
{
  "name": "get_availability",
  "description": "Check available times for property viewing",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": { "type": "string" },
      "days_ahead": { "type": "number" }
    }
  },
  "url": "https://peterental-vapi-github-newer.onrender.com/vapi/webhook"
}

Function 2: set_appointment
{
  "name": "set_appointment",
  "description": "Book a property viewing appointment",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": { "type": "string" },
      "property_address": { "type": "string" },
      "start_time": { "type": "string" },
      "attendee_name": { "type": "string" },
      "attendee_email": { "type": "string" }
    }
  },
  "url": "https://peterental-vapi-github-newer.onrender.com/vapi/webhook"
}
```

**Why Configure Here:**

- VAPI needs to know what functions exist
- Defines when to call each function
- Natural language → function mapping

---

## 🚀 What You Already Have

### ✅ Python Backend Endpoints

```bash
# Health & Info
GET  /                    # Service info
GET  /health              # Health check

# Calendar OAuth
GET  /calendar/auth/start          # Start Microsoft OAuth
GET  /calendar/auth/callback       # OAuth callback
GET  /calendar/auth/status         # Check if user authorized

# Calendar Management
GET  /calendar/events              # Get user's events
POST /calendar/events              # Create new event
GET  /calendar/availability        # Get free time slots

# VAPI Integration
POST /vapi/webhook                 # VAPI function handler
GET  /vapi/assistants              # List all VAPI assistants

# Rental Search (DuckDuckGo)
GET  /search/rental                # Search rental properties

# Database
GET  /database/status              # System status
GET  /database/rentals             # All rentals
GET  /database/available           # Available rentals
```

### ✅ Next.js Frontend Pages

```bash
/                          # Home page
/dashboard                 # Properties dashboard
/appointments              # Appointment management
/users                     # User management & calendar connection
/vapi-agent                # Voice AI interface
/test-suite                # Backend test suite
```

### ✅ Next.js Server Actions

```typescript
// Already implemented
-checkCalendarAuth() -
  getCalendarEvents() -
  getAvailability() -
  createCalendarEvent() -
  vapiGetAvailability() -
  vapiSetAppointment() -
  getRentalsStatus() -
  getAvailableRentals();
```

---

## 🎨 How to Add New VAPI Features

### Scenario 1: Add "Cancel Appointment" Function

#### Step 1: Python Backend (Required)

```python
# backend/app/routers/vapi.py

@app.post("/vapi/webhook")
async def vapi_webhook(request: VAPIWebhookRequest):
    for tool_call in request.message.toolCalls:
        # ... existing code ...

        elif function_name == "cancel_appointment":
            # NEW FUNCTION
            event_id = args['event_id']
            user_id = args['user_id']

            # Delete from Microsoft Calendar
            await delete_calendar_event(user_id, event_id)

            return {
                "results": [{
                    "toolCallId": tool_call.id,
                    "result": "Appointment cancelled successfully"
                }]
            }
```

#### Step 2: VAPI Dashboard (Required)

```
Go to VAPI Dashboard → Assistant → Functions

Add Function:
{
  "name": "cancel_appointment",
  "description": "Cancel an existing appointment",
  "parameters": {
    "type": "object",
    "properties": {
      "event_id": { "type": "string" },
      "user_id": { "type": "string" }
    }
  },
  "url": "https://peterental-vapi-github-newer.onrender.com/vapi/webhook"
}
```

#### Step 3: Next.js Frontend (Optional - for testing)

```typescript
// src/actions/vapi-actions.ts

export async function vapiCancelAppointment(
  userId: string,
  eventId: string
): Promise<string> {
  return callVAPIWebhook('cancel_appointment', {
    user_id: userId,
    event_id: eventId,
  });
}
```

**Summary:**

- ✅ Backend: Handle the actual cancellation
- ✅ VAPI Dashboard: Tell VAPI the function exists
- ✅ Frontend: Optional, just for UI testing

---

### Scenario 2: Add "Get Property Details" Function

#### Step 1: Python Backend (Required)

```python
@app.post("/vapi/webhook")
async def vapi_webhook(request: VAPIWebhookRequest):
    # ... existing code ...

    elif function_name == "get_property_details":
        property_id = args['property_id']

        # Query your database
        property = db.query(Property).filter(Property.id == property_id).first()

        return {
            "results": [{
                "toolCallId": tool_call.id,
                "result": f"Property at {property.address} has {property.bedrooms} bedrooms, {property.bathrooms} bathrooms, rent is ${property.rent}/month"
            }]
        }
```

#### Step 2: VAPI Dashboard

```json
{
  "name": "get_property_details",
  "description": "Get details about a specific rental property",
  "parameters": {
    "type": "object",
    "properties": {
      "property_id": { "type": "string" }
    }
  },
  "url": "https://peterental-vapi-github-newer.onrender.com/vapi/webhook"
}
```

---

### Scenario 3: Add Visual Feature (No Backend Needed!)

#### Live Transcription Display

```typescript
// src/components/features/vapi/live-transcription.tsx
// ✅ FRONTEND ONLY - No backend changes!

'use client';

import { useState, useEffect } from 'react';
import Vapi from '@vapi-ai/web';

export function LiveTranscription() {
  const [transcript, setTranscript] = useState([]);

  useEffect(() => {
    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

    vapi.on('message', (message) => {
      if (message.type === 'transcript') {
        setTranscript((prev) => [...prev, message]);
      }
    });
  }, []);

  return (
    <div>
      {transcript.map((line, i) => (
        <div key={i}>{line.text}</div>
      ))}
    </div>
  );
}
```

**No backend changes needed because:**

- VAPI Web SDK sends transcripts directly to browser
- No business logic required
- No database writes
- Pure UI enhancement

---

## 📋 Decision Matrix: Where Should This Go?

### Frontend (Next.js) ✅

- [ ] User wants to **see** something (transcription, analytics)
- [ ] User wants to **control** call (start/stop/pause)
- [ ] User wants to **select** assistant
- [ ] Pure UI enhancement
- [ ] No database writes
- [ ] No business logic

**Examples:**

- Live transcription display
- Call analytics dashboard
- Assistant selector
- Conversation history (localStorage)
- Notifications

### Backend (Python) ✅

- [ ] VAPI assistant needs to **do** something (get data, create appointment)
- [ ] Requires **Microsoft Calendar** access
- [ ] Requires **database** read/write
- [ ] Requires **OAuth tokens**
- [ ] Multi-user logic (100+ users)
- [ ] Business rules (availability, conflicts)

**Examples:**

- get_availability
- set_appointment
- cancel_appointment
- get_property_details
- search_rentals

### VAPI Dashboard ✅

- [ ] Creating new **assistant**
- [ ] Changing **voice** or **model**
- [ ] Adding new **function/tool**
- [ ] Updating **system prompt**
- [ ] Configuring **webhook URL**

**Examples:**

- Create "Property A Agent"
- Add "cancel_appointment" function
- Change voice from Jennifer to Alloy
- Update first message

---

## 🎯 Your Current Setup (What's Configured)

### ✅ Python Backend

```
Endpoints: 15+
Functions: 2 (get_availability, set_appointment)
OAuth: Microsoft Calendar
Database: PostgreSQL
Users: Multi-user ready (100+)
Timezone: Pendulum (America/Chicago)
```

### ✅ Next.js Frontend

```
Pages: 7 (dashboard, appointments, users, vapi-agent, etc.)
Server Actions: 8
VAPI Web SDK: Integrated
Assistants Loading: Yes (16 assistants)
Multi-user UI: Yes
```

### ⚠️ VAPI Dashboard (Needs Update!)

```
Assistants: 16 created
Webhook URL: ❌ NEEDS UPDATE to new backend
Functions: ❓ May need reconfiguration
```

**Action Required:**

1. Go to https://dashboard.vapi.ai/assistants
2. For EACH assistant, update webhook URL to:
   ```
   https://peterental-vapi-github-newer.onrender.com/vapi/webhook
   ```
3. Verify functions are configured:
   - get_availability
   - set_appointment

---

## 🚀 Quick Start: Adding New Features

### Want to Add: "Send Confirmation Email"

#### Option A: Backend Function (Recommended)

```python
# Python backend
elif function_name == "send_confirmation_email":
    await send_email(
        to=args['attendee_email'],
        subject="Appointment Confirmed",
        body=f"Your viewing at {args['property_address']} is confirmed"
    )
    return {"results": [{"toolCallId": tool_call.id, "result": "Email sent"}]}
```

Then add to VAPI Dashboard → Functions

#### Option B: Frontend Hook (If no backend needed)

```typescript
// Next.js
vapi.on('function-call', (call) => {
  if (call.functionName === 'set_appointment' && call.success) {
    // Send confirmation via frontend email service
    sendEmail(...)
  }
})
```

---

## 📊 Architecture Best Practices

### For Your CRM (100+ Users)

#### 1. User Data → Backend

```
❌ Don't store user data in frontend localStorage
✅ Store in PostgreSQL (already doing this)
```

#### 2. OAuth Tokens → Backend

```
❌ Don't pass tokens to frontend
✅ Store securely in PostgreSQL (already doing this)
```

#### 3. Business Logic → Backend

```
❌ Don't check availability in frontend
✅ Use backend /calendar/availability (already doing this)
```

#### 4. UI/UX → Frontend

```
✅ Transcription display
✅ Call controls
✅ Analytics dashboard
✅ Assistant selection
```

#### 5. Function Definitions → VAPI Dashboard

```
✅ Define what functions exist
✅ Configure webhook URLs
✅ Set assistant behavior
```

---

## 🎯 Recommended Next Steps

### 1. Fix VAPI Dashboard (15 minutes)

Update all 16 assistants' webhook URLs to:

```
https://peterental-vapi-github-newer.onrender.com/vapi/webhook
```

### 2. Add Frontend Enhancements (1-2 days)

**No backend changes needed:**

- Live transcription display
- Multi-assistant selector UI
- Call analytics dashboard
- Browser notifications

### 3. Add New Backend Functions (as needed)

**When you need new capabilities:**

- cancel_appointment
- reschedule_appointment
- get_property_details
- send_confirmation_email

---

## 📚 Summary

### Frontend (Next.js)

**Purpose:** User interface, visualization, call controls  
**Can Do:** Display data, start/stop calls, show transcripts  
**Cannot Do:** Handle VAPI webhooks, access calendar directly, manage multi-user data

### Backend (Python)

**Purpose:** Business logic, data management, VAPI webhooks  
**Can Do:** Handle function calls, access calendar, manage 100+ users  
**Cannot Do:** Display UI, handle browser interactions

### VAPI Dashboard

**Purpose:** Configure assistants, define functions  
**Can Do:** Create agents, set voices, define tools  
**Cannot Do:** Execute functions, handle business logic

### The Flow

```
1. User speaks to assistant (Frontend)
2. VAPI understands intent
3. VAPI calls function via webhook (Backend)
4. Backend executes business logic
5. Backend returns result
6. VAPI speaks result (Frontend)
```

---

**Bottom Line:** Your current architecture is correct! Keep business logic in Python, UI in Next.js, and configuration in VAPI Dashboard. To add new features, primarily update Python backend + VAPI Dashboard. Frontend changes are optional UI enhancements.

---

Want me to help you add a specific feature? Just tell me what you want to build! 🚀
