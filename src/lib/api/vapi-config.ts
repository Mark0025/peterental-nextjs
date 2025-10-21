/**
 * VAPI Configuration API
 * Updates VAPI assistants programmatically
 */

import type { AgentConfig, VAPIAssistantUpdate, VAPIFunctionConfig, VAPIFunctionParameter } from '@/types/agent-config'

const VAPI_API_URL = 'https://api.vapi.ai'
const VAPI_API_KEY = process.env.VAPI_API_KEY || process.env.NEXT_PUBLIC_VAPI_API_KEY

if (!VAPI_API_KEY) {
  console.warn('VAPI_API_KEY not set - agent sync will not work')
}

/**
 * Generate VAPI function configuration from agent config
 */
export function generateVAPIFunctionConfig(
  agentConfig: AgentConfig
): VAPIFunctionConfig[] {
  const backendWebhookUrl = process.env.NEXT_PUBLIC_API_URL + '/vapi/webhook'
  
  return agentConfig.functions
    .filter(fn => fn.enabled)
    .map(fn => {
      // Get variables for this function
      const functionVars = agentConfig.variables.filter(v => 
        fn.variables.includes(v.id)
      )
      
      // Build parameters object
      const properties: Record<string, VAPIFunctionParameter> = {
        // Always include user_id
        user_id: {
          type: 'string',
          description: `User ID for ${agentConfig.userId}`,
          default: agentConfig.userId,
        },
      }
      const required: string[] = ['user_id'] // user_id is always required
      
      functionVars.forEach(variable => {
        properties[variable.name] = {
          type: variable.type === 'number' ? 'number' : 
                variable.type === 'boolean' ? 'boolean' : 'string',
          description: variable.description,
        }
        
        if (variable.validation?.options) {
          properties[variable.name].enum = variable.validation.options
        }
        
        if (variable.required) {
          required.push(variable.name)
        }
      })
      
      return {
        name: fn.name,
        description: fn.description,
        parameters: {
          type: 'object',
          properties,
          required,
        },
        url: backendWebhookUrl,
        method: 'POST' as const,
      }
    })
}

/**
 * Generate system prompt with variable extraction instructions
 */
export function generateSystemPrompt(agentConfig: AgentConfig): string {
  let prompt = agentConfig.systemPrompt + '\n\n'
  
  // Add user context
  prompt += `## User Context\n\n`
  prompt += `You are assisting user: ${agentConfig.userId}\n`
  prompt += `IMPORTANT: Always include user_id="${agentConfig.userId}" when calling functions.\n\n`
  
  prompt += '## Variable Collection Instructions\n\n'
  prompt += 'You must collect the following information from the user:\n\n'
  
  agentConfig.variables.forEach(variable => {
    const requiredLabel = variable.required ? '**REQUIRED**' : '(optional)'
    prompt += `- **${variable.displayName}** ${requiredLabel}: ${variable.description}\n`
    
    if (variable.extractionPrompt) {
      prompt += `  Ask: "${variable.extractionPrompt}"\n`
    }
    
    prompt += '\n'
  })
  
  prompt += '\n## Function Calling Rules\n\n'
  
  agentConfig.functions.forEach(fn => {
    if (!fn.enabled) return
    
    const functionVars = agentConfig.variables.filter(v => fn.variables.includes(v.id))
    const requiredVars = functionVars.filter(v => v.required)
    
    prompt += `### ${fn.displayName}\n`
    prompt += `Call \`${fn.name}\` when: ${fn.description}\n\n`
    
    if (requiredVars.length > 0) {
      prompt += `**You MUST collect these before calling:**\n`
      requiredVars.forEach(v => {
        prompt += `- ${v.displayName} (${v.name})\n`
      })
      prompt += '\n'
    }
    
    prompt += `**Available parameters:**\n`
    prompt += `- user_id: "${agentConfig.userId}" (always include this)\n`
    functionVars.forEach(v => {
      prompt += `- ${v.name}: ${v.description}${v.required ? ' (required)' : ''}\n`
    })
    prompt += '\n'
  })
  
  return prompt
}

/**
 * Sync agent configuration to VAPI
 */
export async function syncAgentToVAPI(agentConfig: AgentConfig): Promise<{
  success: boolean
  assistantId?: string
  error?: string
}> {
  if (!VAPI_API_KEY) {
    return {
      success: false,
      error: 'VAPI_API_KEY not configured',
    }
  }
  
  try {
    const functions = generateVAPIFunctionConfig(agentConfig)
    const systemPrompt = generateSystemPrompt(agentConfig)
    
    const updateData: VAPIAssistantUpdate = {
      name: agentConfig.name,
      model: {
        provider: 'openai',
        model: agentConfig.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
        ],
      },
      voice: {
        provider: 'playht',
        voiceId: agentConfig.voice,
      },
      firstMessage: agentConfig.firstMessage,
      serverUrl: process.env.NEXT_PUBLIC_API_URL + '/vapi/webhook',
      functions,
    }
    
    let response: Response
    
    if (agentConfig.vapiAssistantId) {
      // Update existing assistant
      response = await fetch(
        `${VAPI_API_URL}/assistant/${agentConfig.vapiAssistantId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      )
    } else {
      // Create new assistant
      response = await fetch(`${VAPI_API_URL}/assistant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `VAPI API error: ${response.status} - ${errorText}`,
      }
    }
    
    const result = await response.json()
    
    return {
      success: true,
      assistantId: result.id,
    }
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
export async function getVAPIAssistant(assistantId: string) {
  if (!VAPI_API_KEY) {
    throw new Error('VAPI_API_KEY not configured')
  }
  
  const response = await fetch(`${VAPI_API_URL}/assistant/${assistantId}`, {
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
    },
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch assistant: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Delete assistant from VAPI
 */
export async function deleteVAPIAssistant(assistantId: string) {
  if (!VAPI_API_KEY) {
    throw new Error('VAPI_API_KEY not configured')
  }
  
  const response = await fetch(`${VAPI_API_URL}/assistant/${assistantId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
    },
  })
  
  if (!response.ok) {
    throw new Error(`Failed to delete assistant: ${response.statusText}`)
  }
  
  return { success: true }
}

