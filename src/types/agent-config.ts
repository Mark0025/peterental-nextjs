/**
 * Agent Configuration Types
 * For visual agent builder
 */

export type VariableType = 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'address' | 'datetime'

export interface AgentVariable {
  id: string
  name: string // e.g., "property_address"
  displayName: string // e.g., "Property Address"
  type: VariableType
  description: string // For the AI to understand when to collect it
  required: boolean
  defaultValue?: string
  validation?: {
    pattern?: string // Regex pattern
    minLength?: number
    maxLength?: number
    options?: string[] // For enum-like values
  }
  extractionPrompt?: string // How AI should ask for this variable
}

export interface AgentFunction {
  id: string
  name: string // e.g., "set_appointment"
  displayName: string // e.g., "Book Appointment"
  description: string // What this function does
  variables: string[] // Array of variable IDs this function uses
  enabled: boolean
}

export interface AgentConfig {
  id: string
  name: string // e.g., "Property Seller Agent"
  description: string
  userId: string // User who owns this agent config (e.g., "mark@peterei.com")
  vapiAssistantId?: string // Synced VAPI assistant ID
  
  // Voice & Model
  voice: string // e.g., "jennifer"
  model: string // e.g., "gpt-4"
  
  // System Prompt
  systemPrompt: string
  firstMessage: string
  
  // Variables this agent can collect
  variables: AgentVariable[]
  
  // Functions this agent can call
  functions: AgentFunction[]
  
  // Sync status
  lastSyncedAt?: string
  syncStatus: 'draft' | 'syncing' | 'synced' | 'error'
  syncError?: string
}

export interface VAPIFunctionParameter {
  type: string
  description: string
  enum?: string[]
  default?: string | number | boolean
}

export interface VAPIFunctionConfig {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, VAPIFunctionParameter>
    required: string[]
  }
  url: string
  method: 'POST'
}

export interface VAPIAssistantUpdate {
  name?: string
  model?: {
    provider: string
    model: string
    messages?: Array<{
      role: 'system' | 'user' | 'assistant'
      content: string
    }>
  }
  voice?: {
    provider: string
    voiceId: string
  }
  firstMessage?: string
  serverUrl?: string
  serverUrlSecret?: string
  functions?: VAPIFunctionConfig[]
}

