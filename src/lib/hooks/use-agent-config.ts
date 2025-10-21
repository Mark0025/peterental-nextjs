/**
 * Hook for managing agent configurations (per-user)
 */

'use client'

import { useState, useEffect } from 'react'
import { useUser } from './use-user'
import type { AgentConfig } from '@/types/agent-config'

const STORAGE_KEY = 'agent_configs'

export function useAgentConfig() {
  const { userId } = useUser()
  const [allConfigs, setAllConfigs] = useState<AgentConfig[]>([])
  const [loading, setLoading] = useState(true)
  
  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setAllConfigs(parsed)
      } catch (error) {
        console.error('Failed to parse agent configs:', error)
      }
    }
    setLoading(false)
  }, [])
  
  // Filter configs for current user
  const configs = userId 
    ? allConfigs.filter(c => c.userId === userId)
    : allConfigs
  
  // Save to localStorage
  const saveConfigs = (newConfigs: AgentConfig[]) => {
    setAllConfigs(newConfigs)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfigs))
  }
  
  const createConfig = (config: Omit<AgentConfig, 'id' | 'userId'>): AgentConfig => {
    if (!userId) {
      throw new Error('No user selected')
    }
    
    const newConfig: AgentConfig = {
      ...config,
      id: `agent_${userId}_${Date.now()}`,
      userId: userId,
      syncStatus: 'draft',
    }
    saveConfigs([...allConfigs, newConfig])
    return newConfig
  }
  
  const updateConfig = (id: string, updates: Partial<AgentConfig>) => {
    const newConfigs = allConfigs.map(c =>
      c.id === id ? { ...c, ...updates } : c
    )
    saveConfigs(newConfigs)
  }
  
  const deleteConfig = (id: string) => {
    const newConfigs = allConfigs.filter(c => c.id !== id)
    saveConfigs(newConfigs)
  }
  
  const getConfig = (id: string) => {
    return allConfigs.find(c => c.id === id)
  }
  
  return {
    configs,
    loading,
    createConfig,
    updateConfig,
    deleteConfig,
    getConfig,
  }
}

