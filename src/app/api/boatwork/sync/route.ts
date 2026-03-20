/**
 * POST /api/boatwork/sync
 *
 * Polls the Boatwork API for the contractor's latest profile data:
 * reviews, photos, services, verification status.
 *
 * Called by:
 *   - Vercel Cron (every 6 hours, configured in vercel.json)
 *   - Boatwork.co webhook on profile update (see /api/boatwork/webhook)
 *   - Manual trigger from the site owner dashboard (future)
 *
 * After fetching the profile it:
 *   1. Deletes the AI content cache so it regenerates on the next request
 *   2. Calls revalidatePath() for all pages so the next load is instant
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { getProfileSlug, getProfileUrl } from '@/lib/config';
import { fetchBoatworkProfile } from '@/lib/boatwork';

const AI_CACHE_PATH = path.join(process.cwd(), 'src', 'data', 'generated-content.json');

export async function POST(req: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const slug = getProfileSlug();

    // Fetch contractor profile from Boatwork public API
    const profile = await fetchBoatworkProfile(slug);

    if (!profile) {
      return NextResponse.json(
        { error: 'Failed to fetch profile from Boatwork API' },
        { status: 502 }
      );
    }

    // Delete AI content cache so it regenerates with fresh profile data
    try {
      if (fs.existsSync(AI_CACHE_PATH)) {
        fs.unlinkSync(AI_CACHE_PATH);
      }
    } catch (err) {
      console.warn('[boatwork/sync] Failed to delete AI cache:', err);
    }

    // Trigger Next.js on-demand revalidation for all pages
    const pagesToRevalidate = ['/', '/services', '/portfolio', '/contact'];
    for (const p of pagesToRevalidate) {
      revalidatePath(p);
    }

    return NextResponse.json({
      success: true,
      synced_at: new Date().toISOString(),
      slug,
      profile_updated: profile.updatedAt,
      revalidated: pagesToRevalidate,
    });
  } catch (err) {
    console.error('[boatwork/sync]', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

// Allow GET for manual browser testing in dev
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/boatwork/sync',
    description: 'Polls Boatwork API and revalidates cached pages',
    slug: getProfileSlug(),
    profileUrl: getProfileUrl(),
  });
}
