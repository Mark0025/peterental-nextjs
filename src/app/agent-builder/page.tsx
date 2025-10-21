/**
 * Visual Agent Builder
 * Configure VAPI agents with drag-and-drop variables
 */

'use client'

import { useState } from 'react'
import { useAgentConfig } from '@/lib/hooks/use-agent-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Settings, Trash2, CheckCircle2, XCircle, Loader2, Download } from 'lucide-react'
import Link from 'next/link'
import type { AgentConfig } from '@/types/agent-config'
import { ImportAssistantDialog } from '@/components/features/agent-builder/import-assistant-dialog'

export default function AgentBuilderPage() {
    const { configs, loading, createConfig, deleteConfig } = useAgentConfig()
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [showImportDialog, setShowImportDialog] = useState(false)
    const [newAgentName, setNewAgentName] = useState('')

    const handleCreate = () => {
        if (!newAgentName.trim()) return

        const newConfig: Omit<AgentConfig, 'id' | 'userId'> = {
            name: newAgentName,
            description: '',
            voice: 'jennifer',
            model: 'gpt-4',
            systemPrompt: `You are a helpful real estate assistant for ${newAgentName}.`,
            firstMessage: `Hi! I'm here to help you with ${newAgentName}. How can I assist you today?`,
            variables: [],
            functions: [],
            syncStatus: 'draft',
        }

        createConfig(newConfig)
        setNewAgentName('')
        setShowCreateForm(false)
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
                        Visual configuration for VAPI agents - no guesswork, perfect sync every time
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
                {showImportDialog && (
                    <ImportAssistantDialog onClose={() => setShowImportDialog(false)} />
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
                        <Button onClick={() => setShowImportDialog(true)} variant="outline" size="lg">
                            <Download className="h-5 w-5 mr-2" /> Import from VAPI
                        </Button>
                    </div>
                )}

                {/* Agent List */}
                {configs.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <div className="text-muted-foreground mb-4">
                                <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">No agents configured yet</p>
                                <p className="text-sm mt-2">Create your first agent to get started</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {configs.map((config) => (
                            <Card
                                key={config.id}
                                className="hover:shadow-lg transition-shadow cursor-pointer group"
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{config.name}</CardTitle>
                                            <CardDescription className="mt-1 text-xs">
                                                {config.variables.length} variables •{' '}
                                                {config.functions.filter((f) => f.enabled).length} functions
                                            </CardDescription>
                                        </div>
                                        <Badge
                                            variant={
                                                config.syncStatus === 'synced'
                                                    ? 'default'
                                                    : config.syncStatus === 'error'
                                                        ? 'destructive'
                                                        : 'secondary'
                                            }
                                        >
                                            {config.syncStatus === 'synced' && (
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                            )}
                                            {config.syncStatus === 'error' && (
                                                <XCircle className="h-3 w-3 mr-1" />
                                            )}
                                            {config.syncStatus === 'syncing' && (
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                            )}
                                            {config.syncStatus}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="font-medium">Model:</span>
                                            <span>{config.model}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="font-medium">Voice:</span>
                                            <span>{config.voice}</span>
                                        </div>
                                        {config.vapiAssistantId && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span className="font-medium">VAPI ID:</span>
                                                <span className="font-mono text-xs">
                                                    {config.vapiAssistantId.slice(0, 8)}...
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            href={`/agent-builder/${encodeURIComponent(config.id)}`}
                                            className="flex-1"
                                        >
                                            <Button className="w-full" variant="default">
                                                <Settings className="h-4 w-4 mr-2" /> Configure
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (
                                                    confirm(
                                                        `Delete ${config.name}? This cannot be undone.`
                                                    )
                                                ) {
                                                    deleteConfig(config.id)
                                                }
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

