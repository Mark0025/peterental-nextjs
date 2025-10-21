// VAPI-specific types for voice integration

import type { VAPIAssistant, VAPIWebhookResponse } from './api'

// VAPI SDK event types
export type VAPIEventType =
  | 'call-start'
  | 'call-end'
  | 'speech-start'
  | 'speech-end'
  | 'message'
  | 'error'
  | 'volume-level'

export interface VAPIMessage {
  type: 'transcript' | 'function-call' | 'hang' | 'conversation-update'
  role?: 'user' | 'assistant' | 'system'
  text?: string
  timestamp?: string
  functionCall?: {
    name: string
    parameters: Record<string, unknown>
  }
}

export interface VAPITranscript {
  text: string
  role: 'user' | 'assistant'
  timestamp: string
  isFinal: boolean
}

export interface VAPICallState {
  active: boolean
  startTime?: string
  endTime?: string
  duration?: number
  error?: string
}

export interface AgentConfig {
  id: string
  name: string
  model: string
  voice: string
  firstMessage: string
  systemPrompt?: string
  tools?: string[]
}

// VAPI Context Type
export interface VAPIContextType {
  // VAPI instance
  vapi: unknown | null // Vapi instance from @vapi-ai/web
  
  // Call state
  isCallActive: boolean
  currentAgent: VAPIAssistant | null
  callStartTime: string | null
  callDuration: number
  
  // Agents
  agents: VAPIAssistant[]
  agentsLoading: boolean
  agentsError: string | null
  
  // Transcript
  transcript: VAPITranscript[]
  isSpeaking: boolean
  isListening: boolean
  
  // Actions
  selectAgent: (agentId: string) => void
  startCall: () => Promise<void>
  endCall: () => void
  refreshAgents: () => Promise<void>
  clearTranscript: () => void
  
  // Testing
  testWebhook: (functionName: string, args: Record<string, unknown>) => Promise<VAPIWebhookResponse>
}

// VAPI Tool Function Names (from backend)
export type VAPIToolFunction =
  | 'get_availability'
  | 'set_appointment'
  | 'search_rentals'

export interface VAPIToolArguments {
  get_availability: {
    user_id: string
    property_address: string
  }
  set_appointment: {
    user_id: string
    property_address: string
    start_time: string
    attendee_name: string
    attendee_email: string
    attendee_phone?: string
  }
  search_rentals: {
    website?: string
  }
}

// VAPI Error Types
export interface VAPIError {
  code: string
  message: string
  details?: unknown
}

