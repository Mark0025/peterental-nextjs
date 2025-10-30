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

    const agents = await response.json()
    console.log(`✅ Fetched ${agents.length} agents from backend`)
    return agents
  } catch (error) {
    console.error('[Server Action] getAgents error:', error)
    throw error
  }
}

/**
 * Fetch a single agent by ID
 * Uses GET /agents/{agent_id} if available, otherwise filters list
 */
export async function getAgentById(agentId: number): Promise<BackendAgent | null> {
  try {
    const headers = await getAuthHeaders()
    
    // Try specific endpoint first
    const response = await fetch(`${API_URL}/agents/${agentId}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (response.ok) {
      const agent = await response.json()
      console.log(`✅ Fetched agent ${agentId} from backend`)
      return agent
    }

    // Fallback to filtering list
    console.log(`⚠️ GET /agents/${agentId} not available, filtering list`)
    const agents = await getAgents()
    const agent = agents.find(a => a.agent_id === agentId)
    return agent || null
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
