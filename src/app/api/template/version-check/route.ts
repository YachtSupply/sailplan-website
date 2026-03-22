import { getTemplateVersion, parseSemver, getUpgradeType } from '@/lib/github';
import { TEMPLATE_VERSION } from '@/site.config';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://boatwork.co',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

/** CORS preflight */
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Public endpoint for contractor sites to check if an update is available.
 *
 * GET /api/template/version-check?current=1.0.0
 *
 * Used by the upgrade notification banner on boatwork.co business center.
 * Fetches the live template version from GitHub. Falls back to the build-time
 * constant if the GitHub API is unreachable.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currentVersion = searchParams.get('current') || '0.0.0';

  // Prefer live version from GitHub; fall back to build-time constant
  const liveVersion = await getTemplateVersion();
  const latestVersion = liveVersion?.version || TEMPLATE_VERSION;

  const upgradeType = getUpgradeType(latestVersion, currentVersion);
  const tv = parseSemver(latestVersion);
  const sv = parseSemver(currentVersion);

  // Only report update if template is actually newer
  const isNewer = tv.major > sv.major ||
    (tv.major === sv.major && tv.minor > sv.minor) ||
    (tv.major === sv.major && tv.minor === sv.minor && tv.patch > sv.patch);

  return Response.json({
    currentVersion,
    latestVersion,
    updateAvailable: isNewer,
    upgradeType: isNewer ? upgradeType : 'up-to-date',
    isForced: isNewer && upgradeType === 'force',
    changelog: isNewer
      ? `Version ${latestVersion}: ${tv.major > sv.major ? 'Major update' : tv.minor > sv.minor ? 'New features available' : 'Bug fixes and improvements'}`
      : null,
  }, {
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': 'public, max-age=300',
    },
  });
}
