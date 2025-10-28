# E2E Testing with Playwright

Comprehensive end-to-end tests for PeteRental NextJS application.

## Test Coverage

### 01-authentication.spec.ts
- ✅ Sign in with valid credentials
- ✅ Access protected routes when authenticated
- ✅ Sign out successfully
- ✅ Redirect to sign-in for protected routes
- ✅ Session persistence across page reloads
- ✅ Display correct user email in navigation

### 02-user-profile-calendar.spec.ts
- ✅ Display user profile page with correct email
- ✅ Show calendar connection status
- ✅ Display connected Microsoft account email
- ✅ Show disconnect button when calendar is connected
- ✅ Show connect button when calendar is not connected
- ✅ Open confirmation dialog when clicking disconnect
- ✅ Display user profile information sections
- ✅ Load without errors

### 03-dashboard-rentals.spec.ts
- ✅ Load dashboard page
- ✅ Display rental statistics
- ✅ Display rental property listings
- ✅ Show loading state while fetching data
- ✅ Display property details when available
- ✅ Handle empty state if no rentals
- ✅ Navigate back to home from dashboard
- ✅ Load without console errors

### 04-multi-tenant.spec.ts
- ✅ Display correct user email in profile
- ✅ Not show admin badge for non-admin users
- ✅ Use Clerk authentication for all requests
- ✅ No hardcoded user IDs in console logs
- ✅ Show user-specific calendar connection
- ✅ Handle multiple sessions correctly
- ✅ Display correct data after page refresh

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Test Environment

Edit `.env.test` (already created, gitignored):

```bash
TEST_USER_EMAIL=mark@localhousebuyers.net
TEST_USER_PASSWORD=your-password-here
TEST_BASE_URL=http://localhost:3000
TEST_API_URL=https://peterentalvapi-latest.onrender.com
```

### 3. Install Playwright Browsers

```bash
pnpx playwright install chromium
```

## Running Tests

### Run all E2E tests
```bash
pnpm test:e2e
```

### Run tests with UI mode (recommended for development)
```bash
pnpm test:e2e:ui
```

### Run tests in debug mode
```bash
pnpm test:e2e:debug
```

### Run specific test file
```bash
pnpx playwright test tests/e2e/01-authentication.spec.ts
```

### Run tests in headed mode (see browser)
```bash
pnpx playwright test --headed
```

### View test report
```bash
pnpm test:e2e:report
```

## Test Best Practices

### 1. Sequential Execution
Tests run sequentially (not in parallel) to avoid state conflicts with Clerk authentication.

### 2. Test User
All tests use the same test user (`mark@localhousebuyers.net`) for consistency.

### 3. Cleanup
Tests automatically clean up after themselves. No manual cleanup needed.

### 4. Retries
Tests automatically retry once in CI environments if they fail.

### 5. Screenshots & Videos
- Screenshots captured on failure
- Videos recorded only on failure
- Traces captured on first retry

## Debugging Failed Tests

### View Screenshots
After test failure, screenshots are saved to:
```
test-results/
```

### View Trace
```bash
pnpx playwright show-trace test-results/[test-name]/trace.zip
```

### Run Single Test in Debug Mode
```bash
pnpx playwright test tests/e2e/01-authentication.spec.ts --debug
```

## CI/CD Integration

Tests can be run in CI with:

```bash
# Set CI environment variable
CI=true pnpm test:e2e
```

This enables:
- 2 retries for flaky tests
- Fails if `test.only` is found
- Generates JSON report

## Security Notes

- ⚠️ **NEVER commit `.env.test` to git** - it contains real credentials
- ✅ `.env.test` is already in `.gitignore`
- ✅ Test credentials are for `mark@localhousebuyers.net` only
- ✅ All requests use Clerk JWT authentication

## Test Structure

```
tests/
└── e2e/
    ├── helpers/
    │   └── auth.ts          # Authentication helper functions
    ├── 01-authentication.spec.ts
    ├── 02-user-profile-calendar.spec.ts
    ├── 03-dashboard-rentals.spec.ts
    ├── 04-multi-tenant.spec.ts
    └── README.md
```

## Coverage Summary

**Total Test Files:** 4
**Total Test Cases:** ~30
**Test User:** mark@localhousebuyers.net
**Target Environment:** Local (http://localhost:3000)

**Features Tested:**
- ✅ Clerk Authentication
- ✅ Protected Routes
- ✅ User Profile
- ✅ Calendar Connect/Disconnect
- ✅ Dashboard & Rentals
- ✅ Multi-Tenant Isolation
- ✅ Error Handling
- ✅ Session Management

## Troubleshooting

### Tests fail with "browser not installed"
```bash
pnpx playwright install chromium
```

### Tests timeout
Increase timeout in `playwright.config.ts`:
```typescript
timeout: 90 * 1000, // 90 seconds
```

### Clerk sign-in fails
1. Check `.env.test` has correct credentials
2. Verify Clerk is configured properly in `.env.local`
3. Check dev server is running on port 3000

### Tests fail in CI
1. Ensure `NEXT_PUBLIC_API_URL` is set correctly
2. Check backend is accessible from CI environment
3. Verify Clerk environment variables are set

## Adding New Tests

1. Create new spec file: `tests/e2e/05-your-feature.spec.ts`
2. Import auth helper: `import { signIn } from './helpers/auth'`
3. Use test user from environment: `process.env.TEST_USER_EMAIL`
4. Follow naming convention: `test.describe('Feature Name', () => { ... })`
5. Run tests to verify: `pnpm test:e2e`

## Performance

**Average test execution time:**
- Authentication: ~15-20 seconds
- User Profile: ~10-15 seconds
- Dashboard: ~10-15 seconds
- Multi-Tenant: ~20-25 seconds

**Total suite execution:** ~60-75 seconds
