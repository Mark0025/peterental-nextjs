# Learning: URL Encoding Breaking Agent Config Lookups

## Quick Summary

Agent Builder showed "Agent not found" because URL params with `@` symbols get URL-encoded (`%40`), but we were comparing directly against localStorage IDs that had literal `@` symbols.

## The Problem

```
URL: /agent-builder/agent_mark%40peterei.com_1761007152360
localStorage ID: agent_mark@peterei.com_1761007152360
Comparison: agent_mark%40peterei.com_1761007152360 === agent_mark@peterei.com_1761007152360
Result: false → "Agent not found"
```

## The Fix

```typescript
// Before (broken):
const { id } = use(params);
const config = configs.find((c) => c.id === id);

// After (working):
const { id: rawId } = use(params);
const id = decodeURIComponent(rawId); // Decode %40 → @
const config = configs.find((c) => c.id === id);
```

Also encode when creating links:

```typescript
<Link href={`/agent-builder/${encodeURIComponent(config.id)}`}>
```

## The Lesson

**Always decode URL parameters that might contain special characters (`@`, `+`, `#`, etc.) before using them as lookup keys!**

Common URL encodings:

- `@` → `%40`
- `+` → `%2B`
- `#` → `%23`
- `/` → `%2F`
- `?` → `%3F`

## Status: ✅ FIXED

Works immediately in dev mode (Next.js Fast Refresh), no rebuild needed!
