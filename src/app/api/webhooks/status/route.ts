import { NextResponse } from 'next/server';
import { siteConfig } from '@/site.config';

export async function GET() {
  const hooks = (siteConfig.outboundWebhooks ?? []).map(({ secret: _secret, ...h }) => h);
  return NextResponse.json({ outboundWebhooks: hooks, count: hooks.length });
}
