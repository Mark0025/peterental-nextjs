# 🎨 Visual Agent Builder Guide

**Created:** October 20, 2025  
**Feature:** No-code VAPI agent configuration with perfect sync

---

## 🎯 What Problem Does This Solve?

**Before:** Confusing VAPI Dashboard configuration
- ❌ Not sure if variables are configured correctly
- ❌ Functions might be missing required fields
- ❌ Backend and VAPI config can get out of sync
- ❌ Hard to know if agent will collect all needed info

**After:** Visual agent builder
- ✅ Define variables once with clear labels
- ✅ Drag variables into functions
- ✅ One-click deploy syncs everything
- ✅ Agent automatically collects required fields
- ✅ No guesswork!

---

## 🚀 How It Works

### 1. Visual Configuration

```
You Configure in Next.js UI:
┌─────────────────────────────────────┐
│ Variables:                          │
│ • property_address (required)       │
│ • email (required)                  │
│ • phone (optional)                  │
│                                     │
│ Functions:                          │
│ • set_appointment                   │
│   Uses: property_address, email    │
└─────────────────────────────────────┘
```

### 2. Automatic VAPI Sync

When you click "Deploy", the system automatically:

1. **Generates VAPI Function Config:**
```json
{
  "name": "set_appointment",
  "parameters": {
    "type": "object",
    "properties": {
      "property_address": {
        "type": "string",
        "description": "The property address for viewing"
      },
      "email": {
        "type": "string",
        "description": "Contact email"
      }
    },
    "required": ["property_address", "email"]
  }
}
```

2. **Enhances System Prompt:**
```
You must collect the following information:
- Property Address **REQUIRED**: The property address for viewing
  Ask: "What's the property address?"
- Email **REQUIRED**: Contact email
  Ask: "What's your email address?"

You MUST collect property_address and email before calling set_appointment.
```

3. **Updates VAPI Dashboard:**
- Calls VAPI API to update assistant
- Sets webhook URL to your Python backend
- Configures all functions with proper parameters

4. **Result:**
- Agent knows what to ask for
- Agent won't call function without required fields
- Backend receives properly structured data

---

## 📋 Step-by-Step Usage

### Step 1: Create Agent

1. Go to `/agent-builder`
2. Click "Create New Agent"
3. Enter name: e.g., "Property Seller Agent"

### Step 2: Configure Basic Info

1. Click "Configure" on your agent
2. Go to "Basic Info" tab
3. Set:
   - Name: Property Seller Agent
   - Model: gpt-4
   - Voice: jennifer
   - First Message: "Hi! I help with selling properties."
   - System Prompt: "You are a helpful real estate assistant..."

### Step 3: Add Variables

1. Go to "Variables" tab
2. Click "Add Variable"
3. Configure each variable:

**Example: Property Address**
```
Variable Name: property_address
Display Name: Property Address
Type: address
Description: The address of the property to sell
Required: ✓ Yes
Extraction Prompt: "What's the property address?"
```

**Example: Email**
```
Variable Name: email
Display Name: Email Address
Type: email
Description: Contact email for follow-up
Required: ✓ Yes
Extraction Prompt: "What's your email address?"
```

**Example: Phone** (Optional)
```
Variable Name: phone
Display Name: Phone Number
Type: phone
Description: Contact phone number
Required: ✗ No
Extraction Prompt: "What's your phone number? (optional)"
```

### Step 4: Add Functions

1. Go to "Functions" tab
2. Click "Add Function"
3. Configure function:

**Example: Set Appointment**
```
Function Name: set_appointment
Display Name: Book Property Viewing
Description: Schedule a property viewing appointment
Enabled: ✓ Yes

Variables Used:
✓ Property Address (required)
✓ Email Address (required)
+ Phone Number (optional)
```

### Step 5: Preview Configuration

1. Go to "Preview" tab
2. Click "Generate Preview"
3. Review:
   - System prompt (how AI will collect variables)
   - Function configurations (what will be sent to VAPI)

### Step 6: Deploy to VAPI

1. Click "Deploy to VAPI" (top right)
2. System will:
   - Generate VAPI configuration
   - Call VAPI API to create/update assistant
   - Set webhook URL to your Python backend
   - Sync all functions and variables
3. Success! Agent is now live

### Step 7: Test Your Agent

1. Go to `/vapi-agent`
2. Select your newly created agent
3. Click "Start Call"
4. Test the conversation:
   ```
   User: "I want to sell my house"
   Agent: "I'd be happy to help! What's the property address?"
   User: "123 Main Street"
   Agent: "Great! What's your email address?"
   User: "john@example.com"
   Agent: "Perfect! I'm booking your appointment now..."
   [Agent calls set_appointment with property_address="123 Main Street", email="john@example.com"]
   ```

---

## 🎨 Example: Complete Agent Configuration

### Property Seller Agent

**Variables:**
1. `property_address` (string, required) - "What's the property address?"
2. `email` (email, required) - "What's your email?"
3. `phone` (phone, optional) - "Phone number?"
4. `property_type` (string, required) - "House, apartment, or condo?"
5. `bedrooms` (number, optional) - "How many bedrooms?"
6. `asking_price` (number, optional) - "Asking price?"

**Functions:**
1. **set_appointment**
   - Uses: property_address, email, phone
   - Description: Schedule property viewing
   
2. **get_property_valuation**
   - Uses: property_address, property_type, bedrooms
   - Description: Get estimated property value
   
3. **send_listing_info**
   - Uses: email, property_address
   - Description: Send property listing details

**Generated System Prompt:**
```
You are a helpful real estate assistant for Property Seller Agent.

## Variable Collection Instructions

You must collect the following information from the user:

- **Property Address** **REQUIRED**: The address of the property to sell
  Ask: "What's the property address?"

- **Email Address** **REQUIRED**: Contact email for follow-up
  Ask: "What's your email?"

- **Phone Number** (optional): Contact phone number
  Ask: "What's your phone number? (optional)"

- **Property Type** **REQUIRED**: Type of property (house, apartment, condo)
  Ask: "Is this a house, apartment, or condo?"

- **Bedrooms** (optional): Number of bedrooms
  Ask: "How many bedrooms?"

- **Asking Price** (optional): Desired asking price
  Ask: "What's your asking price?"

## Function Calling Rules

### Book Property Viewing
Call `set_appointment` when: Schedule property viewing

**You MUST collect these before calling:**
- Property Address (property_address)
- Email Address (email)

**Available parameters:**
- property_address: The address of the property to sell (required)
- email: Contact email for follow-up (required)
- phone: Contact phone number

### Get Property Valuation
Call `get_property_valuation` when: Get estimated property value

**You MUST collect these before calling:**
- Property Address (property_address)
- Property Type (property_type)

**Available parameters:**
- property_address: The address of the property to sell (required)
- property_type: Type of property (house, apartment, condo) (required)
- bedrooms: Number of bedrooms

### Send Listing Info
Call `send_listing_info` when: Send property listing details

**You MUST collect these before calling:**
- Email Address (email)
- Property Address (property_address)

**Available parameters:**
- email: Contact email for follow-up (required)
- property_address: The address of the property to sell (required)
```

---

## 🔧 Setup Instructions

### 1. Get VAPI API Key

1. Go to https://dashboard.vapi.ai/api-keys
2. Create new API key (private key, not public key)
3. Copy the key

### 2. Add to Environment

```bash
# .env.local
VAPI_API_KEY=your_private_vapi_api_key_here
```

### 3. Start Using

```bash
# Navigate to agent builder
http://localhost:3000/agent-builder

# Create, configure, deploy!
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Next.js Agent Builder UI                       │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 1. User configures variables & functions          │     │
│  │ 2. Clicks "Deploy to VAPI"                        │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                          ↓
                  Next.js Server Action
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              VAPI API (via API Key)                         │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 1. Creates/updates assistant                      │     │
│  │ 2. Sets system prompt with variable instructions  │     │
│  │ 3. Configures functions with parameters          │     │
│  │ 4. Sets webhook URL to Python backend            │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                          ↓
                  Assistant is Live!
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              User Calls Agent                               │
│  Agent collects: property_address, email                   │
│  Agent calls: set_appointment                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Python Backend Webhook                         │
│  Receives: { property_address: "123 Main", email: "..." } │
│  Executes: Book appointment logic                          │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Benefits

### 1. No Guesswork
- Visual UI shows exactly what agent will ask for
- Required fields are clearly marked
- Agent won't call function without required data

### 2. Perfect Sync
- One source of truth (your configuration)
- Deploy button syncs everything
- Backend automatically knows what to expect

### 3. Easy Modifications
- Change variable name: update once, redeploy
- Add new variable: add to UI, assign to function, redeploy
- No manual VAPI Dashboard editing

### 4. Team-Friendly
- Non-technical team members can configure agents
- Clear, intuitive interface
- Preview before deploying

### 5. Scalable
- Create multiple agents for different use cases
- Clone and modify existing agents
- Centralized management

---

## 🎯 Example Use Cases

### Property Seller Agent
Variables: property_address, email, phone, property_type
Functions: set_appointment, get_valuation, send_info

### Rental Inquiry Agent
Variables: property_address, email, move_in_date, budget
Functions: check_availability, schedule_viewing, send_application

### Customer Support Agent
Variables: customer_id, issue_type, description
Functions: create_ticket, escalate_issue, send_solution

### Appointment Booking Agent
Variables: service_type, preferred_date, email, phone
Functions: check_availability, book_appointment, send_confirmation

---

## 📚 API Reference

### syncAgent(agentConfig)
Syncs agent configuration to VAPI Dashboard

**Returns:**
```typescript
{
  success: boolean
  assistantId?: string
  error?: string
}
```

### previewAgentConfig(agentConfig)
Generates preview of what will be sent to VAPI

**Returns:**
```typescript
{
  success: boolean
  functions: VAPIFunctionConfig[]
  systemPrompt: string
}
```

---

## 🐛 Troubleshooting

### Deploy Fails
**Error:** "VAPI_API_KEY not configured"
**Fix:** Add your VAPI private API key to `.env.local`

### Agent Not Collecting Variables
**Fix:** Check "Preview" tab to see if system prompt includes variable instructions

### Function Not Working
**Fix:** Ensure:
1. Function is enabled (toggle in UI)
2. Required variables are assigned to function
3. Backend webhook handles the function name

---

## 🚀 Future Enhancements

- [ ] Agent cloning (duplicate and modify)
- [ ] Import/export agent configs
- [ ] A/B testing different prompts
- [ ] Analytics (which agents perform best)
- [ ] Team collaboration (share agents)
- [ ] Variable validation rules (regex, min/max length)
- [ ] Conditional logic (if X then collect Y)

---

## 💡 Pro Tips

1. **Start Simple:** Begin with 2-3 required variables, test, then add more
2. **Clear Prompts:** Make extraction prompts conversational
3. **Preview Always:** Check preview before deploying
4. **Test Immediately:** After deploy, test the agent to verify behavior
5. **Iterate:** Refine variable descriptions based on how agent performs

---

**You now have a visual agent builder that makes VAPI configuration intuitive and error-free!** 🎉

