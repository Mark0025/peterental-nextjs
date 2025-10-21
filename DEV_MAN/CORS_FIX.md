# CORS Issue - Frontend Can't Call Backend

## 🚨 Problem

Frontend getting "Failed to fetch" error when calling:

```
https://peterental-vapi-github-newer.onrender.com/calendar/auth/status?user_id=mark@peterei.com
```

**Error:**

```
TypeError: Failed to fetch
```

This is a **CORS (Cross-Origin Resource Sharing)** issue or backend endpoint problem.

---

## 🔍 Diagnosis

### Test 1: Does endpoint exist?

```bash
curl "https://peterental-vapi-github-newer.onrender.com/docs"
```

Check if `/calendar/auth/status` is listed in API docs.

### Test 2: Does it respond?

```bash
curl "https://peterental-vapi-github-newer.onrender.com/calendar/auth?user_id=mark@peterei.com"
```

If this works but browser doesn't → CORS issue.

---

## 🔧 Fix Options

### Option 1: Backend - Add CORS Headers ✅ RECOMMENDED

Backend needs to allow requests from `http://localhost:3000` (and production domain).

**Python/FastAPI:**

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://peterental-nextjs.vercel.app",  # Production frontend
        # Add your production domains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Option 2: Check Endpoint Path

Frontend calling: `/calendar/auth/status`

Backend might have: `/calendar/auth` or `/calendar/status`

**Check backend docs:**

```bash
curl https://peterental-vapi-github-newer.onrender.com/docs
```

Look for correct endpoint path.

### Option 3: Temporary Workaround - Proxy

Add to `next.config.ts`:

```typescript
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'https://peterental-vapi-github-newer.onrender.com/:path*',
      },
    ];
  },
};
```

Then frontend calls: `/api/backend/calendar/auth/status`

---

## 🎯 Quick Fix Steps

### Step 1: Verify Backend Endpoint

```bash
# Check API docs
curl https://peterental-vapi-github-newer.onrender.com/docs | grep calendar

# Or check OpenAPI spec
curl https://peterental-vapi-github-newer.onrender.com/openapi.json | jq '.paths | keys[]' | grep calendar
```

### Step 2: Test Direct Call

```bash
curl -v "https://peterental-vapi-github-newer.onrender.com/calendar/auth?user_id=mark@peterei.com"
```

Look for:

- ✅ 200 OK → Endpoint works
- ❌ 404 Not Found → Wrong endpoint
- ❌ 500 Error → Backend issue

### Step 3: Check CORS Headers

```bash
curl -v -H "Origin: http://localhost:3000" \
  "https://peterental-vapi-github-newer.onrender.com/calendar/auth?user_id=mark@peterei.com"
```

Look for response headers:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

If missing → Backend needs CORS middleware!

---

## 🔄 Immediate Workaround

**Use Server Actions instead of client-side fetch:**

Already implemented! ✅

```typescript
// src/actions/calendar-actions.ts
'use server';

export async function checkCalendarAuth(userId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/calendar/auth?user_id=${userId}`
  );
  return response.json();
}
```

**Update frontend to use server action:**

```typescript
// src/components/providers/user-provider.tsx
import { checkCalendarAuth } from '@/actions/calendar-actions';

const checkAuthStatus = useCallback(async (userId: string) => {
  try {
    const data = await checkCalendarAuth(userId); // ✅ Use server action
    // ... rest of code
  } catch (error) {
    console.error('Error checking auth:', error);
  }
}, []);
```

This bypasses CORS because server actions run on server-side! 🎉

---

## 📋 Action Items

### For Backend Team:

1. Add CORS middleware to allow `localhost:3000`
2. Verify endpoint `/calendar/auth/status` exists
3. Check logs for errors when endpoint is called

### For Frontend (Quick Fix):

1. Update `UserProvider` to use server actions instead of direct fetch
2. Server actions bypass CORS
3. Already implemented in `src/actions/calendar-actions.ts` ✅

---

## 🚀 Implement Quick Fix Now

Let me update the UserProvider to use server actions...
