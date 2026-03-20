/**
 * BoatworkVerifiedBadge
 *
 * Template-native 'Verified on Boatwork' badge using the gold/navy color scheme.
 * No external image dependencies — pure inline SVG + Tailwind.
 *
 * Props:
 *   profileUrl  — Boatwork profile link
 *   pixelUrl    — Optional tracking pixel
 *   size        — 'sm' | 'md' | 'lg'
 *   variant     — 'default' | 'compact' | 'minimal'
 *   inverted    — true for dark (navy) backgrounds
 *
 * Legacy props (badgeUrl, svgUrl, embedCode) are accepted for API compatibility
 * but are no longer used — the native design replaces external badge images.
 */

import { getProfileUrl } from '@/lib/config';

interface BoatworkVerifiedBadgeProps {
  badgeUrl?: string | null;
  svgUrl?: string | null;
  embedCode?: string | null;
  pixelUrl?: string | null;
  profileUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'minimal';
  inverted?: boolean;
  className?: string;
}

function AnchorIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="16"
      viewBox="0 0 14 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Ring */}
      <circle cx="7" cy="3" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      {/* Stock (horizontal bar) */}
      <line x1="2.5" y1="5.8" x2="11.5" y2="5.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {/* Shank (vertical shaft) */}
      <line x1="7" y1="4.8" x2="7" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {/* Crown / flukes (bottom U-curve) */}
      <path
        d="M1.5 11 C1.5 13.5 4 15 7 15 C10 15 12.5 13.5 12.5 11"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Fluke tips */}
      <circle cx="1.5" cy="11" r="1" fill="currentColor" />
      <circle cx="12.5" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

function VerifiedStar() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7 0L8.573 2.68L11.686 2.045L11.394 5.19L14 7L11.394 8.81L11.686 11.955L8.573 11.32L7 14L5.427 11.32L2.314 11.955L2.606 8.81L0 7L2.606 5.19L2.314 2.045L5.427 2.68L7 0Z"
        fill="var(--color-accent)"
      />
      <path
        d="M4.5 7L6.167 8.667L9.5 5.333"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BoatworkVerifiedBadge({
  pixelUrl,
  profileUrl,
  size = 'md',
  variant = 'default',
  inverted = false,
  className = '',
  badgeUrl: _badgeUrl,
  svgUrl: _svgUrl,
  embedCode: _embedCode,
}: BoatworkVerifiedBadgeProps) {
  const href = profileUrl || getProfileUrl();

  if (variant === 'minimal') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 group ${className}`}
        title="View Boatwork profile"
      >
        <VerifiedStar />
        <span
          className={`text-xs font-sans font-semibold tracking-wide transition-colors group-hover:text-gold ${
            inverted ? 'text-gold-light' : 'text-navy'
          }`}
        >
          Verified on Boatwork
        </span>
      </a>
    );
  }

  const padding = {
    sm: variant === 'compact' ? 'px-2.5 py-1.5' : 'px-3 py-2',
    md: variant === 'compact' ? 'px-3 py-2'     : 'px-4 py-2.5',
    lg: variant === 'compact' ? 'px-4 py-2.5'   : 'px-5 py-3',
  }[size];

  const bgClass     = inverted
    ? 'bg-navy/60 hover:bg-navy/80'
    : 'bg-white hover:bg-cream/60';
  const borderClass = inverted
    ? 'border-gold/35 hover:border-gold/65'
    : 'border-gold/40 hover:border-gold/70';
  const anchorColorClass   = inverted ? 'text-gold'      : 'text-navy/70';
  const wordmarkColorClass = inverted ? 'text-gold-light' : 'text-navy';

  return (
    <div className="relative inline-block">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2.5 border ${borderClass} ${bgClass} ${padding} transition-all duration-200 group ${className}`}
        title="Verified on Boatwork"
      >
        {/* Logomark + wordmark */}
        <div className="flex items-center gap-1.5">
          <AnchorIcon
            className={`${anchorColorClass} opacity-80 group-hover:opacity-100 transition-opacity`}
          />
          <span
            className={`text-[10px] font-serif font-bold tracking-[0.15em] uppercase leading-none ${wordmarkColorClass} opacity-80 group-hover:opacity-100 transition-opacity`}
          >
            Boatwork
          </span>
        </div>

        {/* Gold divider */}
        <div className="h-3.5 w-px bg-gold/30" />

        {/* Verified label */}
        <div className="flex items-center gap-1">
          <VerifiedStar />
          <span className="text-[10px] font-sans font-bold tracking-[0.12em] uppercase leading-none text-gold">
            Verified Pro
          </span>
        </div>
      </a>

      {/* Tracking pixel */}
      {pixelUrl && (
        <img
          src={pixelUrl}
          alt=""
          width={1}
          height={1}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        />
      )}
    </div>
  );
}
