/**
 * POST /api/revalidate?path=<path>&secret=<secret>
 *
 * On-demand ISR revalidation. Called by the sync route after a
 * Boatwork profile update to serve fresh data without a full redeploy.
 */

import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const path = searchParams.get('path') ?? '/';

  if (process.env.REVALIDATE_SECRET && secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  revalidatePath(path);
  return NextResponse.json({ revalidated: true, path, ts: Date.now() });
}
