# Agent Builder Testing Guide

## Overview

Comprehensive testing strategy for the Visual Agent Builder feature in PeteRental Next.js application.

## Test Infrastructure

### Setup

```bash
# Install dependencies
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest

# Run tests
pnpm test              # Run all tests once
pnpm test:watch        # Watch mode
pnpm test:coverage     # Generate coverage report
```

### Configuration Files

- `jest.config.js` - Jest configuration for Next.js 15.4
- `jest.setup.js` - Setup file for testing library
- `src/__tests__/` - Unit test directory

## Test Categories

### 1. Unit Tests

**Location:** `src/__tests__/agent-config.test.ts`

**Tests:**

- ✅ System prompt generation with user context
- ✅ Variable extraction instructions
- ✅ Function calling rules generation
- ✅ VAPI function configuration generation
- ✅ user_id parameter injection
- ✅ Required variable validation
- ✅ Disabled function handling

**Run:**

```bash
pnpm test src/__tests__/agent-config.test.ts
```

### 2. Integration Tests

**Test Scenarios:**

#### Import Existing Assistant

```typescript
// Test importing assistant 3fe56141-7c5b-4b98-bf4b-f857317f738b
describe('Import VAPI Assistant', () => {
  it('should fetch and parse existing assistant', async () => {
    const result = await importVAPIAssistant(
      '3fe56141-7c5b-4b98-bf4b-f857317f738b',
      'mark@peterei.com'
    );

    expect(result.success).toBe(true);
    expect(result.config).toBeDefined();
    expect(result.config.userId).toBe('mark@peterei.com');
    expect(result.config.vapiAssistantId).toBe(
      '3fe56141-7c5b-4b98-bf4b-f857317f738b'
    );
  });
});
```

#### Sync to VAPI

```typescript
describe('Sync Agent to VAPI', () => {
  it('should create new assistant in VAPI', async () => {
    const config: AgentConfig = {
      // ... config
    };

    const result = await syncAgent(config);
    expect(result.success).toBe(true);
    expect(result.vapiAssistantId).toBeDefined();
  });

  it('should update existing assistant', async () => {
    const config: AgentConfig = {
      vapiAssistantId: '3fe56141-7c5b-4b98-bf4b-f857317f738b',
      // ... other fields
    };

    const result = await syncAgent(config);
    expect(result.success).toBe(true);
  });
});
```

#### Multi-User Configuration

```typescript
describe('Multi-User Agent Configs', () => {
  it('should isolate configs by userId', () => {
    const markConfig = createConfig({
      name: 'Mark Agent',
      userId: 'mark@peterei.com',
      // ...
    });

    const jonConfig = createConfig({
      name: 'Jon Agent',
      userId: 'jon@peterei.com',
      // ...
    });

    // Switch to Mark
    setUserId('mark@peterei.com');
    expect(configs).toContain(markConfig);
    expect(configs).not.toContain(jonConfig);

    // Switch to Jon
    setUserId('jon@peterei.com');
    expect(configs).toContain(jonConfig);
    expect(configs).not.toContain(markConfig);
  });
});
```

### 3. Component Tests

#### Import Dialog Component

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportAssistantDialog } from '@/components/features/agent-builder/import-assistant-dialog';

describe('ImportAssistantDialog', () => {
  it('should render with assistant ID input', () => {
    render(<ImportAssistantDialog onClose={jest.fn()} />);
    expect(screen.getByPlaceholderText(/3fe56141/)).toBeInTheDocument();
  });

  it('should load assistants list', async () => {
    render(<ImportAssistantDialog onClose={jest.fn()} />);

    const loadButton = screen.getByText('Load Assistants');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText(/Property Seller Agent/)).toBeInTheDocument();
    });
  });

  it('should import selected assistant', async () => {
    const onClose = jest.fn();
    render(<ImportAssistantDialog onClose={onClose} />);

    const input = screen.getByPlaceholderText(/3fe56141/);
    fireEvent.change(input, {
      target: { value: '3fe56141-7c5b-4b98-bf4b-f857317f738b' },
    });

    const importButton = screen.getByText('Import');
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
```

#### Agent Builder Page

```typescript
describe('Agent Builder Page', () => {
  it('should show create and import buttons', () => {
    render(<AgentBuilderPage />);
    expect(screen.getByText('Create New Agent')).toBeInTheDocument();
    expect(screen.getByText('Import from VAPI')).toBeInTheDocument();
  });

  it('should open import dialog when clicked', () => {
    render(<AgentBuilderPage />);

    const importButton = screen.getByText('Import from VAPI');
    fireEvent.click(importButton);

    expect(
      screen.getByText('Import Existing VAPI Assistant')
    ).toBeInTheDocument();
  });
});
```

### 4. End-to-End Tests

**Manual Testing Checklist:**

#### ✅ Import Existing Assistant

1. Navigate to `/agent-builder`
2. Click "Import from VAPI"
3. Enter assistant ID: `3fe56141-7c5b-4b98-bf4b-f857317f738b`
4. Click "Import"
5. Verify:
   - Success message appears
   - Agent appears in list
   - Agent name, voice, and model are correct
   - Prompt is editable

#### ✅ Edit Imported Agent

1. Click "Configure" on imported agent
2. Verify existing settings are loaded
3. Edit system prompt
4. Add new variable:
   - Name: `customer_email`
   - Display: "Customer Email"
   - Type: email
   - Required: Yes
5. Add to function: `set_appointment`
6. Click "Preview VAPI Config"
7. Verify prompt includes new variable
8. Verify function includes `customer_email` parameter

#### ✅ Sync to VAPI

1. Edit agent configuration
2. Click "Sync to VAPI"
3. Verify:
   - "Syncing..." indicator shows
   - Success message appears
   - Status badge shows "Synced"
   - `lastSyncedAt` timestamp updates

#### ✅ Multi-User Isolation

1. Set user to `mark@peterei.com`
2. Create agent "Mark's Agent"
3. Change user to `jon@peterei.com`
4. Verify "Mark's Agent" is NOT visible
5. Create agent "Jon's Agent"
6. Change back to Mark
7. Verify only "Mark's Agent" is visible

#### ✅ Variable Assignment

1. Create new agent
2. Add 3 variables (address, email, phone)
3. Add function `book_viewing`
4. Click variables to assign to function
5. Verify visual feedback (color change)
6. Preview config
7. Verify function only includes selected variables

### 5. Backend Integration Tests

**Test VAPI API Integration:**

```bash
# Test fetching assistant
curl -X GET https://api.vapi.ai/assistant/3fe56141-7c5b-4b98-bf4b-f857317f738b \
  -H "Authorization: Bearer $VAPI_API_KEY"

# Test creating assistant
curl -X POST https://api.vapi.ai/assistant \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "model": {
      "provider": "openai",
      "model": "gpt-4",
      "messages": [{"role": "system", "content": "You are helpful."}]
    }
  }'

# Test updating assistant
curl -X PATCH https://api.vapi.ai/assistant/3fe56141-7c5b-4b98-bf4b-f857317f738b \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "firstMessage": "Hello! Updated message."
  }'
```

## Test Coverage Goals

- **Unit Tests:** 90%+ coverage for `vapi-config.ts`
- **Integration Tests:** All server actions tested
- **Component Tests:** All interactive components tested
- **E2E Tests:** Critical user flows verified

## Continuous Testing

### Pre-Commit Checks

```bash
#!/bin/bash
# .husky/pre-commit

echo "Running tests..."
pnpm test

echo "Running linter..."
pnpm lint

echo "Running build..."
pnpm build
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Install dependencies
        run: pnpm install
      - name: Run tests
        run: pnpm test
      - name: Run build
        run: pnpm build
```

## Known Issues & Gotchas

### 1. VAPI API Key

- Must be private key (not public key)
- Set in `.env.local` as `VAPI_API_KEY`
- Server-side only, not exposed to client

### 2. localStorage Persistence

- Agent configs stored in browser
- Cleared on browser clear
- TODO: Migrate to PostgreSQL for production

### 3. VAPI Assistant ID Format

- UUIDs like `3fe56141-7c5b-4b98-bf4b-f857317f738b`
- Must exist in your VAPI account
- Import validates before saving

### 4. User Context

- Always includes `user_id` in functions
- Backend routes based on user_id
- Calendar OAuth token lookup by user_id

## Performance Benchmarks

### Expected Performance

- Unit tests: < 2 seconds
- Integration tests: < 10 seconds
- Full test suite: < 30 seconds
- Build time: < 60 seconds

### Current Performance

```
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Time:        1.84 s
```

## Debugging Failed Tests

### Test fails with "VAPI_API_KEY not set"

```bash
# Add to .env.local or .env.test
VAPI_API_KEY=your_private_key_here
```

### Test fails with "Module not found"

```bash
# Clear Jest cache
pnpm jest --clearCache

# Rebuild
pnpm build
```

### Test fails with network errors

```bash
# Check VAPI API status
curl https://api.vapi.ai/health

# Verify API key is valid
echo $VAPI_API_KEY
```

## Next Steps

1. ✅ Set up Jest infrastructure
2. ✅ Create unit tests for core functions
3. 🔄 Add integration tests for server actions
4. 🔄 Add component tests for UI
5. 🔄 Set up E2E testing with Playwright
6. 🔄 Add performance tests
7. 🔄 Set up CI/CD pipeline

## Resources

- [Next.js Testing Docs](https://nextjs.org/docs/app/building-your-application/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [VAPI API Docs](https://docs.vapi.ai/)
