# Local Development Webhook System

**Purpose:** Real-time sync between Next.js frontend and FastAPI backend during development

---

## 🎯 The Concept

```
Frontend (localhost:3000)  ←→  Backend (localhost:8000)
     │                              │
     │  POST /dev/webhook           │
     ├──────────────────────────────▶
     │                              │
     │  SSE /dev/events             │
     ◀──────────────────────────────┤
     │                              │
```

**When frontend changes** → POST to backend → Backend updates
**When backend changes** → SSE event → Frontend updates

---

## 🔧 Backend Setup (FastAPI)

### 1. Create Development Webhook Router

**File:** `backend/routers/dev_webhook.py` (new file)

```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator
import asyncio
import json
from datetime import datetime

router = APIRouter(prefix="/dev", tags=["development"])

# In-memory event queue for SSE
event_subscribers = []

@router.post("/webhook")
async def dev_webhook(
    event_type: str,
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Development webhook - triggered by frontend when changes happen

    Example:
    POST /dev/webhook
    {
        "event_type": "agent.created",
        "data": {"agent_id": "123", "name": "New Agent"}
    }
    """
    print(f"🔔 [DEV WEBHOOK] {event_type}: {json.dumps(data, indent=2)}")

    # Broadcast to all SSE subscribers
    event = {
        "type": event_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }

    for queue in event_subscribers:
        await queue.put(event)

    return {
        "success": True,
        "message": f"Event {event_type} broadcasted to {len(event_subscribers)} subscribers"
    }

@router.get("/events")
async def dev_events_stream(current_user: dict = Depends(get_current_user)):
    """
    Server-Sent Events (SSE) endpoint for real-time updates
    Frontend subscribes to this to receive backend changes
    """
    async def event_generator() -> AsyncGenerator[str, None]:
        queue = asyncio.Queue()
        event_subscribers.append(queue)

        try:
            # Send initial connection message
            yield f"data: {json.dumps({'type': 'connected', 'message': 'SSE connected'})}\n\n"

            # Stream events
            while True:
                event = await queue.get()
                yield f"data: {json.dumps(event)}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            event_subscribers.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/trigger")
async def trigger_event(event_type: str, data: dict):
    """
    Manually trigger an event (for backend-initiated changes)
    """
    event = {
        "type": event_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }

    for queue in event_subscribers:
        await queue.put(event)

    return {"success": True, "subscribers_notified": len(event_subscribers)}
```

### 2. Register Router in Main App

**File:** `backend/main.py`

```python
from routers import dev_webhook

# Add to app
app.include_router(dev_webhook.router, prefix="/api")
```

---

## 🎨 Frontend Setup (Next.js)

### 1. Create Dev Webhook Utility

**File:** `src/lib/dev-webhook.ts` (new file)

```typescript
/**
 * Development Webhook System
 * Real-time sync with local backend during development
 */

const DEV_MODE = process.env.NODE_ENV === 'development';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Send event to backend webhook
 */
export async function sendDevWebhook(
  eventType: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!DEV_MODE) return; // Only in development

  try {
    const response = await fetch(`${BACKEND_URL}/api/dev/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: eventType,
        data,
      }),
    });

    if (!response.ok) {
      console.warn('[DEV WEBHOOK] Failed to send:', eventType, response.status);
    } else {
      console.log('🔔 [DEV WEBHOOK] Sent:', eventType, data);
    }
  } catch (error) {
    console.warn('[DEV WEBHOOK] Error:', error);
  }
}

/**
 * Subscribe to backend events via SSE
 */
export function subscribeToBackendEvents(
  onEvent: (eventType: string, data: unknown) => void
): () => void {
  if (!DEV_MODE) return () => {}; // Only in development

  const eventSource = new EventSource(`${BACKEND_URL}/api/dev/events`);

  eventSource.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      console.log('📡 [DEV SSE] Received:', parsed.type, parsed.data);
      onEvent(parsed.type, parsed.data);
    } catch (error) {
      console.error('[DEV SSE] Parse error:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.warn('[DEV SSE] Connection error:', error);
  };

  // Return cleanup function
  return () => {
    eventSource.close();
    console.log('🔌 [DEV SSE] Disconnected');
  };
}
```

### 2. Use in Components

**Example: Agent Builder**

**File:** `src/app/agent-builder/page.tsx`

```typescript
'use client'

import { useEffect } from 'react'
import { sendDevWebhook, subscribeToBackendEvents } from '@/lib/dev-webhook'
import { useAgentConfig } from '@/lib/hooks/use-agent-config'

export default function AgentBuilderPage() {
  const { configs, loading, createConfig, refetch } = useAgentConfig()

  // Subscribe to backend events
  useEffect(() => {
    const unsubscribe = subscribeToBackendEvents((eventType, data) => {
      if (eventType === 'agent.created' || eventType === 'agent.updated') {
        console.log('🔄 Backend changed agent, refreshing...')
        refetch() // Reload agents from backend
      }
    })

    return unsubscribe
  }, [refetch])

  const handleCreate = async (newConfig: AgentConfig) => {
    // Create agent
    const agent = await createConfig(newConfig)

    // Notify backend
    await sendDevWebhook('agent.created', {
      agent_id: agent.id,
      name: agent.name,
      source: 'frontend',
    })
  }

  return (
    // ... your component
  )
}
```

---

## 🔥 Use Cases

### 1. **Agent Creation/Update**

```typescript
// Frontend creates agent
await createConfig(newAgent);
await sendDevWebhook('agent.created', { agent_id: 'abc123' });

// Backend receives webhook
// Backend can update its internal state
// Backend can broadcast to other clients
```

### 2. **Rental Addition**

```typescript
// Frontend adds rental
await fetch('/api/rentals', { method: 'POST', body: {...} })
await sendDevWebhook('rental.created', { rental_id: 'xyz789' })

// Backend logs it
// Backend can trigger scraping
// Backend can notify other services
```

### 3. **Calendar Connection**

```typescript
// Frontend connects calendar
await connectCalendar();
await sendDevWebhook('calendar.connected', { provider: 'microsoft' });

// Backend receives notification
// Backend can update agent configurations
// Backend can sync calendar events
```

---

## 🎬 Real-Time Scenarios

### Scenario 1: Two Browser Tabs

```
Tab 1 (Agent Builder)     Backend      Tab 2 (Dashboard)
        │                    │                 │
        │  Create Agent      │                 │
        ├───────────────────▶│                 │
        │                    │  SSE: agent.created
        │                    ├────────────────▶│
        │                    │                 │
        │                    │         Refresh agents
```

### Scenario 2: CLI Script + Frontend

```
Backend CLI Script        Backend      Frontend
        │                    │              │
        │  Create 100 agents │              │
        ├───────────────────▶│              │
        │                    │  SSE: agents.bulk_created
        │                    ├─────────────▶│
        │                    │              │
        │                    │      Show "100 new agents"
```

---

## 🛠️ Advanced: File Watcher Integration

**Watch frontend changes and auto-reload backend:**

**File:** `scripts/dev-sync.js`

```javascript
const chokidar = require('chokidar');
const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:8000';

// Watch for file changes
const watcher = chokidar.watch('src/**/*.{ts,tsx}', {
  ignored: /node_modules/,
  persistent: true,
});

watcher.on('change', async (path) => {
  console.log(`📝 File changed: ${path}`);

  // Notify backend
  await fetch(`${BACKEND_URL}/api/dev/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: 'frontend.file_changed',
      data: { file: path, timestamp: new Date().toISOString() },
    }),
  });
});

console.log('👀 Watching for file changes...');
```

---

## 🚀 Quick Start

### 1. Start Backend (Terminal 1)

```bash
cd /Users/markcarpenter/Desktop/pete/PeteRental_vapi_10_02_25
source venv/bin/activate  # or your venv
uvicorn main:app --reload --port 8000
```

### 2. Start Frontend (Terminal 2)

```bash
cd /Users/markcarpenter/Desktop/pete/peterental-nextjs
pnpm dev
```

### 3. Test Webhook

```bash
# Terminal 3 - Send test event
curl -X POST http://localhost:8000/api/dev/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test.event",
    "data": {"message": "Hello from curl!"}
  }'
```

### 4. Test SSE

```bash
# Terminal 4 - Subscribe to events
curl -N http://localhost:8000/api/dev/events
```

---

## 📊 Benefits

1. **Real-time sync** - See changes instantly
2. **Multi-tab support** - Changes in one tab reflect in others
3. **Backend visibility** - Backend sees what frontend is doing
4. **Debugging** - Track event flow in console
5. **No polling** - Efficient SSE connection
6. **Development only** - Zero production overhead

---

## ⚡ Implementation Priority

### Phase 1: Basic Webhook (30 min)

- Add backend `/dev/webhook` endpoint
- Add frontend `sendDevWebhook()` function
- Test with agent creation

### Phase 2: SSE Events (1 hour)

- Add backend `/dev/events` SSE endpoint
- Add frontend `subscribeToBackendEvents()` function
- Test multi-tab sync

### Phase 3: Integration (1 hour)

- Add webhooks to all CRUD operations
- Add SSE subscription to all pages
- Test full flow

---

## 🎯 Example Integration

**Complete Agent Builder with Dev Webhook:**

```typescript
'use client';

import { useEffect } from 'react';
import { sendDevWebhook, subscribeToBackendEvents } from '@/lib/dev-webhook';

export default function AgentBuilderPage() {
  const { configs, createConfig, updateConfig, deleteConfig, refetch } =
    useAgentConfig();

  // Subscribe to backend events on mount
  useEffect(() => {
    const unsubscribe = subscribeToBackendEvents((eventType, data) => {
      switch (eventType) {
        case 'agent.created':
        case 'agent.updated':
        case 'agent.deleted':
          console.log(`🔄 Backend event: ${eventType}, refreshing...`);
          refetch();
          break;
      }
    });

    return unsubscribe;
  }, [refetch]);

  const handleCreate = async (newAgent) => {
    const agent = await createConfig(newAgent);
    await sendDevWebhook('agent.created', {
      agent_id: agent.id,
      source: 'frontend',
    });
  };

  const handleUpdate = async (id, updates) => {
    await updateConfig(id, updates);
    await sendDevWebhook('agent.updated', { agent_id: id, source: 'frontend' });
  };

  const handleDelete = async (id) => {
    await deleteConfig(id);
    await sendDevWebhook('agent.deleted', { agent_id: id, source: 'frontend' });
  };

  // ... rest of component
}
```

---

**Want me to implement this now? It would give you real-time sync between frontend and backend during development!** 🚀
