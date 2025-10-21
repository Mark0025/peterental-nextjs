# Learning: Fixed Agent Builder Loading State and setConfig Errors

## The Full Story

### The Problem We Encountered

The Agent Builder configuration page (`/agent-builder/[id]`) was showing "Agent not found" errors and an infinite spinner, even when the agent existed. Then during refactoring, we got 14 TypeScript errors about `setConfig` not being defined.

**Error Message:**

```
Type error: Cannot find name 'setConfig'. Did you mean 'config'?
```

### What We Initially Thought

1. **First assumption:** The `getConfig` function wasn't working properly
2. **Second assumption:** We needed to fix the loading logic with `useEffect`
3. **Third assumption:** Just removing `useEffect` would fix everything

### What We Discovered Was Actually True

The real issues were:

1. **Loading state management:** We were checking `config === null` but `configs.find()` returns `undefined` when not found, not `null`
2. **Premature rendering:** The component was trying to render before `configs` loaded from localStorage
3. **State management pattern:** We had **two competing patterns**:
   - Local component state with `setConfig` (from old version)
   - Hook-based updates with `updateConfig` from `useAgentConfig`
4. **The refactor broke it:** When simplifying to remove `useEffect`, we **accidentally deleted the `handleUpdateConfig` function definition** while still calling it everywhere

### The Journey: Troubleshooting Steps

1. **Identified infinite spinner issue:**

   - Removed bad `useEffect` that depended on non-existent `getConfig`
   - Changed to direct `const config = configs.find(c => c.id === id)`

2. **Fixed loading check:**

   ```typescript
   // WRONG - config could be undefined, not null
   if (configsLoading || config === null)
     if (configsLoading)
       // CORRECT - check both loading and undefined
       return <Spinner />;
   if (!config) return <NotFound />;
   ```

3. **Discovered 14 `setConfig` errors:**

   - Used `grep` to find all instances: `grep -n "setConfig" src/app/agent-builder/[id]/page.tsx`
   - Found references in: `addVariable`, `updateVariable`, `deleteVariable`, `addFunction`, `updateFunction`, `deleteFunction`, `toggleVariableInFunction`, and 7 input `onChange` handlers

4. **Realized the pattern:**

   - Old code used **local component state** with `useState` and `setConfig`
   - New code uses **hook-based persistence** with `useAgentConfig` hook
   - During cleanup, we removed `setConfig` but forgot to add back `handleUpdateConfig`

5. **Fixed systematically:**
   - Added back `handleUpdateConfig` wrapper function
   - Replaced all 14 `setConfig` calls with `handleUpdateConfig`
   - Used batch search/replace to fix all instances

### The Solution That Worked

**Final working pattern:**

```typescript
'use client';

export default function AgentConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { configs, updateConfig, loading: configsLoading } = useAgentConfig();

  // Find config directly from loaded configs (auto-updates when configs change)
  const config = configs.find((c) => c.id === id);

  // Wrapper to mark config as draft when editing
  const handleUpdateConfig = (updates: Partial<typeof config>) => {
    updateConfig(id, { ...config, ...updates, syncStatus: 'draft' as const });
  };

  // Loading state - wait for configs to load
  if (configsLoading) {
    return <Spinner />;
  }

  // Not found - config doesn't exist
  if (!config) {
    return <NotFoundCard />;
  }

  // All update functions use handleUpdateConfig
  const addVariable = () => {
    handleUpdateConfig({ variables: [...config.variables, newVar] });
  };

  // All input handlers use handleUpdateConfig
  <Input onChange={(e) => handleUpdateConfig({ name: e.target.value })} />;
}
```

**Key architectural decisions:**

1. ✅ **No local useState for config** - Single source of truth in `useAgentConfig` hook
2. ✅ **No useEffect** - Direct derivation: `const config = configs.find(...)`
3. ✅ **Wrapper function** - `handleUpdateConfig` adds draft status automatically
4. ✅ **Immediate persistence** - Updates go straight to localStorage via hook
5. ✅ **Server Actions for sync** - `syncAgent` server action syncs to VAPI API

### The Lesson Learned

**So now we know:**

1. **Loading state in Next.js 15 with hooks:**

   ```typescript
   // ALWAYS check loading first, then check if data exists
   if (loading) return <Spinner />;
   if (!data) return <NotFound />;
   ```

2. **Don't mix state patterns:**

   - Either use `useState` + local state
   - OR use hook + direct updates
   - **DON'T do both!**

3. **When refactoring:**

   - Search for ALL references before deleting: `grep -r "functionName"`
   - If you remove a function, make sure nothing calls it
   - Test incrementally, don't remove everything at once

4. **Next.js 15 architecture is correct:**
   - ✅ Client components CAN call Server Actions
   - ✅ localStorage management stays client-side
   - ✅ Sensitive API calls (VAPI) go through Server Actions
   - ✅ No need for API routes when Server Actions work

## Before/After Comparison

### Before (Broken):

```typescript
// ❌ Competing state patterns
const [config, setConfig] = useState(null);
const { getConfig, updateConfig } = useAgentConfig();

useEffect(() => {
  const loaded = getConfig(id); // getConfig doesn't exist!
  setConfig(loaded);
}, [id, getConfig]);

// ❌ Confusing loading check
if (configsLoading || config === null)
  // undefined !== null

  // ❌ Calls to non-existent function
  setConfig({ ...config, name: value });
```

### After (Fixed):

```typescript
// ✅ Single source of truth
const { configs, updateConfig, loading: configsLoading } = useAgentConfig();
const config = configs.find((c) => c.id === id);

// ✅ Clear loading states
if (configsLoading) return <Spinner />;
if (!config) return <NotFound />;

// ✅ Wrapper for updates
const handleUpdateConfig = (updates) => {
  updateConfig(id, { ...config, ...updates, syncStatus: 'draft' });
};

// ✅ Consistent pattern everywhere
handleUpdateConfig({ name: value });
```

## Technical Details

**Files Changed:**

- `src/app/agent-builder/[id]/page.tsx` - Main fix (14 replacements)

**Error Pattern:**

- Build error: `Cannot find name 'setConfig'`
- Runtime error: "Agent not found" (loading state bug)
- Runtime error: Infinite spinner (premature rendering)

**Commands Used:**

```bash
# Find all references
grep -n "setConfig" src/app/agent-builder/[id]/page.tsx

# Verify build
pnpm build

# Check for similar issues
grep -r "useState.*config" src/app/agent-builder/
```

## Actionable Takeaways

**For Future Development:**

1. **Before removing state management:**

   - Search: `grep -r "setState\|setMyVar" .`
   - Verify nothing else depends on it
   - Consider gradual migration

2. **Loading pattern checklist:**

   ```typescript
   // 1. Check loading first
   if (isLoading) return <LoadingState />;

   // 2. Then check if data exists
   if (!data) return <EmptyState />;

   // 3. Then render with data
   return <ActualComponent data={data} />;
   ```

3. **When using hooks for data:**

   - Don't duplicate with local state
   - Trust the hook's reactivity
   - Use derived values: `const item = items.find(...)`

4. **Server Actions are the right choice when:**
   - Need to call external APIs with secrets
   - Want to avoid CORS issues
   - Following Next.js 15 best practices
   - Don't need streaming responses

## Status: ✅ RESOLVED

The Agent Builder now:

- ✅ Loads correctly without infinite spinners
- ✅ Shows proper "not found" state
- ✅ Updates work consistently across all inputs
- ✅ Builds without TypeScript errors
- ✅ Follows Next.js 15 patterns correctly
