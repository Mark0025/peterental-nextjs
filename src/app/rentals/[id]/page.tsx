'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, Edit, Trash2, Home, DollarSign, Bed, Bath, Square, Calendar, Phone, Loader2, AlertCircle } from 'lucide-react'
import { deleteRental } from '@/actions/rental-actions'
import { useCurrentUser } from '@/hooks/use-current-user'
import type { RentalProperty } from '@/types'
import Link from 'next/link'

export default function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isLoading: userLoading } = useCurrentUser()
  const [rental, setRental] = useState<RentalProperty | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRental = async () => {
      try {
        // Fetch from backend - it will filter by user_id automatically
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/database/available`)
        if (!response.ok) throw new Error('Failed to fetch rentals')

        const data = await response.json()
        const rentals: RentalProperty[] = data.rentals || []
        const found = rentals.find((r) => r.id.toString() === id)

        if (!found) {
          setError('Property not found or you do not have access')
        } else {
          setRental(found)
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

  const handleDelete = async () => {
    if (!rental) return

    const confirmed = window.confirm(
      `Are you sure you want to delete this property?\n\n${rental.property_address}\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    setDeleting(true)
    try {
      await deleteRental(rental.id)
      router.push('/rentals')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete property')
      setDeleting(false)
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
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/rentals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/rentals/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Home className="h-6 w-6 text-blue-600" />
                {rental.property_address}
              </CardTitle>
              <CardDescription className="mt-2">
                {rental.source_type === 'manual' ? 'Manually added property' : `Scraped from ${rental.website}`}
              </CardDescription>
            </div>
            {rental.source_type && (
              <Badge variant={rental.source_type === 'manual' ? 'default' : 'secondary'}>
                {rental.source_type === 'manual' ? 'Manual' : 'Scraped'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price */}
          <div className="flex items-center gap-2 text-3xl font-bold text-blue-600">
            <DollarSign className="h-8 w-8" />
            ${rental.price.toLocaleString()}/mo
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Bed className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{rental.bedrooms}</div>
                <div className="text-sm text-muted-foreground">Bedrooms</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{rental.bathrooms}</div>
                <div className="text-sm text-muted-foreground">Bathrooms</div>
              </div>
            </div>
            {rental.square_feet && (
              <div className="flex items-center gap-2">
                <Square className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{rental.square_feet.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">sq ft</div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {rental.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{rental.description}</p>
            </div>
          )}

          {/* Available Date */}
          {rental.available_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Available</div>
                <div className="font-medium">{new Date(rental.available_date).toLocaleDateString()}</div>
              </div>
            </div>
          )}

          {/* Contact Info */}
          {rental.contact_info && (
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Contact</div>
                <div className="font-medium">{rental.contact_info}</div>
              </div>
            </div>
          )}

          {/* Property Type */}
          {rental.property_type && (
            <div>
              <Badge variant="outline">{rental.property_type}</Badge>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
            <div>Added: {new Date(rental.created_at).toLocaleDateString()}</div>
            {rental.website && (
              <div>Source: {rental.website}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

