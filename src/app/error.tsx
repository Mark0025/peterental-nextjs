'use client'

/**
 * Root Error Boundary
 *
 * Catches errors in the entire application (except layout.tsx errors)
 * For layout.tsx errors, you would need global-error.tsx
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

import ErrorBoundary from '@/components/error-boundary'

export default ErrorBoundary
