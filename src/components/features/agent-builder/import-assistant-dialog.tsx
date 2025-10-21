/**
 * Import Existing VAPI Assistant Dialog
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Download, CheckCircle2, XCircle } from 'lucide-react'
import { importVAPIAssistant, listVAPIAssistants } from '@/actions/agent-config-actions'
import { useUser } from '@/lib/hooks/use-user'
import { useAgentConfig } from '@/lib/hooks/use-agent-config'

export function ImportAssistantDialog({ onClose }: { onClose: () => void }) {
    const { userId } = useUser()
    const { createConfig } = useAgentConfig()
    const [assistantId, setAssistantId] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingList, setLoadingList] = useState(false)
    const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)
    interface VAPIAssistant {
        id: string
        name: string
    }

    const [assistants, setAssistants] = useState<VAPIAssistant[]>([])

    const handleImport = async () => {
        if (!assistantId.trim() || !userId) return

        setLoading(true)
        setResult(null)

        try {
            const result = await importVAPIAssistant(assistantId.trim(), userId)

            if (result.success && result.config) {
                // Create config in local storage
                createConfig(result.config)
                setResult({ success: true })
                setTimeout(() => {
                    onClose()
                }, 1500)
            } else {
                setResult({ success: false, error: result.error })
            }
        } catch (error) {
            setResult({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleLoadAssistants = async () => {
        setLoadingList(true)
        try {
            const result = await listVAPIAssistants()
            if (result.success) {
                setAssistants(result.assistants)
            } else {
                console.error('Failed to load assistants:', result.error)
            }
        } catch (error) {
            console.error('Failed to load assistants:', error)
        } finally {
            setLoadingList(false)
        }
    }

    // Auto-load assistants on mount
    useEffect(() => {
        handleLoadAssistants()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <CardTitle>Import Existing VAPI Assistant</CardTitle>
                    <CardDescription>
                        Import an assistant from your VAPI Dashboard to edit in the agent builder
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Manual Import */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            VAPI Assistant ID
                        </label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g., 3fe56141-7c5b-4b98-bf4b-f857317f738b"
                                value={assistantId}
                                onChange={(e) => setAssistantId(e.target.value)}
                                className="flex-1 font-mono text-sm"
                                disabled={loading}
                            />
                            <Button onClick={handleImport} disabled={loading || !assistantId.trim()}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" /> Import
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Result */}
                    {result && (
                        <Alert variant={result.success ? 'default' : 'destructive'}>
                            {result.success ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertDescription>
                                        Assistant imported successfully! Redirecting...
                                    </AlertDescription>
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4" />
                                    <AlertDescription>{result.error}</AlertDescription>
                                </>
                            )}
                        </Alert>
                    )}

                    {/* Load All Assistants */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium">
                                {assistants.length > 0 ? `Your VAPI Assistants (${assistants.length})` : 'Your VAPI Assistants'}
                            </h3>
                            <Button
                                onClick={handleLoadAssistants}
                                variant="outline"
                                size="sm"
                                disabled={loadingList}
                            >
                                {loadingList ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
                                    </>
                                ) : (
                                    'Refresh'
                                )}
                            </Button>
                        </div>

                        {loadingList && assistants.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                <p>Loading your assistants...</p>
                            </div>
                        )}

                        {!loadingList && assistants.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground border rounded-md">
                                <p>No assistants found in your VAPI account.</p>
                                <p className="text-sm mt-1">Create one at dashboard.vapi.ai first.</p>
                            </div>
                        )}

                        {assistants.length > 0 && (
                            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                                {assistants.map((assistant) => (
                                    <div
                                        key={assistant.id}
                                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                                        onClick={() => setAssistantId(assistant.id)}
                                    >
                                        <div>
                                            <p className="font-medium text-sm">{assistant.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                {assistant.id}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setAssistantId(assistant.id)
                                            }}
                                        >
                                            Select
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

