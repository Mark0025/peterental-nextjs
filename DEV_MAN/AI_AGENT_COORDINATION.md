# AI Agent Coordination System - Simple Markdown Approach

**MUCH SIMPLER:** Just a shared folder with markdown files for coordination!

---

## 🎯 The Simple Idea

```
Shared Folder: .AI_agents/
├── status.md          # Current status of each agent
├── changelog.md       # What changed (like git log)
├── requests.md        # Frontend → Backend requests
├── completed.md       # Backend → Frontend completions
└── plans/             # Shared planning docs
    ├── current.md
    └── next.md
```

**Both agents read/write to same folder via symlink**

---

## 📁 Folder Structure

### Setup:

```bash
# Create shared folder (once)
mkdir -p /Users/markcarpenter/Desktop/pete/.AI_agents/plans

# Symlink to frontend DEV_MAN
cd /Users/markcarpenter/Desktop/pete/peterental-nextjs/DEV_MAN
ln -s /Users/markcarpenter/Desktop/pete/.AI_agents .AI_agents

# Symlink to backend DEV_MAN
cd /Users/markcarpenter/Desktop/pete/PeteRental_vapi_10_02_25/DEV_MAN
ln -s /Users/markcarpenter/Desktop/pete/.AI_agents .AI_agents
```

**Result:** Both codebases see the same `.AI_agents/` folder!

---

## 📝 File Templates

### 1. `status.md` - Current Status

```markdown
# Agent Status

**Last Updated:** 2025-10-29 14:30

## Nova (Frontend)

- **Status:** ✅ Ready
- **Working On:** Profile page enhancements
- **Blocked By:** Rental endpoints (waiting for Forge)
- **Next:** Dashboard optimization

## Forge (Backend)

- **Status:** ✅ Ready
- **Working On:** Rental endpoints implementation
- **Blocked By:** Nothing
- **Next:** Dashboard stats endpoint
```

### 2. `changelog.md` - What Changed

```markdown
# Agent Changelog

## 2025-10-29 14:30 - Nova (Frontend)

- ✅ Completed UI reorganization (all 5 phases)
- ✅ Added dashboard analytics
- ✅ Created admin section
- 📝 Created RENTAL_ARCHITECTURE_CLARIFICATION.md

## 2025-10-29 14:00 - Forge (Backend)

- ✅ Verified GET /agents endpoint (user-scoped)
- ✅ Confirmed GET /database/available works
- 🔄 Starting rental endpoints implementation

## 2025-10-29 13:30 - Nova (Frontend)

- ✅ Created calendar events page
- ✅ Added rental search UI
- ⏳ Waiting for rental CRUD endpoints
```

### 3. `requests.md` - Frontend → Backend Requests

```markdown
# Backend Feature Requests

## High Priority

### 1. Rental Management Endpoints

**Status:** 🔄 IN PROGRESS  
**Requested By:** Nova  
**Date:** 2025-10-29

**Endpoints Needed:**

- `POST /rentals` - Add rental manually
- `PATCH /rentals/{id}` - Edit rental
- `DELETE /rentals/{id}` - Delete rental

**Spec:** See `RENTAL_ARCHITECTURE_CLARIFICATION.md`

**Forge Notes:** Starting implementation, ETA 2-3 hours

---

### 2. Rental Sources Table

**Status:** ⏳ PENDING  
**Requested By:** Nova  
**Date:** 2025-10-29

**Database:**

- `rental_sources` table (see spec in RENTAL_ARCHITECTURE_CLARIFICATION.md)

**Endpoints:**

- `POST /rentals/sources` - Add website
- `GET /rentals/sources` - List sources
- `DELETE /rentals/sources/{id}` - Remove source

---

## Low Priority

### 3. Dashboard Stats Optimization

**Status:** 💡 OPTIONAL  
**Requested By:** Nova  
**Date:** 2025-10-29

**Endpoint:**

- `GET /dashboard/stats` - Single endpoint instead of 4 calls

**Note:** Frontend already combines 4 endpoints efficiently, this is just optimization
```

### 4. `completed.md` - Backend → Frontend Completions

```markdown
# Completed Features

## 2025-10-29 - Rental Endpoints Complete

**Implemented By:** Forge  
**For:** Nova

**Completed:**

- ✅ POST /rentals
- ✅ PATCH /rentals/{id}
- ✅ DELETE /rentals/{id}
- ✅ Added ownership verification

**Frontend Action Required:**

- Update `src/lib/api/rentals.ts` to use new endpoints
- Test CRUD operations
- Remove "coming soon" placeholder

---

## 2025-10-28 - Calendar Integration

**Implemented By:** Forge  
**For:** Nova

**Completed:**

- ✅ Added `calendar_name` field
- ✅ Added `calendar_link` field
- ✅ Added `expires_at_formatted` field

**Frontend Action Required:**

- Display calendar link as button
- Show formatted expiry time
```

### 5. `plans/current.md` - Current Sprint

```markdown
# Current Sprint

**Week:** 2025-10-29  
**Goal:** Complete rental management system

## Nova (Frontend) Tasks

- [x] UI reorganization (all phases)
- [x] Dashboard analytics
- [x] Calendar integration UI
- [ ] Connect rental CRUD to backend (waiting for Forge)
- [ ] Test rental management flow
- [ ] Add rental source management UI

## Forge (Backend) Tasks

- [x] Verify agent endpoints (user-scoped)
- [x] Confirm rental display works
- [ ] Implement rental CRUD endpoints
- [ ] Create rental_sources table
- [ ] Add rental source endpoints
- [ ] Test with frontend

## Coordination

- **Blocker:** Nova waiting for rental endpoints
- **Timeline:** Forge implementing (2-3 hours)
- **Next:** Test together once backend ready
```

---

## 🔄 How It Works

### Nova (Frontend) Workflow:

1. **Check `requests.md`** before starting work
2. **Update `status.md`** with current task
3. **Add to `changelog.md`** when completing features
4. **Write to `requests.md`** when needing backend features
5. **Read `completed.md`** to see what Forge finished

### Forge (Backend) Workflow:

1. **Check `requests.md`** for frontend needs
2. **Update `status.md`** with current task
3. **Add to `changelog.md`** when completing features
4. **Write to `completed.md`** when features ready
5. **Update `requests.md`** with progress/ETA

---

## ✅ Benefits

1. **Simple** - Just markdown files
2. **No dependencies** - No SSE, no webhooks, no servers
3. **Git-like** - Changelog tracks everything
4. **Async** - Agents work independently
5. **Clear** - Always know what's needed/done
6. **Local** - Same computer, instant access
7. **Trust-based** - Both agents just read/write files

---

## 🚀 Setup Commands

```bash
# Create shared folder
mkdir -p /Users/markcarpenter/Desktop/pete/.AI_agents/plans

# Create template files
cd /Users/markcarpenter/Desktop/pete/.AI_agents

# status.md
cat > status.md << 'EOF'
# Agent Status

**Last Updated:** $(date +"%Y-%m-%d %H:%M")

## Nova (Frontend)
- **Status:** ✅ Ready
- **Working On:** -
- **Blocked By:** -
- **Next:** -

## Forge (Backend)
- **Status:** ✅ Ready
- **Working On:** -
- **Blocked By:** -
- **Next:** -
EOF

# changelog.md
echo "# Agent Changelog" > changelog.md
echo "" >> changelog.md

# requests.md
echo "# Backend Feature Requests" > requests.md
echo "" >> requests.md

# completed.md
echo "# Completed Features" > completed.md
echo "" >> completed.md

# current plan
echo "# Current Sprint" > plans/current.md

# Symlink to frontend
cd /Users/markcarpenter/Desktop/pete/peterental-nextjs/DEV_MAN
ln -s /Users/markcarpenter/Desktop/pete/.AI_agents .AI_agents

# Symlink to backend
cd /Users/markcarpenter/Desktop/pete/PeteRental_vapi_10_02_25/DEV_MAN
ln -s /Users/markcarpenter/Desktop/pete/.AI_agents .AI_agents

echo "✅ Shared folder created and symlinked!"
```

---

## 📋 Usage Example

### Nova needs rental endpoints:

```bash
# Nova writes to requests.md
echo "## Rental CRUD Endpoints
**Status:** ⏳ PENDING
**Priority:** HIGH
**Needed:** POST /rentals, PATCH /rentals/{id}, DELETE /rentals/{id}
**Spec:** RENTAL_ARCHITECTURE_CLARIFICATION.md
" >> .AI_agents/requests.md

# Nova updates status
# ... edit status.md ...
```

### Forge sees request and implements:

```bash
# Forge reads requests.md
cat .AI_agents/requests.md

# Forge implements endpoints...

# Forge updates completed.md
echo "## Rental CRUD Complete
**Date:** $(date)
**Endpoints:** POST /rentals, PATCH /rentals/{id}, DELETE /rentals/{id}
**Nova Action:** Update rentals.ts API client
" >> .AI_agents/completed.md

# Forge updates changelog
echo "## $(date) - Forge
- ✅ Implemented rental CRUD endpoints
- ✅ Added user_id filtering
- ✅ Added ownership checks
" >> .AI_agents/changelog.md
```

---

## 🎯 Key Points

1. **No complex tech** - Just markdown files
2. **Same computer** - Instant access via symlink
3. **Both read/write** - Like a shared todo board
4. **Git-style tracking** - Changelog keeps history
5. **Async coordination** - No real-time required
6. **Trust-based** - Both agents update honestly

---

**This is MUCH simpler than webhooks/SSE! Just a shared folder both agents use to coordinate.** 📁✨
