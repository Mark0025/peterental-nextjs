/**
 * Agent Configuration Editor
 * Visual editor for individual agent
 */

'use client'

import { use, useState } from 'react'
// import { useRouter } from 'next/navigation'
import { useAgentConfig } from '@/lib/hooks/use-agent-config'
import { syncAgent, previewAgentConfig } from '@/actions/agent-config-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AgentVariable, AgentFunction } from '@/types/agent-config'
import {
    ArrowLeft,
    Plus,
    Trash2,
    Rocket,
    Eye,
    CheckCircle2,
    XCircle,
    Loader2,
    Settings,
    FileText,
    Code,
} from 'lucide-react'
import Link from 'next/link'

export default function AgentConfigPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id: rawId } = use(params)
    // Decode URL-encoded ID (e.g., agent_mark%40peterei.com_123 → agent_mark@peterei.com_123)
    const id = decodeURIComponent(rawId)
    // const router = useRouter()
    const { configs, updateConfig, loading: configsLoading } = useAgentConfig()
    const [syncing, setSyncing] = useState(false)
    const [showSlashMenu, setShowSlashMenu] = useState(false)
    const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 })
    const [slashSearch, setSlashSearch] = useState('')

    // Find the config from the list (updates automatically when configs load)
    const config = configs.find(c => c.id === id)
    const [syncResult, setSyncResult] = useState<{
        success: boolean
        error?: string
    } | null>(null)
    const [preview, setPreview] = useState<{
        success: boolean
        functions?: unknown[]
        systemPrompt?: string
        error?: string
    } | null>(null)

    // Config is now automatically found from configs array - no need for separate useEffect

    if (configsLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <span className="ml-3 text-lg text-muted-foreground">Loading agent configuration...</span>
            </div>
        )
    }

    if (!config) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-100 flex items-center justify-center">
                <Card>
                    <CardContent className="p-8 text-center">
                        <h2 className="text-2xl font-bold mb-2">Agent not found</h2>
                        <p className="text-muted-foreground mb-4">
                            Agent ID: <code className="text-xs bg-gray-100 px-2 py-1 rounded">{id}</code>
                        </p>
                        <Link href="/agent-builder">
                            <Button className="mt-4">Back to Agent Builder</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const handleUpdateConfig = (updates: Partial<typeof config>) => {
        updateConfig(id, { ...config, ...updates, syncStatus: 'draft' as const })
    }

    const handleSave = () => {
        updateConfig(id, config)
        alert('Configuration saved!')
    }

    const handleSync = async () => {
        setSyncing(true)
        setSyncResult(null)

        try {
            const result = await syncAgent(config)

            if (result.success && result.assistantId) {
                updateConfig(id, {
                    vapiAssistantId: result.assistantId,
                    syncStatus: 'synced' as const,
                    lastSyncedAt: new Date().toISOString(),
                })
                setSyncResult({ success: true })
            } else {
                setSyncResult({
                    success: false,
                    error: result.error || 'Unknown error',
                })
                updateConfig(id, { ...config, syncStatus: 'error' })
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

    const handlePreview = async () => {
        const result = await previewAgentConfig(config)
        setPreview(result)
    }

    const addVariable = () => {
        const newVar: AgentVariable = {
            id: `var_${Date.now()}`,
            name: 'new_variable',
            displayName: 'New Variable',
            type: 'string',
            description: 'Description of this variable',
            required: false,
        }
        handleUpdateConfig({
            variables: [...config.variables, newVar],
        })
    }

    const updateVariable = (id: string, updates: Partial<AgentVariable>) => {
        handleUpdateConfig({
            variables: config.variables.map((v) =>
                v.id === id ? { ...v, ...updates } : v
            ),
        })
    }

    const deleteVariable = (id: string) => {
        handleUpdateConfig({
            variables: config.variables.filter((v) => v.id !== id),
            functions: config.functions.map((f) => ({
                ...f,
                variables: f.variables.filter((vId) => vId !== id),
            })),
        })
    }

    const addFunction = () => {
        const newFunc: AgentFunction = {
            id: `func_${Date.now()}`,
            name: 'new_function',
            displayName: 'New Function',
            description: 'What this function does',
            variables: [],
            enabled: true,
        }
        handleUpdateConfig({
            functions: [...config.functions, newFunc],
        })
    }

    const updateFunction = (id: string, updates: Partial<AgentFunction>) => {
        handleUpdateConfig({
            functions: config.functions.map((f) =>
                f.id === id ? { ...f, ...updates } : f
            ),
        })
    }

    const deleteFunction = (id: string) => {
        handleUpdateConfig({
            functions: config.functions.filter((f) => f.id !== id),
        })
    }

    const toggleVariableInFunction = (functionId: string, variableId: string) => {
        handleUpdateConfig({
            functions: config.functions.map((f) => {
                if (f.id !== functionId) return f

                const hasVariable = f.variables.includes(variableId)
                return {
                    ...f,
                    variables: hasVariable
                        ? f.variables.filter((v) => v !== variableId)
                        : [...f.variables, variableId],
                }
            }),
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-100 p-8">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link href="/agent-builder">
                            <Button variant="ghost" size="sm" className="mb-2">
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Agents
                            </Button>
                        </Link>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-800 bg-clip-text text-transparent">
                            {config.name}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Configure variables and functions for your VAPI agent
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handlePreview} variant="outline">
                            <Eye className="h-4 w-4 mr-2" /> Preview
                        </Button>
                        <Button onClick={handleSave} variant="outline">
                            <Settings className="h-4 w-4 mr-2" /> Save
                        </Button>
                        <Button onClick={handleSync} disabled={syncing} size="lg">
                            {syncing ? (
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            ) : (
                                <Rocket className="h-5 w-5 mr-2" />
                            )}
                            {syncing ? 'Deploying...' : 'Deploy to VAPI'}
                        </Button>
                    </div>
                </div>

                {/* Sync Status */}
                {syncResult && (
                    <Alert
                        variant={syncResult.success ? 'default' : 'destructive'}
                        className="mb-6"
                    >
                        <AlertTitle className="flex items-center gap-2">
                            {syncResult.success ? (
                                <>
                                    <CheckCircle2 className="h-5 w-5" /> Successfully Deployed!
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-5 w-5" /> Deployment Failed
                                </>
                            )}
                        </AlertTitle>
                        <AlertDescription>
                            {syncResult.success
                                ? 'Your agent is live in VAPI Dashboard and ready to use!'
                                : syncResult.error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Configuration Tabs */}
                <Tabs defaultValue="basic" className="space-y-6">
                    <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="variables">
                            Variables
                            <Badge className="ml-2" variant="secondary">
                                {config.variables.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="functions">
                            Functions
                            <Badge className="ml-2" variant="secondary">
                                {config.functions.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>

                    {/* Basic Info Tab */}
                    <TabsContent value="basic" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Settings</CardTitle>
                                <CardDescription>
                                    Configure your agent&apos;s name, voice, and initial message
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Agent Name
                                    </label>
                                    <Input
                                        value={config.name}
                                        onChange={(e) =>
                                            handleUpdateConfig({ name: e.target.value })
                                        }
                                        placeholder="e.g., Property Seller Agent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Description
                                    </label>
                                    <Textarea
                                        value={config.description}
                                        onChange={(e) =>
                                            handleUpdateConfig({ description: e.target.value })
                                        }
                                        placeholder="What does this agent do?"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Model
                                        </label>
                                        <select
                                            value={config.model}
                                            onChange={(e) =>
                                                handleUpdateConfig({ model: e.target.value })
                                            }
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <optgroup label="OpenAI GPT-4">
                                                <option value="gpt-4o">GPT-4o (Latest, Best)</option>
                                                <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</option>
                                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                                <option value="gpt-4">GPT-4</option>
                                            </optgroup>
                                            <optgroup label="OpenAI GPT-3.5">
                                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                                <option value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16k</option>
                                            </optgroup>
                                            <optgroup label="Anthropic Claude">
                                                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Latest)</option>
                                                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                                                <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                                                <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fast)</option>
                                            </optgroup>
                                            <optgroup label="Google Gemini">
                                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                                <option value="gemini-pro">Gemini Pro</option>
                                            </optgroup>
                                            <optgroup label="Other">
                                                <option value="groq-llama3-70b">Groq Llama 3 70B (Fast)</option>
                                                <option value="groq-mixtral-8x7b">Groq Mixtral 8x7B</option>
                                            </optgroup>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Voice Provider & Voice
                                        </label>
                                        <select
                                            value={config.voice}
                                            onChange={(e) =>
                                                handleUpdateConfig({ voice: e.target.value })
                                            }
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <optgroup label="ElevenLabs (Premium Quality)">
                                                <option value="21m00Tcm4TlvDq8ikWAM">Rachel - Calm, Professional</option>
                                                <option value="AZnzlk1XvdvUeBnXmlld">Domi - Strong, Authoritative</option>
                                                <option value="EXAVITQu4vr4xnSDxMaL">Bella - Soft, Friendly</option>
                                                <option value="ErXwobaYiN019PkySvjV">Antoni - Confident, Deep</option>
                                                <option value="TxGEqnHWrfWFTfGW9XjX">Josh - Natural, Warm</option>
                                                <option value="VR6AewLTigWG4xSOukaG">Arnold - Clear, Professional</option>
                                                <option value="pNInz6obpgDQGcFmaJgB">Adam - Narration, Deep</option>
                                                <option value="yoZ06aMxZJJ28mfd3POQ">Sam - Dynamic, Energetic</option>
                                                <option value="MF3mGyEYCl7XYWbV9V6O">Elli - Young, Upbeat</option>
                                                <option value="XB0fDUnXU5powFXDhCwa">Charlotte - Smooth, British</option>
                                                <option value="pqHfZKP75CvOlQylNhV4">Bill - Documentary, Authority</option>
                                                <option value="N2lVS1w4EtoT3dr4eOWO">Callum - Masculine, British</option>
                                            </optgroup>
                                            <optgroup label="PlayHT">
                                                <option value="jennifer">Jennifer - Professional</option>
                                                <option value="melissa">Melissa - Warm</option>
                                                <option value="will">Will - Deep</option>
                                                <option value="chris">Chris - Friendly</option>
                                                <option value="jessica">Jessica - Energetic</option>
                                                <option value="brian">Brian - Authoritative</option>
                                            </optgroup>
                                            <optgroup label="Azure">
                                                <option value="andrew">Andrew - Male, American</option>
                                                <option value="brian">Brian - Male, American</option>
                                                <option value="emma">Emma - Female, American</option>
                                            </optgroup>
                                            <optgroup label="Rime AI">
                                                <option value="katie">Katie - Female</option>
                                                <option value="marsh">Marsh - Male</option>
                                            </optgroup>
                                        </select>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            💡 ElevenLabs voices shown with IDs. For custom ElevenLabs voices, use voice ID directly.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        First Message (Greeting)
                                    </label>
                                    <Textarea
                                        value={config.firstMessage}
                                        onChange={(e) =>
                                            handleUpdateConfig({ firstMessage: e.target.value })
                                        }
                                        placeholder="e.g., Hi! I'm here to help you book a property viewing. What property are you interested in?"
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        System Prompt (Main Instructions)
                                    </label>

                                    {/* Variable chips for drag & drop */}
                                    {config.variables.length > 0 && (
                                        <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-md">
                                            <p className="text-xs font-medium text-blue-900 mb-2">
                                                ⚡ <strong>Type `/` in prompt</strong> for slash commands, or <strong>drag & drop</strong> variables:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {config.variables.map((variable) => (
                                                    <Badge
                                                        key={variable.id}
                                                        variant="outline"
                                                        draggable
                                                        className="cursor-move hover:bg-blue-100 border-blue-300 text-blue-700 transition-all active:cursor-grabbing"
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.effectAllowed = 'copy';
                                                            e.dataTransfer.setData('text/plain', `\n\n**${variable.displayName}** (${variable.name}):\n${variable.description}\n${variable.required ? 'REQUIRED - You must collect this before proceeding.' : 'OPTIONAL'}`);
                                                        }}
                                                    >
                                                        ⋮⋮ {variable.displayName} <span className="text-xs opacity-60">/{variable.name}</span>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <Textarea
                                            id="system-prompt-textarea"
                                            value={config.systemPrompt}
                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                const cursorPos = e.currentTarget.selectionStart;

                                                handleUpdateConfig({ systemPrompt: newValue });

                                                // Check for slash command - simplified logic
                                                const textBeforeCursor = newValue.substring(0, cursorPos);
                                                const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

                                                console.log('Slash detection:', { lastSlashIndex, cursorPos, textBeforeCursor: textBeforeCursor.slice(-10) });

                                                if (lastSlashIndex !== -1 && cursorPos > lastSlashIndex) {
                                                    // Check if slash is at start or after whitespace
                                                    const charBeforeSlash = lastSlashIndex > 0 ? textBeforeCursor[lastSlashIndex - 1] : '';
                                                    const isAtWordBoundary = lastSlashIndex === 0 || charBeforeSlash === ' ' || charBeforeSlash === '\n';

                                                    if (isAtWordBoundary) {
                                                        const searchText = textBeforeCursor.substring(lastSlashIndex + 1);

                                                        // Close menu if space or newline after slash
                                                        if (searchText.includes(' ') || searchText.includes('\n')) {
                                                            setShowSlashMenu(false);
                                                        } else {
                                                            // Show menu and filter
                                                            setShowSlashMenu(true);
                                                            setSlashSearch(searchText.toLowerCase());
                                                            setSlashMenuPosition({ top: 40, left: 0 });
                                                            console.log('Showing slash menu, search:', searchText);
                                                        }
                                                    } else {
                                                        setShowSlashMenu(false);
                                                    }
                                                } else {
                                                    setShowSlashMenu(false);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (showSlashMenu && (e.key === 'Escape')) {
                                                    setShowSlashMenu(false);
                                                    e.preventDefault();
                                                }
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();

                                                const droppedText = e.dataTransfer.getData('text/plain');
                                                if (!droppedText) return;

                                                const textarea = e.currentTarget;

                                                // Calculate drop position based on mouse coordinates
                                                // For simplicity, we'll use selection start (cursor position)
                                                const cursorPos = textarea.selectionStart || 0;

                                                const textBefore = config.systemPrompt.substring(0, cursorPos);
                                                const textAfter = config.systemPrompt.substring(cursorPos);

                                                handleUpdateConfig({
                                                    systemPrompt: textBefore + droppedText + textAfter
                                                });

                                                e.currentTarget.classList.remove('ring-2', 'ring-blue-500');

                                                // Set cursor after inserted text
                                                setTimeout(() => {
                                                    textarea.selectionStart = cursorPos + droppedText.length;
                                                    textarea.selectionEnd = cursorPos + droppedText.length;
                                                    textarea.focus();
                                                }, 0);
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                e.dataTransfer.dropEffect = 'copy';
                                                e.currentTarget.classList.add('ring-2', 'ring-blue-500');
                                            }}
                                            onDragEnter={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.add('ring-2', 'ring-blue-500');
                                            }}
                                            onDragLeave={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.remove('ring-2', 'ring-blue-500');
                                            }}
                                            placeholder="Type / for slash commands... e.g., 'You are a helpful real estate assistant...'"
                                            rows={20}
                                            className="font-mono text-sm transition-all"
                                        />

                                        {/* Slash Command Menu */}
                                        {showSlashMenu && (
                                            <div className="absolute z-50 mt-1 bg-white border-2 border-blue-400 rounded-lg shadow-xl p-2 max-h-60 overflow-y-auto"
                                                style={{ top: slashMenuPosition.top, left: slashMenuPosition.left, minWidth: '300px' }}>
                                                <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                                                    Insert Variable:
                                                </div>
                                                {config.variables
                                                    .filter(v => v.name.toLowerCase().includes(slashSearch) || v.displayName.toLowerCase().includes(slashSearch))
                                                    .map((variable) => (
                                                        <button
                                                            key={variable.id}
                                                            type="button"
                                                            className="w-full text-left px-3 py-2 rounded hover:bg-blue-50 flex items-center gap-2 group"
                                                            onClick={() => {
                                                                const insertText = `\n\n**${variable.displayName}** (${variable.name}):\n${variable.description}\n${variable.required ? 'REQUIRED - You must collect this before proceeding.' : 'OPTIONAL'}`;

                                                                // Find the last slash position
                                                                const lastSlashIndex = config.systemPrompt.lastIndexOf('/');
                                                                if (lastSlashIndex === -1) {
                                                                    // Fallback: just append
                                                                    handleUpdateConfig({
                                                                        systemPrompt: config.systemPrompt + insertText
                                                                    });
                                                                } else {
                                                                    // Remove slash and search text, insert variable
                                                                    const textBeforeSlash = config.systemPrompt.substring(0, lastSlashIndex);
                                                                    const textAfterSearch = config.systemPrompt.substring(lastSlashIndex + 1 + slashSearch.length);

                                                                    handleUpdateConfig({
                                                                        systemPrompt: textBeforeSlash + insertText + textAfterSearch
                                                                    });
                                                                }

                                                                setShowSlashMenu(false);

                                                                // Focus back on textarea
                                                                setTimeout(() => {
                                                                    document.getElementById('system-prompt-textarea')?.focus();
                                                                }, 100);
                                                            }}
                                                        >
                                                            <Badge variant="outline" className="text-xs">
                                                                /{variable.name}
                                                            </Badge>
                                                            <span className="text-sm font-medium">{variable.displayName}</span>
                                                            {variable.required && (
                                                                <Badge variant="default" className="ml-auto text-xs">Required</Badge>
                                                            )}
                                                        </button>
                                                    ))}
                                                {config.variables.filter(v => v.name.toLowerCase().includes(slashSearch) || v.displayName.toLowerCase().includes(slashSearch)).length === 0 && (
                                                    <div className="text-sm text-gray-500 px-3 py-2">
                                                        No variables match &quot;{slashSearch}&quot;
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                        <p className="text-xs font-medium text-gray-700 mb-1">
                                            💡 VAPI Tips:
                                        </p>
                                        <ul className="text-xs text-gray-600 space-y-1">
                                            <li>• Describe what information the AI should collect in natural language</li>
                                            <li>• Mark required vs optional fields clearly</li>
                                            <li>• Tell the AI when to call functions (e.g., &quot;Once you have all info, call set_appointment&quot;)</li>
                                            <li>• The AI will extract variables from conversation automatically</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Variables Tab */}
                    <TabsContent value="variables" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Variables</CardTitle>
                                        <CardDescription>
                                            Define what information your agent needs to collect
                                        </CardDescription>
                                    </div>
                                    <Button onClick={addVariable}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Variable
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {config.variables.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No variables configured</p>
                                        <p className="text-sm mt-1">
                                            Add variables like property_address, email, etc.
                                        </p>
                                    </div>
                                ) : (
                                    config.variables.map((variable) => (
                                        <Card key={variable.id} className="border-2">
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Input
                                                            value={variable.name}
                                                            onChange={(e) =>
                                                                updateVariable(variable.id, {
                                                                    name: e.target.value,
                                                                })
                                                            }
                                                            placeholder="variable_name"
                                                            className="w-48 font-mono text-sm"
                                                        />
                                                        <Badge
                                                            variant={
                                                                variable.required ? 'default' : 'secondary'
                                                            }
                                                            className="cursor-pointer"
                                                            onClick={() => {
                                                                const newRequired = !variable.required;
                                                                updateVariable(variable.id, {
                                                                    required: newRequired,
                                                                });

                                                                // Update system prompt to reflect new required status
                                                                const oldText = variable.required ? 'REQUIRED - You must collect this before proceeding.' : 'OPTIONAL';
                                                                const newText = newRequired ? 'REQUIRED - You must collect this before proceeding.' : 'OPTIONAL';

                                                                if (config.systemPrompt.includes(oldText)) {
                                                                    handleUpdateConfig({
                                                                        systemPrompt: config.systemPrompt.replace(oldText, newText)
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            {variable.required ? 'Required' : 'Optional'}
                                                        </Badge>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteVariable(variable.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs text-muted-foreground">
                                                            Display Name
                                                        </label>
                                                        <Input
                                                            value={variable.displayName}
                                                            onChange={(e) =>
                                                                updateVariable(variable.id, {
                                                                    displayName: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Property Address"
                                                            className="text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-muted-foreground">
                                                            Type
                                                        </label>
                                                        <select
                                                            value={variable.type}
                                                            onChange={(e) =>
                                                                updateVariable(variable.id, {
                                                                    type: e.target.value as AgentVariable['type'],
                                                                })
                                                            }
                                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        >
                                                            <option value="string">String</option>
                                                            <option value="number">Number</option>
                                                            <option value="email">Email</option>
                                                            <option value="phone">Phone</option>
                                                            <option value="address">Address</option>
                                                            <option value="datetime">Date/Time</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs text-muted-foreground">
                                                        Description (for AI)
                                                    </label>
                                                    <Textarea
                                                        value={variable.description}
                                                        onChange={(e) =>
                                                            updateVariable(variable.id, {
                                                                description: e.target.value,
                                                            })
                                                        }
                                                        placeholder="What is this variable for?"
                                                        rows={2}
                                                        className="text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-muted-foreground">
                                                        Extraction Prompt (optional)
                                                    </label>
                                                    <Input
                                                        value={variable.extractionPrompt || ''}
                                                        onChange={(e) =>
                                                            updateVariable(variable.id, {
                                                                extractionPrompt: e.target.value,
                                                            })
                                                        }
                                                        placeholder="What's the property address?"
                                                        className="text-sm"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Functions Tab */}
                    <TabsContent value="functions" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Functions</CardTitle>
                                        <CardDescription>
                                            Define what actions your agent can perform
                                        </CardDescription>
                                    </div>
                                    <Button onClick={addFunction}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Function
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {config.functions.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Code className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No functions configured</p>
                                        <p className="text-sm mt-1">
                                            Add functions like set_appointment, send_email, etc.
                                        </p>
                                    </div>
                                ) : (
                                    config.functions.map((func) => (
                                        <Card key={func.id} className="border-2">
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Input
                                                            value={func.name}
                                                            onChange={(e) =>
                                                                updateFunction(func.id, {
                                                                    name: e.target.value,
                                                                })
                                                            }
                                                            placeholder="function_name"
                                                            className="w-48 font-mono text-sm"
                                                        />
                                                        <Badge
                                                            variant={func.enabled ? 'default' : 'secondary'}
                                                            className="cursor-pointer"
                                                            onClick={() =>
                                                                updateFunction(func.id, {
                                                                    enabled: !func.enabled,
                                                                })
                                                            }
                                                        >
                                                            {func.enabled ? 'Enabled' : 'Disabled'}
                                                        </Badge>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteFunction(func.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>

                                                <div>
                                                    <label className="text-xs text-muted-foreground">
                                                        Display Name
                                                    </label>
                                                    <Input
                                                        value={func.displayName}
                                                        onChange={(e) =>
                                                            updateFunction(func.id, {
                                                                displayName: e.target.value,
                                                            })
                                                        }
                                                        placeholder="Book Appointment"
                                                        className="text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-muted-foreground">
                                                        Description
                                                    </label>
                                                    <Textarea
                                                        value={func.description}
                                                        onChange={(e) =>
                                                            updateFunction(func.id, {
                                                                description: e.target.value,
                                                            })
                                                        }
                                                        placeholder="What does this function do?"
                                                        rows={2}
                                                        className="text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-2 block">
                                                        Variables Used in This Function
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {config.variables.map((variable) => {
                                                            const isUsed = func.variables.includes(variable.id)
                                                            return (
                                                                <Badge
                                                                    key={variable.id}
                                                                    variant={isUsed ? 'default' : 'outline'}
                                                                    className="cursor-pointer"
                                                                    onClick={() =>
                                                                        toggleVariableInFunction(
                                                                            func.id,
                                                                            variable.id
                                                                        )
                                                                    }
                                                                >
                                                                    {isUsed ? '✓ ' : '+ '}
                                                                    {variable.displayName}
                                                                    {variable.required && ' *'}
                                                                </Badge>
                                                            )
                                                        })}
                                                        {config.variables.length === 0 && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Add variables first, then assign them to functions
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Preview Tab */}
                    <TabsContent value="preview" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuration Preview</CardTitle>
                                <CardDescription>
                                    See what will be sent to VAPI when you deploy
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!preview ? (
                                    <div className="text-center py-8">
                                        <Button onClick={handlePreview}>
                                            <Eye className="h-4 w-4 mr-2" /> Generate Preview
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">System Prompt:</h4>
                                            <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                                                {preview.systemPrompt}
                                            </pre>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">
                                                Function Configurations:
                                            </h4>
                                            <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
                                                {JSON.stringify(preview.functions, null, 2)}
                                            </pre>
                                        </div>
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

