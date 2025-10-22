/**
 * Clerk Webhook Endpoint
 * 
 * This endpoint receives webhook events from Clerk when users:
 * - Sign up (user.created)
 * - Update their profile (user.updated) 
 * - Delete their account (user.deleted)
 * 
 * It automatically syncs these changes with your database.
 */

import { handleClerkWebhook } from '@/lib/auth/clerk-webhooks'

export async function POST(req: Request) {
  return await handleClerkWebhook(req)
}
