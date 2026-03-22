import { verifyAdminAuth, unauthorizedResponse } from '@/lib/adminAuth';
import { getTemplateVersion, getVersionHistory } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();

  const [current, history] = await Promise.all([
    getTemplateVersion(),
    getVersionHistory(20),
  ]);

  if (!current) {
    return Response.json({ error: 'Failed to fetch template version' }, { status: 502 });
  }

  return Response.json({
    current,
    history,
  });
}
