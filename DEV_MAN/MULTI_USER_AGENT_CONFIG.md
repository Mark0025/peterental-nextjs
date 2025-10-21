# 👥 Multi-User Agent Configuration Architecture

**Created:** October 20, 2025  
**Feature:** Per-user VAPI agent configurations with automatic calendar integration

---

## 🎯 The Scenario

**Problem:** Mark and Jon both use your CRM but need different agent configurations

```
mark@peterei.com needs:
- Property Seller Agent
- Variables: property_address, email, asking_price
- Functions: set_appointment, get_valuation

jon@peterei.com needs:
- Same "Property Seller Agent" BUT:
- Variables: property_address, email, phone (no asking_price)
- Functions: set_appointment only (no valuation)
```

**Solution:** Per-user agent configurations that automatically use each user's calendar!

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Logs In                                 │
│  Mark: mark@peterei.com  |  Jon: jon@peterei.com              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Next.js Agent Builder (Per-User)                   │
│                                                                 │
│  Mark sees:                 Jon sees:                          │
│  • His agents               • His agents                       │
│  • His configs              • His configs                      │
│  • Can't see Jon's          • Can't see Mark's                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Deploy Button Clicked
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              VAPI Dashboard (Separate Assistants)               │
│                                                                 │
│  Mark's Assistant:          Jon's Assistant:                   │
│  • ID: assistant_mark_123   • ID: assistant_jon_456            │
│  • Prompt includes:         • Prompt includes:                 │
│    user_id="mark@..."        user_id="jon@..."                │
│  • Functions call with:     • Functions call with:             │
│    {user_id: "mark@..."}     {user_id: "jon@..."}             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    User Makes Voice Call
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Python Backend Webhook                             │
│                                                                 │
│  Receives: { user_id: "mark@peterei.com", ... }               │
│                              ↓                                  │
│  1. Looks up Mark's OAuth token in PostgreSQL                  │
│  2. Uses Mark's Microsoft Calendar                             │
│  3. Books appointment in Mark's calendar                       │
│  4. Returns result to VAPI                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Features

### 1. User-Scoped Agents

**Every agent config includes userId:**

```typescript
{
  id: "agent_mark@peterei.com_1729440000",
  name: "Property Seller Agent",
  userId: "mark@peterei.com",  // ← Belongs to Mark
  variables: [...],
  functions: [...]
}
```

### 2. Automatic user_id Injection

**System prompt automatically includes:**

```
## User Context

You are assisting user: mark@peterei.com
IMPORTANT: Always include user_id="mark@peterei.com" when calling functions.
```

**Function parameters automatically include:**

```json
{
  "parameters": {
    "properties": {
      "user_id": {
        "type": "string",
        "description": "User ID for mark@peterei.com",
        "default": "mark@peterei.com"
      },
      "property_address": {...},
      "email": {...}
    },
    "required": ["user_id", "property_address", "email"]
  }
}
```

### 3. Calendar Isolation

**Backend receives user_id and looks up correct calendar:**

```python
# Python backend
@app.post("/vapi/webhook")
async def vapi_webhook(request):
    user_id = args['user_id']  # "mark@peterei.com"

    # Get Mark's OAuth token from database
    token = db.get_token(user_id)

    # Use Mark's calendar (not Jon's!)
    events = await microsoft_api.get_events(token)
```

---

## 📋 Step-by-Step: Creating Per-User Agent

### Step 1: User Selects Themselves

```
1. Go to /users
2. Select user: mark@peterei.com
3. (System sets userId in context)
```

### Step 2: Create Agent

```
1. Go to /agent-builder
2. Click "Create New Agent"
3. System automatically assigns: userId = "mark@peterei.com"
4. Name: "Property Seller Agent"
```

### Step 3: Configure Variables

```
Add variables that Mark needs:
• property_address (required)
• email (required)
• asking_price (optional)
```

### Step 4: Configure Functions

```
Add function: set_appointment
Variables used:
  ✓ property_address
  ✓ email
```

### Step 5: Deploy

```
1. Click "Deploy to VAPI"
2. System creates VAPI assistant with:
   - Name: "Property Seller Agent - mark@peterei.com"
   - System prompt includes: user_id="mark@peterei.com"
   - All functions inject: user_id="mark@peterei.com"
   - Webhook URL: your-python-backend/vapi/webhook
```

### Step 6: Test

```
1. Go to /vapi-agent
2. Select Mark's agent
3. Start call
4. Agent automatically uses Mark's calendar!
```

---

## 🔄 Same Agent, Different User

### Jon Creates His Version

```
1. Jon logs in (selects jon@peterei.com)
2. Goes to /agent-builder
3. Creates "Property Seller Agent"
4. Adds HIS variables (no asking_price, has phone)
5. Deploys

Result:
- Separate VAPI assistant created
- Uses user_id="jon@peterei.com"
- When Jon calls, uses JON's calendar
- When Mark calls, uses MARK's calendar
```

---

## 🎨 UI Flow

### Agent Builder Homepage

```
┌─────────────────────────────────────────────────────────────┐
│  🎨 Agent Builder                                           │
│  Current User: mark@peterei.com              [Switch User] │
├─────────────────────────────────────────────────────────────┤
│  [+ Create New Agent]                                        │
│                                                              │
│  ┌───────────────────┐  ┌───────────────────┐              │
│  │ Property Seller   │  │ Rental Inquiry    │              │
│  │ Agent             │  │ Agent             │              │
│  │                   │  │                   │              │
│  │ 3 variables       │  │ 4 variables       │              │
│  │ 2 functions       │  │ 1 function        │              │
│  │ ✅ Synced         │  │ 📝 Draft          │              │
│  │                   │  │                   │              │
│  │ [Configure] [Del] │  │ [Configure] [Del] │              │
│  └───────────────────┘  └───────────────────┘              │
│                                                              │
│  Only YOUR agents shown (filtered by mark@peterei.com)     │
└─────────────────────────────────────────────────────────────┘
```

### Configuration Page

```
┌─────────────────────────────────────────────────────────────┐
│  Property Seller Agent                                       │
│  Owner: mark@peterei.com                                    │
│                                                              │
│  [Basic Info] [Variables] [Functions] [Preview]            │
│                                                              │
│  Variables:                                                  │
│  ┌─────────────────────────────────────────┐               │
│  │ property_address [Required]              │               │
│  │ Type: address                            │               │
│  │ Ask: "What's the property address?"      │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
│  Functions:                                                  │
│  ┌─────────────────────────────────────────┐               │
│  │ set_appointment [Enabled]                │               │
│  │ Uses: property_address, email           │               │
│  │ Auto-includes: user_id="mark@..."       │  ← Automatic! │
│  └─────────────────────────────────────────┘               │
│                                                              │
│  [Save]  [Deploy to VAPI]                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### 1. Agent Config Storage

**localStorage structure:**

```json
[
  {
    "id": "agent_mark@peterei.com_1729440000",
    "userId": "mark@peterei.com",
    "name": "Property Seller Agent",
    "variables": [...],
    "functions": [...]
  },
  {
    "id": "agent_jon@peterei.com_1729440100",
    "userId": "jon@peterei.com",
    "name": "Property Seller Agent",
    "variables": [...],
    "functions": [...]
  }
]
```

**Hook filters by current user:**

```typescript
const { userId } = useUser(); // "mark@peterei.com"
const configs = allConfigs.filter((c) => c.userId === userId);
// Mark only sees his configs!
```

### 2. VAPI Sync

**Generates unique assistant per user:**

```typescript
{
  name: "Property Seller Agent - mark@peterei.com",
  model: {
    messages: [{
      role: "system",
      content: `
        You are assisting user: mark@peterei.com
        Always include user_id="mark@peterei.com" in function calls.
        ...
      `
    }]
  },
  functions: [{
    name: "set_appointment",
    parameters: {
      properties: {
        user_id: {
          type: "string",
          default: "mark@peterei.com"  // Pre-filled!
        },
        property_address: {...},
        email: {...}
      }
    }
  }]
}
```

### 3. Backend Webhook

**Receives user_id in every call:**

```python
@app.post("/vapi/webhook")
async def vapi_webhook(request):
    for tool_call in request.message.toolCalls:
        args = tool_call.function.arguments
        user_id = args['user_id']  # Always present!

        if function_name == "set_appointment":
            # Get THIS user's calendar token
            token = await db.get_user_token(user_id)

            # Use THIS user's calendar
            event = await create_calendar_event(
                token=token,
                property_address=args['property_address'],
                email=args['email']
            )
```

---

## ✅ Benefits

### 1. True Multi-Tenancy

- Each user has isolated agent configs
- Can't see or modify other users' agents
- Data isolation at every level

### 2. Calendar Isolation

- Mark's bookings go to Mark's calendar
- Jon's bookings go to Jon's calendar
- No cross-contamination

### 3. Flexibility

- Each user can customize for their workflow
- Different variables, functions, prompts
- Same agent type, different configuration

### 4. Scalability

- Works for 1 user or 100,000 users
- Each user gets their own VAPI assistant
- Backend handles routing automatically

### 5. No Backend Changes Needed!

- Python backend already accepts user_id
- Just uses whatever user_id is passed
- Looks up correct OAuth token
- Works seamlessly

---

## 🚀 Usage Examples

### Example 1: Mark Creates Seller Agent

```
1. Mark logs in
2. Creates "Property Seller Agent"
3. Adds: property_address, email, asking_price
4. Deploys → VAPI creates assistant_mark_123
5. Mark calls agent
6. Agent collects info
7. Agent calls: {user_id: "mark@...", property_address: "123 Main", ...}
8. Backend uses Mark's calendar token
9. Books in Mark's calendar ✅
```

### Example 2: Jon Creates Same Agent

```
1. Jon logs in
2. Creates "Property Seller Agent" (same name, different config!)
3. Adds: property_address, email, phone (no asking_price)
4. Deploys → VAPI creates assistant_jon_456 (separate!)
5. Jon calls agent
6. Agent collects Jon's variables
7. Agent calls: {user_id: "jon@...", property_address: "456 Oak", ...}
8. Backend uses Jon's calendar token
9. Books in Jon's calendar ✅
```

### Example 3: No Cross-Contamination

```
❌ Jon can't:
- See Mark's agent configs
- Modify Mark's agents
- Book into Mark's calendar

✅ Each user:
- Sees only their agents
- Uses only their calendar
- Complete isolation
```

---

## 🎯 Best Practices

### 1. User Selection

Always ensure user is selected before creating agents:

```typescript
if (!userId) {
  return <div>Please select a user first</div>;
}
```

### 2. Agent Naming

Use descriptive names that make sense per-user:

```
Good: "Property Seller Agent"
Bad: "Mark's Agent" (won't make sense when Jon uses it)
```

### 3. Variable Design

Think about what EACH user needs:

```
Universal: property_address, email
User-specific: asking_price (Mark needs, Jon doesn't)
```

### 4. Testing

Test as different users:

```
1. Log in as Mark → create/test agent
2. Log in as Jon → create/test agent
3. Verify separate calendars are used
```

---

## 📊 System Limits

### Current Architecture

- **Users:** Unlimited
- **Agents per user:** Unlimited
- **Storage:** localStorage (per browser)
- **VAPI assistants:** 1 per agent config

### Future Enhancements

- [ ] Server-side storage (PostgreSQL)
- [ ] Team-wide agent templates
- [ ] Agent sharing between users
- [ ] Usage analytics per user
- [ ] Bulk agent management

---

## 🐛 Troubleshooting

### "No agents shown"

**Fix:** Ensure you've selected a user in /users page

### "Wrong calendar being used"

**Fix:** Check agent config has correct userId
**Fix:** Verify VAPI prompt includes correct user_id

### "Can see other users' agents"

**Bug:** Hook not filtering by userId
**Fix:** Check useAgentConfig() implementation

---

## 💡 Pro Tips

1. **Standardize First:** Create one agent, test thoroughly, then let other users clone/customize
2. **Document Variables:** Clear descriptions help agents collect data correctly
3. **Test Per-User:** Always test as the actual user who will use it
4. **Monitor Sync:** Check VAPI Dashboard to see separate assistants created
5. **Backend Logs:** Watch backend logs to verify correct user_id is being passed

---

**You now have true multi-user agent configuration with perfect calendar isolation!** 🎉
