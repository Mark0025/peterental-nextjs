/**
 * Visual Agent Builder
 * Configure VAPI agents with drag-and-drop variables
 * Now fetches from backend database + VAPI dashboard!
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Settings, Trash2, Loader2, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { BackendAgent } from '@/actions/agent-actions'
import { getAgents, createAgent, deleteAgent as deleteAgentAction, getVAPIAssistants, importVAPIAssistant } from '@/actions/agent-actions'
import type { VAPIAssistant } from '@/actions/agent-actions'

export default function AgentBuilderPage() {
    const [agents, setAgents] = useState<BackendAgent[]>([])
    const [vapiAgents, setVAPIAgents] = useState<VAPIAssistant[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [showImportDialog, setShowImportDialog] = useState(false)
    const [newAgentName, setNewAgentName] = useState('')
    const [importing, setImporting] = useState(false)

    // Load agents from backend on mount
    useEffect(() => {
        loadAgents()
    }, [])

    const loadAgents = async () => {
        try {
            setLoading(true)
            const backendAgents = await getAgents()
            setAgents(backendAgents)
        } catch (error) {
            console.error('Failed to load agents:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadVAPIAgents = async () => {
        try {
            setImporting(true)
            const assistants = await getVAPIAssistants()
            setVAPIAgents(assistants)
            setShowImportDialog(true)
        } catch (error) {
            console.error('Failed to load VAPI assistants:', error)
            alert('Failed to load VAPI assistants. Please try again.')
        } finally {
            setImporting(false)
        }
    }

    const handleCreate = async () => {
        if (!newAgentName.trim()) return

        try {
            await createAgent({
                agent_name: newAgentName,
                is_active: true,
            })
            setNewAgentName('')
            setShowCreateForm(false)
            await loadAgents() // Reload list
        } catch (error) {
            console.error('Failed to create agent:', error)
            alert('Failed to create agent. Please try again.')
        }
    }

    const handleDelete = async (agentId: number, agentName: string) => {
        const confirmed = confirm(
            `Delete ${agentName}? This cannot be undone.`
        )
        if (!confirmed) return

        try {
            const result = await deleteAgentAction(agentId)
            if (result.success) {
                await loadAgents() // Reload list
            } else {
                alert(result.message)
            }
        } catch (error) {
            console.error('Failed to delete agent:', error)
            alert('Failed to delete agent. Please try again.')
        }
    }

    const handleImport = async (vapiAssistant: VAPIAssistant) => {
        try {
            await importVAPIAssistant(vapiAssistant.id, vapiAssistant.name)
            setShowImportDialog(false)
            setVAPIAgents([])
            await loadAgents() // Reload list
        } catch (error) {
            console.error('Failed to import VAPI assistant:', error)
            alert('Failed to import VAPI assistant. Please try again.')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-100 p-8">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-800 bg-clip-text text-transparent">
                        🎨 Agent Builder
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Your AI agents - Configure, deploy, and manage your voice assistants
                    </p>
                </div>

                {/* Explainer Card */}
                <Card className="mb-8 border-purple-200 bg-purple-50">
                    <CardHeader>
                        <CardTitle className="text-purple-900">How It Works</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-purple-800">
                        <ol className="list-decimal list-inside space-y-2">
                            <li>
                                <strong>Configure Variables:</strong> Define what info your agent needs
                                (property_address, email, etc.)
                            </li>
                            <li>
                                <strong>Build Functions:</strong> Drag variables into functions like
                                &quot;Book Appointment&quot;
                            </li>
                            <li>
                                <strong>Deploy:</strong> One click syncs everything to VAPI Dashboard + your
                                backend
                            </li>
                            <li>
                                <strong>Test:</strong> Agent automatically collects required variables, no
                                confusion!
                            </li>
                        </ol>
                    </CardContent>
                </Card>

                {/* Import Dialog */}
                {showImportDialog && vapiAgents.length > 0 && (
                    <Card className="mb-6 border-2 border-purple-500">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Import from VAPI Dashboard</CardTitle>
                                    <CardDescription>
                                        Select agents from your VAPI dashboard to import
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowImportDialog(false)
                                        setVAPIAgents([])
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                            {vapiAgents.map((vapiAgent) => {
                                const alreadyImported = agents.some(
                                    (a) => a.vapi_assistant_id === vapiAgent.id
                                )
                                return (
                                    <Card key={vapiAgent.id} className="border">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold">{vapiAgent.name}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Model: {vapiAgent.model?.model || 'N/A'} • Voice:{' '}
                                                        {vapiAgent.voice?.voiceId || 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        VAPI ID: {vapiAgent.id}
                                                    </p>
                                                </div>
                                                {alreadyImported ? (
                                                    <Badge variant="secondary">Already Imported</Badge>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleImport(vapiAgent)}
                                                        size="sm"
                                                    >
                                                        <Download className="h-4 w-4 mr-2" /> Import
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </CardContent>
                    </Card>
                )}

                {/* Create New Agent */}
                {showCreateForm ? (
                    <Card className="mb-6 border-2 border-purple-500">
                        <CardHeader>
                            <CardTitle>Create New Agent</CardTitle>
                            <CardDescription>
                                Give your agent a name to get started
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-3">
                                <Input
                                    placeholder="e.g., Property Seller Agent"
                                    value={newAgentName}
                                    onChange={(e) => setNewAgentName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreate()
                                    }}
                                    className="flex-1"
                                    autoFocus
                                />
                                <Button onClick={handleCreate} disabled={!newAgentName.trim()}>
                                    <Plus className="h-4 w-4 mr-2" /> Create
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowCreateForm(false)
                                        setNewAgentName('')
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="mb-6 flex gap-3">
                        <Button onClick={() => setShowCreateForm(true)} size="lg">
                            <Plus className="h-5 w-5 mr-2" /> Create New Agent
                        </Button>
                        <Button
                            onClick={loadVAPIAgents}
                            variant="outline"
                            size="lg"
                            disabled={importing}
                        >
                            {importing ? (
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            ) : (
                                <Download className="h-5 w-5 mr-2" />
                            )}
                            {importing ? 'Loading...' : 'Import from VAPI'}
                        </Button>
                    </div>
                )}

                {/* Agent List */}
                {agents.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <div className="text-muted-foreground mb-4">
                                <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">No agents yet</p>
                                <p className="text-sm mt-2">Create your first AI agent to get started</p>
                                <p className="text-xs mt-1 text-blue-600">
                                    Your agents are private and user-scoped
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map((agent) => (
                            <Card
                                key={agent.agent_id}
                                className="hover:shadow-lg transition-shadow cursor-pointer group"
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{agent.agent_name}</CardTitle>
                                            <CardDescription className="mt-1 text-xs">
                                                Backend Agent • User-scoped
                                            </CardDescription>
                                        </div>
                                        <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                                            {agent.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="font-medium">Agent ID:</span>
                                            <span className="font-mono">{agent.agent_id}</span>
                                        </div>
                                        {agent.vapi_assistant_id && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span className="font-medium">VAPI ID:</span>
                                                <span className="font-mono text-xs">
                                                    {agent.vapi_assistant_id.slice(0, 12)}...
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>Created:</span>
                                            <span>{new Date(agent.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            href={`/agent-builder/${agent.agent_id}`}
                                            className="flex-1"
                                        >
                                            <Button className="w-full" variant="default">
                                                <Settings className="h-4 w-4 mr-2" /> Configure
                                            </Button>
                                        </Link>
                                        {agent.vapi_assistant_id && (
                                            <a
                                                href={`https://vapi.ai`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center px-3 py-2 text-sm border rounded-md hover:bg-gray-50 transition-colors"
                                                title="View in VAPI Dashboard"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(agent.agent_id, agent.agent_name)
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

