# OAuth Redirect URI Fix

## ❌ Problem

**Error from Microsoft:**

```
invalid_request: The provided value for the input parameter 'redirect_uri' is not valid.
The expected value is a URI which matches a redirect URI registered for this client application.
```

## 🔍 Root Cause

The **Azure App Registration** (Microsoft OAuth config) still has the **old backend URL** registered as the redirect URI:

- ❌ **Old (currently registered):** `https://peterentalvapi-latest.onrender.com/calendar/auth/callback`
- ✅ **New (needs to be added):** `https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback`

When a user clicks "Connect Microsoft Calendar", the flow is:

1. Frontend → Backend `/calendar/auth/start`
2. Backend → Redirects to Microsoft OAuth
3. User authorizes
4. Microsoft → Tries to redirect to `redirect_uri` (the new URL)
5. ❌ **Microsoft rejects** because only the old URL is registered

## ✅ Solution

You need to **update the Azure App Registration** to include the new redirect URI.

### Step 1: Go to Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Find your app (the one used for PeteRental OAuth)

### Step 2: Update Redirect URIs

1. Click on your app
2. Go to **Authentication** (in left sidebar)
3. Under **Platform configurations** → **Web** → **Redirect URIs**, you'll see:

   - `https://peterentalvapi-latest.onrender.com/calendar/auth/callback` (old)

4. **Add the new redirect URI:**

   ```
   https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback
   ```

5. Click **Save**

### Step 3: (Optional) Remove Old URI

Once you've verified the new backend is working:

1. Go back to **Authentication** → **Redirect URIs**
2. Remove the old URI: `https://peterentalvapi-latest.onrender.com/calendar/auth/callback`
3. Click **Save**

## 🧪 Test the Fix

After updating Azure:

1. Go to your frontend: `/users`
2. Click "Connect Microsoft Calendar"
3. You should be redirected to Microsoft login
4. After authorizing, you should be redirected back to:
   ```
   https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback?code=...&state=...
   ```
5. The backend should exchange the code for tokens
6. You should see "Connected" status in the frontend

## 📋 Complete Redirect URI Configuration

Your Azure App should have these redirect URIs:

### Production (Live Backend)

```
https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback
```

### Development (Optional - for local testing)

```
http://localhost:8000/calendar/auth/callback
```

## 🔐 Security Note

- The `redirect_uri` is **NOT** configurable from the frontend for security
- It must match exactly what's registered in Azure
- The backend constructs the OAuth URL with the correct `redirect_uri`
- Microsoft validates it matches what's in Azure App Registration

## 📝 What the Frontend Does

The frontend code is **correct** and doesn't need changes:

```typescript
// src/lib/api/calendar.ts
getAuthStartURL(userId: string): string {
  return `${this.baseURL}/calendar/auth/start?user_id=${encodeURIComponent(userId)}`
  // Points to: https://peterental-vapi-github-newer.onrender.com/calendar/auth/start
}
```

The **backend** at `/calendar/auth/start` constructs the Microsoft OAuth URL with the correct `redirect_uri`.

## ✅ No Frontend Changes Needed

The frontend is already configured correctly:

- ✅ `.env.local` has `NEXT_PUBLIC_API_URL=https://peterental-vapi-github-newer.onrender.com`
- ✅ All API calls use this URL
- ✅ OAuth flow points to the correct backend

**The fix is 100% in Azure App Registration.**

## 🚀 After Fix

Once Azure is updated:

1. OAuth will work correctly
2. Users can connect their Microsoft calendars
3. All calendar features will work (events, availability, appointments)

---

**Status:** Waiting for Azure App Registration update
**Action Required:** Update redirect URI in Azure Portal
**Estimated Time:** 2-3 minutes
