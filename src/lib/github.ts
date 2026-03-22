/**
 * GitHub API helpers for template version checking.
 * Used by /api/template/version-check to let contractor sites
 * know when a newer template version is available.
 */

const GITHUB_API = 'https://api.github.com';
const ORG = 'YachtSupply';
const TEMPLATE_REPO = 'marine-pro-website-template';

function getToken(): string | null {
  return process.env.SYNC_TOKEN || process.env.GITHUB_TOKEN || null;
}

async function githubFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  if (!token) throw new Error('No GitHub token configured (SYNC_TOKEN or GITHUB_TOKEN)');

  return fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
    cache: 'no-store',
  });
}

// ── Types ──

export interface TemplateVersion {
  version: string;
  sha: string;
  date: string;
  message: string;
  author: string;
}

// ── Semver helpers ──

export function parseSemver(v: string) {
  const match = (v || '0.0.0').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return { major: 0, minor: 0, patch: 0 };
  return { major: parseInt(match[1]), minor: parseInt(match[2]), patch: parseInt(match[3]) };
}

export function isNewerVersion(templateVersion: string, siteVersion: string): boolean {
  const tv = parseSemver(templateVersion);
  const sv = parseSemver(siteVersion);
  if (tv.major !== sv.major) return tv.major > sv.major;
  if (tv.minor !== sv.minor) return tv.minor > sv.minor;
  return tv.patch > sv.patch;
}

export function getUpgradeType(templateVersion: string, siteVersion: string): 'force' | 'optional' | 'up-to-date' {
  if (templateVersion === siteVersion) return 'up-to-date';
  if (!isNewerVersion(templateVersion, siteVersion)) return 'up-to-date';
  const tv = parseSemver(templateVersion);
  const sv = parseSemver(siteVersion);
  if (tv.major !== sv.major || tv.minor !== sv.minor) return 'force';
  return 'optional';
}

// ── API functions ──

/** Get the current template version from .boatwork-template on main */
export async function getTemplateVersion(): Promise<TemplateVersion | null> {
  try {
    const commitRes = await githubFetch(`/repos/${ORG}/${TEMPLATE_REPO}/commits/main`);
    if (!commitRes.ok) return null;
    const commit = await commitRes.json();

    const fileRes = await githubFetch(`/repos/${ORG}/${TEMPLATE_REPO}/contents/.boatwork-template?ref=main`);
    if (!fileRes.ok) return null;
    const file = await fileRes.json();
    const meta = JSON.parse(Buffer.from(file.content, 'base64').toString());

    return {
      version: meta.templateVersion || '0.0.0',
      sha: commit.sha,
      date: commit.commit.author.date,
      message: commit.commit.message.split('\n')[0],
      author: commit.commit.author.name,
    };
  } catch (err) {
    console.error('[github] Failed to get template version:', err);
    return null;
  }
}
