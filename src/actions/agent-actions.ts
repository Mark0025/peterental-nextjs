'use server'

/**
 * Agent Server Actions for PeteRental
 * Connects to backend /agents API and VAPI dashboard
 */

import { auth } from '@clerk/nextjs/server'
import { apiConfig } from '@/config/api'

const API_URL = apiConfig.baseURL

/**
 * Get authenticated headers with Clerk JWT token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { getToken } = await auth()
  
  // Try custom template first, fallback to default
  let token = await getToken({ template: 'pete-next' })
  if (!token) {
    token = await getToken()
  }

  if (!token) {
    throw new Error('Not authenticated - please sign in')
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Backend Agent structure
 */
export interface BackendAgent {
  agent_id: number
  user_id: number
  vapi_assistant_id: string | null
  agent_name: string
  is_active: boolean
  config?: AgentConfigJSON | null  // VAPI-compatible config
  created_at: string
  updated_at?: string
}

/**
 * VAPI-compatible agent configuration (stored in backend as JSONB)
 */
export interface AgentConfigJSON {
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
  functions?: Array<{
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required: string[]
    }
    url: string
    method: 'POST'
  }>
  variables?: Array<{
    id: string
    name: string
    displayName: string
    type: string
    description: string
    required: boolean
    defaultValue?: string
    validation?: {
      pattern?: string
      minLength?: number
      maxLength?: number
      options?: string[]
    }
    extractionPrompt?: string
  }>
  // Sync metadata
  lastSyncedAt?: string
  syncStatus?: 'draft' | 'syncing' | 'synced' | 'error'
  syncError?: string
}

/**
 * Fetch all agents for the current user from backend
 * GET /agents (backend returns user-scoped agents)
 */
export async function getAgents(): Promise<BackendAgent[]> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_URL}/agents`, {
      method: 'GET',
      headers,
      cache: 'no-store', // Always fetch fresh data
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Server Action] getAgents error:', response.status, errorText)
      throw new Error(`Failed to fetch agents: ${response.status}`)
    }

    const data = await response.json()
    console.log(`✅ Backend response:`, data)
    
    // Handle different response structures
    if (Array.isArray(data)) {
      // Direct array response
      console.log(`✅ Fetched ${data.length} agents from backend (array)`)
      return data
    } else if (data.agents && Array.isArray(data.agents)) {
      // Object with agents array
      console.log(`✅ Fetched ${data.agents.length} agents from backend (object.agents)`)
      return data.agents
    } else {
      console.warn('Unexpected response structure:', data)
      return []
    }
  } catch (error) {
    console.error('[Server Action] getAgents error:', error)
    throw error
  }
}

/**
 * Fetch a single agent by ID
 * GET /agents/{agent_id} - Backend user-scopes this via JWT
 * Note: Backend accepts agent_id as string in URL, converts to int internally
 */
export async function getAgentById(agentId: number | string): Promise<BackendAgent | null> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_URL}/agents/${agentId}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Agent doesn't exist OR user doesn't own it (backend returns 404 for both)
        return null
      }
      const errorText = await response.text()
      console.error('[Server Action] getAgentById error:', response.status, errorText)
      throw new Error(`Failed to fetch agent: ${response.status} ${errorText}`)
    }

    const agent = await response.json()
    console.log(`✅ Fetched agent ${agentId} from backend`)
    return agent
  } catch (error) {
    console.error('[Server Action] getAgentById error:', error)
    throw error
  }
}

/**
 * Create a new agent in the backend
 * POST /agents
 */
export async function createAgent(data: {
  agent_name: string
  vapi_assistant_id?: string
  is_active?: boolean
  config?: AgentConfigJSON
}): Promise<BackendAgent> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_URL}/agents`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Server Action] createAgent error:', response.status, errorText)
      throw new Error(`Failed to create agent: ${response.status}`)
    }

    const agent = await response.json()
    console.log(`✅ Created agent: ${agent.agent_name}`)
    return agent
  } catch (error) {
    console.error('[Server Action] createAgent error:', error)
    throw error
  }
}

/**
 * Update an existing agent
 * PATCH /agents/{agent_id}
 */
export async function updateAgent(
  agentId: number,
  data: {
    agent_name?: string
    vapi_assistant_id?: string
    is_active?: boolean
    config?: AgentConfigJSON
  }
): Promise<BackendAgent> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_URL}/agents/${agentId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Server Action] updateAgent error:', response.status, errorText)
      throw new Error(`Failed to update agent: ${response.status}`)
    }

    const agent = await response.json()
    console.log(`✅ Updated agent: ${agent.agent_name}`)
    return agent
  } catch (error) {
    console.error('[Server Action] updateAgent error:', error)
    throw error
  }
}

/**
 * Delete an agent
 * DELETE /agents/{agent_id}
 */
export async function deleteAgent(agentId: number): Promise<{ success: boolean; message: string }> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_URL}/agents/${agentId}`, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Server Action] deleteAgent error:', response.status, errorText)
      throw new Error(`Failed to delete agent: ${response.status}`)
    }

    console.log(`✅ Deleted agent ID: ${agentId}`)
    return {
      success: true,
      message: 'Agent deleted successfully',
    }
  } catch (error) {
    console.error('[Server Action] deleteAgent error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete agent',
    }
  }
}

/**
 * Fetch agents from VAPI dashboard
 * GET /vapi/assistants
 */
export interface VAPIAssistant {
  id: string // VAPI assistant ID
  name: string
  model: { provider: string; model: string; messages?: Array<{ role: string; content: string }> }
  voice: { provider: string; voiceId: string }
  firstMessage: string
  serverUrl?: string
  createdAt: string
  updatedAt: string
}

export async function getVAPIAssistants(): Promise<VAPIAssistant[]> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_URL}/vapi/assistants`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Server Action] getVAPIAssistants error:', response.status, errorText)
      throw new Error(`Failed to fetch VAPI assistants: ${response.status}`)
    }

    const data = await response.json()
    const assistants = data.assistants || []
    console.log(`✅ Fetched ${assistants.length} VAPI assistants`)
    return assistants
  } catch (error) {
    console.error('[Server Action] getVAPIAssistants error:', error)
    throw error
  }
}

/**
 * Import a VAPI assistant into the backend database
 * This creates a new agent record linked to the VAPI assistant
 */
export async function importVAPIAssistant(vapiAssistantId: string, agentName: string): Promise<BackendAgent> {
  try {
    const agent = await createAgent({
      agent_name: agentName,
      vapi_assistant_id: vapiAssistantId,
      is_active: true,
    })
    console.log(`✅ Imported VAPI assistant ${vapiAssistantId} as agent: ${agentName}`)
    return agent
  } catch (error) {
    console.error('[Server Action] importVAPIAssistant error:', error)
    throw error
  }
}

/* ============================================================
 * AGENT VARIABLES - Backend Storage (NEW!)
 * ============================================================ */

export interface AgentVariable {
  id?: number                  // DB ID (optional for create)
  variable_id: string          // Frontend ID (e.g., "property_type")
  name: string                 // Variable name
  display_name: string         // Display name for UI
  type: string                 // Type: string, number, email, etc.
  description: string          // Description
  required: boolean            // Is required?
  default_value?: string       // Default value
  validation_pattern?: string  // Regex pattern
  extraction_prompt?: string   // How AI should ask
  sort_order?: number          // Sort order
  created_at?: string          // Timestamp
  updated_at?: string          // Timestamp
}

/**
 * Add a variable to an agent
 * POST /agents/{agent_id}/variables
 */
export async function addAgentVariable(
  agentId: number,
  variable: Omit<AgentVariable, 'id' | 'created_at' | 'updated_at'>
): Promise<AgentVariable> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_URL}/agents/${agentId}/variables`, {
      method: 'POST',
      headers,
      body: JSON.stringify(variable),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Server Action] addAgentVariable error:', response.status, errorText)
      throw new Error(`Failed to add variable: ${response.status}`)
    }

    const data = await response.json()
    console.log(`✅ Added variable: ${variable.name} to agent ${agentId}`)
    return data.variable
  } catch (error) {
    console.error('[Server Action] addAgentVariable error:', error)
    throw error
  }
}

/**
 * Get all variables for an agent
 * GET /agents/{agent_id}/variables
 */
export async function getAgentVariables(agentId: number): Promise<AgentVariable[]> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_URL}/agents/${agentId}/variables`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Server Action] getAgentVariables error:', response.status, errorText)
      throw new Error(`Failed to fetch variables: ${response.status}`)
    }

    const data = await response.json()
    console.log(`✅ Fetched ${data.variables?.length || 0} variables for agent ${agentId}`)
    return data.variables || []
  } catch (error) {
    console.error('[Server Action] getAgentVariables error:', error)
    throw error
  }
}

/* ============================================================
 * AGENT FUNCTIONS - Backend Storage (NEW!)
 * ============================================================ */

export interface AgentFunction {
  id?: number                  // DB ID (optional for create)
  function_id: string          // Frontend ID (e.g., "search_properties")
  name: string                 // Function name
  display_name: string         // Display name for UI
  description: string          // Description
  enabled: boolean             // Is enabled?
  webhook_url?: string         // Webhook URL
  method?: string              // HTTP method (POST, GET, etc.)
  sort_order?: number          // Sort order
  created_at?: string          // Timestamp
  updated_at?: string          // Timestamp
}

/**
 * Add a function to an agent
 * POST /agents/{agent_id}/functions
 */
export async function addAgentFunction(
  agentId: number,
  func: Omit<AgentFunction, 'id' | 'created_at' | 'updated_at'>
): Promise<AgentFunction> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_URL}/agents/${agentId}/functions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(func),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Server Action] addAgentFunction error:', response.status, errorText)
      throw new Error(`Failed to add function: ${response.status}`)
    }

    const data = await response.json()
    console.log(`✅ Added function: ${func.name} to agent ${agentId}`)
    return data.function
  } catch (error) {
    console.error('[Server Action] addAgentFunction error:', error)
    throw error
  }
}

/**
 * Get all functions for an agent
 * GET /agents/{agent_id}/functions
 */
export async function getAgentFunctions(agentId: number): Promise<AgentFunction[]> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_URL}/agents/${agentId}/functions`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Server Action] getAgentFunctions error:', response.status, errorText)
      throw new Error(`Failed to fetch functions: ${response.status}`)
    }

    const data = await response.json()
    console.log(`✅ Fetched ${data.functions?.length || 0} functions for agent ${agentId}`)
    return data.functions || []
  } catch (error) {
    console.error('[Server Action] getAgentFunctions error:', error)
    throw error
  }
}
