# Debug Agent Builder - Infinite Spinner

## Quick Fix:

### 1. Open Browser Console (F12)

Run this to see what's in storage:

```javascript
console.log(
  'Agent Configs:',
  JSON.parse(localStorage.getItem('agent_configs') || '[]')
);
console.log('Current User:', localStorage.getItem('calendar_user_id'));
```

### 2. If Empty:

```javascript
// Clear and reload
localStorage.clear();
location.href = '/agent-builder';
```

### 3. Or Create Test Agent:

```javascript
// Create a test agent
const testAgent = {
  id: 'test_agent_123',
  userId: 'mark@peterei.com',
  name: 'Test Agent',
  description: 'Test',
  voice: 'jennifer',
  model: 'gpt-4',
  systemPrompt: 'You are helpful.',
  firstMessage: 'Hi!',
  variables: [],
  functions: [],
  syncStatus: 'draft',
};

localStorage.setItem('agent_configs', JSON.stringify([testAgent]));
location.href = '/agent-builder';
```

---

## The Issue:

The spinner appears because:

1. `configsLoading` might be stuck as `true`
2. OR localStorage is empty (no agents created yet)
3. OR the agent ID doesn't match any saved configs

---

## Permanent Fix Needed:

The `useAgentConfig` hook needs to set `loading: false` after checking localStorage.
