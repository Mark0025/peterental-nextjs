# 🔄 Complete User → VAPI → Calendar Flow Explained

## 🎯 Overview

This document explains how users, VAPI agents, and calendar connections work together in your system.

---

## 👤 User Object Architecture

### **1. User Identity (Clerk)**

When a user signs up:

```
User signs up → Clerk creates account → Webhook fires → Backend creates user in database
```

**Clerk provides:**

- `clerk_user_id`: `"user_34Qq8GSCZfnEvFffTzIhx1hXJR8"` ← **Universal ID**
- `email`: `"mark@localhousebuyers.net"`
- `first_name`: `"Mark"`
- `last_name`: `"Carpenter"`

**Backend creates:**

```sql
INSERT INTO users (clerk_user_id, email, full_name, created_at)
VALUES ('user_34Qq8GSCZfnEvFffTzIhx1hXJR8', 'mark@localhousebuyers.net', 'Mark Carpenter', NOW());
```

---

### **2. User Database Record**

**Table: `users`**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,                          -- Internal DB ID
  clerk_user_id VARCHAR UNIQUE NOT NULL,        -- From Clerk (THE KEY)
  email VARCHAR NOT NULL,
  full_name VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example:**

```
id: "550e8400-e29b-41d4-a716-446655440000"
clerk_user_id: "user_34Qq8GSCZfnEvFffTzIhx1hXJR8"  ← Links everything
email: "mark@localhousebuyers.net"
full_name: "Mark Carpenter"
```

---

### **3. Calendar Connection (OAuth)**

When user connects Microsoft Calendar:

```
User clicks "Connect Calendar"
→ Frontend calls `/calendar/auth/start` with JWT
→ Backend redirects to Microsoft OAuth
→ User authorizes
→ Microsoft redirects back with code
→ Backend exchanges code for tokens
→ Backend stores in oauth_tokens table
```

**Table: `oauth_tokens`**

```sql
CREATE TABLE oauth_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),            -- Links to users.id
  clerk_user_id VARCHAR,                        -- Also store Clerk ID for quick lookup
  provider VARCHAR,                             -- 'microsoft' or 'google'
  access_token TEXT,                            -- OAuth access token
  refresh_token TEXT,                           -- OAuth refresh token
  calendar_email VARCHAR,                       -- Actual Microsoft/Google account email
  expires_at TIMESTAMP,
  created_at TIMESTAMP
);
```

**Example:**

```
user_id: "550e8400-e29b-41d4-a716-446655440000"
clerk_user_id: "user_34Qq8GSCZfnEvFffTzIhx1hXJR8"
provider: "microsoft"
access_token: "eyJ0eXAiOiJKV1QiLCJub25j..."
calendar_email: "mark@outlook.com"  ← The actual Microsoft account
expires_at: "2025-11-29T10:30:00Z"
```

---

### **4. VAPI Agent Configuration**

When user creates a VAPI agent:

```
User creates agent
→ Frontend calls `/vapi/agents` with JWT
→ Backend creates VAPI agent via VAPI API
→ Backend stores mapping in database
```

**Table: `vapi_agents`** (hypothetical - check your backend)

```sql
CREATE TABLE vapi_agents (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),            -- Links to users.id
  clerk_user_id VARCHAR,                        -- Clerk ID for quick lookup
  vapi_agent_id VARCHAR UNIQUE,                 -- From VAPI (e.g., "agent_abc123")
  agent_name VARCHAR,
  agent_config JSONB,                           -- VAPI configuration
  created_at TIMESTAMP
);
```

**Example:**

```
user_id: "550e8400-e29b-41d4-a716-446655440000"
clerk_user_id: "user_34Qq8GSCZfnEvFffTzIhx1hXJR8"
vapi_agent_id: "f9847210-e18e-4b19-8880-8532eabc971e"
agent_name: "Property Booking Assistant"
```

---

## 🔄 Complete Flow: User → VAPI → Calendar

### **Scenario: User calls VAPI agent to book appointment**

```
Step 1: User calls VAPI phone number
   ↓
Step 2: VAPI answers with configured agent
   ↓
Step 3: User says "I want to book an appointment"
   ↓
Step 4: VAPI agent calls your backend function
   ↓
Step 5: Backend identifies user and accesses their calendar
   ↓
Step 6: Backend creates calendar event
   ↓
Step 7: VAPI agent confirms to user
```

---

### **Detailed Step-by-Step**

#### **Step 1-3: VAPI Call Initiation**

```
User: "Hey, I want to book an appointment for tomorrow at 2pm"
VAPI: (recognizes intent, prepares to call function)
```

#### **Step 4: VAPI Function Call**

VAPI sends webhook to your backend:

```json
POST https://peterental-vapi-github-newer.onrender.com/vapi/function-call
{
  "message": {
    "type": "function-call",
    "functionCall": {
      "name": "book_appointment",
      "parameters": {
        "property_address": "123 Main St",
        "appointment_time": "2025-10-30T14:00:00Z"
      }
    },
    "call": {
      "id": "call_abc123",
      "assistantId": "f9847210-e18e-4b19-8880-8532eabc971e"  ← VAPI agent ID
    }
  }
}
```

#### **Step 5: Backend Identifies User**

**Backend does:**

```python
# 1. Get assistant_id from VAPI webhook
assistant_id = webhook_data["message"]["call"]["assistantId"]
# "f9847210-e18e-4b19-8880-8532eabc971e"

# 2. Look up user by assistant_id
agent = db.query(VAPIAgent).filter_by(vapi_agent_id=assistant_id).first()
# Returns: { user_id: "550e...", clerk_user_id: "user_34Qq..." }

# 3. Get user's calendar token
oauth_token = db.query(OAuthToken).filter_by(
    clerk_user_id=agent.clerk_user_id,
    provider="microsoft"
).first()
# Returns: { access_token: "eyJ0...", calendar_email: "mark@outlook.com" }

# 4. Create calendar event using user's token
microsoft_graph = MicrosoftGraphAPI(oauth_token.access_token)
event = microsoft_graph.create_event(
    subject="Property Viewing - 123 Main St",
    start_time="2025-10-30T14:00:00Z",
    calendar_email=oauth_token.calendar_email  # mark@outlook.com
)
```

#### **Step 6: Backend Creates Event**

```
Backend → Microsoft Graph API:
  POST https://graph.microsoft.com/v1.0/users/mark@outlook.com/calendar/events
  Authorization: Bearer eyJ0eXAiOiJKV1QiLCJub25j...
  {
    "subject": "Property Viewing - 123 Main St",
    "start": { "dateTime": "2025-10-30T14:00:00", "timeZone": "America/Chicago" },
    "end": { "dateTime": "2025-10-30T15:00:00", "timeZone": "America/Chicago" }
  }

Microsoft → Backend:
  201 Created
  { "id": "AAMkAGI2...", "subject": "Property Viewing - 123 Main St", ... }
```

#### **Step 7: VAPI Confirms**

```
Backend → VAPI:
  200 OK
  {
    "result": "Appointment booked for tomorrow at 2pm at 123 Main St. You'll receive a calendar invite."
  }

VAPI → User:
  "Great! I've booked your appointment for tomorrow at 2pm at 123 Main St.
   You'll receive a calendar invite at mark@outlook.com"
```

---

## 🔑 The Key Relationships

### **1. Clerk User ID is the Universal Key**

```
clerk_user_id: "user_34Qq8GSCZfnEvFffTzIhx1hXJR8"
    ↓
    ├─→ users table (user_id: "550e...")
    ├─→ oauth_tokens table (calendar access)
    ├─→ vapi_agents table (agent mapping)
    └─→ All other user data
```

### **2. VAPI Agent ID → Clerk User ID Mapping**

```
VAPI calls function with assistant_id
    ↓
Backend looks up: assistant_id → clerk_user_id
    ↓
Backend looks up: clerk_user_id → oauth_tokens
    ↓
Backend uses: oauth_token → Microsoft Graph API
```

### **3. Multi-Tenant Isolation**

Every query includes `clerk_user_id` or `user_id`:

```sql
-- Get user's calendar token
SELECT * FROM oauth_tokens
WHERE clerk_user_id = 'user_34Qq8GSCZfnEvFffTzIhx1hXJR8';

-- Get user's VAPI agents
SELECT * FROM vapi_agents
WHERE clerk_user_id = 'user_34Qq8GSCZfnEvFffTzIhx1hXJR8';

-- Create event for user's calendar
-- (uses token specific to that user)
```

---

## 🆚 Microsoft vs Google Calendar

### **Frontend Support**

**Microsoft Calendar:**

```typescript
// ✅ FULLY IMPLEMENTED
- OAuth flow: ✅ `/calendar/auth/start`
- Status check: ✅ `/calendar/auth/status`
- Disconnect: ✅ `/calendar/disconnect`
- Create events: ✅ `/calendar/events`
- List events: ✅ `/calendar/events/list`
- UI: ✅ Full connection flow in `/users` page
```

**Google Calendar:**

```typescript
// ⚠️ BACKEND READY, FRONTEND PENDING
- OAuth flow: ⚠️ Backend supports, frontend shows "Coming Soon"
- Status check: ✅ Same endpoint `/calendar/auth/status`
- Disconnect: ✅ Same endpoint `/calendar/disconnect`
- Create events: ✅ Same endpoint `/calendar/events`
- List events: ✅ Same endpoint `/calendar/events/list`
- UI: ⚠️ Shows "Not Available" button (disabled)
```

### **What's Needed for Google Calendar**

**Frontend changes:**

1. **Add Google Calendar connection button** in `src/app/users/page.tsx`:

```typescript
// Change this:
<Button variant="outline" size="sm" disabled>
  <Calendar className="h-4 w-4 mr-2" />
  Coming Soon
</Button>

// To this:
<Button onClick={handleConnectGoogleCalendar}>
  <Calendar className="h-4 w-4 mr-2" />
  Connect Google Calendar
</Button>
```

2. **Add handler function**:

```typescript
const handleConnectGoogleCalendar = async () => {
  try {
    // Backend already supports this! Just needs provider parameter
    const authUrl = await getCalendarAuthURL('google'); // Pass 'google' instead of 'microsoft'
    window.location.href = authUrl;
  } catch (error) {
    console.error('Failed to get Google OAuth URL:', error);
  }
};
```

3. **Update `getCalendarAuthURL` in `src/actions/calendar-actions.ts`**:

```typescript
export async function getCalendarAuthURL(
  provider: 'microsoft' | 'google' = 'microsoft'
): Promise<string> {
  const headers = await getAuthHeaders();

  const response = await fetch(
    `${API_URL}/calendar/auth/start?provider=${provider}`,
    {
      method: 'GET',
      headers,
      redirect: 'manual',
    }
  );

  const location = response.headers.get('location');
  return location;
}
```

**That's it!** The backend already handles:

- Google OAuth flow
- Google Calendar API
- Token storage
- Event creation
- Multi-provider support

---

## 📊 Database Schema Summary

```
┌─────────────────────────────────────────────────────────────┐
│                          USERS                              │
├─────────────────────────────────────────────────────────────┤
│ id (UUID) │ clerk_user_id │ email │ full_name │ ...         │
└───────────┴───────────────┴───────┴───────────┴─────────────┘
      │              │
      │              │
      ├──────────────┼─────────────────────────────────────────┐
      │              │                                         │
      ▼              ▼                                         ▼
┌──────────────┐  ┌──────────────┐                    ┌──────────────┐
│ oauth_tokens │  │ vapi_agents  │                    │   rentals    │
├──────────────┤  ├──────────────┤                    ├──────────────┤
│ user_id      │  │ user_id      │                    │ user_id      │
│ clerk_user_id│  │ clerk_user_id│                    │ clerk_user_id│
│ provider     │  │ vapi_agent_id│                    │ property_id  │
│ access_token │  │ agent_name   │                    │ ...          │
│ calendar_email│  │ agent_config │                    │              │
└──────────────┘  └──────────────┘                    └──────────────┘
```

---

## 🎯 Key Takeaways

1. **`clerk_user_id` is the universal identifier** that links everything
2. **VAPI agent ID → clerk_user_id mapping** enables function calls to access user's calendar
3. **OAuth tokens are stored per user** with `clerk_user_id` for isolation
4. **Multi-tenant by design** - every query includes user identifier
5. **Google Calendar is 90% ready** - just needs frontend button and provider parameter
6. **Calendar email ≠ account email** - users can connect any Microsoft/Google account
7. **Backend verifies calendar access** - `calendar_verified` field from Graph API

---

## 🚀 To Enable Google Calendar

**3 simple changes:**

1. Enable button in UI (remove `disabled`)
2. Add `provider` parameter to `getCalendarAuthURL('google')`
3. Backend already supports it!

**Backend handles:**

- ✅ Google OAuth flow
- ✅ Token storage
- ✅ Calendar API calls
- ✅ Multi-provider isolation
- ✅ Event creation/listing

**No backend changes needed!** 🎉

---

_Last Updated: 2025-10-29_  
_Status: Microsoft ✅ | Google ⚠️ (backend ready, frontend needs 3 lines)_
