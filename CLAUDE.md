# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PeteRental NextJS is a voice AI-powered rental property management system with Microsoft Calendar integration. It connects a Next.js 15 frontend with a Python FastAPI backend for VAPI voice agent functionality.

**Architecture:**
- **Frontend**: Next.js 15 (App Router) + TypeScript + shadcn/ui
- **Backend**: Python FastAPI (separate repo)
- **Voice AI**: VAPI integration with custom assistants
- **Calendar**: Microsoft Calendar OAuth integration
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
```

## Environment Variables

Required environment variables (see `.env.example`):

- `NEXT_PUBLIC_API_URL` - Backend API URL (http://localhost:8000 for dev, https://peterentalvapi-latest.onrender.com for prod)
- `NEXT_PUBLIC_VAPI_PUBLIC_KEY` - VAPI public key for voice agent
- `NEXT_PUBLIC_BACKEND_URL` - Alternate backend URL variable (defaults to NEXT_PUBLIC_API_URL)

## API Client Architecture

**Centralized API Client** (`src/lib/api-client.ts`):
- Singleton pattern for consistent backend communication
- All API calls go through `apiClient` instance
- Automatically uses `NEXT_PUBLIC_API_URL` from environment
- All responses use `cache: "no-store"` for fresh data
- TypeScript interfaces in `src/types/index.ts`

**When adding new API endpoints:**
1. Add TypeScript interface to `src/types/index.ts`
2. Add method to `APIClient` class in `src/lib/api-client.ts`
3. Use `this.fetch<T>(endpoint)` pattern for type safety

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

## Microsoft Calendar Integration

**User Flow:**
1. User authenticates via `/users` page (OAuth flow handled by backend)
2. User ID (email) stored in `localStorage` as `calendar_user_id`
3. Frontend passes `user_id` query param to calendar endpoints
4. Backend handles token refresh automatically

**Calendar Endpoints Used:**
- `GET /calendar/availability?user_id={email}&days_ahead=7`
- `GET /calendar/auth/status?user_id={email}`
- Calendar event display on `/calendar` page

**Important**: Always check auth status before calling calendar functions. Not all users have connected calendars.

## Page Structure

All pages use Next.js App Router (`src/app/`):

- `/` - Home page with system status and quick links
- `/dashboard` - Rental property listings and stats
- `/calendar` - Display user's calendar events
- `/users` - User management and calendar OAuth
- `/vapi-testing` - VAPI webhook testing and configuration tools
- `/vapi-agent` - Voice agent testing interface with real-time conversation
- `/api-endpoints` - API documentation
- `/whats-working` - System health/feature status

## Component Patterns

**shadcn/ui Components** (`src/components/ui/`):
- Pre-built components from shadcn/ui
- Never modify these directly - they're meant to be copied/extended
- Use composition pattern to customize

**Dashboard Components** (`src/components/dashboard/`):
- `status-cards.tsx` - Rental statistics display
- `rental-table.tsx` - Property listing table

**Navigation** (`src/components/navigation.tsx`):
- Global nav bar with active route highlighting
- Uses inline styles (convert to Tailwind when refactoring)

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

**Data Fetching**:
- Use `apiClient` for backend calls
- Always handle loading states
- Display user-friendly error messages
- Use `cache: "no-store"` for real-time data

**Local Storage Usage**:
- `calendar_user_id` - Current user's email for calendar operations
- Check localStorage on mount with `useEffect`

**Environment-Aware URLs**:
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
```

## Testing VAPI Integration

1. Navigate to `/vapi-testing` for webhook testing
2. Enter user email (must be authenticated)
3. Test auth status and availability endpoints
4. Copy webhook URL and function definitions for VAPI dashboard
5. Navigate to `/vapi-agent` for voice/text conversation testing
6. Select assistant, choose mode (voice/text), start call
7. Monitor conversation log and dev logs panel

## Known Technical Patterns

**Dynamic Assistant Loading**: Assistants are fetched from backend on mount rather than hardcoded. This allows backend to manage VAPI assistant configurations.

**Cache Busting**: Some pages include cache-busting comments (e.g., `// Force cache bust - v2.0`) when environment configuration changes.

**Dev Logs**: The voice agent page includes a dedicated dev logs panel for debugging VAPI events and function calls - useful for troubleshooting integration issues.

## Important Gotchas

1. **VAPI Start Format**: Must use `{ assistantId: string }` object format, not just the ID string
2. **Environment Variables**: All `NEXT_PUBLIC_*` vars must be set at build time
3. **Calendar Auth**: Users must authenticate via `/users` before calendar functions work
4. **Token Refresh**: Backend handles token refresh automatically, but expired tokens may need re-auth
5. **Turbopack**: Project uses `--turbopack` flag - faster dev builds but some plugins may not work
