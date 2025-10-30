'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, Loader2, Home, AlertCircle } from 'lucide-react'
import { updateRental } from '@/actions/rental-actions'
import { useCurrentUser } from '@/hooks/use-current-user'
import type { RentalProperty } from '@/types'
import Link from 'next/link'

export default function EditRentalPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { user, isLoading: userLoading } = useCurrentUser()
    const [rental, setRental] = useState<RentalProperty | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        price: '',
        bedrooms: '',
        bathrooms: '',
        square_feet: '',
        description: '',
        available_date: '',
        contact_info: '',
    })

    useEffect(() => {
        const fetchRental = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/database/available`)
                if (!response.ok) throw new Error('Failed to fetch rentals')

                const data = await response.json()
                const rentals: RentalProperty[] = data.rentals || []
                const found = rentals.find((r) => r.id.toString() === id)

                if (!found) {
                    setError('Property not found or you do not have access')
                } else {
                    setRental(found)
                    setFormData({
                        price: found.price?.toString() || '',
                        bedrooms: found.bedrooms?.toString() || '',
                        bathrooms: found.bathrooms?.toString() || '',
                        square_feet: found.square_feet?.toString() || '',
                        description: found.description || '',
                        available_date: found.available_date ? found.available_date.split('T')[0] : '',
                        contact_info: found.contact_info || '',
                    })
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load property')
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchRental()
        }
    }, [id, user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            if (!formData.price || !formData.bedrooms || !formData.bathrooms) {
                throw new Error('Please fill in all required fields')
            }

            const updates = {
                price: parseFloat(formData.price),
                bedrooms: parseInt(formData.bedrooms),
                bathrooms: parseFloat(formData.bathrooms),
                square_feet: formData.square_feet ? parseInt(formData.square_feet) : undefined,
                description: formData.description.trim() || undefined,
                available_date: formData.available_date || undefined,
                contact_info: formData.contact_info.trim() || undefined,
            }

            console.log('📝 Updating rental:', updates)
            await updateRental(parseInt(id), updates)
            console.log('✅ Rental updated')

            router.push(`/rentals/${id}`)
        } catch (err) {
            console.error('❌ Failed to update rental:', err)
            setError(err instanceof Error ? err.message : 'Failed to update property')
        } finally {
            setSaving(false)
        }
    }

    if (userLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (error || !rental) {
        return (
            <div className="container mx-auto py-8 max-w-3xl">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error || 'Property not found'}</AlertDescription>
                </Alert>
                <Link href="/rentals">
                    <Button className="mt-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Properties
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 max-w-3xl">
            <div className="mb-6">
                <Link href={`/rentals/${id}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Property
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-blue-600" />
                        <CardTitle>Edit Property</CardTitle>
                    </div>
                    <CardDescription>
                        {rental.property_address}
                    </CardDescription>
                    <div className="text-xs text-muted-foreground mt-2">
                        Note: Property address cannot be changed
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">
                                    Monthly Rent <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bedrooms">
                                    Bedrooms <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="bedrooms"
                                    type="number"
                                    value={formData.bedrooms}
                                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                                    required
                                    min="0"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bathrooms">
                                    Bathrooms <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="bathrooms"
                                    type="number"
                                    value={formData.bathrooms}
                                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                                    required
                                    min="0"
                                    step="0.5"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="square_feet">Square Feet</Label>
                            <Input
                                id="square_feet"
                                type="number"
                                value={formData.square_feet}
                                onChange={(e) => setFormData({ ...formData, square_feet: e.target.value })}
                                min="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="available_date">Available Date</Label>
                            <Input
                                id="available_date"
                                type="date"
                                value={formData.available_date}
                                onChange={(e) => setFormData({ ...formData, available_date: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_info">Contact Info</Label>
                            <Input
                                id="contact_info"
                                value={formData.contact_info}
                                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Link href={`/rentals/${id}`} className="flex-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

