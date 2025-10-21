# 🏗️ Complete VAPI Architecture Guide: Frontend vs Backend

**For:** Pete CRM (100+ users) - Rental Property Management  
**Last Updated:** October 20, 2025  
**Based on:** VAPI.AI Official Documentation

---

## 🎯 Executive Summary

### The Confusion: Next.js CAN Be Backend, So What Goes Where?

You're right - Next.js 15 can act as BOTH frontend AND backend (via Server Actions & API Routes). However, for your multi-tenant CRM with 100+ users, here's the optimal architecture:

**Keep Python Backend Because:**

- ✅ OAuth tokens for 100+ users (already in PostgreSQL)
- ✅ Complex calendar logic (Pendulum timezone handling)
- ✅ Database-heavy operations (rental search, user management)
- ✅ Python-specific libraries (LangChain for DuckDuckGo search)

**Use Next.js Frontend For:**

- ✅ VAPI Web SDK (voice UI in browser)
- ✅ Real-time transcription display
- ✅ Call controls and user interactions
- ✅ Server Actions (proxy to Python backend)

**Configure in VAPI Dashboard:**

- ✅ Create assistants (16 already created!)
- ✅ Define functions (what the AI can do)
- ✅ Set webhook URL (points to your Python backend)

---

## 📊 VAPI Architecture (How It Actually Works)

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER'S WEB BROWSER                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Next.js App (http://localhost:3000)                   │    │
│  │  ┌──────────────────────────────────────────────┐      │    │
│  │  │  VAPI Web SDK (@vapi-ai/web)                 │      │    │
│  │  │  • Handles microphone/speaker                │      │    │
│  │  │  • WebRTC audio streaming                    │      │    │
│  │  │  • Real-time transcription events            │      │    │
│  │  │  • Call controls (start/stop/mute)           │      │    │
│  │  └──────────────────────────────────────────────┘      │    │
│  │                                                          │    │
│  │  UI Components:                                         │    │
│  │  • Live transcription display                           │    │
│  │  • Call analytics                                       │    │
│  │  • Assistant selector (16 assistants)                   │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                            ↕ ↕ ↕
                   WebSocket (Audio + Events)
                            ↓ ↓ ↓
┌─────────────────────────────────────────────────────────────────┐
│               VAPI.AI PLATFORM (Cloud Service)                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Voice Processing Pipeline:                            │    │
│  │  1. Speech-to-Text (STT) - User speaks                 │    │
│  │  2. LLM (GPT-4) - Understands intent                   │    │
│  │  3. Function Detection - Recognizes "book appointment" │    │
│  │  4. Webhook Call - Sends to YOUR backend              │    │
│  │  5. Text-to-Speech (TTS) - Speaks response            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Your Assistants (configured in dashboard.vapi.ai):            │
│  • Lead_intake_agent.0.0.2-Appseter                           │
│  • (15 more assistants)                                        │
│                                                                 │
│  Functions Configured:                                          │
│  • get_availability → webhook to your backend                  │
│  • set_appointment → webhook to your backend                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    HTTP POST (Webhook)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│       YOUR PYTHON BACKEND (FastAPI on Render.com)              │
│  https://peterental-vapi-github-newer.onrender.com            │
│                                                                 │
│  POST /vapi/webhook ← VAPI calls this                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Webhook Handler:                                      │    │
│  │  1. Receives function call from VAPI                   │    │
│  │  2. Extracts user_id, parameters                       │    │
│  │  3. Queries PostgreSQL for OAuth token                 │    │
│  │  4. Calls Microsoft Graph API                          │    │
│  │  5. Processes business logic                           │    │
│  │  6. Returns natural language response                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Services:                                                      │
│  • Microsoft Calendar OAuth                                    │
│  • PostgreSQL (user tokens, appointments)                      │
│  • LangChain (rental search)                                   │
│  • Pendulum (timezone handling)                                │
└─────────────────────────────────────────────────────────────────┘
                            ↕
                  Microsoft Graph API
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│           Microsoft 365 Calendar (Per-User)                     │
│  • mark@peterei.com's calendar                                 │
│  • user2@example.com's calendar                                │
│  • ... (100+ user calendars)                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Component Breakdown: WHO Does WHAT?

### 1. VAPI Web SDK (Frontend - Browser)

**Purpose:** Client-side voice interface  
**Location:** `src/app/vapi-agent/page.tsx`  
**Library:** `@vapi-ai/web` (npm package)

**What It Does:**

```typescript
import Vapi from '@vapi-ai/web';

const vapi = new Vapi('your-public-key');

// Start call - connects user's mic/speaker
await vapi.start('assistant-id');

// Listen to events
vapi.on('call-start', () => console.log('Call started'));
vapi.on('message', (msg) => console.log('Transcript:', msg));
vapi.on('function-call', (call) => console.log('Function called:', call));
vapi.on('call-end', () => console.log('Call ended'));
```

**What It DOESN'T Do:**

- ❌ Doesn't execute functions (that's VAPI Platform)
- ❌ Doesn't access calendar (that's Python backend)
- ❌ Doesn't store data (that's Python backend)
- ❌ Only handles audio stream + UI events

**When to Use:**

- Display real-time transcription
- Show call analytics
- Control call (start/stop/mute)
- Select which assistant to use
- Show conversation history (UI only)

---

### 2. VAPI Platform (Cloud - vapi.ai)

**Purpose:** Voice AI processing & function routing  
**Location:** Cloud service (not your code)  
**Configuration:** https://dashboard.vapi.ai

**What It Does:**

1. **Speech-to-Text:** Converts user's voice to text
2. **Natural Language Understanding:** Uses GPT-4 to understand intent
3. **Function Detection:** Recognizes when to call a function
   ```
   User says: "What times are available this week?"
   VAPI thinks: "This needs get_availability function"
   VAPI action: POST webhook with function call
   ```
4. **Webhook Call:** Sends HTTP request to YOUR Python backend
5. **Text-to-Speech:** Speaks the response back to user

**What It DOESN'T Do:**

- ❌ Doesn't know YOUR business logic
- ❌ Doesn't have YOUR database access
- ❌ Doesn't have Microsoft Calendar tokens
- ❌ Only routes function calls to your webhook

**When to Configure:**

- Create new assistants
- Define functions/tools
- Set webhook URL
- Change voice/model
- Customize assistant behavior

---

### 3. Python Backend (Your FastAPI Server)

**Purpose:** Business logic, data access, function execution  
**Location:** `https://peterental-vapi-github-newer.onrender.com`  
**Language:** Python + FastAPI

**What It Does:**

```python
@app.post("/vapi/webhook")
async def vapi_webhook(request: VAPIWebhookRequest):
    """
    VAPI calls this endpoint when assistant needs to:
    1. Check calendar availability
    2. Book an appointment
    3. Cancel appointment
    4. Get property details
    5. ... any custom function
    """

    for tool_call in request.message.toolCalls:
        function_name = tool_call.function.name
        args = tool_call.function.arguments

        # Route to appropriate handler
        if function_name == "get_availability":
            # 1. Get user's OAuth token from PostgreSQL
            token = db.get_token(args['user_id'])

            # 2. Call Microsoft Graph API
            events = await microsoft_api.get_events(token)

            # 3. Calculate available slots
            slots = calculate_availability(events)

            # 4. Return natural language response
            return {
                "results": [{
                    "toolCallId": tool_call.id,
                    "result": f"I have these times available: {format_slots(slots)}"
                }]
            }

        elif function_name == "set_appointment":
            # 1. Validate time slot
            # 2. Check for conflicts
            # 3. Create calendar event
            # 4. Store in database
            # 5. Return confirmation
            ...
```

**What It DOESN'T Do:**

- ❌ Doesn't display UI (that's Next.js)
- ❌ Doesn't handle audio (that's VAPI Platform)
- ❌ Doesn't understand natural language (that's VAPI Platform)
- ❌ Only executes function logic

**When to Use:**

- New function needs calendar access
- New function needs database access
- New function needs OAuth tokens
- Multi-user business logic
- Complex calculations
- External API calls

---

### 4. VAPI Dashboard (Configuration)

**Purpose:** Define assistants and functions  
**Location:** https://dashboard.vapi.ai  
**Access:** Web interface (no code)

**What You Configure:**

#### A. Assistant Settings

```
Name: Pete Rental Agent
Model: GPT-4 Turbo
Voice: Jennifer (or 10+ other voices)
First Message: "Hi! I can help you schedule a property viewing."
System Prompt: "You are a helpful real estate assistant..."
```

#### B. Function Definitions

```json
{
  "name": "get_availability",
  "description": "Check available times for property viewings. Call this when user asks about available times, free slots, or when they can schedule.",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": {
        "type": "string",
        "description": "User's email address"
      },
      "days_ahead": {
        "type": "number",
        "description": "How many days to look ahead"
      },
      "property_id": {
        "type": "string",
        "description": "Optional property identifier"
      }
    },
    "required": ["user_id"]
  },
  "url": "https://peterental-vapi-github-newer.onrender.com/vapi/webhook",
  "method": "POST"
}
```

**What It DOESN'T Do:**

- ❌ Doesn't execute functions (that's Python backend)
- ❌ Doesn't define function logic (that's Python backend)
- ❌ Only tells VAPI "this function exists and here's how to call it"

**When to Use:**

- Adding new assistant
- Adding new function
- Changing assistant behavior
- Updating webhook URL
- Changing voice/model

---

## 📋 Current State of Your Setup

### ✅ What You Have Working

#### Python Backend

```bash
✅ Endpoints: 15+ working
✅ VAPI Webhook: /vapi/webhook (handles 2 functions)
✅ Calendar OAuth: Full Microsoft integration
✅ Database: PostgreSQL with multi-user support
✅ Functions Implemented:
   • get_availability (checks calendar)
   • set_appointment (creates events)
```

#### Next.js Frontend

```bash
✅ Pages: 7 (dashboard, appointments, users, vapi-agent, etc.)
✅ VAPI Web SDK: Integrated and loading
✅ Assistants: Loading all 16 from backend
✅ Server Actions: 8 actions as proxy to Python
✅ User Management: Multi-user UI ready
```

#### VAPI Dashboard

```bash
⚠️ Assistants: 16 created
⚠️ Webhook URL: NEEDS UPDATE (old URL)
⚠️ Functions: May need verification
```

---

## 🚀 How to Add New Features: Step-by-Step

### Example: Add "Cancel Appointment" Function

#### Step 1: Decide Where This Belongs

**Question Checklist:**

- ❓ Does it need database access? → YES (need to find appointment)
- ❓ Does it need OAuth tokens? → YES (need to delete from calendar)
- ❓ Is it just UI? → NO
- ❓ Does it modify data? → YES

**Answer:** Belongs in **Python Backend** + **VAPI Dashboard**

---

#### Step 2: Add to Python Backend

```python
# File: backend/app/routers/vapi.py

@app.post("/vapi/webhook")
async def vapi_webhook(request: VAPIWebhookRequest):
    for tool_call in request.message.toolCalls:
        function_name = tool_call.function.name
        args = tool_call.function.arguments

        # ... existing get_availability and set_appointment ...

        # NEW FUNCTION
        elif function_name == "cancel_appointment":
            user_id = args['user_id']
            event_id = args['event_id']

            try:
                # Get OAuth token from database
                token = await db.get_user_token(user_id)

                if not token:
                    return {
                        "results": [{
                            "toolCallId": tool_call.id,
                            "result": "I'm sorry, but you need to connect your calendar first. Would you like me to help you do that?"
                        }]
                    }

                # Delete from Microsoft Calendar
                await microsoft_graph.delete_event(token, event_id)

                # Update database
                await db.mark_appointment_cancelled(event_id)

                # Return success message
                return {
                    "results": [{
                        "toolCallId": tool_call.id,
                        "result": "Your appointment has been cancelled. Is there anything else I can help you with?"
                    }]
                }

            except Exception as e:
                return {
                    "results": [{
                        "toolCallId": tool_call.id,
                        "result": f"I encountered an error cancelling the appointment: {str(e)}. Please try again or contact support."
                    }]
                }
```

**Deploy:**

```bash
git add backend/app/routers/vapi.py
git commit -m "Add cancel_appointment function"
git push origin main
# Render.com auto-deploys
```

---

#### Step 3: Configure in VAPI Dashboard

1. **Go to:** https://dashboard.vapi.ai/assistants
2. **Select:** Your assistant (e.g., "Lead_intake_agent.0.0.2-Appseter")
3. **Click:** "Functions" or "Tools" tab
4. **Click:** "Add Function"
5. **Fill in:**

```json
{
  "name": "cancel_appointment",
  "description": "Cancel an existing appointment. Call this when user says they want to cancel, need to cancel, or can't make their appointment.",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": {
        "type": "string",
        "description": "User's email address (should be available from context)"
      },
      "event_id": {
        "type": "string",
        "description": "The calendar event ID to cancel. Ask user for appointment date/time if not provided, then look up the ID."
      }
    },
    "required": ["user_id", "event_id"]
  },
  "url": "https://peterental-vapi-github-newer.onrender.com/vapi/webhook",
  "method": "POST"
}
```

6. **Save**
7. **Test** in VAPI Dashboard playground

---

#### Step 4: (Optional) Add Frontend Testing UI

Only if you want a button to test it manually:

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

```tsx
// src/app/appointments/page.tsx

<Button onClick={() => vapiCancelAppointment(userId, eventId)}>
  Test Cancel (bypasses voice)
</Button>
```

---

### Example: Add "Get Property Details" (Database Function)

#### Step 1: Python Backend

```python
elif function_name == "get_property_details":
    property_id = args.get('property_id')
    property_address = args.get('property_address')

    # Query database
    if property_id:
        property = await db.query(Property).filter(Property.id == property_id).first()
    elif property_address:
        property = await db.query(Property).filter(Property.address.ilike(f"%{property_address}%")).first()
    else:
        return {
            "results": [{
                "toolCallId": tool_call.id,
                "result": "I need either a property ID or address to look up details."
            }]
        }

    if not property:
        return {
            "results": [{
                "toolCallId": tool_call.id,
                "result": "I couldn't find that property in our system. Could you provide more details?"
            }]
        }

    # Format response
    details = f"""
    Here are the details for the property at {property.address}:
    • {property.bedrooms} bedrooms, {property.bathrooms} bathrooms
    • Rent: ${property.rent} per month
    • Available: {property.available_date}
    • Features: {property.features}

    Would you like to schedule a viewing?
    """

    return {
        "results": [{
            "toolCallId": tool_call.id,
            "result": details.strip()
        }]
    }
```

#### Step 2: VAPI Dashboard

```json
{
  "name": "get_property_details",
  "description": "Get detailed information about a rental property including bedrooms, bathrooms, rent, availability.",
  "parameters": {
    "type": "object",
    "properties": {
      "property_id": {
        "type": "string",
        "description": "Property identifier"
      },
      "property_address": {
        "type": "string",
        "description": "Property address (if ID not available)"
      }
    }
  },
  "url": "https://peterental-vapi-github-newer.onrender.com/vapi/webhook",
  "method": "POST"
}
```

---

### Example: Add Live Transcription (Frontend Only!)

This is **frontend ONLY** - no backend or VAPI Dashboard changes:

```typescript
// src/components/features/vapi/live-transcription.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

export function LiveTranscription({ vapiInstance }: { vapiInstance: Vapi }) {
  const [transcript, setTranscript] = useState<
    Array<{
      speaker: 'user' | 'assistant';
      text: string;
      timestamp: Date;
    }>
  >([]);

  useEffect(() => {
    if (!vapiInstance) return;

    // Listen to VAPI events (happens in browser)
    vapiInstance.on('message', (message) => {
      if (message.type === 'transcript') {
        setTranscript((prev) => [
          ...prev,
          {
            speaker: message.role,
            text: message.transcript,
            timestamp: new Date(),
          },
        ]);
      }
    });
  }, [vapiInstance]);

  return (
    <Card className="p-4">
      <h3 className="font-bold mb-4">Live Transcription</h3>
      <div className="space-y-2">
        {transcript.map((line, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              line.speaker === 'user' ? 'bg-blue-100' : 'bg-gray-100'
            }`}
          >
            <span className="font-semibold">
              {line.speaker === 'user' ? '🗣️ You' : '🤖 AI'}:
            </span>{' '}
            {line.text}
          </div>
        ))}
      </div>
    </Card>
  );
}
```

**Add to page:**

```tsx
// src/app/vapi-agent/page.tsx

<LiveTranscription vapiInstance={vapi} />
```

**Why No Backend Needed:**

- VAPI Web SDK sends transcript events directly to browser
- Just UI rendering
- No database, no OAuth, no business logic

---

## 🎯 Decision Tree: Where Should This Feature Go?

```
Start: New Feature Idea
  │
  ├─ Does it need Microsoft Calendar access?
  │  └─ YES → Python Backend + VAPI Dashboard
  │
  ├─ Does it need database read/write?
  │  └─ YES → Python Backend + VAPI Dashboard
  │
  ├─ Does it need OAuth tokens (100+ users)?
  │  └─ YES → Python Backend + VAPI Dashboard
  │
  ├─ Is it business logic (availability, conflicts)?
  │  └─ YES → Python Backend + VAPI Dashboard
  │
  ├─ Is it just displaying data from VAPI events?
  │  └─ YES → Frontend ONLY (no backend)
  │
  ├─ Is it UI/UX improvement?
  │  └─ YES → Frontend ONLY (no backend)
  │
  ├─ Is it call control (start/stop/mute)?
  │  └─ YES → Frontend ONLY (no backend)
  │
  └─ Is it assistant configuration?
     └─ YES → VAPI Dashboard ONLY
```

---

## 📋 Quick Reference Tables

### Function Types

| Feature                  | Frontend | Backend | VAPI Dashboard | Example              |
| ------------------------ | -------- | ------- | -------------- | -------------------- |
| Check calendar           | ❌       | ✅      | ✅             | get_availability     |
| Book appointment         | ❌       | ✅      | ✅             | set_appointment      |
| Cancel appointment       | ❌       | ✅      | ✅             | cancel_appointment   |
| Get property details     | ❌       | ✅      | ✅             | get_property_details |
| Search rentals           | ❌       | ✅      | ✅             | search_rentals       |
| Send email               | ❌       | ✅      | ✅             | send_confirmation    |
| **Live transcription**   | ✅       | ❌      | ❌             | Display text         |
| **Call analytics**       | ✅       | ❌      | ❌             | Show stats           |
| **Assistant selector**   | ✅       | ❌      | ❌             | Choose agent         |
| **Conversation history** | ✅       | ❌      | ❌             | Past calls           |
| **Create assistant**     | ❌       | ❌      | ✅             | New agent            |
| **Change voice**         | ❌       | ❌      | ✅             | Voice settings       |

---

## 🚀 Immediate Action Items

### 1. Fix VAPI Dashboard (15 minutes) 🔴 CRITICAL

For EACH of your 16 assistants:

1. Go to https://dashboard.vapi.ai/assistants
2. Click on assistant
3. Go to "Functions" or "Server URL"
4. Update to: `https://peterental-vapi-github-newer.onrender.com/vapi/webhook`
5. Verify functions exist:
   - get_availability
   - set_appointment
6. Save

### 2. Add Frontend Enhancements (1-2 days) 🟢 HIGH VALUE

**No backend changes, high impact:**

- [ ] Live transcription display
- [ ] Multi-assistant selector (showcase all 16!)
- [ ] Call analytics dashboard
- [ ] Browser notifications

### 3. Add Backend Functions (as needed) 🟡 AS NEEDED

**When you need new capabilities:**

- [ ] cancel_appointment
- [ ] reschedule_appointment
- [ ] get_property_details
- [ ] send_confirmation_email
- [ ] search_available_properties

---

## 📚 Official VAPI Documentation

### Essential Reading

- **Tools Overview:** https://docs.vapi.ai/tools
- **Custom Functions:** https://docs.vapi.ai/tools/function-calling
- **Web SDK:** https://docs.vapi.ai/sdk/web
- **Webhooks:** https://docs.vapi.ai/webhooks

### Quick Links

- **Dashboard:** https://dashboard.vapi.ai
- **API Keys:** https://dashboard.vapi.ai/api-keys
- **Assistants:** https://dashboard.vapi.ai/assistants
- **Playground:** https://dashboard.vapi.ai/playground

---

## 💡 Pro Tips for Your CRM (100+ Users)

### 1. Multi-Tenancy

```python
# Always pass user_id in function calls
# VAPI can extract from conversation context or you can set it

# In assistant system prompt:
"The user's ID is {user_id}. Always include this in function calls."
```

### 2. Error Handling

```python
# Always return helpful errors
return {
    "results": [{
        "toolCallId": tool_call.id,
        "result": "I'm sorry, I couldn't complete that action because [reason]. Would you like to try [alternative]?"
    }]
}
```

### 3. Natural Language Responses

```python
# Don't return JSON to the user
# Bad: {"slots": ["2pm", "3pm"]}
# Good: "I have two times available: 2pm and 3pm. Which works better for you?"
```

### 4. Context Management

```python
# Store conversation context in database
# Associate with user_id for multi-turn conversations
```

---

## 🎯 Summary: The Golden Rules

### Frontend (Next.js)

**Do:** UI, visualization, call controls, transcription display  
**Don't:** Business logic, database writes, OAuth token management

### Backend (Python)

**Do:** Function execution, calendar access, database operations, multi-user logic  
**Don't:** UI rendering, audio handling (VAPI does this)

### VAPI Dashboard

**Do:** Create assistants, define functions, configure behavior  
**Don't:** Implement function logic (that's backend), handle UI (that's frontend)

### The Flow

```
User speaks → VAPI processes → Calls YOUR webhook → Returns result → VAPI speaks
     ↑                                    ↓
  Frontend                           Python Backend
  (just UI)                          (does the work)
```

---

## ✅ Your Action Plan

1. **Today (15 min):** Fix VAPI Dashboard webhook URLs
2. **This Week (1-2 days):** Add frontend enhancements
3. **As Needed:** Add new backend functions when you need new capabilities

**Need help with any specific feature? Just ask!** 🚀
