# Testing Guide - PeteRental Frontend

**Created:** October 20, 2025  
**Purpose:** Comprehensive testing procedures for production readiness

---

## 📋 Table of Contents

1. [Backend Integration Tests](#backend-integration-tests)
2. [Frontend Component Tests](#frontend-component-tests)
3. [End-to-End User Flows](#end-to-end-user-flows)
4. [Performance Tests](#performance-tests)
5. [Security Tests](#security-tests)
6. [Accessibility Tests](#accessibility-tests)
7. [Browser Compatibility](#browser-compatibility)

---

## 🔌 Backend Integration Tests

### Test 1: Health Check

```bash
# Test backend is running
curl https://peterental-vapi-github-newer.onrender.com/health

# Expected Response:
# {
#   "status": "healthy",
#   "timestamp": "2025-10-20T...",
#   "uptime_seconds": 12345
# }
```

**✅ Pass Criteria:** Returns `status: "healthy"`

### Test 2: Service Info

```bash
curl https://peterental-vapi-github-newer.onrender.com/

# Expected Response:
# {
#   "name": "PeteRental VAPI Backend",
#   "version": "1.0.0",
#   "description": "...",
#   "endpoints": { ... }
# }
```

**✅ Pass Criteria:** Returns service information

### Test 3: Calendar Auth Status

```bash
# Check if user is authorized
curl "https://peterental-vapi-github-newer.onrender.com/calendar/auth/status?user_id=mark@peterei.com"

# Expected Response (Not Authorized):
# {
#   "authorized": false
# }

# Expected Response (Authorized):
# {
#   "authorized": true,
#   "expires_at": "2025-11-20T..."
# }
```

**✅ Pass Criteria:** Returns auth status for user

### Test 4: Calendar Events

```bash
# Get user's calendar events
curl "https://peterental-vapi-github-newer.onrender.com/calendar/events?user_id=mark@peterei.com&days_ahead=14"

# Expected Response (Authorized):
# {
#   "status": "success",
#   "events": [
#     {
#       "id": "event_123",
#       "subject": "Property Viewing",
#       "start_time": "2025-10-23T14:00:00",
#       "end_time": "2025-10-23T14:30:00",
#       "attendees": [...],
#       "web_link": "https://..."
#     }
#   ]
# }

# Expected Response (Not Authorized):
# {
#   "status": "error",
#   "message": "Not authorized..."
# }
```

**✅ Pass Criteria:** Returns events list or auth error

### Test 5: Calendar Availability

```bash
# Get available time slots
curl "https://peterental-vapi-github-newer.onrender.com/calendar/availability?user_id=mark@peterei.com&days_ahead=7"

# Expected Response:
# {
#   "status": "success",
#   "available_slots": [
#     {
#       "start": "2025-10-21T09:00:00",
#       "end": "2025-10-21T09:30:00"
#     },
#     ...
#   ]
# }
```

**✅ Pass Criteria:** Returns array of available slots

### Test 6: Create Appointment (Timezone Test)

```bash
# Create appointment and verify timezone handling
curl -X POST "https://peterental-vapi-github-newer.onrender.com/vapi/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "toolCalls": [{
        "id": "test_timezone",
        "function": {
          "name": "set_appointment",
          "arguments": {
            "user_id": "mark@peterei.com",
            "property_address": "TIMEZONE TEST",
            "start_time": "2025-10-23T14:00:00-05:00",
            "attendee_name": "Test User",
            "attendee_email": "test@example.com"
          }
        }
      }]
    }
  }'

# Expected Response:
# {
#   "results": [{
#     "toolCallId": "test_timezone",
#     "result": "Appointment confirmed for..."
#   }]
# }

# Then verify the time is correct:
curl "https://peterental-vapi-github-newer.onrender.com/calendar/events?user_id=mark@peterei.com&days_ahead=14"

# Check that start_time shows 14:00 (2:00 PM), not offset
```

**✅ Pass Criteria:** Appointment created at correct time (2:00 PM)

### Test 7: VAPI Assistants

```bash
# Get list of VAPI agents
curl "https://peterental-vapi-github-newer.onrender.com/vapi/assistants"

# Expected Response:
# {
#   "assistants": [
#     {
#       "id": "24464697-8f45-4b38-b43a-d337f50c370e",
#       "name": "Appointment Setter Agent",
#       "model": "gpt-4",
#       "voice": "jennifer",
#       "tools": [...]
#     }
#   ]
# }
```

**✅ Pass Criteria:** Returns list of VAPI assistants

### Test 8: Rental Database Status

```bash
# Get database statistics
curl "https://peterental-vapi-github-newer.onrender.com/database/status"

# Expected Response:
# {
#   "status": "success",
#   "database_stats": {
#     "total_rentals": 42,
#     "websites_tracked": 5,
#     "last_updated": "2025-10-20T...",
#     "websites": { ... }
#   }
# }
```

**✅ Pass Criteria:** Returns database stats

### Test 9: Available Rentals

```bash
# Get available rental properties
curl "https://peterental-vapi-github-newer.onrender.com/database/available"

# Expected Response:
# {
#   "status": "success",
#   "total_available": 10,
#   "current_date": "2025-10-20",
#   "rentals": [
#     {
#       "address": "123 Main St",
#       "price": "$1,500/month",
#       "bedrooms": 2,
#       "bathrooms": 1,
#       "available_date": "Immediate",
#       "availability_status": "Available Now"
#     }
#   ]
# }
```

**✅ Pass Criteria:** Returns list of available rentals

---

## 🧩 Frontend Component Tests

### Manual Component Testing Checklist

#### Navigation Component

- [ ] All links present and clickable
- [ ] Active link has underline
- [ ] Hover states work
- [ ] Responsive on mobile
- [ ] No inline styles (all Tailwind)

#### Home Page

- [ ] Loads without errors
- [ ] Shows auth status correctly
- [ ] "Connect Calendar" button works
- [ ] All cards display properly
- [ ] Links navigate correctly

#### Users Page

- [ ] Shows current user
- [ ] Auth status updates
- [ ] OAuth flow works
- [ ] Callback handled correctly
- [ ] Success/error messages display

#### Calendar Page

- [ ] Events list loads
- [ ] Shows loading state
- [ ] Handles no events
- [ ] Appointment form works
- [ ] Success feedback shows

#### Dashboard Page

- [ ] Rentals load and display
- [ ] Status cards show correct data
- [ ] Table/cards responsive
- [ ] Filters work (if implemented)
- [ ] No data state handled

#### VAPI Agent Page

- [ ] Agent selector loads
- [ ] Can start/stop call
- [ ] Transcript displays
- [ ] Status indicators work
- [ ] Multiple agents selectable

---

## 🔄 End-to-End User Flows

### Flow 1: First-Time User Connects Calendar

**Steps:**

1. Visit home page
2. See "No calendar connected" message
3. Click "Connect Calendar" button
4. Redirected to users page
5. Click "Connect Microsoft Calendar"
6. Complete Microsoft OAuth
7. Redirected back to users page with success message
8. Auth status shows "Connected"
9. Go to calendar page
10. See "No events" (or existing events if any)

**✅ Pass Criteria:** User successfully connects calendar and sees events

### Flow 2: Book Property Viewing

**Steps:**

1. Go to dashboard
2. See available rentals
3. Click "Schedule Viewing" on a property (or note address)
4. Go to calendar page
5. Click "Book Appointment"
6. Enter property address
7. Select date from calendar
8. Select time slot
9. Enter attendee email
10. Submit form
11. See success message
12. New appointment appears in events list
13. Check Microsoft Calendar - appointment is there

**✅ Pass Criteria:** Appointment created and visible in both app and Microsoft Calendar

### Flow 3: Use VAPI Agent to Book Appointment

**Steps:**

1. Ensure calendar is connected
2. Go to VAPI Agent page
3. Select an agent
4. Click "Start Call"
5. Say: "I'd like to book a viewing for 123 Main Street at 2pm tomorrow"
6. VAPI processes and calls backend
7. Agent confirms appointment
8. Go to calendar page
9. See new appointment in list

**✅ Pass Criteria:** Voice-booked appointment appears in calendar

### Flow 4: Multi-User Switching (Phase 2)

**Steps:**

1. Connect calendar for user A
2. Open user selector
3. Click "Add User"
4. Connect calendar for user B
5. Switch to user B
6. See user B's events
7. Switch back to user A
8. See user A's events

**✅ Pass Criteria:** Can switch between users and see correct data

---

## ⚡ Performance Tests

### Lighthouse Audit

```bash
# Run Lighthouse in Chrome DevTools
# Or use CLI:
npm install -g lighthouse
lighthouse https://peterental-nextjs.vercel.app --output html --output-path report.html
```

**Target Scores:**

- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

### Core Web Vitals

| Metric                         | Target  | Tool            |
| ------------------------------ | ------- | --------------- |
| LCP (Largest Contentful Paint) | < 2.5s  | Chrome DevTools |
| FID (First Input Delay)        | < 100ms | Chrome DevTools |
| CLS (Cumulative Layout Shift)  | < 0.1   | Chrome DevTools |
| TTFB (Time to First Byte)      | < 600ms | Network tab     |

### Bundle Size

```bash
# Build and analyze
pnpm build

# Check output
ls -lh .next/static/chunks/*.js

# Target: Initial bundle < 300KB
```

**Pass Criteria:**

- Initial JS bundle < 300KB
- Total page weight < 1MB
- Images optimized
- No unused dependencies

### API Response Times

| Endpoint            | Target  | Test                         |
| ------------------- | ------- | ---------------------------- |
| /health             | < 100ms | `curl -w "@curl-format.txt"` |
| /calendar/events    | < 500ms | Network tab                  |
| /database/available | < 300ms | Network tab                  |
| /vapi/assistants    | < 400ms | Network tab                  |

**curl-format.txt:**

```
time_namelookup:  %{time_namelookup}s\n
time_connect:     %{time_connect}s\n
time_starttransfer: %{time_starttransfer}s\n
time_total:       %{time_total}s\n
```

---

## 🔒 Security Tests

### Environment Variables

- [ ] No secrets in client-side code
- [ ] `NEXT_PUBLIC_*` only for public data
- [ ] `.env.local` in `.gitignore`
- [ ] Production secrets in Vercel dashboard

### Input Validation

```typescript
// Test these inputs
const maliciousInputs = [
  "<script>alert('xss')</script>",
  "'; DROP TABLE users; --",
  '../../../etc/passwd',
  '{{7*7}}',
  '\0',
];

// Verify:
// - Not executed
// - Sanitized
// - Rejected by validation
```

### API Security

- [ ] CORS configured correctly
- [ ] No sensitive data in URLs
- [ ] API errors don't leak info
- [ ] Rate limiting works

### Authentication

- [ ] Tokens stored securely
- [ ] Token expiry handled
- [ ] Refresh tokens work
- [ ] Logout clears state

---

## ♿ Accessibility Tests

### Automated Testing

```bash
# Install axe DevTools extension
# Or use CLI:
npm install -g @axe-core/cli
axe https://peterental-nextjs.vercel.app
```

### Manual Testing Checklist

#### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Tab order is logical
- [ ] Enter submits forms
- [ ] Escape closes modals
- [ ] No keyboard traps

#### Screen Reader (VoiceOver on Mac)

```bash
# Enable VoiceOver
Cmd + F5

# Navigate through page
# Verify all content is announced
# Check button labels are clear
# Ensure images have alt text
```

- [ ] All buttons have labels
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Error messages are announced
- [ ] Status changes announced

#### Visual

- [ ] Color contrast ratio > 4.5:1 for text
- [ ] Color not sole indicator
- [ ] Focus indicators visible
- [ ] Text resizable to 200%
- [ ] No flashing content

#### ARIA

- [ ] Proper ARIA roles
- [ ] aria-label for icon buttons
- [ ] aria-live for dynamic content
- [ ] aria-invalid for errors
- [ ] aria-expanded for dropdowns

---

## 🌐 Browser Compatibility

### Desktop Browsers

| Browser | Version | Test       |
| ------- | ------- | ---------- |
| Chrome  | Latest  | ✅ Primary |
| Firefox | Latest  | ✅ Test    |
| Safari  | Latest  | ✅ Test    |
| Edge    | Latest  | ✅ Test    |

### Mobile Browsers

| Browser | Platform    | Test        |
| ------- | ----------- | ----------- |
| Safari  | iOS 15+     | ✅ Test     |
| Chrome  | Android 10+ | ✅ Test     |
| Firefox | Android 10+ | ⚠️ Optional |

### Responsive Breakpoints

```css
/* Test at these widths */
- 320px  (Mobile small)
- 375px  (Mobile medium)
- 428px  (Mobile large)
- 768px  (Tablet)
- 1024px (Desktop small)
- 1280px (Desktop medium)
- 1920px (Desktop large)
```

**Test Checklist:**

- [ ] Navigation responsive
- [ ] Cards stack properly
- [ ] Tables become cards on mobile
- [ ] Forms usable on mobile
- [ ] No horizontal scroll
- [ ] Touch targets > 44px

---

## 🧪 Test Scripts

### Backend Connection Test

```bash
#!/bin/bash
# test-backend.sh

API_URL="https://peterental-vapi-github-newer.onrender.com"
USER_ID="mark@peterei.com"

echo "Testing Backend Connection..."
echo ""

# Health
echo "1. Health Check:"
curl -s "$API_URL/health" | jq '.'
echo ""

# Auth Status
echo "2. Auth Status:"
curl -s "$API_URL/calendar/auth/status?user_id=$USER_ID" | jq '.'
echo ""

# Events
echo "3. Calendar Events:"
curl -s "$API_URL/calendar/events?user_id=$USER_ID&days_ahead=14" | jq '.status'
echo ""

# Availability
echo "4. Availability:"
curl -s "$API_URL/calendar/availability?user_id=$USER_ID&days_ahead=7" | jq '.status'
echo ""

# VAPI Assistants
echo "5. VAPI Assistants:"
curl -s "$API_URL/vapi/assistants" | jq '.assistants | length'
echo ""

# Rentals
echo "6. Available Rentals:"
curl -s "$API_URL/database/available" | jq '.total_available'
echo ""

echo "✅ All tests complete!"
```

### Frontend Health Check

```typescript
// lib/utils/health-check.ts
export async function runHealthCheck() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const tests = [
    {
      name: 'Backend Health',
      url: `${apiUrl}/health`,
      check: (data: any) => data.status === 'healthy',
    },
    {
      name: 'VAPI Assistants',
      url: `${apiUrl}/vapi/assistants`,
      check: (data: any) => Array.isArray(data.assistants),
    },
    {
      name: 'Database Status',
      url: `${apiUrl}/database/status`,
      check: (data: any) => data.status === 'success',
    },
  ];

  const results = await Promise.all(
    tests.map(async (test) => {
      try {
        const response = await fetch(test.url);
        const data = await response.json();
        const passed = test.check(data);
        return { name: test.name, passed, error: null };
      } catch (error) {
        return {
          name: test.name,
          passed: false,
          error: (error as Error).message,
        };
      }
    })
  );

  return results;
}
```

---

## 📊 Test Report Template

```markdown
# Test Report

**Date:** 2025-10-20
**Tester:** Mark
**Environment:** Production
**Build:** v1.0.0

## Backend Integration Tests

- [x] Health Check - ✅ Pass
- [x] Auth Status - ✅ Pass
- [x] Calendar Events - ✅ Pass
- [x] Availability - ✅ Pass
- [x] Create Appointment - ✅ Pass (time correct)
- [x] VAPI Assistants - ✅ Pass
- [x] Database Status - ✅ Pass
- [x] Available Rentals - ✅ Pass

## Frontend Component Tests

- [x] Navigation - ✅ Pass
- [x] Home Page - ✅ Pass
- [x] Users Page - ✅ Pass
- [x] Calendar Page - ✅ Pass
- [x] Dashboard Page - ✅ Pass
- [x] VAPI Agent Page - ✅ Pass

## End-to-End Flows

- [x] Connect Calendar - ✅ Pass
- [x] Book Appointment - ✅ Pass
- [x] Use VAPI Agent - ✅ Pass

## Performance

- Lighthouse Performance: 92
- Lighthouse Accessibility: 96
- LCP: 1.8s
- CLS: 0.05
- Bundle Size: 285KB

## Security

- [x] No secrets exposed - ✅ Pass
- [x] Input validation - ✅ Pass
- [x] CORS configured - ✅ Pass

## Accessibility

- [x] Keyboard navigation - ✅ Pass
- [x] Screen reader - ✅ Pass
- [x] Color contrast - ✅ Pass
- [x] ARIA labels - ✅ Pass

## Browser Compatibility

- [x] Chrome - ✅ Pass
- [x] Firefox - ✅ Pass
- [x] Safari - ✅ Pass
- [x] Mobile Safari - ✅ Pass
- [x] Mobile Chrome - ✅ Pass

## Issues Found

None

## Recommendations

- Consider adding loading indicators
- Add more user feedback for actions
- Implement dark mode

## Conclusion

✅ **PASS** - Ready for production deployment
```

---

## 🚨 Critical Issues Checklist

If any of these fail, **DO NOT DEPLOY**:

- [ ] Backend health check fails
- [ ] OAuth flow broken
- [ ] Cannot create appointments
- [ ] Timezone bug still present
- [ ] VAPI integration fails
- [ ] TypeScript errors
- [ ] Linter errors
- [ ] Build fails
- [ ] Accessibility score < 90
- [ ] Security vulnerability

---

**End of Testing Guide**

**Remember:** Always test with real backend, never mock. Test thoroughly before deployment.
