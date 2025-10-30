# Rental Architecture: Two-Path System

**Date:** 2025-10-29  
**Critical:** Clarifies rental storage and retrieval by user_id

---

## 🎯 The Two Rental Flows

```
Flow 1: User Has Website (Scraping)
──────────────────────────────────────
User adds website → Backend scrapes → Stores in DB → Returns user's rentals

Flow 2: User Manually Adds (Direct Storage)
────────────────────────────────────────────
User adds rental → Frontend sends to backend → Stores in DB → Returns user's rentals
```

---

## 📊 Current Backend Status

### What Backend HAS:

```python
# GET /database/available
# Returns ALL rentals (filtered by user_id)
@router.get("/database/available")
async def get_available(current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    return await db.fetch_all(
        "SELECT * FROM rentals WHERE user_id = :user_id",
        {"user_id": user_id}
    )
```

**✅ This is correct!** It filters by user_id.

---

## 🔴 What's Missing from Backend

### 1. **`rental_sources` Table** (For Website Scraping)

Users need to be able to add their rental websites:

```sql
CREATE TABLE rental_sources (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    website_url VARCHAR(500) NOT NULL,
    scraping_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Backend Endpoints Needed:**
```python
# Add a website to scrape
POST /rentals/sources
{
  "website_url": "https://zillow.com/austin-tx/",
  "scraping_config": {"max_price": 3000}
}

# Get user's scraping sources
GET /rentals/sources
# Returns: [{ id, website_url, is_active, ... }]

# Delete a source
DELETE /rentals/sources/{source_id}
```

---

### 2. **Manual Rental Addition** (Direct Storage)

Users should be able to add rentals manually (no website):

```python
# Add a rental manually
POST /rentals
{
  "address": "123 Main St",
  "price": 2500,
  "bedrooms": 2,
  "bathrooms": 2,
  "square_feet": 1200,
  "source": "manual"  # Not from scraping
}

# Update a rental
PATCH /rentals/{rental_id}
{
  "price": 2600
}

# Delete a rental
DELETE /rentals/{rental_id}
```

**All must filter by `user_id` from JWT!**

---

## 🏗️ Complete Architecture

### Database Schema:

```sql
-- User's rental sources (websites to scrape)
CREATE TABLE rental_sources (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    website_url VARCHAR(500),
    scraping_config JSONB,
    is_active BOOLEAN DEFAULT TRUE
);

-- Actual rental properties
CREATE TABLE rentals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,  -- ✅ Must have this!
    company_id INTEGER,         -- Future: for company grouping
    
    -- Property details
    address VARCHAR(500),
    price DECIMAL(10,2),
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    square_feet INTEGER,
    
    -- Source tracking
    source_type VARCHAR(50),    -- 'scraped' or 'manual'
    source_url VARCHAR(500),    -- URL if scraped
    source_id INTEGER,          -- rental_sources.id if scraped
    
    -- Metadata
    availability_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_rentals_user ON rentals(user_id);
CREATE INDEX idx_rentals_company ON rentals(company_id);
CREATE INDEX idx_rental_sources_user ON rental_sources(user_id);
```

---

## 🔄 User Workflows

### Workflow 1: User with Rental Website

```
1. User goes to /rentals
2. Clicks "Add Rental Source"
3. Enters: "https://myproperties.com/listings"
4. Frontend: POST /rentals/sources
5. Backend: 
   - Stores in rental_sources table (with user_id)
   - Starts scraping job
   - Scrapes properties
   - Stores in rentals table (with user_id, source_id)
6. User sees their scraped properties
```

**Frontend → Backend:**
```typescript
// Add scraping source
await fetch(`${API_URL}/rentals/sources`, {
  method: 'POST',
  headers: await getAuthHeaders(),
  body: JSON.stringify({
    website_url: "https://myproperties.com/listings",
    scraping_config: { max_price: 5000 }
  })
})

// Get all user's rentals (includes scraped ones)
const rentals = await fetch(`${API_URL}/database/available`, {
  headers: await getAuthHeaders()
})
```

---

### Workflow 2: User WITHOUT Rental Website (Manual Entry)

```
1. User goes to /rentals
2. Clicks "Add Property Manually"
3. Fills form:
   - Address: "456 Oak St"
   - Price: $2200
   - Bedrooms: 3
   - Bathrooms: 2
4. Frontend: POST /rentals
5. Backend:
   - Stores in rentals table (with user_id, source_type='manual')
6. User sees their manually added property
```

**Frontend → Backend:**
```typescript
// Add manual rental
await fetch(`${API_URL}/rentals`, {
  method: 'POST',
  headers: await getAuthHeaders(),
  body: JSON.stringify({
    address: "456 Oak St",
    price: 2200,
    bedrooms: 3,
    bathrooms: 2,
    source_type: "manual"
  })
})

// Get all user's rentals (includes manual ones)
const rentals = await fetch(`${API_URL}/database/available`, {
  headers: await getAuthHeaders()
})
```

---

## ✅ What Backend MUST Have

### Required Endpoints:

1. **✅ `GET /database/available`** (HAS - verified user-scoped)
   - Returns all user's rentals (scraped + manual)

2. **❌ `POST /rentals`** (MISSING - need to add)
   - Add rental manually
   - Must include `user_id` from JWT

3. **❌ `PATCH /rentals/{id}`** (MISSING - need to add)
   - Update rental (with ownership check)

4. **❌ `DELETE /rentals/{id}`** (MISSING - need to add)
   - Delete rental (with ownership check)

5. **❌ `POST /rentals/sources`** (MISSING - need to add)
   - Add website to scrape

6. **❌ `GET /rentals/sources`** (MISSING - need to add)
   - List user's scraping sources

7. **❌ `DELETE /rentals/sources/{id}`** (MISSING - need to add)
   - Remove scraping source

---

## 🚨 Critical Backend Requirements

### Database Changes Needed:

```sql
-- 1. Ensure rentals table has user_id
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(user_id);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'scraped';
CREATE INDEX IF NOT EXISTS idx_rentals_user ON rentals(user_id);

-- 2. Create rental_sources table
CREATE TABLE IF NOT EXISTS rental_sources (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    website_url VARCHAR(500) NOT NULL,
    scraping_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_user_website UNIQUE (user_id, website_url)
);
CREATE INDEX IF NOT EXISTS idx_rental_sources_user ON rental_sources(user_id);
```

### API Endpoints to Add:

```python
# backend/routers/rentals.py

@router.post("/rentals")
async def create_rental(
    rental: RentalCreate,
    current_user: User = Depends(get_current_user)
):
    """Add rental manually (not from scraping)"""
    user_id = current_user.id
    
    rental_id = await db.execute(
        """INSERT INTO rentals 
           (user_id, address, price, bedrooms, bathrooms, square_feet, source_type)
           VALUES (:user_id, :address, :price, :bedrooms, :bathrooms, :sqft, 'manual')
           RETURNING id""",
        {
            "user_id": user_id,
            "address": rental.address,
            "price": rental.price,
            "bedrooms": rental.bedrooms,
            "bathrooms": rental.bathrooms,
            "sqft": rental.square_feet
        }
    )
    
    return {"success": True, "rental_id": rental_id}

@router.patch("/rentals/{rental_id}")
async def update_rental(
    rental_id: int,
    updates: RentalUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update rental (with ownership check)"""
    user_id = current_user.id
    
    # Verify ownership
    rental = await db.fetch_one(
        "SELECT * FROM rentals WHERE id = :id AND user_id = :user_id",
        {"id": rental_id, "user_id": user_id}
    )
    
    if not rental:
        raise HTTPException(403, "You don't own this rental")
    
    # Update...
    return {"success": True}

@router.delete("/rentals/{rental_id}")
async def delete_rental(
    rental_id: int,
    current_user: User = Depends(get_current_user)
):
    """Delete rental (with ownership check)"""
    user_id = current_user.id
    
    # Verify ownership
    result = await db.execute(
        "DELETE FROM rentals WHERE id = :id AND user_id = :user_id RETURNING id",
        {"id": rental_id, "user_id": user_id}
    )
    
    if not result:
        raise HTTPException(403, "You don't own this rental")
    
    return {"success": True}

@router.post("/rentals/sources")
async def add_rental_source(
    source: RentalSourceCreate,
    current_user: User = Depends(get_current_user)
):
    """Add website to scrape for rentals"""
    user_id = current_user.id
    
    # Check if exists
    existing = await db.fetch_one(
        "SELECT id FROM rental_sources WHERE user_id = :uid AND website_url = :url",
        {"uid": user_id, "url": source.website_url}
    )
    
    if existing:
        raise HTTPException(400, "This website is already added")
    
    source_id = await db.execute(
        """INSERT INTO rental_sources (user_id, website_url, scraping_config)
           VALUES (:user_id, :url, :config) RETURNING id""",
        {
            "user_id": user_id,
            "url": source.website_url,
            "config": json.dumps(source.scraping_config or {})
        }
    )
    
    # Trigger scraping job (async)
    await trigger_scraping_job(user_id, source_id)
    
    return {"success": True, "source_id": source_id}

@router.get("/rentals/sources")
async def get_rental_sources(current_user: User = Depends(get_current_user)):
    """Get user's rental scraping sources"""
    user_id = current_user.id
    
    sources = await db.fetch_all(
        "SELECT * FROM rental_sources WHERE user_id = :user_id ORDER BY created_at DESC",
        {"user_id": user_id}
    )
    
    return {"sources": sources}

@router.delete("/rentals/sources/{source_id}")
async def delete_rental_source(
    source_id: int,
    current_user: User = Depends(get_current_user)
):
    """Delete rental source (with ownership check)"""
    user_id = current_user.id
    
    result = await db.execute(
        "DELETE FROM rental_sources WHERE id = :id AND user_id = :user_id RETURNING id",
        {"id": source_id, "user_id": user_id}
    )
    
    if not result:
        raise HTTPException(403, "You don't own this source")
    
    # Optionally: Delete associated rentals
    # await db.execute("DELETE FROM rentals WHERE source_id = :id", {"id": source_id})
    
    return {"success": True}
```

---

## 🎯 Summary for Backend Agent

**Backend needs to add:**

1. **Database:**
   - `rental_sources` table ✅
   - `user_id` column in `rentals` table (if missing) ✅
   - `source_type` column in `rentals` table ✅

2. **API Endpoints:**
   - `POST /rentals` - Add rental manually
   - `PATCH /rentals/{id}` - Update rental
   - `DELETE /rentals/{id}` - Delete rental
   - `POST /rentals/sources` - Add scraping source
   - `GET /rentals/sources` - List sources
   - `DELETE /rentals/sources/{id}` - Delete source

3. **Security:**
   - ALL endpoints must filter by `user_id` from JWT
   - ALL endpoints must verify ownership before update/delete

---

## ✅ Frontend Impact

**Can we proceed with UI now?**

**YES**, but with placeholder text for manual rental addition:

```typescript
// In /rentals page, show message:
"Manual rental addition coming soon - contact support to add properties directly"

// For now, focus on:
- Displaying existing rentals ✅ (works now)
- Adding scraping sources (when backend ready)
- Filtering/searching rentals ✅ (works now)
```

**Frontend can:**
- Display rentals (using existing `GET /database/available`) ✅
- Show "coming soon" for manual add
- Build UI for scraping sources (connect when backend ready)

---

**Next Steps:**
1. Continue frontend UI reorganization (Phases 3-5)
2. Provide this document to backend agent
3. Backend implements rental management endpoints
4. Frontend connects to new endpoints

**Estimated Backend Work:** 2-3 hours for all rental management endpoints

