import { verifyAdminAuth, unauthorizedResponse } from '@/lib/adminAuth';
import { getTemplateVersion, getContractorSites } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) return unauthorizedResponse();

  const template = await getTemplateVersion();
  if (!template) {
    return Response.json({ error: 'Failed to fetch template version' }, { status: 502 });
  }

  const sites = await getContractorSites(template.version);

  const summary = {
    total: sites.length,
    upToDate: sites.filter(s => s.upgradeType === 'up-to-date').length,
    optionalPending: sites.filter(s => s.upgradeType === 'optional').length,
    forcePending: sites.filter(s => s.upgradeType === 'force').length,
  };

  return Response.json({
    templateVersion: template.version,
    summary,
    sites,
  });
}
