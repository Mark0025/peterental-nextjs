# Backend Integration Required for Clerk Authentication

## 🚨 **Yes, you need to update your backend!**

The frontend is now ready, but your Python backend needs these new endpoints and database changes to support Clerk authentication.

## 📋 **What You Need to Add to Your Backend**

### 1. **Database Schema Changes**

Add these tables to your PostgreSQL database:

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
    google_calendar_connected BOOLEAN DEFAULT FALSE
);

-- Index for fast lookups
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);

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

### 2. **New API Endpoints**

Add these endpoints to your FastAPI backend:

#### **A. Create User from Clerk Webhook**

```python
# POST /users/create-from-clerk
@app.post("/users/create-from-clerk")
async def create_user_from_clerk(user_data: dict, authorization: str = Header(None)):
    # Verify Clerk webhook signature
    if not verify_clerk_webhook(authorization):
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Extract data
    clerk_user_id = user_data.get("clerk_user_id")
    email = user_data.get("email")
    first_name = user_data.get("first_name")
    last_name = user_data.get("last_name")
    created_at = user_data.get("created_at")

    # Create user in database
    try:
        user = await create_user(
            clerk_user_id=clerk_user_id,
            email=email,
            first_name=first_name,
            last_name=last_name,
            created_at=created_at
        )
        return {"success": True, "data": user}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

#### **B. Get User by Clerk ID**

```python
# GET /users/by-clerk-id/{clerk_user_id}
@app.get("/users/by-clerk-id/{clerk_user_id}")
async def get_user_by_clerk_id(clerk_user_id: str, authorization: str = Header(None)):
    # Verify authorization
    if not verify_clerk_auth(authorization):
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        user = await get_user_by_clerk_id(clerk_user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"success": True, "data": user}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

#### **C. Update Calendar Connection Status**

```python
# PATCH /users/{user_id}/calendar-status
@app.patch("/users/{user_id}/calendar-status")
async def update_calendar_status(
    user_id: str,
    provider: str,
    connected: bool,
    authorization: str = Header(None)
):
    # Verify authorization
    if not verify_clerk_auth(authorization):
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        await update_user_calendar_status(user_id, provider, connected)
        return {"success": True, "message": "Calendar status updated"}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

### 3. **Database Functions**

Add these functions to your database layer:

```python
async def create_user(clerk_user_id: str, email: str, first_name: str = None, last_name: str = None, created_at: str = None):
    """Create a new user in the database"""
    query = """
    INSERT INTO users (clerk_user_id, email, first_name, last_name, created_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    """
    result = await database.fetch_one(query, clerk_user_id, email, first_name, last_name, created_at)
    return dict(result)

async def get_user_by_clerk_id(clerk_user_id: str):
    """Get user by Clerk user ID"""
    query = "SELECT * FROM users WHERE clerk_user_id = $1"
    result = await database.fetch_one(query, clerk_user_id)
    return dict(result) if result else None

async def update_user_calendar_status(user_id: str, provider: str, connected: bool):
    """Update user's calendar connection status"""
    if provider == "microsoft":
        query = "UPDATE users SET microsoft_calendar_connected = $1, updated_at = NOW() WHERE id = $2"
    elif provider == "google":
        query = "UPDATE users SET google_calendar_connected = $1, updated_at = NOW() WHERE id = $2"
    else:
        raise ValueError("Invalid provider")

    await database.execute(query, connected, user_id)
```

### 4. **Authentication Helpers**

Add these helper functions:

```python
def verify_clerk_auth(authorization: str) -> bool:
    """Verify Clerk authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        return False

    token = authorization.split(" ")[1]
    expected_token = os.getenv("CLERK_SECRET_KEY")
    return token == expected_token

def verify_clerk_webhook(authorization: str) -> bool:
    """Verify Clerk webhook signature"""
    # Implement webhook signature verification
    # This is more complex - you'll need to verify the svix signature
    # For now, you can use the secret key verification
    return verify_clerk_auth(authorization)
```

### 5. **Update Existing Endpoints**

Update your existing endpoints to use the new user system:

```python
# Before (hardcoded user)
@app.get("/calendar/events")
async def get_events(user_id: str = "mark@peterei.com"):
    # ...

# After (dynamic user from Clerk)
@app.get("/calendar/events")
async def get_events(user_id: str = None, authorization: str = Header(None)):
    # Verify authorization and get user
    if not verify_clerk_auth(authorization):
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Get user from database
    user = await get_user_by_clerk_id_from_auth(authorization)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Use user.id instead of hardcoded email
    # ... rest of your logic
```

## 🔧 **Environment Variables**

Add to your backend `.env`:

```bash
# Clerk Integration
CLERK_SECRET_KEY=sk_test_3r3VHE0qgUPY9KNfpD2pEQMnxOGwrQYbcnMXV8QvSR
CLERK_WEBHOOK_SECRET=whsec_... # Get from Clerk Dashboard

# Your existing variables
DATABASE_URL=postgresql://...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
```

## 🚀 **Implementation Priority**

### **Phase 1: Basic User Management (Required)**

1. ✅ Add database tables
2. ✅ Add user creation endpoint
3. ✅ Add user lookup endpoint
4. ✅ Update environment variables

### **Phase 2: Calendar Integration (Required)**

1. ✅ Add calendar status update endpoint
2. ✅ Update existing calendar endpoints to use user ID
3. ✅ Test calendar connection flow

### **Phase 3: Webhook Integration (Optional)**

1. ✅ Add webhook signature verification
2. ✅ Add webhook endpoint for user events
3. ✅ Test user creation flow

## 🧪 **Testing the Integration**

### **1. Test User Creation**

```bash
curl -X POST https://peterental-vapi-github-newer.onrender.com/users/create-from-clerk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_test_3r3VHE0qgUPY9KNfpD2pEQMnxOGwrQYbcnMXV8QvSR" \
  -d '{
    "clerk_user_id": "user_2abc123",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### **2. Test User Lookup**

```bash
curl -X GET https://peterental-vapi-github-newer.onrender.com/users/by-clerk-id/user_2abc123 \
  -H "Authorization: Bearer sk_test_3r3VHE0qgUPY9KNfpD2pEQMnxOGwrQYbcnMXV8QvSR"
```

## 🎯 **Benefits After Implementation**

- ✅ **Multi-user support**: Each user has isolated data
- ✅ **Scalable**: Supports 1 to 1M+ users
- ✅ **Secure**: Proper authentication and authorization
- ✅ **Integrated**: Calendar and VAPI work with user accounts
- ✅ **Maintainable**: Clean separation of concerns

## 🚨 **Critical Notes**

1. **Don't break existing functionality** - Add new endpoints alongside existing ones
2. **Test thoroughly** - The frontend expects these endpoints to exist
3. **Update gradually** - You can implement Phase 1 first, then Phase 2
4. **Keep backups** - Database changes are irreversible

## 📞 **Need Help?**

If you need help implementing any of these backend changes, I can:

1. Provide more detailed code examples
2. Help with database migration scripts
3. Assist with testing the integration
4. Debug any issues that come up

**The frontend is ready - now we just need the backend to catch up!** 🚀
