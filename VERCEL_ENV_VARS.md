# Vercel Environment Variables Setup

## Required Environment Variables

These environment variables must be set in **Vercel Dashboard** → **Settings** → **Environment Variables**

### Backend API URL

```
NEXT_PUBLIC_API_URL=https://peterental-vapi-github-newer.onrender.com
```

**Applies to:** Production, Preview, Development

This tells the frontend where to find your FastAPI backend.

### VAPI Configuration

```
NEXT_PUBLIC_VAPI_PUBLIC_KEY=<your_vapi_public_key>
```

**Applies to:** Production, Preview

Get this from your VAPI dashboard.

### Clerk Authentication

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your_clerk_publishable_key>
CLERK_SECRET_KEY=<your_clerk_secret_key>
```

**Applies to:** Production, Preview, Development

Get these from your Clerk dashboard.

---

## How to Set Variables

1. Go to https://vercel.com/dashboard
2. Select your project: `peterental-nextjs`
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter the variable name and value
6. Select which environments (Production/Preview/Development)
7. Click **Save**
8. **Redeploy** your app for changes to take effect

---

## Current Issue

The `/api/users/current` endpoint is returning 500 because `NEXT_PUBLIC_API_URL` is not set on Vercel.

Once you add this variable and redeploy, the error should be fixed.
