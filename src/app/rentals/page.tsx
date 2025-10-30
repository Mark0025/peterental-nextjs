'use client'

import { useState, useEffect } from 'react'
import { Search, Home, DollarSign, Bed, Bath, Square, MapPin, ExternalLink, Loader2, AlertCircle, Filter, Plus } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useCurrentUser } from '@/hooks/use-current-user'
import { getAvailableRentals } from '@/actions/rental-actions'
import type { RentalProperty } from '@/types'

export default function RentalsPage() {
    const { user, isLoading: userLoading } = useCurrentUser()
    const [allRentals, setAllRentals] = useState<RentalProperty[]>([])
    const [filteredRentals, setFilteredRentals] = useState<RentalProperty[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showFilters, setShowFilters] = useState(false)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [maxPrice, setMaxPrice] = useState('')
    const [minBedrooms, setMinBedrooms] = useState('')
    const [website, setWebsite] = useState('')

    // Load rentals from backend
    useEffect(() => {
        if (!user) return

        const fetchRentals = async () => {
            setLoading(true)
            setError(null)

            try {
                console.log('🏠 Fetching user-scoped rentals from backend...')
                const rentals = await getAvailableRentals()
                console.log(`✅ Fetched ${rentals.length} rentals`)
                setAllRentals(rentals)
                setFilteredRentals(rentals)
            } catch (err) {
                console.error('❌ Failed to fetch rentals:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch rentals')
            } finally {
                setLoading(false)
            }
        }

        fetchRentals()
    }, [user])

    // Apply filters
    const applyFilters = () => {
        let filtered = [...allRentals]

        // Search query filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(r =>
                r.property_address?.toLowerCase().includes(query) ||
                r.description?.toLowerCase().includes(query)
            )
        }

        // Price filter
        if (maxPrice) {
            const max = parseFloat(maxPrice)
            filtered = filtered.filter(r => r.price <= max)
        }

        // Bedrooms filter
        if (minBedrooms) {
            const min = parseInt(minBedrooms)
            filtered = filtered.filter(r => r.bedrooms >= min)
        }

        // Website filter
        if (website) {
            const websiteQuery = website.toLowerCase()
            filtered = filtered.filter(r =>
                r.website?.toLowerCase().includes(websiteQuery)
            )
        }

        setFilteredRentals(filtered)
    }

    const handleSearch = () => {
        applyFilters()
    }

    const handleReset = () => {
        setSearchQuery('')
        setMaxPrice('')
        setMinBedrooms('')
        setWebsite('')
        setFilteredRentals(allRentals)
    }

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Rental Properties</h1>
                        <p className="text-muted-foreground">
                            Search and browse available rental properties
                            {user && <span className="text-xs ml-2">• Showing your properties</span>}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/rentals/new">
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Property
                            </Button>
                        </Link>
                        {user?.email?.includes('mark@') && (
                            <Link href="/admin/testing">
                                <Button variant="outline" size="sm">
                                    Admin Testing
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Search Properties
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            {showFilters ? 'Hide' : 'Show'} Filters
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Main Search */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search by address or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={loading}>
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="maxPrice">Max Price</Label>
                                <Input
                                    id="maxPrice"
                                    type="number"
                                    placeholder="e.g. 2500"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minBedrooms">Min Bedrooms</Label>
                                <Input
                                    id="minBedrooms"
                                    type="number"
                                    placeholder="e.g. 2"
                                    value={minBedrooms}
                                    onChange={(e) => setMinBedrooms(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    placeholder="e.g. zillow.com"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-3 flex gap-2">
                                <Button variant="outline" onClick={handleReset} className="flex-1">
                                    Reset Filters
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Loading State */}
            {loading && !error && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="ml-3 text-muted-foreground">Loading rentals...</p>
                </div>
            )}

            {/* Results */}
            {!loading && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-muted-foreground">
                            {filteredRentals.length} {filteredRentals.length === 1 ? 'property' : 'properties'} found
                        </p>
                    </div>

                    {filteredRentals.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-muted-foreground">No properties found</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {allRentals.length === 0
                                        ? 'No rentals have been added yet'
                                        : 'Try adjusting your search filters'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredRentals.map((rental) => (
                                <Card key={rental.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg line-clamp-2">
                                                    {rental.property_address}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-1 mt-2">
                                                    <DollarSign className="h-3 w-3" />
                                                    ${rental.price.toLocaleString()}/mo
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Property Details */}
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="flex items-center gap-1">
                                                <Bed className="h-4 w-4 text-muted-foreground" />
                                                {rental.bedrooms} bed
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Bath className="h-4 w-4 text-muted-foreground" />
                                                {rental.bathrooms} bath
                                            </span>
                                            {rental.square_feet && (
                                                <span className="flex items-center gap-1">
                                                    <Square className="h-4 w-4 text-muted-foreground" />
                                                    {rental.square_feet.toLocaleString()} sqft
                                                </span>
                                            )}
                                        </div>

                                        {/* Description */}
                                        {rental.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {rental.description}
                                            </p>
                                        )}

                                        {/* Badges */}
                                        <div className="flex flex-wrap gap-2">
                                            {rental.property_type && (
                                                <Badge variant="secondary">{rental.property_type}</Badge>
                                            )}
                                            {rental.available_date && (
                                                <Badge variant="outline">
                                                    Available: {new Date(rental.available_date).toLocaleDateString()}
                                                </Badge>
                                            )}
                                            {rental.source_type && (
                                                <Badge variant="outline">{rental.source_type === 'scraped' ? 'Auto' : 'Manual'}</Badge>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            <Link href={`/rentals/${rental.id}`} className="flex-1">
                                                <Button className="w-full" size="sm">
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    View Details
                                                </Button>
                                            </Link>
                                            {rental.url && (
                                                <a
                                                    href={rental.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center px-3 py-2 text-sm border rounded-md hover:bg-gray-50 transition-colors"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>

                                        {/* Source */}
                                        {rental.website && (
                                            <p className="text-xs text-muted-foreground">
                                                Source: {rental.website}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
