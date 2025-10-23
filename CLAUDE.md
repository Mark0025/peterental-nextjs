# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PeteRental NextJS is a voice AI-powered rental property management system with Microsoft Calendar integration. It connects a Next.js 15 frontend with a Python FastAPI backend for VAPI voice agent functionality.

**Architecture:**
- **Frontend**: Next.js 15 (App Router) + TypeScript + shadcn/ui + Clerk Auth
- **Backend**: Python FastAPI (separate repo)
- **Voice AI**: VAPI integration with custom assistants
- **Calendar**: Microsoft Calendar OAuth integration
- **State Management**: React Context (UserProvider) + Server Actions
- **Deployment**: Vercel (frontend), Render (backend)

## Development Commands

```bash
# Start development server (Turbopack enabled, port 3000)
pnpm dev

# Build for production (with Turbopack)
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate test coverage report
pnpm test:coverage
```

## Environment Variables

Required environment variables (see `.env.example` and `.env.local`):

**Backend API:**
- `NEXT_PUBLIC_API_URL` - Backend API URL (http://localhost:8000 for dev, https://peterentalvapi-latest.onrender.com for prod)

**VAPI Configuration:**
- `NEXT_PUBLIC_VAPI_PUBLIC_KEY` - VAPI public key for voice agent

**Clerk Authentication:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key (server-side only)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - Sign-in URL (default: /sign-in)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - Sign-up URL (default: /sign-up)

**Clerk Webhook (CRITICAL - Required for user sync):**
- `CLERK_WEBHOOK_SECRET` - Secret for validating Clerk webhooks (starts with `whsec_`)
- **Without this, new user sign-ups won't create database records!**
- See `CLERK_WEBHOOK_SETUP.md` for complete configuration guide

## API Client Architecture

**IMPORTANT: Use Server Actions for API calls** (Next.js 15 best practice):
- All API calls should use Server Actions (`src/actions/`)
- Server Actions marked with `'use server'` directive
- Bypasses CORS issues and keeps API keys server-side
- Client components call server actions directly

**API Client Structure** (`src/lib/api/`):
- `client.ts` - Main `APIClient` class with sub-clients (calendar, vapi, rentals)
- `calendar.ts` - Calendar-specific API methods
- `vapi.ts` - VAPI assistant and configuration methods
- `rentals.ts` - Rental property data methods
- `errors.ts` - Error handling and retry logic
- `api-client.ts` - Legacy re-export (for backwards compatibility)

**Server Actions Pattern** (`src/actions/`):
- `calendar-actions.ts` - Calendar operations
- `vapi-actions.ts` - VAPI assistant management
- `rental-actions.ts` - Rental data fetching
- `agent-config-actions.ts` - Agent builder configuration

**When adding new API endpoints:**
1. Add TypeScript interface to appropriate file in `src/types/`
2. Add method to appropriate API client class in `src/lib/api/`
3. Create server action in `src/actions/` that calls the API client
4. Import and call server action from client components

## VAPI Voice Agent System

**Key Concept**: The VAPI agent system dynamically loads assistants from the backend and supports both voice and text modes.

**Implementation** (`src/app/vapi-agent/page.tsx`):
- Assistants are loaded from `/vapi/assistants` endpoint on mount
- VAPI SDK initialized with `NEXT_PUBLIC_VAPI_PUBLIC_KEY`
- Calls start with `assistantId` object format: `vapi.start({ assistantId: selectedAssistant })`
- Real-time event handling for transcripts, function calls, and speech detection
- Dev logs panel for debugging VAPI messages and function calls

**VAPI Event Types to Handle:**
- `call-start` / `call-end` - Connection lifecycle
- `speech-start` / `speech-end` - AI speaking state
- `message` with `type: "transcript"` - User/AI dialogue
- `message` with `type: "function-call"` - Function invocations
- `message` with `type: "function-call-result"` - Function responses

**Function Call Detection:**
When VAPI calls calendar functions (`get_availability`, `set_appointment`), the system detects Microsoft Calendar access and logs it to dev panel.

## Authentication System

**Clerk Authentication** (see `CLERK_SETUP_GUIDE.md`):
- All routes protected by Clerk middleware (`middleware.ts`)
- `clerkMiddleware()` handles auth state server-side
- User authentication required before accessing app features
- Webhook integration syncs Clerk users to backend database

**User Auto-Creation Pattern** (IMPORTANT):
- When a user logs in, frontend calls `/api/users/current` which fetches user from backend
- Backend endpoint `/users/me` auto-creates users if they don't exist in database
- Uses Clerk JWT token for authentication (not CLERK_SECRET_KEY)
- New users get full_name auto-computed from first_name + last_name
- This ensures seamless onboarding without manual user creation
- See `USER_CREATION_FLOW_ANALYSIS.md` for complete flow documentation

**User Context Provider** (`src/components/providers/user-provider.tsx`):
- Client-side user state management
- Tracks calendar connection status
- Multi-user support with localStorage
- Auto-checks auth status every 5 minutes

**Using the User Context:**
```typescript
import { useUser } from '@/lib/hooks/use-user'

function MyComponent() {
  const { userId, email, calendarConnected, isLoading } = useUser()
  // ...
}
```

## Microsoft Calendar Integration

**User Flow:**
1. User signs in with Clerk
2. User connects calendar via backend OAuth flow
3. Calendar connection status tracked in `UserProvider`
4. Backend handles token refresh automatically

**Calendar Server Actions** (`src/actions/calendar-actions.ts`):
- `checkCalendarAuth(userId)` - Check if user has connected calendar
- `getCalendarEvents(userId)` - Fetch user's calendar events
- `getAvailability(userId, daysAhead)` - Get available time slots

**Important**: Always check `calendarConnected` from `useUser()` before calling calendar functions. Not all users have connected calendars.

## Page Structure

All pages use Next.js App Router (`src/app/`):

- `/` - Home page with system status and quick links
- `/dashboard` - Rental property listings and stats
- `/calendar` - Display user's calendar events
- `/agent-builder` - Visual agent configuration builder with variable management
- `/vapi-testing` - VAPI webhook testing and configuration tools
- `/vapi-agent` - Voice agent testing interface with real-time conversation
- `/test-suite` - Frontend integration test suite
- `/api-endpoints` - API documentation
- `/whats-working` - System health/feature status

## Component Patterns

**shadcn/ui Components** (`src/components/ui/`):
- Pre-built components from shadcn/ui
- Never modify these directly - they're meant to be copied/extended
- Use composition pattern to customize

**Feature Components** (`src/components/features/`):
- Organized by feature domain (auth, agent-builder, etc.)
- `auth/` - Authentication UI components (user selector, calendar connect button)
- `agent-builder/` - Agent configuration UI components

**Dashboard Components** (`src/components/dashboard/`):
- `status-cards.tsx` - Rental statistics display
- `rental-table.tsx` - Property listing table

**Providers** (`src/components/providers/`):
- `user-provider.tsx` - User state and calendar connection management
- Wrapped in `src/app/providers.tsx` for client-side context

**Navigation** (`src/components/navigation.tsx`):
- Global nav bar with active route highlighting
- Integrates Clerk authentication UI

## Styling

- **Tailwind CSS v4** with `@tailwindcss/postcss`
- Global styles in `src/app/globals.css`
- Gradient backgrounds: `from-blue-50 via-white to-blue-100` pattern
- Color scheme: Blue/purple gradients for primary actions
- Use `text-muted-foreground` for secondary text

## TypeScript Configuration

- Path alias: `@/*` maps to `./src/*`
- Strict mode enabled
- Target: ES2017
- Use `export interface` for all type definitions

**Type Organization:**
- `src/types/index.ts` - Main type exports and legacy types
- `src/types/api.ts` - API response types
- `src/types/calendar.ts` - Calendar-specific types
- `src/types/rental.ts` - Rental property types
- `src/types/user.ts` - User and auth types
- `src/types/vapi.ts` - VAPI assistant types
- `src/types/agent-config.ts` - Agent builder configuration types

## Testing

**Jest Configuration:**
- Test environment: jsdom
- Setup file: `jest.setup.js`
- Path alias support: `@/` resolves to `src/`

**Running Tests:**
```bash
pnpm test              # Run all tests once
pnpm test:watch        # Run in watch mode
pnpm test:coverage     # Generate coverage report
```

**Test Location:**
- Unit tests: `src/**/__tests__/**/*.test.ts(x)`
- Integration tests: `src/**/*.test.ts(x)`

## Deployment

**Automated via GitHub Actions** (`.github/workflows/vercel-deploy.yml`):
- Triggers on push to `main` branch
- Builds with Turbopack
- Deploys to Vercel production

**Required GitHub Secrets:**
- `VERCEL_TOKEN` - Vercel authentication token

**See DEPLOYMENT.md** for complete setup instructions and troubleshooting.

## Backend Integration

**Backend Repository**: Separate Python FastAPI project
- Production URL: https://peterentalvapi-latest.onrender.com
- Local dev: http://localhost:8000

**CORS**: Backend must allow frontend domain in CORS settings

**Webhook Configuration**:
Backend exposes `/vapi/webhook` for VAPI function calls. Configure in VAPI dashboard with function definitions found in `/vapi-testing` page.

## Common Development Patterns

**Client Components**: All interactive pages use `"use client"` directive (required for useState, useEffect, etc.)

**Data Fetching Pattern:**
```typescript
'use client'
import { useState, useEffect } from 'react'
import { getAvailableRentals } from '@/actions/rental-actions'

export default function MyPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getAvailableRentals()
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  return <div>{/* render data */}</div>
}
```

**Local Storage Keys** (defined in `user-provider.tsx`):
- `peterental_current_user` - Current user ID/email
- `peterental_available_users` - Array of known users
- `peterental_last_auth_check` - Timestamp of last auth check

**Configuration Files:**
- `src/config/api.ts` - API endpoints and configuration
- `src/config/site.ts` - Site metadata and navigation

## Testing VAPI Integration

1. Navigate to `/vapi-testing` for webhook testing
2. Enter user email (must be authenticated)
3. Test auth status and availability endpoints
4. Copy webhook URL and function definitions for VAPI dashboard
5. Navigate to `/vapi-agent` for voice/text conversation testing
6. Select assistant, choose mode (voice/text), start call
7. Monitor conversation log and dev logs panel

## Agent Builder System

**Visual Agent Configuration** (`/agent-builder` page):
- Create and manage VAPI agent configurations per user
- Define variables that can be used in system prompts
- Configure voice settings, models, and first messages
- Import existing VAPI assistants
- Sync status tracking (draft/synced/error)

**Agent Configuration Hooks** (`src/lib/hooks/use-agent-config.ts`):
- `useAgentConfig()` - Manage agent configurations for current user
- CRUD operations for agent configs
- Automatic user association via Clerk auth

**Server Actions** (`src/actions/agent-config-actions.ts`):
- `getAgentConfigs(userId)` - Fetch user's agent configs
- `createAgentConfig(userId, config)` - Create new config
- `updateAgentConfig(userId, configId, updates)` - Update existing config
- `deleteAgentConfig(userId, configId)` - Delete config

## Known Technical Patterns

**Dynamic Assistant Loading**: Assistants are fetched from backend on mount rather than hardcoded. This allows backend to manage VAPI assistant configurations.

**Server Actions for CORS**: Server actions bypass browser CORS restrictions by making API calls server-side. Always use server actions instead of direct `fetch()` calls from client components.

**User Context Pattern**: The `UserProvider` maintains auth state and calendar connection status. Check `useUser()` hook before operations requiring calendar access.

**Dev Logs**: The voice agent page includes a dedicated dev logs panel for debugging VAPI events and function calls - useful for troubleshooting integration issues.

## Important Gotchas

1. **Server Actions Required**: Always use server actions (`src/actions/`) for API calls - direct fetch from client causes CORS errors
2. **VAPI Start Format**: Must use `{ assistantId: string }` object format, not just the ID string
3. **Environment Variables**: All `NEXT_PUBLIC_*` vars must be set at build time - restart dev server after changes
4. **Clerk Webhook**: User sync requires webhook configured in Clerk dashboard pointing to `/api/webhooks/clerk`
5. **Calendar Auth Check**: Always check `calendarConnected` from `useUser()` before calendar operations
6. **Turbopack**: Project uses `--turbopack` flag - faster dev builds but some plugins may not work
7. **API Client Import**: Import from `@/lib/api/client` not `@/lib/api-client` (legacy re-export exists for compatibility)
