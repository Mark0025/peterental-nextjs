# 🔧 Backend Fix: Calendar OAuth Start Endpoint

## 🚨 Issue

**Error**: `{"detail":"Missing or invalid authorization header"}`  
**Endpoint**: `GET /calendar/auth/start?user_id=user_34Qq8GSCZfnEvFffTzIhx1hXJR8`  
**Location**: Backend (`peterental-vapi-github-newer.onrender.com`)

## ❌ Problem

The backend endpoint `/calendar/auth/start` is **incorrectly requiring JWT authentication**. This is wrong because:

1. **OAuth flows start without authentication** - You redirect the user to Microsoft first
2. **The endpoint initiates an external redirect** - Not an authenticated API call
3. **Browser redirects don't send Authorization headers** - Frontend uses `window.location.href`

---

## ✅ Expected Behavior

### **Current Flow (Incorrect)**

```
Frontend → GET /calendar/auth/start?user_id=XXX
         → Backend requires Authorization header ❌
         → Backend returns 401: "Missing authorization header" ❌
         → User sees error instead of Microsoft login ❌
```

### **Correct Flow**

```
Frontend → GET /calendar/auth/start?user_id=user_XXX
         → Backend accepts request (NO auth required) ✅
         → Backend generates Microsoft OAuth URL ✅
         → Backend redirects to Microsoft ✅
         → User sees Microsoft login page ✅
```

---

## 🔍 How Frontend Calls It

The frontend does **NOT** send Authorization headers:

```typescript
// src/actions/calendar-actions.ts
export async function getCalendarAuthURL(): Promise<string> {
  const { userId } = await auth()
  
  // Just returns a URL string - no fetch, no headers
  return `${API_URL}/calendar/auth/start?user_id=${encodeURIComponent(userId)}`
}

// src/app/users/page.tsx
const handleConnectCalendar = async () => {
  const authUrl = await getCalendarAuthURL()
  // Browser redirect - NO Authorization header sent
  window.location.href = authUrl  // ← This is a browser redirect, not an API call!
}
```

**Key Point**: `window.location.href` is a **browser redirect**, not an API call. Browsers don't send custom Authorization headers on redirects.

---

## 🔧 Backend Fix Required

### **Option 1: Remove Auth Requirement (Recommended)**

```python
# BEFORE (Wrong):
@app.get("/calendar/auth/start")
async def start_calendar_auth(
    user_id: str = Query(...),
    authorization: str = Header(..., alias="Authorization")  # ❌ Wrong!
):
    # ... code

# AFTER (Correct):
@app.get("/calendar/auth/start")
async def start_calendar_auth(
    user_id: str = Query(...),  # ✅ Only needs user_id parameter
    # No Authorization required!
):
    """
    Start Microsoft Calendar OAuth flow.
    
    This endpoint does NOT require JWT authentication because:
    1. It's the START of an OAuth flow (user isn't authenticated with Microsoft yet)
    2. Frontend uses browser redirect (window.location.href), which doesn't send headers
    3. This redirects to Microsoft, not returns data
    
    Parameters:
        user_id: Clerk user ID (e.g., "user_34Qq8GSCZfnEvFffTzIhx1hXJR8")
    
    Returns:
        Redirect to Microsoft OAuth URL
    """
    
    # Validate user_id exists (optional but recommended)
    # This is just to ensure we're starting OAuth for a valid user
    # You can check if user exists in database, but DON'T require JWT
    
    # Generate Microsoft OAuth URL
    oauth_url = generate_microsoft_oauth_url(
        user_id=user_id,
        redirect_uri=f"{BACKEND_URL}/calendar/auth/callback"
    )
    
    # Redirect to Microsoft
    return RedirectResponse(url=oauth_url)
```

### **Option 2: Accept user_id WITHOUT JWT (Alternative)**

If you want some validation, you can check the user exists without requiring JWT:

```python
@app.get("/calendar/auth/start")
async def start_calendar_auth(
    user_id: str = Query(...),
    # No Authorization header required!
):
    # Optional: Validate user exists (without JWT)
    user = await db.get_user_by_clerk_id(user_id)
    if not user:
        # User doesn't exist - could create them here or return error
        # But this is optional - OAuth could work without checking
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate OAuth URL
    oauth_url = generate_microsoft_oauth_url(user_id=user_id)
    
    return RedirectResponse(url=oauth_url)
```

---

## 📋 Which Endpoints Need Auth vs Don't

### **Endpoints That DO Need JWT Auth**

These endpoints are called via `fetch()` with headers:

```python
# ✅ REQUIRE JWT:
- GET  /users/me                      # Gets current user from JWT
- GET  /calendar/auth/status          # Checks if user's calendar is connected
- GET  /calendar/events               # Gets user's calendar events
- POST /calendar/events               # Creates calendar event for user
- GET  /calendar/availability         # Gets user's available time slots
- DELETE /calendar/auth/disconnect   # Disconnects user's calendar
- GET  /vapi/assistants              # Gets user's VAPI assistants
```

**Frontend calls these with**:
```typescript
fetch(`${API_URL}/calendar/auth/status`, {
  headers: {
    'Authorization': `Bearer ${jwt_token}`,  // ✅ Sends JWT
    'Content-Type': 'application/json',
  }
})
```

### **Endpoints That DON'T Need JWT Auth**

These are called via browser redirect or are public:

```python
# ❌ NO JWT REQUIRED:
- GET  /calendar/auth/start           # OAuth initiation (browser redirect)
- GET  /calendar/auth/callback        # OAuth callback (called by Microsoft)
- POST /vapi/webhook                  # Called by VAPI (not frontend)
- GET  /                              # Public health check
- GET  /health                        # Public health check
- GET  /docs                          # Public API docs
```

**Why `/calendar/auth/start` doesn't need auth:**
- Called via `window.location.href = url` (browser redirect)
- Browser doesn't send Authorization headers on redirects
- It's the **start** of OAuth - user isn't authenticated with Microsoft yet
- Purpose is to redirect to Microsoft, not return data

---

## ✅ Expected Response

### **When Working Correctly**

**Request:**
```
GET https://peterental-vapi-github-newer.onrender.com/calendar/auth/start?user_id=user_34Qq8GSCZfnEvFffTzIhx1hXJR8
```

**Response:**
```
HTTP 307 Temporary Redirect
Location: https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=XXX&redirect_uri=https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback&response_type=code&scope=Calendars.ReadWrite&state=user_34Qq8GSCZfnEvFffTzIhx1hXJR8
```

**User sees:**
- Microsoft login page (not an error)
- After login → Microsoft redirects to `/calendar/auth/callback`
- Backend exchanges code for tokens
- User redirected back to frontend with success

---

## 🔍 Testing

### **Test 1: Check Current Behavior**

```bash
curl "https://peterental-vapi-github-newer.onrender.com/calendar/auth/start?user_id=user_34Qq8GSCZfnEvFffTzIhx1hXJR8"
```

**Current (Wrong):**
```json
{"detail":"Missing or invalid authorization header"}
```

**Expected (Correct):**
```
HTTP 307 Redirect
Location: https://login.microsoftonline.com/...
```

### **Test 2: Verify No Auth Header Needed**

```bash
# Should work WITHOUT Authorization header
curl -v "https://peterental-vapi-github-newer.onrender.com/calendar/auth/start?user_id=user_34Qq8GSCZfnEvFffTzIhx1hXJR8" 2>&1 | grep -i location
```

Should show Microsoft OAuth URL in `Location` header.

---

## 📝 Summary for Backend Agent

**The Issue:**
- `/calendar/auth/start` is requiring JWT authentication
- Frontend uses browser redirect (`window.location.href`), which doesn't send headers
- This is an OAuth **initiation** endpoint - it shouldn't require auth

**The Fix:**
- Remove `Authorization` header requirement from `/calendar/auth/start`
- Accept only `user_id` query parameter
- Redirect to Microsoft OAuth URL
- Keep JWT auth on other endpoints (like `/calendar/auth/status`, `/calendar/events`, etc.)

**Reference:**
- See `AUTHENTICATION_FLOW_DOCUMENTATION.md` for complete flow
- See "Calendar OAuth Flow" section for sequence diagram

---

*Created: 2025-10-29*  
*Issue: Calendar connection failing with "Missing authorization header"*  
*Status: Backend fix required*

