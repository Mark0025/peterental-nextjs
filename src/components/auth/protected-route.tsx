'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { Loader2, Shield } from 'lucide-react'

interface ProtectedRouteProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
    const { isSignedIn, isLoaded } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            // Optional: redirect to sign-in page instead of showing fallback
            // router.push('/sign-in')
        }
    }, [isLoaded, isSignedIn, router])

    // Show loading state while Clerk is initializing
    if (!isLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <p className="mt-4 text-sm text-gray-600">Loading authentication...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Show sign-in prompt if not authenticated
    if (!isSignedIn) {
        if (fallback) {
            return <>{fallback}</>
        }

        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                            <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl">Authentication Required</CardTitle>
                        <CardDescription>
                            Please sign in to access PeteRental&apos;s property management features.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3">
                            <SignInButton mode="modal">
                                <Button className="w-full" size="lg">
                                    Sign In
                                </Button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <Button variant="outline" className="w-full" size="lg">
                                    Create Account
                                </Button>
                            </SignUpButton>
                        </div>
                        <p className="text-center text-xs text-gray-500">
                            Secure access to your rental property management dashboard
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // User is authenticated, show protected content
    return <>{children}</>
}
