# Clerk Webhook Setup Guide

## 🚨 Critical Issue Identified

**Problem:** New users signing in with Google don't get created in the database

**Root Cause:** Clerk webhook is not properly configured

---

## ✅ Step-by-Step Fix

### Step 1: Get Your Clerk Webhook Secret

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Webhooks** in the sidebar
4. Click **Add Endpoint** (or edit existing endpoint)
5. For **Endpoint URL**, enter:
   ```
   https://peterental-nextjs.vercel.app/api/webhooks/clerk
   ```
6. Under **Subscribe to events**, select:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
7. Click **Create** (or **Save**)
8. Copy the **Signing Secret** (starts with `whsec_...`)

### Step 2: Add Webhook Secret to Environment Variables

#### Local Development (`.env.local`)
```bash
# Add this line to .env.local
CLERK_WEBHOOK_SECRET=whsec_your_secret_here
```

#### Production (Vercel)
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project: `peterental-nextjs`
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `CLERK_WEBHOOK_SECRET`
   - **Value:** `whsec_your_secret_here` (paste the signing secret from Clerk)
   - **Environment:** Production (and Preview if needed)
5. Click **Save**
6. **Redeploy** your app for changes to take effect

### Step 3: Restart Development Server

```bash
# Stop your dev server (Ctrl+C)
# Restart it
pnpm dev
```

---

## 🧪 Testing the Webhook

### Option 1: Test in Clerk Dashboard
1. In Clerk Dashboard → Webhooks → Your endpoint
2. Click **Testing** tab
3. Select event: `user.created`
4. Click **Send Example**
5. Check the response - should see `200 OK`

### Option 2: Test with Real Google Sign-In
1. Open an incognito/private browser window
2. Go to your app: https://peterental-nextjs.vercel.app
3. Sign out if logged in
4. Click **Sign in with Google**
5. Complete Google authentication
6. After successful sign-in, check:
   - Vercel logs for webhook processing
   - Backend database for new user creation
   - Your `/users` page should show the new user

### Option 3: Check Vercel Logs
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login
vercel login

# View real-time logs
vercel logs --follow
```

Watch for these log messages:
- `🔔 Clerk webhook: user.created event received`
- `📧 Email: user@example.com`
- `👤 Name data: { first_name: 'John', last_name: 'Doe' }`
- `✅ User created in database`

---

## 🔍 Troubleshooting

### Issue: Webhook returns 400 error
**Cause:** `CLERK_WEBHOOK_SECRET` is not set or incorrect

**Fix:**
1. Verify secret in `.env.local` (local) or Vercel dashboard (production)
2. Make sure there are no extra spaces or quotes
3. Restart dev server / redeploy on Vercel

### Issue: User created but name is empty
**Cause:** Google OAuth doesn't always provide first_name/last_name

**Fix:**
1. Check Clerk Dashboard → Users → Your user
2. See what data Clerk received from Google
3. If name is missing in Clerk, you'll need to either:
   - Manually update name in Clerk dashboard
   - Add a profile completion page in your app
   - Use the email prefix as fallback name

### Issue: Webhook not firing at all
**Cause:** Endpoint URL is incorrect or webhook not enabled

**Fix:**
1. Check webhook endpoint URL in Clerk dashboard
2. Production: `https://peterental-nextjs.vercel.app/api/webhooks/clerk`
3. Local testing: Use ngrok or similar tunnel
4. Verify events are subscribed: `user.created`, `user.updated`, `user.deleted`

### Issue: Backend returns 500 error
**Cause:** Backend can't create user (database issue)

**Check:**
1. Backend logs on Render
2. Database connection
3. User already exists with same email/clerk_user_id

---

## 📊 Verification Checklist

After setup, verify everything works:

- [ ] `CLERK_WEBHOOK_SECRET` added to `.env.local`
- [ ] `CLERK_WEBHOOK_SECRET` added to Vercel environment variables
- [ ] Webhook endpoint configured in Clerk dashboard
- [ ] Webhook URL is correct: `https://peterental-nextjs.vercel.app/api/webhooks/clerk`
- [ ] Events subscribed: `user.created`, `user.updated`, `user.deleted`
- [ ] Vercel app redeployed after adding env variable
- [ ] Test webhook in Clerk dashboard shows `200 OK`
- [ ] New Google sign-in creates user in database
- [ ] Name displays correctly in `/users` page

---

## 🎯 What Happens After Fix

1. **User signs in with Google** → Clerk creates user account
2. **Clerk fires `user.created` webhook** → Sends to your endpoint
3. **Your Next.js webhook handler** → Verifies signature with `CLERK_WEBHOOK_SECRET`
4. **Backend creates user** → Stores in PostgreSQL with full_name computed
5. **User sees their name** → Profile page shows "Mark Carpenter" instead of "Name not provided"

---

## 🔗 Useful Links

- [Clerk Webhook Documentation](https://clerk.com/docs/integrations/webhooks/overview)
- [Testing Webhooks Locally](https://clerk.com/docs/integrations/webhooks/sync-data#testing-webhooks-locally)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

## 💡 Pro Tips

1. **Use webhook logs** - Enable detailed logging in Clerk dashboard to see exactly what's being sent
2. **Test locally first** - Use ngrok to test webhooks locally before deploying
3. **Monitor Vercel logs** - Watch real-time logs to debug issues
4. **Check backend logs** - Render dashboard has logs for backend errors
5. **Fallback strategy** - If Google doesn't provide name, extract from email or ask user to complete profile
