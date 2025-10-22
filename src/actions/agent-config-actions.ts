/**
 * Server Actions for Agent Configuration
 */

'use server'

import type { AgentConfig, AgentVariable, AgentFunction } from '@/types/agent-config'
import { syncAgentToVAPI, getVAPIAssistant, deleteVAPIAssistant } from '@/lib/api/vapi-config'

/**
 * Sync agent configuration to VAPI
 */
export async function syncAgent(agentConfig: AgentConfig) {
  try {
    const result = await syncAgentToVAPI(agentConfig)
    return result
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get assistant from VAPI
 */
export async function fetchVAPIAssistant(assistantId: string) {
  try {
    const assistant = await getVAPIAssistant(assistantId)
    return { success: true, data: assistant }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Import existing VAPI assistant into agent builder
 */
export async function importVAPIAssistant(assistantId: string, userId: string) {
  try {
    const result = await fetchVAPIAssistant(assistantId)
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch assistant',
      }
    }
    
    // Type the VAPI assistant response
    interface VAPIFunctionParameter {
      type?: string
      description?: string
      enum?: string[]
      default?: string | number | boolean
    }
    
    interface VAPIAssistantResponse {
      id: string
      name?: string
      firstMessage?: string
      voice?: { voiceId?: string }
      model?: { model?: string; messages?: Array<{ content?: string }> }
      functions?: Array<{ 
        name: string
        description?: string
        parameters?: {
          properties: Record<string, VAPIFunctionParameter>
          required: string[]
        }
      }>
    }
    
    const assistant = result.data as VAPIAssistantResponse
    
    // Extract variables from function parameters
    const variablesMap = new Map<string, AgentVariable>()
    const functionsWithVarIds: AgentFunction[] = []

    // Process each function and its parameters
    ;(assistant.functions || []).forEach((fn, fnIndex) => {
      const functionVarIds: string[] = []
      
      if (fn.parameters?.properties) {
        Object.entries(fn.parameters.properties).forEach(([paramName, paramDef]) => {
          // Skip user_id as it's automatically added
          if (paramName === 'user_id') return
          
          // Create or get variable
          if (!variablesMap.has(paramName)) {
            const varId = `var_${Date.now()}_${Math.random()}`
            variablesMap.set(paramName, {
              id: varId,
              name: paramName,
              displayName: paramName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              type: paramDef.type === 'number' ? 'number' : 
                    paramDef.type === 'boolean' ? 'boolean' : 'string',
              description: paramDef.description || `Parameter: ${paramName}`,
              required: fn.parameters.required?.includes(paramName) || false,
              extractionPrompt: paramDef.description ? `What is the ${paramName.replace(/_/g, ' ')}?` : undefined,
            })
          }
          
          functionVarIds.push(variablesMap.get(paramName)!.id)
        })
      }
      
      functionsWithVarIds.push({
        id: `func_${Date.now()}_${fnIndex}_${Math.random()}`,
        name: fn.name,
        displayName: fn.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description: fn.description || '',
        variables: functionVarIds,
        enabled: true,
      })
    })

    // Parse VAPI assistant into our format
    const agentConfig: Omit<AgentConfig, 'id'> = {
      name: assistant.name || 'Imported Agent',
      description: 'Imported from VAPI',
      userId: userId,
      vapiAssistantId: assistantId,
      voice: assistant.voice?.voiceId || 'jennifer',
      model: assistant.model?.model || 'gpt-4',
      systemPrompt: assistant.model?.messages?.[0]?.content || '',
      firstMessage: assistant.firstMessage || 'Hi! How can I help?',
      variables: Array.from(variablesMap.values()),
      functions: functionsWithVarIds,
      syncStatus: 'synced' as const,
      lastSyncedAt: new Date().toISOString(),
    }
    
    return {
      success: true,
      config: agentConfig,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * List all VAPI assistants
 */
export async function listVAPIAssistants() {
  try {
    const response = await fetch('https://api.vapi.ai/assistant', {
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch assistants: ${response.statusText}`)
    }
    
    const assistants = await response.json()
    return {
      success: true,
      assistants: assistants || [],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      assistants: [],
    }
  }
}

/**
 * Delete assistant from VAPI
 */
export async function deleteAgent(assistantId: string) {
  try {
    await deleteVAPIAssistant(assistantId)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Test agent configuration by generating function config
 */
export async function previewAgentConfig(agentConfig: AgentConfig) {
  try {
    const { generateVAPIFunctionConfig, generateSystemPrompt } = await import('@/lib/api/vapi-config')
    
    const functions = generateVAPIFunctionConfig(agentConfig)
    const systemPrompt = generateSystemPrompt(agentConfig)
    
    return {
      success: true,
      functions,
      systemPrompt,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
