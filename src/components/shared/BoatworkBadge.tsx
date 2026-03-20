import { getProfileUrl } from '@/lib/config';
import { BoatworkVerifiedBadge } from './BoatworkVerifiedBadge';

export function BoatworkBadge({
  className = '',
  profileUrl,
  badgeUrl,
  svgUrl,
  embedCode,
  inverted = false,
}: {
  className?: string;
  profileUrl?: string | null;
  badgeUrl?: string | null;
  svgUrl?: string | null;
  embedCode?: string | null;
  inverted?: boolean;
}) {
  const href = profileUrl || getProfileUrl();
  if (!href) return null;

  return (
    <BoatworkVerifiedBadge
      profileUrl={href}
      badgeUrl={badgeUrl}
      svgUrl={svgUrl}
      embedCode={embedCode}
      variant="compact"
      inverted={inverted}
      className={className}
    />
  );
}
