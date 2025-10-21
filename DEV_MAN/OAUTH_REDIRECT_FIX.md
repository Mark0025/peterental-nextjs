# OAuth Redirect Issue - Wrong Backend URL

## 🚨 Problem

When connecting Microsoft Calendar, OAuth redirects to:

```
https://peterentalvapi-latest.onrender.com/calendar/auth/callback
```

Should redirect to:

```
https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback
```

---

## 🔍 Root Cause

**This is a BACKEND issue, not a frontend issue!**

The backend is configured with the wrong redirect URL in Microsoft Azure App Registration.

### How OAuth Works:

```
1. Frontend: User clicks "Connect Calendar"
2. Frontend → Backend: GET /calendar/auth?user_id=mark@peterei.com
3. Backend: Generates Microsoft OAuth URL with redirect_uri
4. Backend → Frontend: Returns authorization_url
5. Frontend: Redirects user to Microsoft
6. User: Approves permissions
7. Microsoft → Backend: Redirects to redirect_uri with code
8. Backend: Exchanges code for access token
```

**The problem is at step 3** - Backend is generating URL with old redirect_uri.

---

## ✅ Frontend is Correct

`.env.local` has correct backend URL:

```bash
NEXT_PUBLIC_API_URL=https://peterental-vapi-github-newer.onrender.com
```

Frontend correctly calls:

```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/calendar/auth?user_id=${userId}`
);
```

This resolves to:

```
https://peterental-vapi-github-newer.onrender.com/calendar/auth
```

✅ Frontend is calling the correct backend!

---

## ❌ Backend is Wrong

Backend is returning OAuth URL with wrong redirect_uri:

```json
{
  "authorization_url": "https://login.microsoftonline.com/...&redirect_uri=https://peterentalvapi-latest.onrender.com/calendar/auth/callback"
}
```

Should be:

```json
{
  "authorization_url": "https://login.microsoftonline.com/...&redirect_uri=https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback"
}
```

---

## 🔧 Fix Required (Backend)

### Option 1: Update Azure App Registration ✅ Recommended

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Select your app (PeteRental or similar)
4. Go to **Authentication** → **Redirect URIs**
5. **Add new redirect URI:**
   ```
   https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback
   ```
6. **Remove old URI:**
   ```
   https://peterentalvapi-latest.onrender.com/calendar/auth/callback
   ```
7. Save changes

### Option 2: Update Backend Environment Variable

Check backend's environment variables on Render.com:

```bash
# Backend should have:
REDIRECT_URI=https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback

# Or dynamically construct it from:
BASE_URL=https://peterental-vapi-github-newer.onrender.com
```

**Where to check:**

1. Go to https://dashboard.render.com/
2. Find service: `peterental-vapi-github-newer`
3. Go to **Environment** tab
4. Look for `REDIRECT_URI` or `BASE_URL`
5. Update if wrong

### Option 3: Update Backend Code

If backend hardcodes the URL, update the Python code:

```python
# ❌ BAD - Hardcoded old URL
REDIRECT_URI = "https://peterentalvapi-latest.onrender.com/calendar/auth/callback"

# ✅ GOOD - Use environment variable
REDIRECT_URI = os.getenv("REDIRECT_URI", "https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback")
```

---

## 🧪 Test the Fix

### 1. Verify Backend Returns Correct URL

```bash
curl "https://peterental-vapi-github-newer.onrender.com/calendar/auth?user_id=mark@peterei.com"
```

**Check response contains:**

```
redirect_uri=https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback
```

NOT:

```
redirect_uri=https://peterentalvapi-latest.onrender.com/calendar/auth/callback
```

### 2. Test OAuth Flow

1. Frontend: Click "Connect Calendar"
2. Redirects to Microsoft
3. Approve permissions
4. Check URL bar - should redirect to:
   ```
   https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback?code=...
   ```

---

## 📋 Quick Checklist

- [x] Frontend `.env.local` has correct `NEXT_PUBLIC_API_URL`
- [ ] Backend environment has correct `REDIRECT_URI`
- [ ] Azure App Registration has new redirect URI added
- [ ] Azure App Registration has old redirect URI removed (or keep both during transition)
- [ ] Test OAuth flow end-to-end

---

## 🔄 Workaround (Temporary)

**Keep BOTH redirect URIs in Azure:**

1. Add new: `https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback`
2. Keep old: `https://peterentalvapi-latest.onrender.com/calendar/auth/callback`

This way, if backend is still using old URL, it won't break while you migrate.

---

## 💡 Why This Happened

You migrated from:

```
peterentalvapi-latest.onrender.com
```

To:

```
peterental-vapi-github-newer.onrender.com
```

But forgot to update:

1. ✅ Frontend `.env.local` (YOU DID THIS)
2. ❌ Backend environment variables (NEEDS FIXING)
3. ❌ Azure App Registration (NEEDS FIXING)

---

## 🎯 Action Items

**Immediate (You need to do this):**

1. **Check Backend Env Vars on Render.com**

   - Login to https://dashboard.render.com/
   - Find: `peterental-vapi-github-newer`
   - Environment tab
   - Look for `REDIRECT_URI` or similar
   - Update to new URL

2. **Update Azure App Registration**

   - Login to https://portal.azure.com/
   - Add new redirect URI
   - Test OAuth flow

3. **Or: Redeploy Backend**
   - If backend code has hardcoded URL
   - Update code
   - Push to GitHub
   - Backend auto-deploys

---

## 📞 Need Help?

If you don't have access to Azure App Registration or backend code:

1. Check with whoever set up the Microsoft OAuth app
2. They need to add the new redirect URI to Azure
3. Or give you access to Azure Portal

---

**Status:** 🔴 Backend Configuration Issue
**Impact:** OAuth flow broken
**Priority:** HIGH - Blocks calendar integration
