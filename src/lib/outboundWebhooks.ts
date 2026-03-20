import crypto from 'crypto';
import { siteConfig } from '@/site.config';
import type { BoatworkEventType } from '@/site.config';

export interface OutboundWebhookPayload {
  event: BoatworkEventType;
  slug: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

function signPayload(body: string, secret: string): string {
  return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
}

export async function fireOutboundWebhooks(
  event: BoatworkEventType,
  slug: string,
  data?: Record<string, unknown>
): Promise<void> {
  const hooks = (siteConfig.outboundWebhooks ?? []).filter(
    (h) => h.enabled && (h.event === '*' || h.event === event)
  );
  if (hooks.length === 0) return;

  const payload: OutboundWebhookPayload = {
    event,
    slug,
    timestamp: new Date().toISOString(),
    data,
  };
  const body = JSON.stringify(payload);

  await Promise.allSettled(
    hooks.map(async (hook) => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Boatwork-Event': event,
          'X-Boatwork-Site': slug,
        };
        if (hook.secret) {
          headers['X-Boatwork-Signature'] = signPayload(body, hook.secret);
        }
        const res = await fetch(hook.url, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
          console.error(`[outboundWebhook] ${hook.url} returned ${res.status}`);
        }
      } catch (err) {
        console.error(`[outboundWebhook] Failed to deliver to ${hook.url}:`, err);
      }
    })
  );
}
