import { verifyAdminAuth, unauthorizedResponse } from '@/lib/adminAuth';
import { triggerSync } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();

  let body: { targetRepo?: string; forceUpgrade?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { targetRepo, forceUpgrade = false } = body;

  const success = await triggerSync(targetRepo, forceUpgrade);

  if (!success) {
    return Response.json({ error: 'Failed to trigger sync workflow' }, { status: 502 });
  }

  return Response.json({
    success: true,
    message: targetRepo
      ? `Sync triggered for ${targetRepo} (force=${forceUpgrade})`
      : `Sync triggered for all sites (force=${forceUpgrade})`,
  });
}
