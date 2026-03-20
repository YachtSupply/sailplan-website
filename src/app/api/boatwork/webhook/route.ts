/**
 * POST /api/boatwork/webhook
 *
 * Receives inbound webhooks from Boatwork.co when the contractor's profile
 * is updated. Handles:
 *   - profile.updated       — new photos, services, about copy changed
 *   - reviews.new           — new review posted
 *   - verification.updated  — domain or email verification status changed
 *   - verification.badge    — Boatwork Verified Pro badge status updated
 *
 * Boatwork.co sends:
 *   POST /api/boatwork/webhook
 *   Header: x-boatwork-signature: sha256=<hmac>
 *   Body: { event, slug, data, timestamp }
 *
 * To register this webhook on Boatwork.co, the site owner provides:
 *   Webhook URL: https://<your-domain>/api/boatwork/webhook
 *   Secret: value of BOATWORK_WEBHOOK_SECRET env var
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { fireOutboundWebhooks } from '@/lib/outboundWebhooks';
import type { BoatworkEventType } from '@/site.config';

const WEBHOOK_SECRET = process.env.BOATWORK_WEBHOOK_SECRET ?? '';

function verifySignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return true; // Skip verification in dev if no secret set
  const expected = `sha256=${crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-boatwork-signature') ?? '';

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: { event: string; slug: string; data: Record<string, unknown>; timestamp: string };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { event, slug, data } = payload;
  console.log(`[boatwork/webhook] event=${event} slug=${slug}`);

  // Handle each event type
  switch (event) {
    case 'profile.updated':
    case 'reviews.new': {
      // Trigger a sync to pull fresh data and revalidate pages
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/boatwork/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ''}` },
      });
      void fireOutboundWebhooks(event as BoatworkEventType, slug, data);
      break;
    }

    case 'verification.badge':
    case 'verification.updated': {
      // Store badge/verification status in Vercel KV or env (future: database)
      // For now, log and trigger sync
      console.log(`[boatwork/webhook] verification update:`, data);
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/boatwork/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ''}` },
      });
      void fireOutboundWebhooks('verification.updated', slug, data);
      break;
    }

    default:
      console.log(`[boatwork/webhook] unhandled event: ${event}`);
  }

  return NextResponse.json({ received: true, event });
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/boatwork/webhook',
    description: 'Receives Boatwork.co profile update webhooks',
    events: ['profile.updated', 'reviews.new', 'verification.updated', 'verification.badge'],
    setup: 'Register this URL in your Boatwork Business Center → Integrations → Webhook',
  });
}
