# Clerk + Database Integration Guide

## 🔄 **How Clerk Integrates with Your Database**

### **The Flow:**
1. **User signs up with Clerk** → Clerk creates user account
2. **Clerk webhook fires** → Your app receives `user.created` event
3. **Your app creates user in database** → Maps Clerk ID to your UUID
4. **User data synced** → All future operations use your database UUID

### **Database Schema Example:**

```sql
-- Users table with Clerk integration
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL, -- Clerk's user ID
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    microsoft_calendar_connected BOOLEAN DEFAULT FALSE,
    google_calendar_connected BOOLEAN DEFAULT FALSE,
    -- Add other fields as needed
);

-- Index for fast lookups
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
```

### **Calendar Integration:**

```sql
-- Calendar connections table
CREATE TABLE user_calendar_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'microsoft' or 'google'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 **Backend API Endpoints You Need**

### **1. Create User from Clerk Webhook**
```python
# POST /users/create-from-clerk
@app.post("/users/create-from-clerk")
async def create_user_from_clerk(user_data: dict):
    # Verify Clerk webhook signature
    # Create user in database
    # Return user with your UUID
    pass
```

### **2. Get User by Clerk ID**
```python
# GET /users/by-clerk-id/{clerk_user_id}
@app.get("/users/by-clerk-id/{clerk_user_id}")
async def get_user_by_clerk_id(clerk_user_id: str):
    # Find user by Clerk ID
    # Return user data
    pass
```

### **3. Update Calendar Connection**
```python
# PATCH /users/{user_id}/calendar-status
@app.patch("/users/{user_id}/calendar-status")
async def update_calendar_status(user_id: str, provider: str, connected: bool):
    # Update user's calendar connection status
    pass
```

## 🔧 **Frontend Integration**

### **1. Use the Current User Hook**
```tsx
import { useCurrentUser } from '@/hooks/use-current-user'

function MyComponent() {
  const { user, isLoading, isSignedIn } = useCurrentUser()
  
  if (isLoading) return <div>Loading...</div>
  if (!isSignedIn) return <div>Please sign in</div>
  
  return (
    <div>
      <h1>Welcome, {user?.first_name}!</h1>
      <p>Email: {user?.email}</p>
      <p>Microsoft Calendar: {user?.microsoft_calendar_connected ? 'Connected' : 'Not Connected'}</p>
    </div>
  )
}
```

### **2. Update Your Existing Components**
```tsx
// Before (hardcoded user)
const userId = "mark@peterei.com"

// After (dynamic user from Clerk)
const { user } = useCurrentUser()
const userId = user?.id
```

## 🔐 **Environment Variables**

Add to your `.env.local`:
```bash
# Clerk Webhook Secret (get from Clerk Dashboard)
CLERK_WEBHOOK_SECRET=whsec_...

# Your existing keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=https://peterental-vapi-github-newer.onrender.com
```

## 📋 **Setup Checklist**

### **Frontend (Done ✅)**
- [x] Clerk authentication integrated
- [x] User sync utilities created
- [x] Webhook endpoint created
- [x] Current user hook created

### **Backend (You Need To Do)**
- [ ] Add user creation endpoint
- [ ] Add user lookup by Clerk ID
- [ ] Add calendar connection tracking
- [ ] Update existing endpoints to use user ID from Clerk

### **Clerk Dashboard (You Need To Do)**
- [ ] Add webhook endpoint: `https://yourdomain.com/api/webhooks/clerk`
- [ ] Subscribe to events: `user.created`, `user.updated`, `user.deleted`
- [ ] Copy webhook secret to `.env.local`

## 🎯 **Benefits for Your CRM**

### **Scalability (1 to 1M+ users)**
- Each user gets their own data isolation
- All operations filtered by `user_id`
- Perfect for your 100+ user CRM

### **Calendar Integration**
- Microsoft Calendar: OAuth handled by Clerk
- Google Calendar: Same pattern when you add it
- Tokens stored securely in your database

### **Multi-Provider Support**
- Users can connect multiple calendars
- Each connection tracked separately
- Easy to add new providers

## 🔄 **The Complete Flow**

1. **User visits your app** → Clerk checks authentication
2. **User signs up** → Clerk creates account
3. **Webhook fires** → Your app creates user in database
4. **User connects Microsoft Calendar** → OAuth via Clerk
5. **Calendar tokens stored** → In your database linked to user
6. **All operations** → Use your database UUID for data isolation

## 🚀 **Next Steps**

1. **Set up webhook in Clerk Dashboard**
2. **Add the backend endpoints** (I can help with this)
3. **Test the complete flow**
4. **Update existing components** to use `useCurrentUser()`

This gives you a **production-ready, scalable authentication system** that works with your existing database and supports unlimited users! 🎉
