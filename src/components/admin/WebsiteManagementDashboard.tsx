'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ──

interface TemplateVersion {
  version: string;
  sha: string;
  date: string;
  message: string;
  author: string;
}

interface SiteSummary {
  total: number;
  upToDate: number;
  optionalPending: number;
  forcePending: number;
}

interface ContractorSite {
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

// ── API helpers ──

function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_api_key') || '';
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const key = getApiKey();
  const res = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (res.status === 401) throw new Error('unauthorized');
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ── Components ──

function AuthGate({ onAuth }: { onAuth: () => void }) {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    sessionStorage.setItem('admin_api_key', key.trim());
    onAuth();
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Admin Access</h2>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="Enter admin API key"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#c9a96e] focus:border-transparent"
          autoFocus
        />
        <button
          type="submit"
          className="w-full bg-[#0a1628] text-white rounded px-4 py-2 text-sm font-medium hover:bg-[#1a2638] transition-colors"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}

function VersionBadge({ type }: { type: 'force' | 'optional' | 'up-to-date' }) {
  const styles = {
    force: 'bg-red-100 text-red-700 border-red-200',
    optional: 'bg-amber-100 text-amber-700 border-amber-200',
    'up-to-date': 'bg-green-100 text-green-700 border-green-200',
  };
  const labels = {
    force: 'Force Upgrade',
    optional: 'Optional',
    'up-to-date': 'Up to Date',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    red: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorMap[color] || colorMap.blue}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-75 mt-1">{label}</div>
    </div>
  );
}

// ── Main Dashboard ──

export function WebsiteManagementDashboard() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const [templateVersion, setTemplateVersion] = useState<TemplateVersion | null>(null);
  const [versionHistory, setVersionHistory] = useState<TemplateVersion[]>([]);
  const [sites, setSites] = useState<ContractorSite[]>([]);
  const [summary, setSummary] = useState<SiteSummary | null>(null);

  const [deploying, setDeploying] = useState<string | null>(null); // repo name or 'all'
  const [deployMessage, setDeployMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [versionsData, sitesData] = await Promise.all([
        apiFetch('/api/admin/template/versions'),
        apiFetch('/api/admin/template/sites'),
      ]);

      setTemplateVersion(versionsData.current);
      setVersionHistory(versionsData.history || []);
      setSites(sitesData.sites || []);
      setSummary(sitesData.summary || null);
    } catch (err) {
      if (err instanceof Error && err.message === 'unauthorized') {
        sessionStorage.removeItem('admin_api_key');
        setAuthed(false);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData]);

  // Check if we already have a key stored
  useEffect(() => {
    if (sessionStorage.getItem('admin_api_key')) setAuthed(true);
  }, []);

  const handleDeploy = async (targetRepo?: string, forceUpgrade = false) => {
    const target = targetRepo || 'all';
    setDeploying(target);
    setDeployMessage(null);
    try {
      const result = await apiFetch('/api/admin/template/deploy', {
        method: 'POST',
        body: JSON.stringify({ targetRepo, forceUpgrade }),
      });
      setDeployMessage(result.message + ' Data will refresh shortly.');
      // Refresh data after a brief delay to let the workflow start
      const timer = setTimeout(loadData, 5000);
      refreshTimerRef.current = timer;
    } catch (err) {
      setDeployMessage(`Deploy failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeploying(null);
    }
  };

  if (!authed) {
    return <AuthGate onAuth={() => setAuthed(true)} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Management</h1>
          <p className="text-sm text-gray-500 mt-1">Template version control and deployment</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {deployMessage && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-center justify-between">
          <span>{deployMessage}</span>
          <button onClick={() => setDeployMessage(null)} className="text-blue-500 hover:text-blue-700 ml-4">&times;</button>
        </div>
      )}

      {loading && !templateVersion ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <>
          {/* ── Version Control Panel ── */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-base font-semibold text-gray-900">Version Control</h2>
              </div>
              <div className="p-6">
                {/* Current version + stats */}
                <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-6">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">Current Template Version</div>
                    <div className="text-3xl font-bold text-gray-900 font-mono">
                      v{templateVersion?.version || '—'}
                    </div>
                    {templateVersion && (
                      <div className="text-xs text-gray-400 mt-1">
                        {templateVersion.message} &middot;{' '}
                        {new Date(templateVersion.date).toLocaleDateString()} &middot;{' '}
                        <span className="font-mono">{templateVersion.sha.substring(0, 7)}</span>
                      </div>
                    )}
                  </div>

                  {summary && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                      <StatCard label="Total Sites" value={summary.total} color="blue" />
                      <StatCard label="Up to Date" value={summary.upToDate} color="green" />
                      <StatCard label="Optional Updates" value={summary.optionalPending} color="amber" />
                      <StatCard label="Force Upgrades" value={summary.forcePending} color="red" />
                    </div>
                  )}
                </div>

                {/* Deploy buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleDeploy(undefined, false)}
                    disabled={deploying !== null}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0a1628] rounded-md hover:bg-[#1a2638] disabled:opacity-50 transition-colors"
                  >
                    {deploying === 'all' ? 'Deploying...' : 'Push Pending Releases (Semver Rules)'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('This will force-upgrade ALL sites to the latest version. Are you sure?')) {
                        handleDeploy(undefined, true);
                      }
                    }}
                    disabled={deploying !== null}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    Force Upgrade All Sites
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Version History ── */}
          {versionHistory.length > 0 && (
            <section className="mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <h2 className="text-base font-semibold text-gray-900">Version History</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {versionHistory.slice(0, 5).map((v) => (
                    <div key={v.sha} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-gray-900">v{v.version}</span>
                        <span className="text-sm text-gray-500">{v.message}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(v.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Sites Table ── */}
          <section>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  Contractor Websites ({sites.length})
                </h2>
                <div className="flex gap-2 text-xs">
                  <span className="text-green-600">{summary?.upToDate || 0} current</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-amber-600">{summary?.optionalPending || 0} optional</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-red-600">{summary?.forcePending || 0} forced</span>
                </div>
              </div>

              {sites.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  {loading ? 'Loading sites...' : 'No contractor websites found'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sites.map((site) => (
                        <tr key={site.repoName} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{site.contractorSlug}</div>
                            <div className="text-xs text-gray-400">{site.repoName}</div>
                          </td>
                          <td className="px-6 py-4">
                            {site.domain && (
                              <div className="text-sm text-gray-900">{site.domain}</div>
                            )}
                            <div className="text-xs text-gray-400">{site.subdomain}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm text-gray-900">v{site.currentVersion}</span>
                            {site.updateAvailable && (
                              <span className="text-xs text-gray-400 ml-2">
                                &rarr; v{site.templateVersion}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <VersionBadge type={site.upgradeType} />
                            {site.pendingPrUrl && site.pendingPrUrl.startsWith('https://') && (
                              <a
                                href={site.pendingPrUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-xs text-blue-600 hover:underline"
                              >
                                PR open
                              </a>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {site.updateAvailable && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleDeploy(site.repoName, false)}
                                  disabled={deploying !== null}
                                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                  {deploying === site.repoName ? '...' : 'Upgrade'}
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Force upgrade ${site.contractorSlug}?`)) {
                                      handleDeploy(site.repoName, true);
                                    }
                                  }}
                                  disabled={deploying !== null}
                                  className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                  Force
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
