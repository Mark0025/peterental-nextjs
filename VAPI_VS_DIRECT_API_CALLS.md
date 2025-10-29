# VAPI Function Calls vs. Direct Frontend API Calls

**Date:** 2025-10-29  
**Purpose:** Clarify which APIs are called by VAPI webhooks vs. direct frontend

---

## 🎯 Two Separate Paths to Backend

```
Path 1: User Browsing Website (Direct Frontend → Backend)
────────────────────────────────────────────────────────
User visits page → Frontend loads → Calls backend API → Displays data

Path 2: User Speaking to VAPI Agent (VAPI Webhook → Backend)
────────────────────────────────────────────────────────
User speaks → VAPI processes → Webhook to backend → Returns data → VAPI speaks
```

**Key Point:** These are SEPARATE! Both need the same backend APIs.

---

## 📊 Detailed Breakdown

### 1. Agent Filtering

#### Path A: Direct Frontend Call (UI Display)
```
User visits /agent-builder page
    ↓
Frontend calls: GET /agents (JWT)
    ↓
Backend filters: WHERE user_id = {from JWT}
    ↓
Returns: User's agents only
    ↓
Frontend displays: Agent list with edit buttons
```

**Used For:** Displaying agent list in UI, editing agents

#### Path B: VAPI Webhook (Maybe - but not primary)
```
User asks: "What agents do I have?"
    ↓
VAPI webhook: POST /vapi/webhook
    { function: "list_agents" }
    ↓
Backend looks up: assistant_id → user_id → agents
    ↓
Returns: { agents: [...] }
    ↓
VAPI speaks: "You have 3 agents: Property Bot, Rental Assistant..."
```

**Used For:** Voice queries about agents (optional feature)

#### ✅ Current Status:
- **Direct Frontend Call:** ❌ BROKEN (returns ALL agents, not filtered)
- **VAPI Webhook:** May not even be implemented yet
- **Fix Needed:** Backend `GET /agents` MUST filter by user_id for UI to work

---

### 2. Rentals Data

#### Path A: Direct Frontend Call (UI Display)
```
User visits /rentals page
    ↓
Frontend calls: GET /rentals?max_price=2500 (JWT)
    ↓
Backend filters: WHERE user_id = {from JWT}
    ↓
Returns: User's rentals only
    ↓
Frontend displays: Property cards with filters
```

**Used For:** Browsing rentals in UI, applying filters, viewing details

#### Path B: VAPI Webhook (Primary Voice Feature!)
```
User asks: "What rentals do you have under $2000?"
    ↓
VAPI webhook: POST /vapi/webhook
    { 
      function: "search_rentals",
      arguments: { max_price: 2000 }
    }
    ↓
Backend looks up: assistant_id → user_id → rentals
    ↓
Backend filters: WHERE user_id = X AND price <= 2000
    ↓
Returns: { rentals: [...] }
    ↓
VAPI speaks: "I found 5 properties under $2000. The first is at..."
```

**Used For:** Voice queries about available rentals

#### ✅ Current Status:
- **Direct Frontend Call:** ❌ DOESN'T EXIST (frontend has mock data)
- **VAPI Webhook:** ✅ May already be implemented as `website_search` function
- **Fix Needed:** Backend `GET /rentals` needed for UI, might already work for VAPI

---

### 3. Dashboard Stats

#### Path A: Direct Frontend Call (UI Display)
```
User visits /dashboard page
    ↓
Frontend calls: GET /dashboard/stats (JWT)
    ↓
Backend aggregates:
  - COUNT agents WHERE user_id = X
  - COUNT rentals WHERE user_id = X
  - COUNT calendar events WHERE user_id = X
    ↓
Returns: { agents: {total: 3, active: 2}, rentals: {total: 12}, ... }
    ↓
Frontend displays: Metric cards, charts, recent activity
```

**Used For:** Dashboard analytics display

#### Path B: VAPI Webhook (Optional)
```
User asks: "How many properties do I have?"
    ↓
VAPI webhook: POST /vapi/webhook
    { function: "get_stats" }
    ↓
Backend looks up: assistant_id → user_id → COUNT rentals
    ↓
Returns: { count: 12 }
    ↓
VAPI speaks: "You have 12 properties listed"
```

**Used For:** Voice queries about statistics (optional)

#### ✅ Current Status:
- **Direct Frontend Call:** ❌ DOESN'T EXIST (no aggregation endpoint)
- **VAPI Webhook:** Probably NOT implemented (would be separate functions)
- **Fix Needed:** Backend `GET /dashboard/stats` needed for UI

---

## 🔍 Which APIs Are VAPI Function Calls?

### Currently Implemented VAPI Functions:
From your backend (`/vapi/webhook`):

1. ✅ **`get_availability`** (Calendar)
   ```
   User: "When am I available next week?"
   VAPI → Backend → Calendar API → Returns slots
   ```

2. ✅ **`set_appointment`** (Calendar)
   ```
   User: "Book appointment for 2pm tomorrow"
   VAPI → Backend → Calendar API → Creates event
   ```

3. ✅ **`website_search`** (Rentals)
   ```
   User: "Find me rentals under $2000"
   VAPI → Backend → Rental scraping → Returns properties
   ```

**These are for VOICE INTERACTION ONLY!**

---

### NOT VAPI Functions (Direct Frontend Calls):

1. ❌ **`GET /agents`** (Agent List)
   - **Not** called by VAPI
   - **Is** called by frontend when user visits `/agent-builder`
   - **Broken:** Returns all agents, not filtered

2. ❌ **`GET /rentals`** (Rental List)
   - **Not** called by VAPI (VAPI uses `website_search` which is different)
   - **Is** called by frontend when user visits `/rentals`
   - **Missing:** Doesn't exist yet

3. ❌ **`GET /dashboard/stats`** (Dashboard Metrics)
   - **Not** called by VAPI
   - **Is** called by frontend when user visits `/dashboard`
   - **Missing:** Doesn't exist yet

---

## 🤔 The Confusion

### You Might Be Thinking:
> "Since VAPI handles rental searches via `website_search`, doesn't that mean the rentals API is already implemented?"

### The Reality:
**NO! They're separate:**

```
VAPI Function: website_search
────────────────────────────────
Purpose: Search NEW rentals from external websites (DuckDuckGo → Scraping)
Flow: User speaks → VAPI → Backend scrapes Zillow/etc → Returns NEW results
Used For: "Find me rentals under $2000 in Austin"

Direct API: GET /rentals
────────────────────────
Purpose: Display user's SAVED rentals from database
Flow: User visits page → Frontend → Backend database → Returns EXISTING rentals
Used For: Browse my saved properties, view details, apply filters
```

**Key Difference:**
- VAPI `website_search` = Real-time scraping of external sites
- `GET /rentals` = Database query of user's saved properties

**Both are needed!**

---

## 📋 What Your Backend Agent Needs to Confirm

### Question 1: Agent Filtering
**Ask Backend:** "Does `GET /agents` filter by user_id from JWT?"

```python
# This is what it SHOULD be:
@router.get("/agents")
async def get_agents(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    agents = await db.fetch_all(
        "SELECT * FROM agents WHERE user_id = :user_id",  # ← Is this here?
        {"user_id": user_id}
    )
    return {"agents": agents}
```

**If NO:** UI will show ALL agents (security risk!)  
**If YES:** UI works correctly

---

### Question 2: Rentals API
**Ask Backend:** "Does `GET /rentals` endpoint exist for listing user's saved properties?"

**NOT asking about:**
- ❌ VAPI `website_search` function (that's for real-time scraping)
- ❌ `/database/rentals/{website}` (that's for scraping results)

**Asking about:**
- ✅ Direct API for user's saved properties
- ✅ Database query: `SELECT * FROM rentals WHERE user_id = ?`

```python
# Does this exist?
@router.get("/rentals")
async def get_rentals(
    max_price: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    query = "SELECT * FROM rentals WHERE user_id = :user_id"
    # ... filters ...
    return {"rentals": rentals}
```

**If NO:** Frontend can't display user's properties  
**If YES:** Check if it filters by user_id

---

### Question 3: Dashboard Stats
**Ask Backend:** "Does `GET /dashboard/stats` endpoint exist for aggregated metrics?"

```python
# Does this exist?
@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    
    agent_count = await db.fetch_one(
        "SELECT COUNT(*) FROM agents WHERE user_id = :user_id"
    )
    
    rental_count = await db.fetch_one(
        "SELECT COUNT(*) FROM rentals WHERE user_id = :user_id"
    )
    
    return {
        "agents": {"total": agent_count},
        "rentals": {"total": rental_count},
        "calendar": {...}
    }
```

**If NO:** Dashboard can't show metrics  
**If YES:** Frontend can display analytics

---

## 🎯 Summary for Backend Agent

### Questions to Answer:

1. **`GET /agents` - Does it filter by user_id?**
   - Check the code: Does it have `WHERE user_id = ?`
   - If NO: ADD IT (security risk!)
   - If YES: ✅ Frontend will work

2. **`GET /rentals` - Does this endpoint exist?**
   - NOT the VAPI `website_search` function
   - A direct HTTP endpoint for listing saved properties
   - If NO: CREATE IT (from `BACKEND_REQUIREMENTS_FOR_UI.md`)
   - If YES: Does it filter by user_id?

3. **`GET /dashboard/stats` - Does this endpoint exist?**
   - Aggregated metrics (agent count, rental count, etc.)
   - If NO: CREATE IT (from `BACKEND_REQUIREMENTS_FOR_UI.md`)
   - If YES: ✅ Frontend will work

---

## ✅ What You Should Tell Backend Agent

**Message:**
> "Hey backend team! Frontend needs confirmation on 3 APIs:
> 
> 1. **`GET /agents`** - Does it filter by user_id from JWT? (Security issue if not)
> 2. **`GET /rentals`** - Does this exist? (Not the VAPI website_search, a direct database query)
> 3. **`GET /dashboard/stats`** - Does this exist? (Aggregated metrics endpoint)
> 
> See `BACKEND_REQUIREMENTS_FOR_UI.md` for exact specs if any are missing.
> 
> These are for UI display (user browsing pages), NOT for VAPI function calls!"

---

## 🚦 Decision Tree

```
┌─────────────────────────────────────┐
│ Backend confirms all 3 APIs exist   │
│ and filter by user_id correctly?    │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
       YES            NO
        │             │
        ▼             ▼
  ✅ Proceed      ⚠️ Backend must
   with UI        implement first
   reorganization  (4-5 hours work)
        │             │
        │             ▼
        │        Give them
        │        BACKEND_REQUIREMENTS_FOR_UI.md
        │             │
        │        Wait for completion
        │             │
        └──────┬──────┘
               │
               ▼
         Start Phase 1
         (Homepage)
```

---

**Want me to help you draft the message to your backend agent?**

