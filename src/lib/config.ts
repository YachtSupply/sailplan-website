import { siteConfig } from '@/site.config';

// Support both nested (template v1+) and flat (legacy) siteConfig shapes.
// Downstream sites may omit the `boatwork` object and put these fields at the top level.
const bw = (): Record<string, any> => {
  if ('boatwork' in siteConfig && (siteConfig as any).boatwork) {
    return (siteConfig as any).boatwork;
  }
  return siteConfig as unknown as Record<string, any>;
};

export function getProfileSlug(): string {
  return bw().profileSlug || 'template';
}

export function getProfileId(): string {
  return bw().profileId || '';
}

export function getProfileUrl(): string {
  return bw().profileUrl || '';
}

export function getBoatworkLogoUrl(): string {
  return bw().logoUrl || 'https://boatwork.co/images/boatwork-logo.png';
}

export function getStaticReviews(): any[] {
  return bw().staticReviews || [];
}

/** Returns a normalized boatwork config object regardless of config shape. */
export function getBoatworkConfig(): Record<string, any> {
  const b = bw();
  return {
    profileSlug: b.profileSlug || 'template',
    profileId: b.profileId || '',
    profileUrl: b.profileUrl || '',
    logoUrl: b.logoUrl || 'https://boatwork.co/images/boatwork-logo.png',
    useLiveReviews: b.useLiveReviews || false,
    staticReviews: b.staticReviews || [],
  };
}
