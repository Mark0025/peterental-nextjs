/**
 * Agent Configuration Tests
 * Testing agent builder functionality
 */

import { describe, it, expect } from '@jest/globals'
import { generateSystemPrompt, generateVAPIFunctionConfig } from '@/lib/api/vapi-config'
import type { AgentConfig } from '@/types/agent-config'

describe('Agent Configuration', () => {
  const mockAgentConfig: AgentConfig = {
    id: 'test-agent-1',
    name: 'Test Agent',
    description: 'Test Description',
    userId: 'test@example.com',
    voice: 'jennifer',
    model: 'gpt-4',
    systemPrompt: 'You are a helpful assistant.',
    firstMessage: 'Hello!',
    variables: [
      {
        id: 'var-1',
        name: 'property_address',
        displayName: 'Property Address',
        type: 'address',
        description: 'The property address',
        required: true,
        extractionPrompt: 'What is the property address?',
      },
      {
        id: 'var-2',
        name: 'email',
        displayName: 'Email',
        type: 'email',
        description: 'Contact email',
        required: true,
      },
    ],
    functions: [
      {
        id: 'func-1',
        name: 'set_appointment',
        displayName: 'Set Appointment',
        description: 'Book an appointment',
        variables: ['var-1', 'var-2'],
        enabled: true,
      },
    ],
    syncStatus: 'draft',
  }

  describe('generateSystemPrompt', () => {
    it('should include user context', () => {
      const prompt = generateSystemPrompt(mockAgentConfig)
      expect(prompt).toContain('test@example.com')
      expect(prompt).toContain('user_id="test@example.com"')
    })

    it('should include variable collection instructions', () => {
      const prompt = generateSystemPrompt(mockAgentConfig)
      expect(prompt).toContain('Property Address')
      expect(prompt).toContain('**REQUIRED**')
      expect(prompt).toContain('What is the property address?')
    })

    it('should include function calling rules', () => {
      const prompt = generateSystemPrompt(mockAgentConfig)
      expect(prompt).toContain('set_appointment')
      expect(prompt).toContain('Book an appointment')
    })

    it('should list required variables for functions', () => {
      const prompt = generateSystemPrompt(mockAgentConfig)
      expect(prompt).toContain('property_address')
      expect(prompt).toContain('email')
    })
  })

  describe('generateVAPIFunctionConfig', () => {
    it('should generate function configurations', () => {
      const functions = generateVAPIFunctionConfig(mockAgentConfig)
      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('set_appointment')
    })

    it('should include user_id parameter', () => {
      const functions = generateVAPIFunctionConfig(mockAgentConfig)
      expect(functions[0].parameters.properties.user_id).toBeDefined()
      expect(functions[0].parameters.properties.user_id.default).toBe(
        'test@example.com'
      )
    })

    it('should mark user_id as required', () => {
      const functions = generateVAPIFunctionConfig(mockAgentConfig)
      expect(functions[0].parameters.required).toContain('user_id')
    })

    it('should include all function variables', () => {
      const functions = generateVAPIFunctionConfig(mockAgentConfig)
      expect(functions[0].parameters.properties.property_address).toBeDefined()
      expect(functions[0].parameters.properties.email).toBeDefined()
    })

    it('should mark required variables correctly', () => {
      const functions = generateVAPIFunctionConfig(mockAgentConfig)
      expect(functions[0].parameters.required).toContain('property_address')
      expect(functions[0].parameters.required).toContain('email')
    })

    it('should not include disabled functions', () => {
      const configWithDisabled: AgentConfig = {
        ...mockAgentConfig,
        functions: [
          {
            id: 'func-2',
            name: 'disabled_function',
            displayName: 'Disabled',
            description: 'Should not appear',
            variables: [],
            enabled: false,
          },
        ],
      }
      const functions = generateVAPIFunctionConfig(configWithDisabled)
      expect(functions).toHaveLength(0)
    })
  })
})

