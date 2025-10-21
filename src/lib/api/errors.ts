// API Error Handling

import type { APIError as APIErrorType } from '@/types'

export class APIError extends Error implements APIErrorType {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'APIError'
    
    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError)
    }
  }
}

/**
 * Handle API response and throw appropriate errors
 */
export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    
    // Handle different HTTP status codes
    switch (response.status) {
      case 401:
        throw new APIError(
          401,
          data.message || 'Please connect your calendar first',
          data
        )
      
      case 403:
        throw new APIError(
          403,
          data.message || 'Access forbidden',
          data
        )
      
      case 404:
        throw new APIError(
          404,
          data.message || 'Resource not found',
          data
        )
      
      case 429:
        throw new APIError(
          429,
          data.message || 'Too many requests, please try again later',
          data
        )
      
      case 500:
      case 502:
      case 503:
        throw new APIError(
          response.status,
          data.message || 'Server error, please try again',
          data
        )
      
      default:
        throw new APIError(
          response.status,
          data.message || `Request failed with status ${response.status}`,
          data
        )
    }
  }
  
  return response.json()
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on client errors (4xx)
      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        throw error
      }
      
      // Don't retry if this was the last attempt
      if (attempt === maxRetries) {
        throw error
      }
      
      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt)
      
      console.warn(
        `API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`,
        error
      )
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Check if error is an APIError
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  if (isAPIError(error)) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

