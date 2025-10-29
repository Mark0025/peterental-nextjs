# Backend Requirements for UI Reorganization

**To:** Backend Agent  
**From:** Frontend Team  
**Date:** 2025-10-29  
**Priority:** HIGH - Required before frontend UI changes

---

## 🎯 Summary

Frontend UI reorganization requires these backend changes:

1. Database migrations (new tables, indexes)
2. API modifications (add user filtering)
3. New API endpoints (rentals, dashboard stats)

**Timeline:** Need these before frontend Phase 2-5 implementation

---

## 📊 Database Migrations Required

### 1. Create `rental_sources` Table

```sql
CREATE TABLE rental_sources (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    company_id INTEGER,  -- Future use
    website_url VARCHAR(500) NOT NULL,
    scraping_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_user_website UNIQUE (user_id, website_url)
);

CREATE INDEX idx_rental_sources_user ON rental_sources(user_id);
CREATE INDEX idx_rental_sources_company ON rental_sources(company_id);
CREATE INDEX idx_rental_sources_active ON rental_sources(is_active) WHERE is_active = TRUE;
```

**Purpose:** Store user's rental website sources for scraping

---

### 2. Modify `rentals` Table (if needed)

```sql
-- Add user_id if not present
ALTER TABLE rentals
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(user_id);

-- Add company_id for future use
ALTER TABLE rentals
ADD COLUMN IF NOT EXISTS company_id INTEGER;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_rentals_user ON rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_company ON rentals(company_id);
```

**Purpose:** Ensure rentals are user-scoped

---

### 3. Verify `agents` Table

```sql
-- Check if user_id exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'agents' AND column_name = 'user_id';

-- If not, add it
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(user_id);

CREATE INDEX IF NOT EXISTS idx_agents_user ON agents(user_id);
```

**Purpose:** Ensure agents are user-scoped

---

## 🔧 API Modifications Required

### 1. `GET /agents` - Add User Filtering

**Current (Assumed):**

```python
@router.get("/agents")
async def get_agents():
    # Returns ALL agents (security issue!)
    agents = await db.fetch_all("SELECT * FROM agents")
    return {"agents": agents}
```

**Required:**

```python
@router.get("/agents")
async def get_agents(
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]  # From JWT

    # Filter by user_id!
    agents = await db.fetch_all(
        "SELECT * FROM agents WHERE user_id = :user_id",
        {"user_id": user_id}
    )

    return {"agents": agents}
```

**Test:**

```bash
curl -H "Authorization: Bearer {JWT}" \
  https://peterental-vapi-github-newer.onrender.com/agents

# Should only return agents owned by the JWT user
```

---

### 2. `PATCH /agents/{agent_id}` - Add Ownership Verification

**Current (Assumed):**

```python
@router.patch("/agents/{agent_id}")
async def update_agent(agent_id: str, data: AgentUpdate):
    # Updates agent without checking ownership (security issue!)
    await db.execute(
        "UPDATE agents SET ... WHERE id = :id",
        {"id": agent_id}
    )
```

**Required:**

```python
@router.patch("/agents/{agent_id}")
async def update_agent(
    agent_id: str,
    data: AgentUpdate,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]

    # Verify ownership!
    agent = await db.fetch_one(
        "SELECT * FROM agents WHERE id = :id AND user_id = :user_id",
        {"id": agent_id, "user_id": user_id}
    )

    if not agent:
        raise HTTPException(403, "You don't own this agent")

    # Update agent
    await db.execute(
        "UPDATE agents SET ... WHERE id = :id",
        {"id": agent_id, ...}
    )

    return {"success": True, "agent": agent}
```

**Test:**

```bash
# Should succeed (own agent)
curl -X PATCH -H "Authorization: Bearer {USER1_JWT}" \
  https://.../agents/{USER1_AGENT_ID} \
  -d '{"agent_name": "Updated"}'

# Should fail 403 (not own agent)
curl -X PATCH -H "Authorization: Bearer {USER1_JWT}" \
  https://.../agents/{USER2_AGENT_ID} \
  -d '{"agent_name": "Hacked"}'
```

---

## 🆕 New API Endpoints Required

### 1. `GET /rentals` - User's Rental Properties

```python
@router.get("/rentals")
async def get_rentals(
    max_price: Optional[int] = Query(None),
    min_bedrooms: Optional[int] = Query(None),
    website: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's rental properties with optional filters
    """
    user_id = current_user["user_id"]

    query = "SELECT * FROM rentals WHERE user_id = :user_id"
    params = {"user_id": user_id}

    if max_price:
        query += " AND price <= :max_price"
        params["max_price"] = max_price

    if min_bedrooms:
        query += " AND bedrooms >= :min_bedrooms"
        params["min_bedrooms"] = min_bedrooms

    if website:
        query += " AND source_website ILIKE :website"
        params["website"] = f"%{website}%"

    query += " ORDER BY created_at DESC"

    rentals = await db.fetch_all(query, params)

    return {
        "rentals": rentals,
        "count": len(rentals)
    }
```

**Response Example:**

```json
{
  "rentals": [
    {
      "id": "123",
      "address": "123 Main St",
      "price": 2500,
      "bedrooms": 2,
      "bathrooms": 2,
      "square_feet": 1200,
      "source_website": "zillow.com",
      "user_id": 1
    }
  ],
  "count": 1
}
```

---

### 2. `POST /rentals/sources` - Add Rental Website

```python
from pydantic import BaseModel, HttpUrl

class RentalSourceCreate(BaseModel):
    website_url: HttpUrl
    scraping_config: Optional[dict] = {}

@router.post("/rentals/sources")
async def add_rental_source(
    data: RentalSourceCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Add a rental website source for scraping
    """
    user_id = current_user["user_id"]

    # Check if already exists
    existing = await db.fetch_one(
        """SELECT id FROM rental_sources
           WHERE user_id = :user_id AND website_url = :url""",
        {"user_id": user_id, "url": str(data.website_url)}
    )

    if existing:
        raise HTTPException(400, "This website is already added")

    # Insert new source
    source_id = await db.execute(
        """INSERT INTO rental_sources
           (user_id, website_url, scraping_config, is_active)
           VALUES (:user_id, :url, :config, TRUE)
           RETURNING id""",
        {
            "user_id": user_id,
            "url": str(data.website_url),
            "config": json.dumps(data.scraping_config)
        }
    )

    return {
        "success": True,
        "source_id": source_id,
        "message": "Rental source added successfully"
    }
```

**Request Example:**

```json
{
  "website_url": "https://www.zillow.com/austin-tx/",
  "scraping_config": {
    "max_price": 3000,
    "min_bedrooms": 2
  }
}
```

---

### 3. `GET /rentals/sources` - List User's Sources

```python
@router.get("/rentals/sources")
async def get_rental_sources(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's rental website sources
    """
    user_id = current_user["user_id"]

    sources = await db.fetch_all(
        """SELECT * FROM rental_sources
           WHERE user_id = :user_id
           ORDER BY created_at DESC""",
        {"user_id": user_id}
    )

    return {
        "sources": sources,
        "count": len(sources)
    }
```

**Response Example:**

```json
{
  "sources": [
    {
      "id": 1,
      "website_url": "https://www.zillow.com/austin-tx/",
      "scraping_config": { "max_price": 3000 },
      "is_active": true,
      "created_at": "2025-10-29T12:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 4. `DELETE /rentals/sources/{source_id}` - Remove Source

```python
@router.delete("/rentals/sources/{source_id}")
async def delete_rental_source(
    source_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a rental source (or mark as inactive)
    """
    user_id = current_user["user_id"]

    # Verify ownership
    source = await db.fetch_one(
        """SELECT * FROM rental_sources
           WHERE id = :id AND user_id = :user_id""",
        {"id": source_id, "user_id": user_id}
    )

    if not source:
        raise HTTPException(404, "Source not found or not yours")

    # Soft delete (mark inactive) or hard delete
    await db.execute(
        "UPDATE rental_sources SET is_active = FALSE WHERE id = :id",
        {"id": source_id}
    )
    # OR hard delete:
    # await db.execute("DELETE FROM rental_sources WHERE id = :id", {"id": source_id})

    return {"success": True, "message": "Source removed"}
```

---

### 5. `GET /dashboard/stats` - Aggregated User Stats

```python
@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_user)
):
    """
    Get aggregated statistics for user's dashboard
    """
    user_id = current_user["user_id"]

    # Agent stats
    agent_stats = await db.fetch_one(
        """SELECT
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE is_active = TRUE) as active,
             COUNT(*) FILTER (WHERE is_active = FALSE) as inactive
           FROM agents
           WHERE user_id = :user_id""",
        {"user_id": user_id}
    )

    # Rental stats
    rental_stats = await db.fetch_one(
        """SELECT
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE availability_date <= NOW()) as available
           FROM rentals
           WHERE user_id = :user_id""",
        {"user_id": user_id}
    )

    # Calendar stats (use existing calendar service)
    calendar_connected = await check_calendar_connected(user_id)

    if calendar_connected:
        # Get events for next 7 days
        events = await get_upcoming_events(user_id, days_ahead=7)
        calendar_stats = {
            "connected": True,
            "upcoming_events": len(events),
            "next_event": events[0] if events else None
        }
    else:
        calendar_stats = {
            "connected": False,
            "upcoming_events": 0,
            "next_event": None
        }

    return {
        "agents": {
            "total": agent_stats["total"],
            "active": agent_stats["active"],
            "inactive": agent_stats["inactive"]
        },
        "rentals": {
            "total": rental_stats["total"],
            "available": rental_stats["available"]
        },
        "calendar": calendar_stats
    }
```

**Response Example:**

```json
{
  "agents": {
    "total": 3,
    "active": 2,
    "inactive": 1
  },
  "rentals": {
    "total": 12,
    "available": 8
  },
  "calendar": {
    "connected": true,
    "upcoming_events": 5,
    "next_event": {
      "subject": "Property Viewing",
      "start_time": "2025-10-30T14:00:00Z"
    }
  }
}
```

---

## 🧪 Testing Checklist

After implementing, backend should test:

- [ ] `GET /agents` returns only user's agents
- [ ] `PATCH /agents/{id}` rejects if not user's agent
- [ ] `GET /rentals` returns only user's rentals
- [ ] `GET /rentals?max_price=2000` filters correctly
- [ ] `POST /rentals/sources` creates source for user
- [ ] `GET /rentals/sources` returns only user's sources
- [ ] `DELETE /rentals/sources/{id}` verifies ownership
- [ ] `GET /dashboard/stats` returns aggregated data
- [ ] All endpoints require valid JWT
- [ ] All endpoints extract user_id from JWT correctly

---

## 📋 Implementation Priority

### Phase 1 (Required for Dashboard) - HIGH PRIORITY

1. ✅ `GET /dashboard/stats` - Dashboard needs this first
2. ✅ `GET /agents` user filtering - Dashboard shows agent count
3. ✅ `GET /rentals` user filtering - Dashboard shows rental count

### Phase 2 (Required for Agent Builder) - HIGH PRIORITY

1. ✅ `PATCH /agents/{id}` ownership check - Security issue
2. ✅ Verify `agents` table has `user_id` and indexes

### Phase 3 (Required for Rentals Page) - MEDIUM PRIORITY

1. ✅ Create `rental_sources` table
2. ✅ `POST /rentals/sources` - Add website
3. ✅ `GET /rentals/sources` - List sources
4. ✅ `DELETE /rentals/sources/{id}` - Remove source

---

## ⏱️ Estimated Backend Work

- Database migrations: 30 minutes
- Modify existing APIs: 1 hour
- Create new APIs: 2-3 hours
- Testing: 1 hour
  **Total: 4-5 hours**

---

## 🚨 Critical Notes

1. **All endpoints MUST verify JWT** - Use existing `get_current_user` dependency
2. **All endpoints MUST filter by user_id** - Never return other users' data
3. **Ownership checks are SECURITY CRITICAL** - Especially for agents
4. **Indexes are PERFORMANCE CRITICAL** - Add indexes on user_id columns

---

## ✅ Completion Criteria

Backend is ready when:

- [ ] All database migrations run successfully
- [ ] All 8 API endpoints implemented and tested
- [ ] User-scoping verified (can't access others' data)
- [ ] JWT authentication working on all endpoints
- [ ] Ownership checks prevent unauthorized edits
- [ ] Performance tested with indexes
- [ ] API documentation updated

---

**Questions?** Contact frontend team for clarification!
