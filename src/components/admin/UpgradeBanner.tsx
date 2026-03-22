'use client';

import { useState, useEffect } from 'react';

interface VersionCheckResponse {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  upgradeType: 'force' | 'optional' | 'up-to-date';
  isForced: boolean;
  changelog: string | null;
}

interface UpgradeBannerProps {
  /** The current template version of this site */
  currentVersion: string;
  /** Base URL of the template repo deployment (where the API lives) */
  templateApiUrl?: string;
  /** Callback when user clicks "Upgrade Now" — may return a Promise */
  onUpgrade?: () => void | Promise<void>;
  /** Custom upgrade URL (e.g. boatwork.co admin endpoint) */
  upgradeUrl?: string;
}

/**
 * Upgrade notification banner for the Boatwork business center.
 *
 * Embed on https://boatwork.co/pro/{slug}/business-center/website/
 * to notify contractors when a template update is available.
 *
 * Usage:
 *   <UpgradeBanner
 *     currentVersion="1.0.3"
 *     templateApiUrl="https://template.boatwork.co"
 *     upgradeUrl="/api/website/upgrade"
 *   />
 */
export function UpgradeBanner({
  currentVersion,
  templateApiUrl = '',
  onUpgrade,
  upgradeUrl,
}: UpgradeBannerProps) {
  const [versionInfo, setVersionInfo] = useState<VersionCheckResponse | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch(
          `${templateApiUrl}/api/template/version-check?current=${encodeURIComponent(currentVersion)}`
        );
        if (!res.ok) return;
        const data: VersionCheckResponse = await res.json();
        setVersionInfo(data);
      } catch {
        // Silently fail — don't block the page
      }
    };

    checkVersion();
  }, [currentVersion, templateApiUrl]);

  // Don't render if no update or dismissed
  if (!versionInfo?.updateAvailable || dismissed) return null;

  const isForced = versionInfo.isForced;

  const handleUpgrade = async () => {
    setUpgrading(true);
    setError(null);
    try {
      if (onUpgrade) {
        await onUpgrade();
      } else if (upgradeUrl) {
        const res = await fetch(upgradeUrl, { method: 'POST' });
        if (res.ok) {
          setVersionInfo(null); // Hide banner on success
        } else {
          setError(`Upgrade failed (${res.status}). Please try again or contact support.`);
        }
      }
    } catch {
      setError('Upgrade failed. Please check your connection and try again.');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 mb-6 ${
        isForced
          ? 'bg-red-50 border-red-200'
          : 'bg-blue-50 border-blue-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-semibold ${isForced ? 'text-red-800' : 'text-blue-800'}`}>
              {isForced ? 'Required Update Available' : 'Website Update Available'}
            </span>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                isForced
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              v{versionInfo.currentVersion} &rarr; v{versionInfo.latestVersion}
            </span>
          </div>
          <p className={`text-sm ${isForced ? 'text-red-700' : 'text-blue-700'}`}>
            {versionInfo.changelog || (isForced
              ? 'A required update is available for your website. This update includes important changes.'
              : 'An optional update is available for your website with bug fixes and improvements.'
            )}
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-2 font-medium">{error}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 ${
              isForced
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {upgrading ? 'Upgrading...' : 'Upgrade Now'}
          </button>
          {!isForced && (
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
