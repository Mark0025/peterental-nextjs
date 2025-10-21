# 🔧 VAPI Webhook Configuration

**Issue:** VAPI agent not seeing booked appointments when calling functions

**Root Cause:** VAPI assistants need to be configured to send webhooks to YOUR backend

---

## ✅ Your Backend Webhook URL

**VAPI assistants must call this webhook URL:**

```
https://peterental-vapi-github-newer.onrender.com/vapi/webhook
```

---

## 🔧 How VAPI Webhooks Work

### When User Says: "What times are available?"

1. **VAPI** recognizes intent → calls `get_availability` function
2. **VAPI sends webhook** to YOUR backend:
   ```
   POST https://peterental-vapi-github-newer.onrender.com/vapi/webhook
   ```
3. **Your backend:**
   - Checks Microsoft Calendar
   - Finds available slots
   - Returns natural language response
4. **VAPI speaks** the response to user

### When User Says: "Book me for 2pm Tuesday"

1. **VAPI** recognizes intent → calls `set_appointment` function
2. **VAPI sends webhook** to YOUR backend:
   ```
   POST https://peterental-vapi-github-newer.onrender.com/vapi/webhook
   ```
3. **Your backend:**
   - Checks for conflicts in Microsoft Calendar
   - Creates the appointment if available
   - Returns success/failure message
4. **VAPI speaks** the result to user

---

## 🎯 Configuration Required in VAPI Dashboard

You need to configure EACH assistant in VAPI dashboard:

### 1. Go to VAPI Dashboard

```
https://dashboard.vapi.ai/assistants
```

### 2. For EACH Assistant (all 16):

#### Server URL Configuration

```
Server URL: https://peterental-vapi-github-newer.onrender.com/vapi/webhook
```

#### Function 1: get_availability

```json
{
  "name": "get_availability",
  "description": "Get available appointment times for property viewings. Checks the user's Microsoft Calendar for free slots.",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": {
        "type": "string",
        "description": "User's email address"
      },
      "days_ahead": {
        "type": "number",
        "description": "Number of days to look ahead (default: 7)"
      }
    },
    "required": ["user_id"]
  },
  "url": "https://peterental-vapi-github-newer.onrender.com/vapi/webhook"
}
```

#### Function 2: set_appointment

```json
{
  "name": "set_appointment",
  "description": "Book a property viewing appointment. Creates event in Microsoft Calendar and checks for conflicts.",
  "parameters": {
    "type": "object",
    "properties": {
      "user_id": {
        "type": "string",
        "description": "User's email address"
      },
      "property_address": {
        "type": "string",
        "description": "Full address of the property"
      },
      "start_time": {
        "type": "string",
        "description": "Appointment start time in ISO format with timezone (e.g. 2025-10-21T14:00:00-05:00)"
      },
      "attendee_name": {
        "type": "string",
        "description": "Name of person attending viewing"
      },
      "attendee_email": {
        "type": "string",
        "description": "Email of person attending viewing"
      },
      "timezone": {
        "type": "string",
        "description": "Timezone (default: America/Chicago)"
      }
    },
    "required": [
      "user_id",
      "property_address",
      "start_time",
      "attendee_name",
      "attendee_email"
    ]
  },
  "url": "https://peterental-vapi-github-newer.onrender.com/vapi/webhook"
}
```

---

## 🧪 Test Your Webhook Configuration

### Test 1: Verify Backend is Receiving Webhooks

Run this to test `get_availability`:

```bash
curl -X POST "https://peterental-vapi-github-newer.onrender.com/vapi/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "toolCalls": [{
        "id": "test_123",
        "function": {
          "name": "get_availability",
          "arguments": {
            "user_id": "mark@peterei.com",
            "days_ahead": 7
          }
        }
      }]
    }
  }'
```

**Expected Response:**

```json
{
  "results": [
    {
      "toolCallId": "test_123",
      "result": "I have several viewing times available for the property. Here are the next available slots: Tuesday, October 21 at 09:00 AM, Tuesday, October 21 at 09:30 AM..."
    }
  ]
}
```

### Test 2: Verify Conflict Detection

Run this to test `set_appointment` with a TAKEN time:

```bash
curl -X POST "https://peterental-vapi-github-newer.onrender.com/vapi/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "toolCalls": [{
        "id": "test_456",
        "function": {
          "name": "set_appointment",
          "arguments": {
            "user_id": "mark@peterei.com",
            "property_address": "123 Test Street",
            "start_time": "2025-10-21T14:00:00-05:00",
            "attendee_name": "John Doe",
            "attendee_email": "john@example.com",
            "timezone": "America/Chicago"
          }
        }
      }]
    }
  }'
```

**Expected Response (if time is taken):**

```json
{
  "results": [
    {
      "toolCallId": "test_456",
      "result": "I'm sorry, but that time slot (2:00 PM on October 21) is already taken. Would you like to see other available times?"
    }
  ]
}
```

---

## 🔍 Why It's Not Working Right Now

### Current Issue:

Your VAPI assistants are probably configured with:

- ❌ No webhook URL
- ❌ Wrong webhook URL
- ❌ Functions not configured
- ❌ Old backend URL

### What Needs to Happen:

1. ✅ Each assistant needs webhook URL: `https://peterental-vapi-github-newer.onrender.com/vapi/webhook`
2. ✅ Functions `get_availability` and `set_appointment` must be defined
3. ✅ Functions must point to YOUR backend
4. ✅ Backend must check Microsoft Calendar for conflicts

---

## 📋 Step-by-Step Fix

### Step 1: Go to VAPI Dashboard

```
https://dashboard.vapi.ai/assistants
```

### Step 2: Select an Assistant

Click on "Lead_intake_agent.0.0.2-Appseter" (or any assistant you want to use)

### Step 3: Add Server URL

In the assistant settings:

```
Server URL: https://peterental-vapi-github-newer.onrender.com/vapi/webhook
```

### Step 4: Add Functions

Click "Add Function" and add both:

1. `get_availability` (see JSON above)
2. `set_appointment` (see JSON above)

### Step 5: Save Assistant

### Step 6: Test in Your App

1. Go to http://localhost:3000/vapi-agent
2. Select the configured assistant
3. Click "Start Call"
4. Say: "What times are available this week?"
5. Agent should call YOUR backend and see actual calendar

---

## 🎯 Quick Test URLs

**Test in Frontend Test Suite:**

```
http://localhost:3000/test-suite
→ Test 5: VAPI Get Availability
→ Test 7: VAPI Set Appointment
```

**Test via Terminal:**

```bash
# Test get_availability
curl -X POST "https://peterental-vapi-github-newer.onrender.com/vapi/webhook" \
  -H "Content-Type: application/json" \
  -d '{"message":{"toolCalls":[{"id":"test_1","function":{"name":"get_availability","arguments":{"user_id":"mark@peterei.com","days_ahead":3}}}]}}'

# Test set_appointment
curl -X POST "https://peterental-vapi-github-newer.onrender.com/vapi/webhook" \
  -H "Content-Type: application/json" \
  -d '{"message":{"toolCalls":[{"id":"test_2","function":{"name":"set_appointment","arguments":{"user_id":"mark@peterei.com","property_address":"123 Main St","start_time":"2025-11-01T14:00:00-05:00","attendee_name":"John Doe","attendee_email":"john@example.com","timezone":"America/Chicago"}}}]}}'
```

---

## ✅ Expected Behavior After Configuration

### Scenario: User Books Appointment

**User Says:** "Can you book me for a property viewing at 2pm on Tuesday?"

**What Should Happen:**

1. VAPI calls `get_availability` → sees 2pm is TAKEN
2. VAPI says: "I'm sorry, 2pm on Tuesday is already booked. I have these times available: 3pm, 4pm, or 5pm. Which works for you?"

**User Says:** "3pm works"

**What Should Happen:**

1. VAPI calls `set_appointment` with 3pm
2. Backend checks calendar → 3pm is FREE
3. Backend creates appointment in Microsoft Calendar
4. VAPI says: "Perfect! I've booked your viewing for 3pm on Tuesday at [property address]. You'll receive a calendar invite."

---

## 🚨 Important Notes

### 1. Calendar Must Be Connected

Before booking works:

```
http://localhost:3000/users
→ Connect Microsoft Calendar
```

### 2. User ID Must Match

The `user_id` in function calls must match the connected calendar user:

```
user_id: "mark@peterei.com"  ← Must be YOUR email
```

### 3. Timezone Matters

All times should use America/Chicago:

```
start_time: "2025-10-21T14:00:00-05:00"  ← Note -05:00
timezone: "America/Chicago"
```

### 4. Backend Logs

Check backend logs to see if webhooks are being received:

```
https://peterental-vapi-github-newer.onrender.com/docs
```

---

## 🎉 Success Indicators

You'll know it's working when:

✅ **In Dev Logs (Frontend):**

```
🔧 Function call: get_availability
✅ Function result: get_availability
   [Shows actual available times from calendar]
```

✅ **In Conversation:**

```
Agent: "I have several times available. Tuesday at 2pm, 3pm, or 4pm..."
User: "2pm please"
Agent: "I'm sorry, that time is already taken. Would 3pm work?"
```

✅ **In Microsoft Calendar:**

- New appointment appears after booking
- Attendee receives email invite

---

## 📞 Need Help?

1. **Check backend is running:**

   ```bash
   curl https://peterental-vapi-github-newer.onrender.com/
   ```

2. **Run test suite:**

   ```
   http://localhost:3000/test-suite
   ```

3. **Check VAPI dashboard:**
   ```
   https://dashboard.vapi.ai/assistants
   ```

---

**🎯 Bottom Line:**

Your VAPI assistants need to be configured in VAPI Dashboard to send function calls to:

```
https://peterental-vapi-github-newer.onrender.com/vapi/webhook
```

Once configured, the agent will:

- ✅ See your real Microsoft Calendar
- ✅ Detect conflicts
- ✅ Only book available times
- ✅ Confirm bookings

**Configure this in VAPI Dashboard, not in your frontend code!**
