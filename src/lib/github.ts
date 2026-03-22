/**
 * GitHub API helpers for template version management.
 * Uses SYNC_TOKEN (same token the GitHub Actions use) for API access.
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

export interface ContractorSite {
  repoName: string;
  domain: string | null;
  subdomain: string | null;
  currentVersion: string;
  templateVersion: string;
  updateAvailable: boolean;
  upgradeType: 'force' | 'optional' | 'up-to-date';
  contractorSlug: string;
  lastSynced: string | null;
  pendingPrUrl: string | null;
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
    // Get latest commit on main
    const commitRes = await githubFetch(`/repos/${ORG}/${TEMPLATE_REPO}/commits/main`);
    if (!commitRes.ok) return null;
    const commit = await commitRes.json();

    // Get .boatwork-template content
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

/** Get recent version-bump commits (tags or version commits) */
export async function getVersionHistory(limit = 10): Promise<TemplateVersion[]> {
  try {
    const res = await githubFetch(
      `/repos/${ORG}/${TEMPLATE_REPO}/commits?per_page=${limit}&sha=main`
    );
    if (!res.ok) return [];
    const commits = await res.json();

    return commits
      .filter((c: { commit: { message: string } }) =>
        c.commit.message.includes('[auto-version]') ||
        c.commit.message.match(/bump version to \d+\.\d+\.\d+/i)
      )
      .map((c: { sha: string; commit: { message: string; author: { name: string; date: string } } }) => ({
        version: extractVersionFromMessage(c.commit.message),
        sha: c.sha,
        date: c.commit.author.date,
        message: c.commit.message.split('\n')[0],
        author: c.commit.author.name,
      }));
  } catch {
    return [];
  }
}

function extractVersionFromMessage(msg: string): string {
  const match = msg.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : 'unknown';
}

/** List all contractor sites with their version info */
export async function getContractorSites(templateVersion: string): Promise<ContractorSite[]> {
  try {
    const res = await githubFetch(`/orgs/${ORG}/repos?per_page=100&type=public`);
    if (!res.ok) return [];
    const repos = await res.json();

    const contractorRepos = repos.filter(
      (r: { name: string }) => r.name !== TEMPLATE_REPO && r.name.endsWith('-website')
    );

    const sites: ContractorSite[] = [];

    for (const repo of contractorRepos) {
      try {
        // Read .boatwork-template from the repo
        const fileRes = await githubFetch(
          `/repos/${ORG}/${repo.name}/contents/.boatwork-template?ref=${repo.default_branch}`
        );

        let currentVersion = '0.0.0';
        let contractorSlug = repo.name.replace(/-website$/, '');
        let domain: string | null = null;
        let subdomain: string | null = null;

        if (fileRes.ok) {
          const file = await fileRes.json();
          const meta = JSON.parse(Buffer.from(file.content, 'base64').toString());
          currentVersion = meta.templateVersion || '0.0.0';
          contractorSlug = meta.contractorSlug || contractorSlug;
        }

        // Check for CNAME (custom domain)
        try {
          const cnameRes = await githubFetch(
            `/repos/${ORG}/${repo.name}/contents/CNAME?ref=${repo.default_branch}`
          );
          if (cnameRes.ok) {
            const cname = await cnameRes.json();
            domain = Buffer.from(cname.content, 'base64').toString().trim();
          }
        } catch { /* no CNAME */ }

        // Derive subdomain from contractor slug
        subdomain = `${contractorSlug}.boatwork.co`;

        // Check for pending template-sync PR (list open PRs and filter client-side
        // since the GitHub API head param requires an exact branch name, not a prefix)
        let pendingPrUrl: string | null = null;
        try {
          const prRes = await githubFetch(
            `/repos/${ORG}/${repo.name}/pulls?state=open&per_page=30`
          );
          if (prRes.ok) {
            const prs = await prRes.json();
            const syncPr = prs.find((pr: { head: { ref: string } }) =>
              pr.head.ref.startsWith('template-sync-')
            );
            if (syncPr) pendingPrUrl = syncPr.html_url;
          }
        } catch { /* no pending PR */ }

        sites.push({
          repoName: repo.name,
          domain,
          subdomain,
          currentVersion,
          templateVersion,
          updateAvailable: currentVersion !== templateVersion,
          upgradeType: getUpgradeType(templateVersion, currentVersion),
          contractorSlug,
          lastSynced: repo.updated_at,
          pendingPrUrl,
        });
      } catch (err) {
        console.error(`[github] Failed to read ${repo.name}:`, err);
      }
    }

    return sites.sort((a, b) => a.contractorSlug.localeCompare(b.contractorSlug));
  } catch (err) {
    console.error('[github] Failed to list contractor sites:', err);
    return [];
  }
}

/** Trigger the sync workflow for a specific repo or all repos */
export async function triggerSync(targetRepo?: string, forceUpgrade = false): Promise<boolean> {
  try {
    const res = await githubFetch(
      `/repos/${ORG}/${TEMPLATE_REPO}/actions/workflows/sync-template.yml/dispatches`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            force_upgrade: forceUpgrade ? 'true' : 'false',
            target_repo: targetRepo || '',
          },
        }),
      }
    );

    return res.status === 204;
  } catch (err) {
    console.error('[github] Failed to trigger sync:', err);
    return false;
  }
}
