# OAuth Fix - Backend Environment Variables on Render.com

## 🎯 The Real Issue

You don't have an Azure app because **someone else set it up** for the backend. The OAuth credentials and redirect URI are configured in the **backend's environment variables on Render.com**.

## 🔍 Where the Problem Is

The backend service on Render.com has these environment variables:

```bash
MICROSOFT_CLIENT_ID=xxxxx
MICROSOFT_CLIENT_SECRET=xxxxx
MICROSOFT_REDIRECT_URI=https://peterentalvapi-latest.onrender.com/calendar/auth/callback  # ❌ OLD URL
```

This is why Microsoft is rejecting the OAuth - the backend is telling Microsoft to redirect to the **old URL**.

## ✅ The Fix (3 minutes on Render.com)

### Step 1: Go to Render.com Dashboard

1. Go to https://dashboard.render.com
2. Find your backend service: `peterental-vapi-github-newer`
3. Click on it

### Step 2: Update Environment Variable

1. Click **Environment** (left sidebar)
2. Look for `MICROSOFT_REDIRECT_URI` (or similar - might be `REDIRECT_URI` or `BASE_URL`)
3. **Update it to:**
   ```
   MICROSOFT_REDIRECT_URI=https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback
   ```
4. Click **Save Changes**
5. Wait for the service to redeploy (automatic)

### Step 3: Test OAuth

1. Go to your frontend: `/users`
2. Click "Connect Microsoft Calendar"
3. Should work! ✅

## 🔍 Finding the Right Environment Variable

The backend might use different names. Look for:

- `MICROSOFT_REDIRECT_URI`
- `REDIRECT_URI`
- `OAUTH_REDIRECT_URI`
- `BASE_URL` (if it constructs the redirect URI dynamically)
- `CALENDAR_REDIRECT_URI`

**Find the one that has the old URL** (`peterentalvapi-latest.onrender.com`) and update it.

## 📋 Complete Backend Environment Variables (Should Have)

```bash
# Backend URL (for constructing redirect URIs)
BASE_URL=https://peterental-vapi-github-newer.onrender.com

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_REDIRECT_URI=https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback

# Database
DATABASE_URL=postgresql://...

# VAPI
VAPI_API_KEY=your-vapi-key

# Frontend (for OAuth callback)
FRONTEND_URL=https://peterental-nextjs.vercel.app
```

## 🧪 How to Verify It's Fixed

### Before Fix:

```bash
curl "https://peterental-vapi-github-newer.onrender.com/calendar/auth/start?user_id=mark@peterei.com"
```

Response will have:

```json
{
  "authorization_url": "https://login.microsoftonline.com/...&redirect_uri=https://peterentalvapi-latest.onrender.com/calendar/auth/callback"
}
```

❌ Notice the **old URL** in `redirect_uri`

### After Fix:

```json
{
  "authorization_url": "https://login.microsoftonline.com/...&redirect_uri=https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback"
}
```

✅ Notice the **new URL** in `redirect_uri`

## 🎯 Quick Summary

**The Problem:**

- Backend environment variables on Render.com still have the old URL
- When OAuth starts, backend tells Microsoft to redirect to old URL
- Microsoft rejects it

**The Fix:**

1. Go to Render.com dashboard
2. Find backend service
3. Update `MICROSOFT_REDIRECT_URI` (or similar) to new URL
4. Save and wait for redeploy
5. Test OAuth ✅

## 🚨 Important Notes

1. **You don't need Azure Portal access** - whoever set up the backend has that
2. **You only need Render.com access** - to update environment variables
3. **The backend will auto-redeploy** after changing env vars
4. **Frontend code is already correct** - no changes needed there

---

**Status:** Waiting for backend environment variable update on Render.com
**Action Required:** Update `MICROSOFT_REDIRECT_URI` in Render.com dashboard
**Estimated Time:** 3-5 minutes (including redeploy)
