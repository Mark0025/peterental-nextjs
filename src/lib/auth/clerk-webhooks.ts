/**
 * Clerk Webhooks for User Synchronization
 * 
 * This handles Clerk webhook events to keep your database in sync:
 * - user.created: Create user in your database
 * - user.updated: Update user data
 * - user.deleted: Handle user deletion
 */

import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createUserInDatabase } from './user-sync'

export async function handleClerkWebhook(req: Request) {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
      throw new Error('CLERK_WEBHOOK_SECRET is not set')
    }

    // Get the headers
    const svix_id = req.headers.get('svix-id')
    const svix_timestamp = req.headers.get('svix-timestamp')
    const svix_signature = req.headers.get('svix-signature')

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Error occured -- no svix headers', { status: 400 })
    }

    // Get the body
    const payload = await req.text()
    const body = JSON.parse(payload)

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return new Response('Error occured', { status: 400 })
    }

    // Handle the webhook
    const eventType = evt.type

    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name, created_at, updated_at } = evt.data

      // Create user in your database
      const userData = {
        id,
        emailAddresses: email_addresses,
        firstName: first_name,
        lastName: last_name,
        createdAt: created_at,
        updatedAt: updated_at,
      }

      const createdUser = await createUserInDatabase(userData)
      
      if (createdUser) {
        console.log('User created in database:', createdUser.id)
      } else {
        console.error('Failed to create user in database')
      }
    }

    if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, updated_at } = evt.data

      // Update user in your database
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/by-clerk-id/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
          body: JSON.stringify({
            email: email_addresses[0]?.email_address,
            first_name,
            last_name,
            updated_at: new Date(updated_at).toISOString(),
          }),
        }
      )

      if (response.ok) {
        console.log('User updated in database:', id)
      } else {
        console.error('Failed to update user in database')
      }
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data

      // Handle user deletion (soft delete or anonymize data)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/by-clerk-id/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        }
      )

      if (response.ok) {
        console.log('User deleted from database:', id)
      } else {
        console.error('Failed to delete user from database')
      }
    }

    return new Response('', { status: 200 })
  } catch (err) {
    console.error('Error handling webhook:', err)
    return new Response('Error occured', { status: 400 })
  }
}
