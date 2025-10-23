# 🚨 URGENT: Fix Google Sign-In User Creation

## Problem
**New users signing in with Google don't get created in your database**

## Root Cause
Missing `CLERK_WEBHOOK_SECRET` environment variable

---

## Quick Fix (5 minutes)

### 1. Get Webhook Secret from Clerk
```
1. Go to https://dashboard.clerk.com
2. Select your app
3. Click "Webhooks" in sidebar
4. Click "Add Endpoint" (or edit existing)
5. Endpoint URL: https://peterental-nextjs.vercel.app/api/webhooks/clerk
6. Subscribe to: user.created, user.updated, user.deleted
7. Copy the "Signing Secret" (whsec_...)
```

### 2. Add to Vercel (Production)
```
1. Go to https://vercel.com/dashboard
2. Select: peterental-nextjs
3. Settings → Environment Variables
4. Add new:
   Name: CLERK_WEBHOOK_SECRET
   Value: whsec_... (paste from Clerk)
   Environment: Production
5. Click Save
6. Redeploy your app
```

### 3. Add to .env.local (Local Development)
```bash
# Add this line to .env.local
CLERK_WEBHOOK_SECRET=whsec_your_secret_from_clerk
```

### 4. Restart Dev Server
```bash
# Stop server (Ctrl+C)
pnpm dev
```

---

## Verify It Works

1. **Open Vercel logs:**
   ```bash
   vercel logs --follow
   ```

2. **Test with new Google sign-in:**
   - Use incognito window
   - Go to your app
   - Sign in with a NEW Google account
   - Watch Vercel logs for:
     ```
     🔔 Clerk webhook: user.created event received
     ✅ User created in database
     ```

3. **Check database:**
   ```sql
   SELECT * FROM users ORDER BY created_at DESC LIMIT 1;
   ```
   Should show the new user with full_name populated

---

## What Was Fixed in Backend

✅ `UserPublic.from_user()` - Auto-computes full_name from first_name + last_name
✅ `create_from_clerk()` - Populates full_name on user creation
✅ `update()` - Auto-updates full_name when names change
✅ Existing user updated: "Mark Carpenter"

## What Was Fixed in Frontend

✅ Added detailed webhook logging
✅ Better error messages
✅ Updated .env.example with all required variables
✅ Created CLERK_WEBHOOK_SETUP.md guide

---

## If Still Not Working

See detailed troubleshooting in: `CLERK_WEBHOOK_SETUP.md`

Or check:
- Clerk dashboard → Webhooks → Recent attempts (see errors)
- Vercel dashboard → Functions → Logs
- Backend Render logs → Should show user creation
