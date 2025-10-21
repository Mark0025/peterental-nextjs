// VAPI API Methods

import type {
  VAPIAssistant,
  VAPIWebhookRequest,
  VAPIWebhookResponse,
  GetAssistantsResponse,
  VAPIToolFunction,
} from '@/types'
import { apiConfig } from '@/config/api'
import { handleAPIResponse } from './errors'

/**
 * VAPI API client
 */
export class VAPIAPI {
  constructor(private baseURL: string) {}
  
  /**
   * Get list of VAPI assistants
   */
  async getAssistants(): Promise<VAPIAssistant[]> {
    const response = await fetch(
      `${this.baseURL}${apiConfig.endpoints.vapiAssistants}`,
      {
        headers: apiConfig.defaultHeaders,
        next: { revalidate: apiConfig.cache.availability }, // Cache for 5 minutes
      }
    )
    
    const data = await handleAPIResponse<GetAssistantsResponse>(response)
    return data.assistants || []
  }
  
  /**
   * Test VAPI webhook with a function call
   */
  async testWebhook(
    functionName: VAPIToolFunction,
    args: Record<string, unknown>
  ): Promise<VAPIWebhookResponse> {
    const request: VAPIWebhookRequest = {
      message: {
        toolCalls: [
          {
            id: `test_${Date.now()}`,
            function: {
              name: functionName,
              arguments: args,
            },
          },
        ],
      },
    }
    
    const response = await fetch(
      `${this.baseURL}${apiConfig.endpoints.vapiWebhook}`,
      {
        method: 'POST',
        headers: apiConfig.defaultHeaders,
        body: JSON.stringify(request),
      }
    )
    
    return handleAPIResponse<VAPIWebhookResponse>(response)
  }
  
  /**
   * Test get_availability function
   */
  async testGetAvailability(
    userId: string,
    propertyAddress: string
  ): Promise<string> {
    const response = await this.testWebhook('get_availability', {
      user_id: userId,
      property_address: propertyAddress,
    })
    
    return response.results[0]?.result || 'No response'
  }
  
  /**
   * Test set_appointment function
   */
  async testSetAppointment(params: {
    userId: string
    propertyAddress: string
    startTime: string
    attendeeName: string
    attendeeEmail: string
    attendeePhone?: string
  }): Promise<string> {
    const response = await this.testWebhook('set_appointment', {
      user_id: params.userId,
      property_address: params.propertyAddress,
      start_time: params.startTime,
      attendee_name: params.attendeeName,
      attendee_email: params.attendeeEmail,
      attendee_phone: params.attendeePhone,
    })
    
    return response.results[0]?.result || 'No response'
  }
  
  /**
   * Test search_rentals function
   */
  async testSearchRentals(website?: string): Promise<string> {
    const response = await this.testWebhook('search_rentals', {
      ...(website && { website }),
    })
    
    return response.results[0]?.result || 'No response'
  }
}

