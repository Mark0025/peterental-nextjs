'use client'

import { useState, useEffect } from 'react'
import { Search, Home, DollarSign, Bed, Bath, Square, MapPin, ExternalLink, Loader2, AlertCircle, Filter } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useCurrentUser } from '@/hooks/use-current-user'

interface RentalProperty {
  id: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  square_feet?: number
  property_type?: string
  availability_date?: string
  description?: string
  source_website: string
  source_url: string
  created_at: string
}

export default function RentalsPage() {
  const { user, isLoading: userLoading } = useCurrentUser()
  const [rentals, setRentals] = useState<RentalProperty[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minBedrooms, setMinBedrooms] = useState('')
  const [website, setWebsite] = useState('')

  // Mock data for demonstration (replace with actual API call)
  const mockRentals: RentalProperty[] = [
    {
      id: '1',
      address: '123 Main St, Austin, TX 78701',
      price: 2500,
      bedrooms: 2,
      bathrooms: 2,
      square_feet: 1200,
      property_type: 'Apartment',
      availability_date: '2025-12-01',
      description: 'Beautiful 2BR/2BA apartment in downtown Austin with modern amenities',
      source_website: 'apartments.com',
      source_url: 'https://www.apartments.com/example',
      created_at: '2025-10-29T00:00:00Z'
    },
    {
      id: '2',
      address: '456 Oak Ave, Austin, TX 78704',
      price: 3200,
      bedrooms: 3,
      bathrooms: 2.5,
      square_feet: 1800,
      property_type: 'House',
      availability_date: '2025-11-15',
      description: 'Spacious 3BR house with large backyard and garage',
      source_website: 'zillow.com',
      source_url: 'https://www.zillow.com/example',
      created_at: '2025-10-28T00:00:00Z'
    },
    {
      id: '3',
      address: '789 Elm St, Austin, TX 78702',
      price: 1800,
      bedrooms: 1,
      bathrooms: 1,
      square_feet: 850,
      property_type: 'Condo',
      availability_date: '2025-12-15',
      description: 'Cozy 1BR condo near public transit',
      source_website: 'trulia.com',
      source_url: 'https://www.trulia.com/example',
      created_at: '2025-10-27T00:00:00Z'
    }
  ]

  useEffect(() => {
    if (!user) return
    
    // Load user-scoped rentals
    // TODO: Replace with actual API call to /database/available?user_id=...
    // Backend will filter by user_id automatically based on JWT
    setRentals(mockRentals)
  }, [user])

  const handleSearch = async () => {
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual API call
      // const params = new URLSearchParams()
      // if (website) params.append('website', website)
      // if (maxPrice) params.append('max_price', maxPrice)
      // if (minBedrooms) params.append('min_bedrooms', minBedrooms)
      // const response = await fetch(`/api/rentals?${params}`)
      // const data = await response.json()
      // setRentals(data.rentals)

      // Mock filter logic
      let filtered = mockRentals

      if (searchQuery) {
        filtered = filtered.filter(r =>
          r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      if (maxPrice) {
        filtered = filtered.filter(r => r.price <= parseInt(maxPrice))
      }

      if (minBedrooms) {
        filtered = filtered.filter(r => r.bedrooms >= parseInt(minBedrooms))
      }

      if (website) {
        filtered = filtered.filter(r => r.source_website.includes(website.toLowerCase()))
      }

      setRentals(filtered)
    } catch (err) {
      console.error('Failed to fetch rentals:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch rentals')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSearchQuery('')
    setMaxPrice('')
    setMinBedrooms('')
    setWebsite('')
    setRentals(mockRentals)
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
          {user?.email?.includes('mark@') && (
            <a href="/admin/testing">
              <Button variant="outline" size="sm">
                Admin Testing
              </Button>
            </a>
          )}
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

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {rentals.length} {rentals.length === 1 ? 'property' : 'properties'} found
          </p>
        </div>

        {rentals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground">No properties found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rentals.map((rental) => (
              <Card key={rental.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {rental.address}
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
                    {rental.availability_date && (
                      <Badge variant="outline">
                        Available: {new Date(rental.availability_date).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1" size="sm">
                      <MapPin className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                    <a
                      href={rental.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-3 py-2 text-sm border rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {/* Source */}
                  <p className="text-xs text-muted-foreground">
                    Source: {rental.source_website}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

