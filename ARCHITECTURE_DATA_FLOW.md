# Complete Architecture & Data Flow Analysis
**Date:** 2025-10-29  
**Purpose:** Clarify what's handled where before UI reorganization  
**Critical:** Must understand this before making ANY changes

---

## 🎯 The Big Picture

```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                          │
│  ┌──────────────┐        ┌──────────────┐              │
│  │   Next.js    │        │  VAPI SDK    │              │
│  │   Frontend   │        │ (Voice AI)   │              │
│  └──────┬───────┘        └──────┬───────┘              │
└─────────┼──────────────────────┼──────────────────────┘
          │                      │
          │ HTTP/REST            │ WebSocket
          │                      │
    ┌─────▼──────────────────────▼─────────┐
    │                                       │
    │         VAPI SERVERS                  │
    │     (Voice Processing)                │
    │                                       │
    └────────────────┬──────────────────────┘
                     │
                     │ Webhooks (Function Calls)
                     │
          ┌──────────▼──────────────────┐
          │                              │
          │    YOUR BACKEND (FastAPI)    │
          │                              │
          │  ┌────────────────────────┐  │
          │  │  PostgreSQL Database   │  │
          │  │  - users               │  │
          │  │  - agents              │  │
          │  │  - oauth_tokens        │  │
          │  │  - rentals             │  │
          │  │  - rental_sources (?)  │  │
          │  └────────────────────────┘  │
          │                              │
          └──────────┬───────────────────┘
                     │
          ┌──────────▼──────────────────┐
          │  External APIs               │
          │  - Microsoft Graph           │
          │  - Google Calendar           │
          │  - Rental Scraping           │
          └──────────────────────────────┘
```

---

## 📊 Current Data Flow (What Works Now)

### 1. User Data
```
Frontend                  Backend                    Database
────────                  ────────                   ────────
Login (Clerk)      →      Webhook receives    →      INSERT INTO users
                          clerk_user_id              (clerk_user_id, email, name)

/users page        →      GET /users/me       →      SELECT * FROM users
loads                     (JWT auth)                 WHERE clerk_user_id = ?

Display user info  ←      Returns user data   ←      User found
```

**✅ This works! No changes needed.**

---

### 2. Calendar Data
```
Frontend                  Backend                    Database
────────                  ────────                   ────────
Connect button     →      GET /calendar/auth/  →     INSERT INTO oauth_tokens
                          start (JWT)                (user_id, provider, tokens)

/calendar/events   →      GET /calendar/       →     SELECT * FROM oauth_tokens
page loads                events (JWT)               WHERE user_id = ?
                                                     ↓
                          Calls Microsoft      →     Uses stored tokens
                          Graph API                  to fetch events

Display events     ←      Returns events       ←     Events from Microsoft
```

**✅ This works! No changes needed.**

---

### 3. VAPI Agent Data (CRITICAL - Where confusion might be)
```
Frontend                  Backend                    Database
────────                  ────────                   ────────
/agent-builder     →      GET /agents         →      SELECT * FROM agents
page loads                (JWT auth)                 WHERE user_id = ?
                                                     
                          ❌ PROBLEM: May not be filtering by user_id!

Create agent       →      POST /agents        →      INSERT INTO agents
                          { vapi_assistant_id,       (vapi_assistant_id, user_id,
                            agent_name }              agent_name)

Edit agent         →      PATCH /agents/:id   →      UPDATE agents
                                                     WHERE id = ? AND user_id = ?
                                                     ❌ PROBLEM: May not verify ownership!
```

**⚠️ NEEDS FIXING:**
- Backend must filter agents by `user_id` from JWT
- Backend must verify ownership before allowing edits

---

### 4. VAPI Voice Interaction (THE TRICKY PART)
```
User's Browser            VAPI Servers               Your Backend
──────────                ──────────                 ────────────
User clicks        →      VAPI SDK connects    →     (No backend yet)
"Start Call"              WebSocket to VAPI

User speaks        →      Voice → Text         →     (No backend yet)
"Book appointment"        AI processes

                          Function call needed  →    POST /vapi/webhook
                          {                          {
                            "assistant_id": "...",     "call": {...},
                            "function": {              "message": {
                              "name":                    "toolCalls": [{
                              "get_availability"         "function": {
                            }                              "name": "get_availability"
                          }                              }
                                                       }]
                                                     }
                                                     
                                                     Backend looks up:
                                                     1. assistant_id → agents table
                                                     2. agents.user_id → users table
                                                     3. users.clerk_user_id → oauth_tokens
                                                     4. Gets calendar tokens
                                                     5. Calls Microsoft API
                                                     6. Returns available slots

Response sent      ←      VAPI speaks result   ←     Returns JSON
to user                   back to user               { "slots": [...] }
```

**✅ This works! VAPI SDK on frontend, webhooks to backend.**

**Key Points:**
- Frontend uses VAPI SDK (WebSocket to VAPI servers)
- VAPI servers call YOUR backend via webhooks
- Backend handles function calls (get_availability, book_appointment, etc.)
- Backend uses `assistant_id` to map to user's calendar

---

### 5. Rental Data (CURRENT STATE)
```
Frontend                  Backend                    Database
────────                  ────────                   ────────
/rentals page      →      (No API call yet)    →     (Mock data in frontend)
loads                     ❌ TODO: Implement

Currently:
- Mock data in frontend
- No backend API
- No database table
```

**❌ NOT IMPLEMENTED YET**

---

## 🔴 What MUST Be Added to Backend Database

### New Table: `rental_sources`
```sql
CREATE TABLE rental_sources (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),  -- Link to user
    company_id INTEGER,  -- Future: link to company
    website_url VARCHAR(500) NOT NULL,  -- e.g., "zillow.com"
    scraping_config JSONB,  -- Configuration for scraping
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX idx_rental_sources_user ON rental_sources(user_id);
CREATE INDEX idx_rental_sources_company ON rental_sources(company_id);
```

**Why:** Users need to add their rental websites for scraping

---

### Updated Table: `rentals` (if exists)
```sql
-- Add user_id if not present
ALTER TABLE rentals ADD COLUMN user_id INTEGER REFERENCES users(user_id);
ALTER TABLE rentals ADD COLUMN company_id INTEGER;  -- Future

-- Index for fast user lookups
CREATE INDEX idx_rentals_user ON rentals(user_id);
```

**Why:** Rentals must be user-scoped

---

### Updated Table: `agents` (verify it has user_id)
```sql
-- Ensure agents table has user_id
-- This probably exists already, but verify:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agents';

-- If user_id doesn't exist, add it:
ALTER TABLE agents ADD COLUMN user_id INTEGER REFERENCES users(user_id);
CREATE INDEX idx_agents_user ON agents(user_id);
```

**Why:** Agents must be user-scoped

---

## 🔵 What Backend APIs Need to Be Added/Modified

### 1. Agents API (MODIFY - Add User Filtering)
```python
# backend/routers/agents.py

@router.get("/agents")
async def get_agents(
    current_user: dict = Depends(get_current_user)  # From JWT
):
    user_id = current_user["user_id"]  # Extract from JWT
    
    # FILTER BY USER_ID!
    agents = await db.fetch_all(
        "SELECT * FROM agents WHERE user_id = :user_id",
        {"user_id": user_id}
    )
    
    return {"agents": agents}

@router.patch("/agents/{agent_id}")
async def update_agent(
    agent_id: str,
    data: AgentUpdate,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    
    # VERIFY OWNERSHIP!
    agent = await db.fetch_one(
        "SELECT * FROM agents WHERE id = :id AND user_id = :user_id",
        {"id": agent_id, "user_id": user_id}
    )
    
    if not agent:
        raise HTTPException(403, "You don't own this agent")
    
    # Update agent...
```

**Status:** ❌ NEEDS MODIFICATION

---

### 2. Rentals API (CREATE - New Endpoints)
```python
# backend/routers/rentals.py (NEW FILE)

@router.get("/rentals")
async def get_rentals(
    max_price: Optional[int] = None,
    min_bedrooms: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    
    # FILTER BY USER_ID!
    query = "SELECT * FROM rentals WHERE user_id = :user_id"
    params = {"user_id": user_id}
    
    if max_price:
        query += " AND price <= :max_price"
        params["max_price"] = max_price
    
    if min_bedrooms:
        query += " AND bedrooms >= :min_bedrooms"
        params["min_bedrooms"] = min_bedrooms
    
    rentals = await db.fetch_all(query, params)
    return {"rentals": rentals}

@router.post("/rentals/sources")
async def add_rental_source(
    data: RentalSourceCreate,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    
    # INSERT rental source for user
    await db.execute(
        """INSERT INTO rental_sources 
           (user_id, website_url, scraping_config, is_active)
           VALUES (:user_id, :url, :config, TRUE)""",
        {
            "user_id": user_id,
            "url": data.website_url,
            "config": json.dumps(data.scraping_config)
        }
    )
    
    return {"success": True}

@router.get("/rentals/sources")
async def get_rental_sources(
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    
    sources = await db.fetch_all(
        "SELECT * FROM rental_sources WHERE user_id = :user_id",
        {"user_id": user_id}
    )
    
    return {"sources": sources}
```

**Status:** ❌ NEEDS CREATION

---

### 3. Dashboard Stats API (CREATE - New Endpoint)
```python
# backend/routers/dashboard.py (NEW FILE)

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    
    # Get agent stats
    agent_stats = await db.fetch_one(
        """SELECT 
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE is_active = TRUE) as active,
             COUNT(*) FILTER (WHERE is_active = FALSE) as inactive
           FROM agents WHERE user_id = :user_id""",
        {"user_id": user_id}
    )
    
    # Get rental stats
    rental_stats = await db.fetch_one(
        "SELECT COUNT(*) as total FROM rentals WHERE user_id = :user_id",
        {"user_id": user_id}
    )
    
    # Get calendar stats (use existing calendar service)
    calendar_stats = await get_calendar_stats(user_id)
    
    return {
        "agents": agent_stats,
        "rentals": rental_stats,
        "calendar": calendar_stats
    }
```

**Status:** ❌ NEEDS CREATION

---

## 🟢 What Frontend Needs to Know

### Data Fetching Sources

| Feature | Data Source | How It Works |
|---------|------------|--------------|
| **User Profile** | Backend DB | `GET /users/me` (JWT) → PostgreSQL |
| **Calendar Events** | Backend → Microsoft/Google | `GET /calendar/events` → Backend fetches from Microsoft Graph API |
| **Agents List** | Backend DB | `GET /agents` (JWT) → PostgreSQL (needs user_id filter) |
| **Rentals** | Backend DB | `GET /rentals` (JWT) → PostgreSQL (needs implementation) |
| **Dashboard Stats** | Backend DB | `GET /dashboard/stats` (JWT) → PostgreSQL (needs creation) |
| **VAPI Voice Calls** | VAPI SDK → VAPI Servers | Frontend uses VAPI SDK, backend receives webhooks |

---

### VAPI Integration (Critical Understanding)

**Frontend VAPI Usage:**
```typescript
// src/app/vapi-agent/page.tsx or similar

import { useVapi } from '@vapi-ai/web'

const { start, stop, isActive } = useVapi({
  apiKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
  assistantId: userAgent.vapi_assistant_id  // From backend DB
})

// When user clicks "Start Call"
const handleStartCall = () => {
  start()  // Connects to VAPI servers via WebSocket
}

// VAPI handles voice → text → AI → function calls
// Function calls go to YOUR backend via webhook
```

**Backend VAPI Webhook:**
```python
# backend/routers/vapi.py

@router.post("/vapi/webhook")
async def vapi_webhook(request: VAPIWebhookRequest):
    # VAPI sends function call request
    assistant_id = request.call.assistant_id
    function_name = request.message.tool_calls[0].function.name
    
    # Map assistant_id to user
    agent = await db.fetch_one(
        "SELECT user_id FROM agents WHERE vapi_assistant_id = :id",
        {"id": assistant_id}
    )
    
    user_id = agent["user_id"]
    
    # Get user's calendar tokens
    tokens = await get_oauth_tokens(user_id)
    
    # Call Microsoft API
    if function_name == "get_availability":
        slots = await microsoft_calendar.get_availability(tokens)
        return {"slots": slots}
```

**Key Point:** 
- Frontend uses VAPI SDK (WebSocket to VAPI)
- Backend receives webhooks from VAPI (HTTP POST)
- Backend uses `assistant_id` to find user and their data

---

## ❌ What Will BREAK Without Backend Changes

### 1. Agent Filtering (BREAKS NOW)
**Problem:** Frontend shows ALL agents, not user's agents
**Fix Needed:** Backend must filter `GET /agents` by `user_id`

### 2. Agent Editing (SECURITY RISK)
**Problem:** User can edit others' agents via direct URL
**Fix Needed:** Backend must verify ownership in `PATCH /agents/:id`

### 3. Rental Data (DOESN'T WORK)
**Problem:** No backend API, frontend has mock data
**Fix Needed:** Backend must create `GET /rentals` with `user_id` filter

### 4. Rental Sources (DOESN'T EXIST)
**Problem:** No way to add rental websites
**Fix Needed:** Backend must create `POST /rentals/sources`

### 5. Dashboard Stats (DOESN'T EXIST)
**Problem:** No aggregated data endpoint
**Fix Needed:** Backend must create `GET /dashboard/stats`

---

## ✅ What Backend Changes Are REQUIRED

### Database Changes
1. ✅ **Create `rental_sources` table**
2. ✅ **Add `user_id` to `rentals` table** (if missing)
3. ✅ **Verify `agents` table has `user_id`** (probably exists)
4. ✅ **Add indexes for performance**

### API Changes
1. ✅ **Modify `GET /agents`** - Add user_id filter
2. ✅ **Modify `PATCH /agents/:id`** - Add ownership check
3. ✅ **Create `GET /rentals`** - User-scoped rental list
4. ✅ **Create `POST /rentals/sources`** - Add rental website
5. ✅ **Create `GET /rentals/sources`** - List user's sources
6. ✅ **Create `GET /dashboard/stats`** - Aggregated metrics

### No Changes Needed
- ❌ VAPI webhook handling (already works)
- ❌ Calendar integration (already works)
- ❌ User authentication (already works)

---

## 🚨 Critical Questions for Backend Agent

### Before UI Reorganization, Backend Must Answer:

1. **Does `agents` table have `user_id` column?**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'agents';
   ```

2. **Does `GET /agents` filter by `user_id` from JWT?**
   ```python
   # Is this implemented?
   agents = db.fetch_all(
       "SELECT * FROM agents WHERE user_id = :user_id",
       {"user_id": current_user["user_id"]}
   )
   ```

3. **Does `PATCH /agents/:id` verify ownership?**
   ```python
   # Is this implemented?
   agent = db.fetch_one(
       "SELECT * FROM agents WHERE id = :id AND user_id = :user_id"
   )
   if not agent:
       raise HTTPException(403, "Not your agent")
   ```

4. **Does `rentals` table exist? Does it have `user_id`?**
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'rentals';
   SELECT column_name FROM information_schema.columns WHERE table_name = 'rentals';
   ```

5. **Does `rental_sources` table exist?**
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'rental_sources';
   ```

---

## 📋 Action Plan

### Step 1: Backend Database (DO FIRST)
```sql
-- Run these migrations
CREATE TABLE IF NOT EXISTS rental_sources (...);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_rentals_user ON rentals(user_id);
```

### Step 2: Backend APIs (DO SECOND)
- Modify `GET /agents` - add user filter
- Modify `PATCH /agents/:id` - add ownership check
- Create `GET /rentals` - user-scoped
- Create `POST /rentals/sources` - add source
- Create `GET /dashboard/stats` - aggregated metrics

### Step 3: Frontend UI (DO LAST)
- Implement UI reorganization
- Frontend just calls new/modified APIs
- No logic changes needed in frontend (just UI)

---

## ✅ Summary

**Q: Does backend DB need to change?**  
**A:** YES - Need to add `rental_sources` table and verify user_id columns

**Q: Is data fetching from backend or VAPI?**  
**A:** BOTH:
- User/Agent/Rental data: Backend database
- Voice interactions: VAPI SDK → VAPI Servers → Backend webhooks
- Calendar data: Backend → Microsoft/Google APIs

**Q: What about VAPI integration?**  
**A:** VAPI integration works! Frontend uses SDK, backend handles webhooks. No changes needed.

**Q: Can we do UI reorganization without backend changes?**  
**A:** NO - Must add backend APIs first, especially for rentals and dashboard stats

---

**Next Step:** Create backend requirements document for backend agent!

