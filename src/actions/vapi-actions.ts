'use server'

/**
 * VAPI Server Actions for PeteRental
 * Next.js 15.4 best practice - all webhook calls server-side
 */

import type { VAPIWebhookRequest, VAPIWebhookResponse } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set')
}

/**
 * Call VAPI webhook with any function
 */
async function callVAPIWebhook(
  functionName: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    const request: VAPIWebhookRequest = {
      message: {
        toolCalls: [
          {
            id: `${functionName}_${Date.now()}`,
            function: {
              name: functionName,
              arguments: args,
            },
          },
        ],
      },
    }

    const response = await fetch(`${API_URL}/vapi/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`VAPI webhook failed: ${response.statusText} - ${errorText}`)
    }

    const data: VAPIWebhookResponse = await response.json()
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No results returned from VAPI webhook')
    }

    return data.results[0].result
  } catch (error) {
    console.error('[Server Action] callVAPIWebhook error:', error)
    throw error
  }
}

/**
 * Get availability via VAPI
 */
export async function vapiGetAvailability(
  userId: string,
  daysAhead: number = 7
): Promise<string> {
  return callVAPIWebhook('get_availability', {
    user_id: userId,
    days_ahead: daysAhead,
  })
}

/**
 * Set appointment via VAPI
 */
export async function vapiSetAppointment(
  userId: string,
  propertyAddress: string,
  startTime: string,
  attendeeName: string,
  attendeeEmail: string,
  timezone: string = 'America/Chicago'
): Promise<string> {
  return callVAPIWebhook('set_appointment', {
    user_id: userId,
    property_address: propertyAddress,
    start_time: startTime,
    attendee_name: attendeeName,
    attendee_email: attendeeEmail,
    timezone: timezone,
  })
}

/**
 * Search rentals via VAPI
 */
export async function vapiSearchRentals(
  location: string,
  priceRange?: string
): Promise<string> {
  return callVAPIWebhook('search_rentals', {
    location,
    price_range: priceRange,
  })
}

/**
 * Get backend health status
 */
export async function getBackendHealth(): Promise<{
  service: string
  version: string
  status: string
  features: string[]
  links: Record<string, string>
}> {
  try {
    const response = await fetch(`${API_URL}/`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Backend health check failed')
    }

    return response.json()
  } catch (error) {
    console.error('[Server Action] getBackendHealth error:', error)
    throw error
  }
}

/**
 * Test all VAPI functions
 */
export async function testAllVAPIFunctions(userId: string): Promise<{
  results: Array<{
    function: string
    success: boolean
    result?: string
    error?: string
    duration: number
  }>
}> {
  const results: Array<{
    function: string
    success: boolean
    result?: string
    error?: string
    duration: number
  }> = []

  // Test get_availability
  const startGetAvail = Date.now()
  try {
    const result = await vapiGetAvailability(userId, 3)
    results.push({
      function: 'get_availability',
      success: true,
      result,
      duration: Date.now() - startGetAvail,
    })
  } catch (error) {
    results.push({
      function: 'get_availability',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startGetAvail,
    })
  }

  // Test search_rentals
  const startSearch = Date.now()
  try {
    const result = await vapiSearchRentals('Austin, TX', '1000-2000')
    results.push({
      function: 'search_rentals',
      success: true,
      result,
      duration: Date.now() - startSearch,
    })
  } catch (error) {
    results.push({
      function: 'search_rentals',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startSearch,
    })
  }

  return { results }
}

