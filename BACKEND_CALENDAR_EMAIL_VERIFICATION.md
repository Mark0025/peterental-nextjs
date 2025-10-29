# 🔍 Backend Calendar Email Verification Requirements

## 🚨 Critical Issue

**Problem**: Frontend shows calendar as "connected" but:
1. User didn't go through OAuth flow
2. Email `mark@localhousebuyers.net` may not have a Microsoft account
3. Cannot verify if connection is legitimate or false positive

**Root Cause**: Need to ensure backend returns **actual Microsoft/Google calendar email** from OAuth tokens, not Clerk email.

---

## ✅ Frontend Implementation

The frontend now displays:
1. **Side-by-side comparison**: Shows Clerk account email vs Calendar account email
2. **Warning**: If calendar email = account email (indicates potential false positive)
3. **Success**: If calendar email ≠ account email (indicates legitimate connection)
4. **Provider badge**: Shows 🔵 Microsoft or 🔴 Google

### **Visual Display**

```
┌─────────────────────────────────────────┐
│ Your Account Email (Clerk):            │
│ mark@localhousebuyers.net              │
│                                         │
│ Connected Calendar Account: 🔵         │
│ actual_microsoft@outlook.com           │
│                                         │
│ ✅ Calendar connected to a different    │
│    account than your Clerk email.       │
│    This indicates a valid connection.   │
└─────────────────────────────────────────┘
```

OR (if there's an issue):

```
┌─────────────────────────────────────────┐
│ Your Account Email (Clerk):            │
│ mark@localhousebuyers.net              │
│                                         │
│ Connected Calendar Account: 🔵         │
│ mark@localhousebuyers.net              │
│                                         │
│ ⚠️ Warning: Calendar email matches      │
│    your account email.                  │
│    This may indicate the calendar is    │
│    not actually connected.              │
└─────────────────────────────────────────┘
```

---

## 📋 Backend Requirements

### **1. `/calendar/auth/status` Endpoint**

**Must return**:

```json
{
  "user_id": "user_34Qq8GSCZfnEvFffTzIhx1hXJR8",
  "user_email": "mark@localhousebuyers.net",  // Clerk email (from users table)
  "calendar_email": "actual_microsoft@outlook.com",  // ⚠️ CRITICAL: Actual Microsoft/Google account email from oauth_tokens.calendar_email
  "provider": "microsoft",  // or "google"
  "authorized": true,
  "token_valid": true,
  "expires_at": "2025-11-26T15:30:00Z"
}
```

**Critical Points**:

1. **`calendar_email` MUST come from `oauth_tokens.calendar_email`** (NOT `users.email`)

   ```sql
   -- ✅ CORRECT:
   SELECT calendar_email FROM oauth_tokens 
   WHERE user_id = 'user_34Qq8GSCZfnEvFffTzIhx1hXJR8' 
   AND provider = 'microsoft';
   -- Returns: actual_microsoft@outlook.com

   -- ❌ WRONG:
   -- Returning users.email (Clerk email) as calendar_email
   ```

2. **`calendar_email` should be NULL if no token exists**

   ```python
   # ✅ CORRECT:
   if token_data:
       calendar_email = token_data.get("calendar_email")  # From oauth_tokens table
   else:
       calendar_email = None  # No connection
   
   # ❌ WRONG:
   calendar_email = user.email  # Defaulting to Clerk email
   ```

3. **If `calendar_email` is NULL, return `authorized: false`**

   ```python
   # ✅ CORRECT:
   authorized = bool(token_data and token_data.get("calendar_email"))
   
   # ❌ WRONG:
   authorized = user.has_microsoft_calendar  # Using database flag alone
   ```

### **2. Populating `calendar_email` in OAuth Callback**

When user completes OAuth flow, backend must:

1. **Get calendar email from Microsoft Graph API**:

   ```不用
   # After exchanging OAuth code for tokens:
   me_response = await microsoft_graph.get("/me", headers={"Authorization": f"Bearer {access_token}"})
   calendar_email = me_response.json().get("mail") or me_response.json().get("userPrincipalName")
   # Example: "mark.carpenter@outlook.com" or "mark@microsoft.com"
   ```

2. **Store in database**:

   ```sql
   INSERT INTO oauth_tokens (user_id, provider, access_token, calendar_email, ...)
   VALUES ('user_34Qq8GSCZfnEvFffTzIhx1hXJR8', 'microsoft', '...', 'actual_microsoft@outlook.com', ...)
   ```

3. **DO NOT default to Clerk email**:

   ```python
   # ❌ WRONG:
   calendar_email = user.email  # mark@localhousebuyers.net
   
   # ✅ CORRECT:
   calendar_email = microsoft_graph_response.get("mail")  # actual_microsoft@outlook.com
   ```

### **3. Database Schema Verification**

**Check `oauth_tokens` table**:

```sql
-- Verify calendar_email is populated correctly
SELECT 
  user_id,
  provider,
  calendar_email,  -- ⚠️ This should be the actual Microsoft/Google account email
  expires_at,
  CASE 
    WHEN calendar_email IS NULL THEN 'NO_EMAIL'
    WHEN expires_at < NOW() THEN 'EXPIRED'
    WHEN access_token IS NULL THEN 'NO_TOKEN'
    ELSE 'VALID'
  END as status
FROM oauth_tokens
WHERE user_id = 'user_34Qq8GSCZfnEvFffTzIhx1hXJR8';
```

**Expected Result if Connected**:
```
user_id: user_34Qq8GSCZfnEvFffTzIhx1hXJR8
provider: microsoft
calendar_email: actual_microsoft@outlook.com  ← Should be different from Clerk email!
status: VALID
```

**Red Flags**:
- `calendar_email` = `mark@localhousebuyers.net` (same as Clerk email)
- `calendar_email` IS NULL (but `authorized: true`)
- `expires_at` < NOW() (but `authorized: true`)

---

## 🔍 Current User Investigation

**User**: `user_34Qq8GSCZfnEvFffTzIhx1hXJR8`

**Clerk Data**:
- Email: `mark@localhousebuyers.net`
- Signed in via: Google OAuth (`oauth_google`)
- **No Microsoft account in Clerk**

**Questions for Backend**:

1. **Does OAuth token exist?**
   ```sql
   SELECT * FROM oauth_tokens
   WHERE user_id = 'user_34Qq8GSCZfnEvFffTzIhx1hXJR8'
   AND provider = 'microsoft';
   ```
   - If 0 rows → User is NOT connected (backend should return `authorized: false`)
   - If 1+ rows → Continue to question 2

2. **What is `calendar_email` value?**
   ```sql
   SELECT calendar_email FROM oauth_tokens
   WHERE user_id = 'user_34Qq8GSCZfnEvFffTzIhx1hXJR8'
   AND provider = 'microsoft';
   ```
   - If `NULL` → Backend should return `authorized: false`
   - If `mark@localhousebuyers.net` → **RED FLAG**: Same as Clerk->email (potential issue)
   - If `something@outlook.com` → Likely legitimate

3. **Is token valid?**
   ```sql
   SELECT expires_at, access_token
   FROM oauth_tokens
   WHERE user_id = 'user_34Qq8GSCZfnEvFffTzIhx1hXJR8'
   AND provider = 'microsoft';
   ```
   - If `expires_at < NOW()` → Token expired
   - If `access_token IS NULL` → No token (should be `authorized: false`)

---

## ✅ Backend Verification Checklist

For `/calendar/auth/status` endpoint:

- [ ] Checks `oauth_tokens` table (not just `users.has_microsoft_calendar` flag)
- [ ] Returns `authorized: false` if no token exists
- [ ] Returns `authorized: false` if `calendar_email IS NULL`
- [ ] Returns `authorized: false` if token expired
- [ ] Returns `calendar_email` from `oauth_tokens.calendar_email` (not `users.email`)
- [ ] Returns `provider` from `oauth_tokens.provider`
- [ ] Returns `token_valid` based on expiry check
- [ ] Returns `user_email` from `users.email` (Clerk email) - separate field

For OAuth callback:

- [ ] Fetches calendar email from Microsoft Graph API `/me` endpoint
- [ ] Stores `calendar_email` in `oauth_tokens` table
- [ ] Does NOT default to Clerk email if Graph API call fails
- [ ] Only sets `authorized: true` after successful token storage

---

## 🎯 Expected Behavior Examples

### **Scenario 1: Legitimate Connection**

**Backend Returns**:
```json
{
  "user_id": "user_34Qq8GSCZfnEvFffTzIhx1hXJR8",
  "user_email": "mark@localhousebuyers.net",
  "calendar_email": "mark.carpenter@outlook.com",  // Different from Clerk email
  "provider": "microsoft",
  "authorized": true,
  "token_valid": true
}
```

**Frontend Shows**:
- ✅ Clerk email: `mark@localhousebuyers.net`
- ✅ Calendar email: `mark.carpenter@outlook.com` (different!)
- ✅ Success message: "Calendar connected to a different account"

### **Scenario 2: False Positive (Current Issue)**

**Backend Returns**:
```json
{
  "user_id": "user_34Qq8GSCZfnEvFffTzIhx1hXJR8",
  "user_email": "mark@localhousebuyers.net",
  "calendar_email": "mark@localhousebuyers.net",  // Same as Clerk email - RED FLAG!
  "provider": "microsoft",
  "authorized": true,
  "token_valid": true
}
```

**Frontend Shows**:
- ⚠️ Clerk email: `mark@localhousebuyers.net`
- ⚠️ Calendar email: `mark@localhousebuyers.net` (same!)
- ⚠️ **Warning**: "Calendar email matches your account email. This may indicate the calendar is not actually connected."

### **Scenario 3: Not Connected**

**Backend Returns**:
```json
{
  "user_id": "user_34Qq8GSCZfnEvFffTzIhx1hXJR8",
  "user_email": "mark@localhousebuyers.net",
  "calendar_email": null,
  "provider": null,
  "authorized": false,
  "token_valid": false
}
```

**Frontend Shows**:
- ❌ "Not Connected"
- ✅ "Connect Microsoft Calendar" button

---

## 📝 Summary for Backend Agent

**The Frontend Needs**:

1. **`calendar_email` field**: Must be the **actual Microsoft/Google account email** from OAuth tokens
   - NOT the Clerk email
   - Must come from `oauth_tokens.calendar_email` table
   - Must be populated from Microsoft Graph API during OAuth callback

2. **Accurate `authorized` status**: Only `true` if:
   - OAuth token exists
   - `calendar_email` is not NULL
   - Token is not expired
   - NOT just based on `users.has_microsoft_calendar` flag

3. **Proper validation**: Backend must check actual token existence, not database flags

**The Frontend Will**:
- ✅ Display both emails side-by-side
- ✅ Warn users if calendar email = account email (potential false positive)
- ✅ Show success if emails are different (legitimate connection)
- ✅ Help identify issues for 1000+ users

---

*Created: 2025-10-29*  
*Status: Frontend ready - waiting for backend verification and fixes*  
*Priority: High - affects user trust and system accuracy*

