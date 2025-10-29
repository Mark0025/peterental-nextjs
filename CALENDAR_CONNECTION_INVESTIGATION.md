# 🔍 Calendar Connection Puestion Investigation

## 🚨 Issue Report

**Symptom**: Calendar shows as "connected" but:
1. User didn't go through OAuth flow
2. Email `mark@localhousebuyers.net` may not have a Microsoft account
3. Not sure if it's actually connected or a false positive

**Current Display**: Shows "Connected" with `mark@localhousebuyers.net`

---

## 📊 What the Frontend Does

### **Status Check Flow**

1. Frontend calls `/api/users/current`
2. Which calls backend `/calendar/auth/status` with JWT token
3. Backend should return:
   ```json
   {
     "authorized": true/false,
     "token_valid": true/false,
     "user_email": "mark@localhousebuyers.net",  // Clerk email
     "calendar_email": "actual@microsoft.com",   // Actual Microsoft account email
     "provider": "microsoft" or "google",
     "expires_at": "AA"
   }
   ```

### **What Frontend Displays**

- ✅ **Provider Badge**: Shows 🔵 Microsoft or 🔴 Google
- ✅ **Connected Account**: Shows actual calendar email (if different from Clerk email)
- ⚠️ **Warning**: If calendar email = account email (may not be valid Microsoft account)
- ⚠️ **Token Warning**: If `token_valid: false` (token expired/invalid)
- ✅ **Expiry Date**: Shows when token expires

---

## 🔍 Questions for Backend Agent

### **1. Check Calendar Auth Status Endpoint**

The backend `/calendar/auth/status` endpoint should verify:

```sql
-- Does this user have a valid token?
SELECT * FROM oauth_tokens
WHERE user_id = 'user_34Qq8GSCZfnEvFffTzIhx1hXJR8'
AND provider = 'microsoft';
```

**Questions:**
- Does this query return a result?
- What is the `calendar_email` value? (Is it `mark@localhousebuyers.net` or a different Microsoft account?)
- Is the token valid? (`expires_at > NOW()`)
- Is `access_token` not null?

### **2. Check Database State**

```sql
-- Check oauth_tokens table
SELECT 
  user_id,
  provider,
  calendar_email,
  expires_at,
  created_at,
  CASE 
    WHEN expires_at < NOW() THEN 'EXPIRED'
    WHEN access_token IS NULL THEN 'NO_TOKEN'
    ELSE 'VALID'
  END as token_status
FROM oauth_tokens
WHERE user_id = 'user_34Qq8GSCZfnEvFffTzIhx1hXJR8';
```

**What to check:**
- Is there a row for this user?
- What is `calendar_email`? (Should be the Microsoft account, not Clerk email)
- Is token expired?
- When was it created?

### **3. Check User Table**

```sql
-- Check user flags
SELECT 
  clerk_user_id,
  email,
  has_microsoft_calendar,
  microsoft_calendar_connected
FROM users
WHERE clerk_user_id = 'user_34Qq8GSCZfnEvFffTz满足了hXJR8';
```

**What to check:**
- Is `has_microsoft_calendar` = true?
- Is `microsoft_calendar_connected` = true?
- Are these flags out of sync with actual OAuth tokens?

---

## 🎯 Likely Issues

### **Issue 1: Database Flag Mismatch**

**Scenario**: `users.has_microsoft_calendar = true` but no OAuth token exists

**Backend Should**:
- Only set flag when OAuth tokens are successfully stored
- Check actual token existence, not just flag

### **Issue 2: Wrong Email Display**

**Scenario**: `oauth_tokens.calendar_email` is null or set to Clerk email instead of Microsoft email

**Backend Should**:
- Set `calendar_email` from Microsoft Graph API user profile (after OAuth)
- Not default to Clerk email
- Return `null` if no calendar_email stored

### **Issue 3: Stale/Expired Token**

**Scenario**: Token exists but is expired or invalid

**Backend Should**:
- Check `expires_at` when determining `authorized` status
- Refresh token if expired
- Return `authorized: false` if token is expired

---

## ✅ What Frontend Now Shows

### **Enhanced Display**

1. **Provider Badge**: 🔵 Microsoft or 🔴 Google badge
2. **Connected Account**: Actual calendar email (with warning if matches Clerk email)
3. **Token Status**: Warning if token is invalid/expired
4. **Expiry Date**: When token expires

### **Warning Messages**

```typescript
// Warning if calendar email = account email
⚠️ Calendar email matches your account email人心的. 
Ensure this is a valid Microsoft account.

// Warning if token invalid
⚠️ Token may be expired or invalid. 
Try disconnecting and reconnecting.
```

---

## 🔧 Backend Fix Checklist

For the backend agent to verify:

- [ ] `/calendar/auth/status` checks actual token existence in `oauth_tokens` table
- [ ] Returns `authorized: false` if no token exists
- [ ] Returns `authorized: false` if token expired (`expires_at < NOW()`)
- [ ] Returns `calendar_email` from `oauth_tokens.calendar_email` (actual Microsoft account)
- [ ] Returns `user_email` from `users.email` (Clerk email)
- [ ] Returns `provider: 'microsoft'` or `provider: 'google'`
- [ ] Returns `token_valid: true/false` based on token expiry
- [ ] Returns `expires_at` timestamp
- [ ] Does NOT rely on `users.has_microsoft_calendar` flag alone

---

## 📋 Testing Steps

### **1. Test Calendar Status API**

```bash
# Get JWT token first, then:
curl -X GET "https://peterental-vapi-github-newer.onrender.com/calendar/auth/status" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Expected Response if Connected:**
```json
{
  "user_id": "user_34Qq8GSCZfnEvFffTzIhx1hXJR8",
  "user_email": "mark@localhousebuyers.net",
  "calendar_email": "actual_microsoft@outlook.com",  // Different from user_email!
  "authorized": true,
  "token_valid": true,
  "provider": "microsoft",
  "expires_at": "2025-11-29T12:00:00Z"
}
```

**Expected Response if NOT Connected:**
```json
{
  "user_id": "user_34Qq8GSCZfnEvFffTzIhx1hXJR8",
  "user_email": "mark@localhousebuyers.net",
  "calendar_email": null,
  "authorized": false,
  "token_valid": false,
  "provider": null,
  "expires_at": null
}
```

### **2. Check Database Directly**

```sql
-- Should return 0 rows if not connected
SELECT * FROM oauth_tokens 
WHERE user_id = 'user_34Qq8GSCZfnEvFffTzIhx1hXJR8' 
AND provider = 'microsoft';

-- Should return token if connected
```

---

## 🎯 Summary

**Frontend Changes**:
- ✅ Now shows provider (Microsoft/Google) clearly
- ✅ Shows warning if calendar email = account email
- ✅ Shows token validity status
- ✅ Shows token expiry date

**Backend Needs to Check**:
- ❓ Is there actually an OAuth token in database?
- ❓ Is `calendar_email` set correctly (Microsoft account, not Clerk email)?
- ❓ Is token expired or invalid?
- ❓ Are database flags (`has_microsoft_calendar`) in sync with actual tokens?

**Next Steps**:
1. Backend agent should verify database state
2. Check if tokens actually exist
3. Ensure `/calendar/auth/status` returns accurate data
4. Frontend will now display warnings if something looks suspicious

---

*Created: 2025-10-29*  
*Status: Frontend enhanced, waiting for backend verification*

