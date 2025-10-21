# 🧪 Testing Checklist - Ready to Test Now!

## ✅ Pre-requisites Complete

- ✅ Backend fixed (OAuth redirect URL)
- ✅ VAPI_API_KEY added to `.env.local`
- ✅ Build passing
- ✅ Unit tests passing (10/10)

---

## 🚀 Start Testing Now

### Step 1: Start Dev Server

```bash
cd /Users/markcarpenter/Desktop/pete/peterental-nextjs
pnpm dev
```

**Expected:** Server starts at `http://localhost:3000`

---

## 🧪 Test Plan (Do in Order)

### ✅ Test 1: OAuth Fix (High Priority)

**Goal:** Verify Microsoft Calendar OAuth works

1. Open: http://localhost:3000/users
2. Click **"Connect Calendar"** for `mark@peterei.com`
3. **Redirects to Microsoft** → Approve permissions
4. **Check URL after redirect:**
   - ✅ Should be: `https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback`
   - ❌ NOT: `https://peterentalvapi-latest.onrender.com/calendar/auth/callback`
5. **Expected Result:**
   - Green success message
   - "Authorized ✓" badge appears
   - Token expiry date shown

**Status:** ⏳ Ready to test

---

### ✅ Test 2: Agent Builder UI (High Priority)

**Goal:** Verify UI loads and works

1. Open: http://localhost:3000/agent-builder
2. **Check page loads:**
   - [ ] "Agent Builder" heading visible
   - [ ] "Create New Agent" button visible
   - [ ] "Import from VAPI" button visible
3. Click **"Create New Agent"**
4. Enter name: `"Test Agent"`
5. Click **"Add Agent"**
6. **Expected:**
   - Agent card appears
   - "Draft" badge visible
   - "Configure" button visible

**Status:** ⏳ Ready to test

---

### ✅ Test 3: Import Existing Assistant (Critical!)

**Goal:** Import your assistant `3fe56141-7c5b-4b98-bf4b-f857317f738b`

1. On `/agent-builder` page
2. Click **"Import from VAPI"** button
3. Dialog opens
4. Enter Assistant ID: `3fe56141-7c5b-4b98-bf4b-f857317f738b`
5. Click **"Import"**
6. **Expected:**
   - "Importing..." spinner shows
   - Success message appears
   - Dialog closes
   - Imported agent appears in list with:
     - Agent name from VAPI
     - "Synced" badge (green)
     - Your userId (`mark@peterei.com`)

**Status:** ⏳ Ready to test

**Troubleshooting:**

- If error "VAPI_API_KEY not configured" → Check `.env.local`
- If error "Failed to fetch" → VAPI_API_KEY might be invalid
- If error "404 Not Found" → Assistant ID doesn't exist in your VAPI account

---

### ✅ Test 4: Edit Imported Agent

**Goal:** Verify imported agent is editable

1. Click **"Configure"** on imported agent
2. **Check tabs load:**
   - [ ] Settings tab (voice, model, prompt)
   - [ ] Variables tab (empty for now)
   - [ ] Functions tab (shows imported functions)
   - [ ] Preview tab
3. Go to **Variables** tab
4. Click **"Add Variable"**
5. Fill in:
   - Internal Name: `customer_phone`
   - Display Name: `Customer Phone`
   - Type: `phone`
   - Required: ✓ checked
   - Description: `Customer phone number`
   - Extraction Prompt: `What's your phone number?`
6. Click outside to save (auto-save)
7. **Expected:**
   - Variable card appears
   - Shows all entered details

**Status:** ⏳ Ready to test

---

### ✅ Test 5: Assign Variable to Function

**Goal:** Drag-and-drop variable assignment

1. Still in agent editor
2. Go to **Functions** tab
3. Find a function (e.g., `set_appointment`)
4. Look at "Variables Used by this Function" section
5. Click the **`Customer Phone (customer_phone)`** badge
6. **Expected:**
   - Badge changes color (blue/purple)
   - Visual indication it's selected
7. Click again to deselect
8. **Expected:**
   - Badge returns to outline style

**Status:** ⏳ Ready to test

---

### ✅ Test 6: Preview VAPI Config

**Goal:** See generated configuration

1. Still in agent editor
2. Click **"Preview VAPI Config"** button at top
3. **Expected:**
   - Preview modal/section appears
   - Shows "Generated System Prompt":
     - Includes `user: mark@peterei.com`
     - Includes `user_id="mark@peterei.com"`
     - Lists `Customer Phone` variable
     - Shows extraction prompt
   - Shows "Generated Functions (JSON)":
     - `user_id` parameter with default `mark@peterei.com`
     - `customer_phone` parameter if assigned
     - All parameters in JSON format

**Status:** ⏳ Ready to test

---

### ✅ Test 7: Sync Back to VAPI

**Goal:** Update assistant in VAPI with changes

1. Still in agent editor (with changes made)
2. Note: Status badge should show "Draft" (unsaved changes)
3. Click **"Sync to VAPI"** button at top
4. **Expected:**
   - Button changes to "Syncing..." with spinner
   - Green success alert appears:
     - "Sync Successful!"
     - Shows VAPI Assistant ID
   - Status badge changes to "Synced" (green)
   - `lastSyncedAt` timestamp updates
5. **Verify in VAPI Dashboard:**
   - Go to https://dashboard.vapi.ai/assistants
   - Find assistant `3fe56141-7c5b-4b98-bf4b-f857317f738b`
   - Click to view
   - Check if `customer_phone` parameter appears in functions

**Status:** ⏳ Ready to test

---

### ✅ Test 8: Multi-User Isolation

**Goal:** Verify per-user configuration

1. Open: http://localhost:3000/users
2. Current user: `mark@peterei.com`
3. Note agents visible in builder
4. Switch user to another email (or add new user like `jon@peterei.com`)
5. Go to: http://localhost:3000/agent-builder
6. **Expected:**
   - Mark's agents NOT visible
   - Empty state or different agents
7. Create agent "Jon's Test Agent"
8. Switch back to Mark
9. **Expected:**
   - Mark's agents visible
   - Jon's agent NOT visible

**Status:** ⏳ Ready to test

---

### ✅ Test 9: Create New Agent from Scratch

**Goal:** Build agent without importing

1. Open: http://localhost:3000/agent-builder
2. Click **"Create New Agent"**
3. Name: `Property Buyer Agent`
4. Click **"Configure"**
5. **Settings Tab:**
   - Name: `Property Buyer Agent`
   - Description: `Helps buyers find properties`
   - Voice: `jennifer`
   - Model: `gpt-4`
   - System Prompt: `You are a helpful real estate agent assisting buyers.`
   - First Message: `Hi! Looking to buy a property? I'm here to help!`
6. **Variables Tab:**
   - Add `property_type` (string, required)
   - Add `budget` (number, required)
   - Add `location` (address, required)
   - Add `email` (email, required)
7. **Functions Tab:**
   - Add function `schedule_viewing`
   - Assign all 4 variables
8. **Preview Tab:**
   - Click "Preview VAPI Config"
   - Verify all variables listed
   - Verify function has all 4 parameters + user_id
9. **Sync:**
   - Click "Sync to VAPI"
   - Verify success
   - Check VAPI Dashboard for new assistant

**Status:** ⏳ Ready to test

---

### ✅ Test 10: End-to-End VAPI Call

**Goal:** Make actual voice call with configured agent

1. Get assistant ID from agent you just created/synced
2. Open: http://localhost:3000/vapi-agent
3. **Should see assistant in list** (may need to refresh assistants)
4. Select your assistant
5. Click **"Start Call"** (enable microphone)
6. **Speak to agent:**
   - Agent should greet with first message
   - Agent should ask for variables (property address, email, etc.)
   - Provide the info
   - Agent should call function
7. **Check backend logs:**
   - Backend should receive POST to `/vapi/webhook`
   - Should include `user_id="mark@peterei.com"`
   - Should include collected variables
8. **Check calendar:**
   - If function is `set_appointment`
   - Should create event in Mark's calendar

**Status:** ⏳ Ready to test (after steps 1-9 pass)

---

## 📊 Quick Results Tracker

| Test                | Status | Result |
| ------------------- | ------ | ------ |
| 1. OAuth Fix        | ⏳     |        |
| 2. Agent Builder UI | ⏳     |        |
| 3. Import Assistant | ⏳     |        |
| 4. Edit Agent       | ⏳     |        |
| 5. Assign Variables | ⏳     |        |
| 6. Preview Config   | ⏳     |        |
| 7. Sync to VAPI     | ⏳     |        |
| 8. Multi-User       | ⏳     |        |
| 9. Create New Agent | ⏳     |        |
| 10. End-to-End Call | ⏳     |        |

**Legend:**

- ⏳ = Not tested yet
- ✅ = Passed
- ❌ = Failed (needs fix)

---

## 🐛 Report Issues Like This

```
❌ Test 3 Failed: Import Assistant

Steps:
1. Clicked "Import from VAPI"
2. Entered: 3fe56141-7c5b-4b98-bf4b-f857317f738b
3. Clicked "Import"

Expected: Success message
Actual: Error "Failed to fetch assistant"

Console errors:
[paste console error here]

Network tab:
[paste failed request details]
```

---

## 🎯 Start Now

```bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Watch for errors (optional)
pnpm build --watch
```

**Then open:** http://localhost:3000/agent-builder

**Let me know results of each test!** I'll fix any issues immediately. 🚀

---

**Priority Tests (Do First):**

1. ✅ OAuth Fix (Test 1)
2. ✅ Import Assistant (Test 3)
3. ✅ Preview Config (Test 6)
4. ✅ Sync to VAPI (Test 7)

**Nice to Have (Do Later):** 5. ⏳ Multi-User (Test 8) 6. ⏳ Create New Agent (Test 9) 7. ⏳ End-to-End Call (Test 10)
