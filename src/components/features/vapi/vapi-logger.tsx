'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Terminal, Trash2, Download } from 'lucide-react'

export interface VAPILog {
    timestamp: string
    type: 'function_call' | 'function_response' | 'message' | 'error'
    functionName?: string
    parameters?: Record<string, unknown>
    response?: unknown
    message?: string
    error?: string
}

export function VAPILogger() {
    const [logs, setLogs] = useState<VAPILog[]>([])

    // Load logs from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('vapi_logs')
        if (stored) {
            try {
                setLogs(JSON.parse(stored))
            } catch (e) {
                console.error('Failed to parse VAPI logs', e)
            }
        }

        // Listen for new logs
        const handleLogEvent = (event: CustomEvent<VAPILog>) => {
            setLogs(prev => {
                const newLogs = [...prev, event.detail]
                localStorage.setItem('vapi_logs', JSON.stringify(newLogs))
                return newLogs
            })
        }

        window.addEventListener('vapi-log', handleLogEvent as EventListener)
        return () => window.removeEventListener('vapi-log', handleLogEvent as EventListener)
    }, [])

    const clearLogs = () => {
        setLogs([])
        localStorage.removeItem('vapi_logs')
    }

    const exportLogs = () => {
        const dataStr = JSON.stringify(logs, null, 2)
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
        const exportFileDefaultName = `vapi-logs-${new Date().toISOString()}.json`
        const linkElement = document.createElement('a')
        linkElement.setAttribute('href', dataUri)
        linkElement.setAttribute('download', exportFileDefaultName)
        linkElement.click()
    }

    const getLogColor = (type: VAPILog['type']) => {
        switch (type) {
            case 'function_call':
                return 'bg-blue-100 text-blue-800 border-blue-300'
            case 'function_response':
                return 'bg-green-100 text-green-800 border-green-300'
            case 'message':
                return 'bg-gray-100 text-gray-800 border-gray-300'
            case 'error':
                return 'bg-red-100 text-red-800 border-red-300'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Terminal className="h-5 w-5" />
                            VAPI Interaction Log
                        </CardTitle>
                        <CardDescription>
                            Real-time logging of VAPI function calls and responses
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={exportLogs} disabled={logs.length === 0}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button variant="destructive" size="sm" onClick={clearLogs} disabled={logs.length === 0}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No VAPI interactions yet</p>
                        <p className="text-sm mt-1">Start a call to see logs here</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs">
                        {logs.map((log, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded border ${getLogColor(log.type)}`}
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <Badge variant="outline" className="text-xs">
                                        {log.type}
                                    </Badge>
                                    <span className="text-xs opacity-70">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>

                                {log.functionName && (
                                    <div className="mt-2">
                                        <strong>Function:</strong> {log.functionName}
                                    </div>
                                )}

                                {log.parameters && (
                                    <div className="mt-2">
                                        <strong>Parameters:</strong>
                                        <pre className="mt-1 p-2 bg-white/50 rounded overflow-x-auto">
                                            {JSON.stringify(log.parameters, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {log.response && (
                                    <div className="mt-2">
                                        <strong>Response:</strong>
                                        <pre className="mt-1 p-2 bg-white/50 rounded overflow-x-auto">
                                            {JSON.stringify(log.response, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {log.message && (
                                    <div className="mt-2">
                                        <strong>Message:</strong> {log.message}
                                    </div>
                                )}

                                {log.error && (
                                    <div className="mt-2">
                                        <strong>Error:</strong> {log.error}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Helper function to log VAPI interactions from anywhere
export function logVAPIInteraction(log: Omit<VAPILog, 'timestamp'>) {
    const event = new CustomEvent('vapi-log', {
        detail: {
            ...log,
            timestamp: new Date().toISOString(),
        },
    })
    window.dispatchEvent(event)
}

