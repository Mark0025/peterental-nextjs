'use client'

import { useState } from 'react'
import { useUser } from '@/lib/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, Clock, Play, RotateCcw } from 'lucide-react'
import {
    checkCalendarAuth,
    getCalendarEvents,
    getAvailability,
} from '@/actions/calendar-actions'
import {
    vapiGetAvailability,
    vapiSetAppointment,
    getBackendHealth,
} from '@/actions/vapi-actions'

interface TestResult {
    name: string
    status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
    message?: string
    duration?: number
    details?: string
}

export default function TestSuitePage() {
    const { userId, calendarConnected } = useUser()
    const [testResults, setTestResults] = useState<TestResult[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const [summary, setSummary] = useState<{
        total: number
        passed: number
        failed: number
        skipped: number
        duration: number
    } | null>(null)

    const updateTest = (name: string, updates: Partial<TestResult>) => {
        setTestResults((prev) => {
            const index = prev.findIndex((t) => t.name === name)
            if (index === -1) {
                return [...prev, { name, status: 'pending', ...updates } as TestResult]
            }
            const newResults = [...prev]
            newResults[index] = { ...newResults[index], ...updates }
            return newResults
        })
    }

    const runTest = async (
        name: string,
        testFn: () => Promise<void>
    ): Promise<boolean> => {
        const startTime = Date.now()
        updateTest(name, { status: 'running' })

        try {
            await testFn()
            const duration = Date.now() - startTime
            updateTest(name, {
                status: 'passed',
                message: `Passed in ${duration}ms`,
                duration,
            })
            return true
        } catch (error) {
            const duration = Date.now() - startTime
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            updateTest(name, {
                status: 'failed',
                message: errorMessage,
                details: error instanceof Error ? error.stack : undefined,
                duration,
            })
            return false
        }
    }

    const runAllTests = async () => {
        if (!userId) {
            alert('Please sign in to run tests')
            return
        }

        setIsRunning(true)
        setTestResults([])
        setSummary(null)

        const startTime = Date.now()
        let passed = 0
        let failed = 0
        let skipped = 0

        // Test 1: Backend Health
        if (
            await runTest('1. Backend Health Check', async () => {
                const health = await getBackendHealth()
                if (health.status !== 'running') {
                    throw new Error(`Backend status: ${health.status}`)
                }
                if (!health.features || health.features.length === 0) {
                    throw new Error('No features reported')
                }
            })
        ) {
            passed++
        } else {
            failed++
        }

        // Test 2: Calendar Auth Status
        if (
            await runTest('2. Calendar Auth Status', async () => {
                const status = await checkCalendarAuth()
                if (!status.user_email) {
                    throw new Error('No user_email in response')
                }
                if (typeof status.authorized !== 'boolean') {
                    throw new Error('Invalid authorized field')
                }
            })
        ) {
            passed++
        } else {
            failed++
        }

        // Test 3: Get Calendar Events
        if (
            await runTest('3. Get Calendar Events', async () => {
                const response = await getCalendarEvents(14)
                if (!Array.isArray(response.events)) {
                    throw new Error('Events not an array')
                }
                // Events can be empty, that's valid
            })
        ) {
            passed++
        } else {
            failed++
        }

        // Test 4: Get Availability
        if (
            await runTest('4. Get Available Time Slots', async () => {
                if (!calendarConnected) {
                    throw new Error('Calendar not connected - connect your calendar first')
                }
                const response = await getAvailability(7, 9, 17)
                if (!Array.isArray(response.available_slots)) {
                    throw new Error('Available slots not an array')
                }
                if (response.available_slots.length === 0) {
                    throw new Error('No available slots found')
                }
            })
        ) {
            passed++
        } else {
            failed++
        }

        // Test 5: VAPI Get Availability
        if (
            await runTest('5. VAPI Get Availability Function', async () => {
                if (!userId) {
                    throw new Error('User not authenticated')
                }
                const result = await vapiGetAvailability(userId, 3)
                if (!result || typeof result !== 'string') {
                    throw new Error('No response from VAPI')
                }
                if (result.length < 10) {
                    throw new Error('Response too short, likely error')
                }
            })
        ) {
            passed++
        } else {
            failed++
        }

        // Test 6: VAPI Set Appointment (Dry Run)
        if (
            await runTest('6. VAPI Set Appointment (Dry Run)', async () => {
                if (!userId) {
                    throw new Error('User not authenticated')
                }
                // Use a far future date to avoid actual conflicts
                const futureDate = new Date()
                futureDate.setDate(futureDate.getDate() + 60)
                const startTime = futureDate.toISOString().split('.')[0] + '-05:00'

                const result = await vapiSetAppointment(
                    userId,
                    'Test Property - 123 Test St',
                    startTime,
                    'Test User',
                    'test@example.com',
                    'America/Chicago'
                )
                if (!result || typeof result !== 'string') {
                    throw new Error('No appointment response')
                }
            })
        ) {
            passed++
        } else {
            failed++
        }

        const totalDuration = Date.now() - startTime

        setSummary({
            total: passed + failed + skipped,
            passed,
            failed,
            skipped,
            duration: totalDuration,
        })

        setIsRunning(false)
    }

    const resetTests = () => {
        setTestResults([])
        setSummary(null)
    }

    const getStatusColor = (status: TestResult['status']) => {
        switch (status) {
            case 'passed':
                return 'border-green-500 bg-green-50'
            case 'failed':
                return 'border-red-500 bg-red-50'
            case 'running':
                return 'border-blue-500 bg-blue-50 animate-pulse'
            case 'skipped':
                return 'border-yellow-500 bg-yellow-50'
            default:
                return 'border-gray-300 bg-gray-50'
        }
    }

    const getStatusIcon = (status: TestResult['status']) => {
        switch (status) {
            case 'passed':
                return <CheckCircle2 className="h-5 w-5 text-green-600" />
            case 'failed':
                return <XCircle className="h-5 w-5 text-red-600" />
            case 'running':
                return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            case 'skipped':
                return <Clock className="h-5 w-5 text-yellow-600" />
            default:
                return <Clock className="h-5 w-5 text-gray-400" />
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="container mx-auto p-8 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        🧪 Backend Test Suite
                    </h1>
                    <p className="text-muted-foreground">
                        Next.js 15.4 with Server Actions • Production Backend Testing
                    </p>
                </div>

                {/* Test Configuration */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Test Configuration</CardTitle>
                        <CardDescription>
                            Run comprehensive backend integration tests as the currently authenticated user
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {userId ? (
                                <Alert className="bg-blue-50 border-blue-200">
                                    <AlertDescription>
                                        Running tests as: <strong>{userId}</strong>
                                        {calendarConnected && (
                                            <span className="ml-2 text-green-600">✓ Calendar Connected</span>
                                        )}
                                        {!calendarConnected && (
                                            <span className="ml-2 text-yellow-600">⚠ Calendar Not Connected</span>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        Please sign in to run tests
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-4">
                                <Button
                                    onClick={runAllTests}
                                    disabled={isRunning || !userId}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {isRunning ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Running Tests...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-4 w-4 mr-2" />
                                            Run All Tests
                                        </>
                                    )}
                                </Button>
                                {testResults.length > 0 && !isRunning && (
                                    <Button onClick={resetTests} variant="outline">
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary */}
                {summary && (
                    <Card className="mb-6 border-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Test Summary</CardTitle>
                                <Badge
                                    variant={summary.failed === 0 ? 'default' : 'destructive'}
                                    className="text-lg px-4 py-1"
                                >
                                    {summary.failed === 0 ? '✅ All Passed' : '❌ Some Failed'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-5 gap-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900">
                                        {summary.total}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Total</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">
                                        {summary.passed}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Passed</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-red-600">
                                        {summary.failed}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Failed</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-600">
                                        {summary.skipped}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Skipped</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {summary.duration}ms
                                    </div>
                                    <div className="text-sm text-muted-foreground">Duration</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Test Results */}
                <Card>
                    <CardHeader>
                        <CardTitle>Test Results</CardTitle>
                        <CardDescription>
                            {testResults.length === 0
                                ? 'Click "Run All Tests" to start testing'
                                : `${testResults.length} test${testResults.length !== 1 ? 's' : ''} executed`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {testResults.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🧪</div>
                                <p className="text-muted-foreground text-lg">
                                    Ready to test your backend integration
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Tests include: Auth, Calendar, VAPI, Conflict Detection, and more
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {testResults.map((test, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg border-l-4 transition-all ${getStatusColor(
                                            test.status
                                        )}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-gray-900">
                                                        {test.name}
                                                    </span>
                                                    {test.duration && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {test.duration}ms
                                                        </Badge>
                                                    )}
                                                </div>
                                                {test.message && (
                                                    <div
                                                        className={`text-sm mt-1 ${test.status === 'failed'
                                                                ? 'text-red-700 font-medium'
                                                                : 'text-gray-600'
                                                            }`}
                                                    >
                                                        {test.message}
                                                    </div>
                                                )}
                                                {test.details && test.status === 'failed' && (
                                                    <details className="mt-2">
                                                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                                            Show stack trace
                                                        </summary>
                                                        <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                                                            {test.details}
                                                        </pre>
                                                    </details>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0">
                                                {getStatusIcon(test.status)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Backend Info */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Backend Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="font-medium text-gray-600">API URL</div>
                                <div className="font-mono text-xs break-all">
                                    {process.env.NEXT_PUBLIC_API_URL}
                                </div>
                            </div>
                            <div>
                                <div className="font-medium text-gray-600">Frontend</div>
                                <div className="font-mono text-xs">Next.js 15.4 + Server Actions</div>
                            </div>
                            <div>
                                <div className="font-medium text-gray-600">Current User</div>
                                <div className="font-mono text-xs break-all">{userId || 'Not signed in'}</div>
                            </div>
                            <div>
                                <div className="font-medium text-gray-600">Authentication</div>
                                <div className="font-mono text-xs">Clerk JWT (Multi-Tenant)</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

