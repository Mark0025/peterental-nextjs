/**
 * Agent Configuration Editor - BACKEND INTEGRATION
 * NOW USES: Backend database for variables & functions ✅
 * FORGE BUILT: Normalized tables (agent_variables, agent_functions)
 */

'use client'

import { use, useState, useEffect } from 'react'
import {
    getAgentById,
    updateAgent,
    getAgentVariables,
    getAgentFunctions,
    addAgentVariable,
    addAgentFunction,
    type BackendAgent,
    type AgentVariable as BackendVariable,
    type AgentFunction as BackendFunction,
} from '@/actions/agent-actions'
import { syncAgent } from '@/actions/agent-config-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AgentConfig, VariableType } from '@/types/agent-config'
import {
    ArrowLeft,
    Plus,
    Rocket,
    CheckCircle2,
    XCircle,
    Loader2,
    Save,
} from 'lucide-react'
import Link from 'next/link'

export default function AgentConfigPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id: rawId } = use(params)
筋肉
    const decodedId = decodeURIComponent(rawId)
    // Backend uses agent_id as integer in database, but URL param might be string
    // Try to parse as number first, fallback to string if it fails
    const agentId = /^\d+$/.test(decodedId) ? parseInt(decodedId, 10) : decodedId
    
    // Backend state
    const [agent, setAgent] = useState<BackendAgent | null>(null)
    const [variables, setVariables] = useState<BackendVariable[]>([])
    const [functions, setFunctions] = useState<BackendFunction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [syncing, setSyncing] = useState(false)
    const [saving, setSaving] = useState(false)

    // Local editing state (for name, prompts, etc.)
    const [agentName, setAgentName] = useState('')
    const [systemPrompt, setSystemPrompt] = useState('')
    const [firstMessage, setFirstMessage] = useState('')
    const [voice, setVoice] = useState('jennifer')
    const [model, setModel] = useState('gpt-4')

    const [syncResult, setSyncResult] = useState<{
        success: boolean
        error?: string
    } | null>(null)

    // Load agent data from backend
    useEffect(() => {
        const loadAgent = async () => {
            try {
                setLoading(true)
                setError(null) // Clear previous errors

                // First get the agent - this will 404 if not found or not owned by user
                const agentData = await getAgentById(agentId)

                if (!agentData) {
                    setAgent(null)
                    setError('Agent not found or you don\'t have permission to access it')
                    return
                }

                setAgent(agentData)

                // Then load variables and functions for this agent
                const [vars, funcs] = await Promise.all([
                    getAgentVariables(agentId),
                    getAgentFunctions(agentId),
                ])

                setVariables(vars)
                setFunctions(funcs)

                // Initialize local state from backend config
                setAgentName(agentData.agent_name)
                setSystemPrompt(agentData.config?.model?.messages?.[0]?.content || '')
                setFirstMessage(agentData.config?.firstMessage || '')
                setVoice(agentData.config?.voice?.voiceId || 'jennifer')
                setModel(agentData.config?.model?.model || 'gpt-4')

            } catch (error) {
                console.error('Failed to load agent:', error)
                setAgent(null)

                // Check if it's a 404 (agent not found or no permission)
                if (error instanceof Error && error.message.includes('404')) {
                    setError('Agent not found or you don\'t have permission to access it')
                } else {
                    setError(
                        error instanceof Error
                            ? error.message
                            : 'Failed to load agent. Please try again.'
                    )
                }
            } finally {
                setLoading(false)
            }
        }

        loadAgent()
    }, [agentId])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <span className="ml-3 text-lg text-muted-foreground">Loading agent configuration...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            ⚠️ {agent === null && !error.includes('not found') ? 'Failed to Load Agent' : 'Agent Not Found'}
                        </CardTitle>
                        <CardDescription>
                            {error.includes('not found')
                                ? 'This agent does not exist or you don\'t have permission to view it'
                                : 'We couldn\'t connect to the backend'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground bg-red-50 p-3 rounded">
                            {error}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Agent ID: <code className="bg-gray-100 px-2 py-1 rounded">{agentId}</code>
                        </div>
                    </CardContent>
                    <CardContent className="flex gap-3 pt-0">
                        <Link href="/agent-builder" className="flex-1">
                            <Button variant="outline" className="w-full">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Agents
                            </Button>
                        </Link>
                        {!error.includes('not found') && (
                            <Button onClick={() => window.location.reload()} className="flex-1">
                                Retry
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!agent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-100 flex items-center justify-center">
                <Card>
                    <CardContent className="p-8 text-center">
                        <h2 className="text-2xl font-bold mb-2">Agent not found</h2>
                        <p className="text-muted-foreground mb-4">
                            Agent ID: <code className="text-xs bg-gray-100 px-2 py-1 rounded">{agentId}</code>
                        </p>
                        <Link href="/agent-builder">
                            <Button className="mt-4">Back to Agent Builder</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            // Update agent basic info + config
            await updateAgent(agentId, {
                agent_name: agentName,
                config: {
                    model: {
                        provider: 'openai',
                        model,
                        messages: systemPrompt ? [{
                            role: 'system' as const,
                            content: systemPrompt,
                        }] : [],
                    },
                    voice: {
                        provider: 'playht',
                        voiceId: voice,
                    },
                    firstMessage,
                    serverUrl: process.env.NEXT_PUBLIC_API_URL + '/vapi/webhook',
                },
            })

            alert('✅ Saved to backend!')
        } catch (error) {
            console.error('Save error:', error)
            alert('❌ Failed to save')
        } finally {
            setSaving(false)
        }
    }

    const handleAddVariable = async () => {
        try {
            const newVar = await addAgentVariable(agentId, {
                variable_id: `var_${Date.now()}`,
                name: 'new_variable',
                display_name: 'New Variable',
                type: 'string',
                description: 'Description of this variable',
                required: false,
            })
            setVariables([...variables, newVar])
        } catch (error) {
            console.error('Failed to add variable:', error)
            alert('Failed to add variable')
        }
    }

    const handleAddFunction = async () => {
        try {
            const newFunc = await addAgentFunction(agentId, {
                function_id: `func_${Date.now()}`,
                name: 'new_function',
                display_name: 'New Function',
                description: 'Description of this function',
                enabled: true,
                webhook_url: process.env.NEXT_PUBLIC_API_URL + '/vapi/webhook',
                method: 'POST',
            })
            setFunctions([...functions, newFunc])
        } catch (error) {
            console.error('Failed to add function:', error)
            alert('Failed to add function')
        }
    }

    const handleSync = async () => {
        setSyncing(true)
        setSyncResult(null)

        try {
            // Build AgentConfig for VAPI sync
            const config: AgentConfig = {
                id: agentId.toString(),
                name: agentName,
                description: '',
                userId: agent.user_id.toString(),
                vapiAssistantId: agent.vapi_assistant_id || undefined,
                voice,
                model,
                systemPrompt,
                firstMessage,
                variables: variables.map(v => ({
                    id: v.variable_id,
                    name: v.name,
                    displayName: v.display_name,
                    type: (v.type || 'string') as VariableType, // Backend stores as string, cast for VAPI
                    description: v.description,
                    required: v.required,
                    defaultValue: v.default_value,
                    validation: v.validation_pattern ? {
                        pattern: v.validation_pattern,
                    } : undefined,
                    extractionPrompt: v.extraction_prompt,
                })),
                functions: functions.filter(f => f.enabled).map(f => ({
                    id: f.function_id,
                    name: f.name,
                    displayName: f.display_name,
                    description: f.description,
                    variables: [],
                    enabled: f.enabled,
                })),
                syncStatus: 'draft',
            }

            const result = await syncAgent(config)

            if (result.success && result.assistantId) {
                // Update backend with Pete assistant ID
                await updateAgent(agentId, {
                    vapi_assistant_id: result.assistantId,
                })
                setSyncResult({ success: true })
            } else {
                setSyncResult({
                    success: false,
                    error: result.error || 'Unknown error',
                })
            }
        } catch (error) {
            setSyncResult({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            })
        } finally {
            setSyncing(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-100 p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/agent-builder">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{agentName}</h1>
                            <p className="text-muted-foreground mt-1">
                                Configure your Pete agent (Backend Integrated ✅)
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handleSave} variant="outline" disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button onClick={handleSync} disabled={syncing} size="lg">
                            {syncing ? (
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            ) : (
                                <Rocket className="h-5 w-5 mr-2" />
                            )}
                            {syncing ? 'Deploying...' : 'Deploy to Pete'}
                        </Button>
                    </div>
                </div>

                {/* Sync Status */}
                {syncResult && (
                    <Alert variant={syncResult.success ? 'default' : 'destructive'}>
                        {syncResult.success ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : (
                            <XCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>
                            {syncResult.success ? 'Success!' : 'Sync Failed'}
                        </AlertTitle>
                        <AlertDescription>
                            {syncResult.success
                                ? 'Agent deployed to Pete successfully!'
                                : syncResult.error || 'Unknown error occurred'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Main Content */}
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                        <TabsTrigger value="variables">
                            Variables
                            <Badge variant="secondary" className="ml-2">{variables.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="functions">
                            Functions
                            <Badge variant="secondary" className="ml-2">{functions.length}</Badge>
                        </TabsTrigger>
                    </TabsList>

                    {/* Basic Settings Tab */}
                    <TabsContent value="basic" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Configuration</CardTitle>
                                <CardDescription>Core agent settings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Agent Name</label>
                                    <Input
                                        value={agentName}
                                        onChange={(e) => setAgentName(e.target.value)}
                                        placeholder="Property Seller Agent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Model</label>
                                    <Input
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        placeholder="gpt-4"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Voice</label>
                                    <Input
                                        value={voice}
                                        onChange={(e) => setVoice(e.target.value)}
                                        placeholder="jennifer"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">System Prompt</label>
                                    <Textarea
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                        placeholder="You are a helpful real estate assistant..."
                                        rows={6}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">First Message</label>
                                    <Input
                                        value={firstMessage}
                                        onChange={(e) => setFirstMessage(e.target.value)}
                                        placeholder="Hi! How can I help you today?"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Variables Tab */}
                    <TabsContent value="variables" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Variables</CardTitle>
                                        <CardDescription>Data collected from conversations</CardDescription>
                                    </div>
                                    <Button onClick={handleAddVariable}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Variable
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {variables.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No variables yet. Click Add Variable to create one.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {variables.map((v) => (
                                            <Card key={v.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="font-medium">{v.display_name}</h3>
                                                            <p className="text-sm text-muted-foreground">{v.name}</p>
                                                            <p className="text-sm mt-1">{v.description}</p>
                                                            <div className="flex gap-2 mt-2">
                                                                <Badge variant="outline">{v.type}</Badge>
                                                                {v.required && <Badge>Required</Badge>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Functions Tab */}
                    <TabsContent value="functions" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Functions</CardTitle>
                                        <CardDescription>Actions the agent can perform</CardDescription>
                                    </div>
                                    <Button onClick={handleAddFunction}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Function
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {functions.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No functions yet. Click Add Function to create one.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {functions.map((f) => (
                                            <Card key={f.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="font-medium">{f.display_name}</h3>
                                                            <p className="text-sm text-muted-foreground">{f.name}</p>
                                                            <p className="text-sm mt-1">{f.description}</p>
                                                            <div className="flex gap-2 mt-2">
                                                                {f.enabled ? (
                                                                    <Badge variant="default">Enabled</Badge>
                                                                ) : (
                                                                    <Badge variant="secondary">Disabled</Badge>
                                                                )}
                                                                <Badge variant="outline">{f.method || 'POST'}</Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
