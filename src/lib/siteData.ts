/**
 * Single source of truth for all page data.
 *
 * Merges live Boatwork API data and AI-generated content with the static
 * fallback in site.config.ts. Returns an object with the exact same shape
 * as siteConfig so every page and component continues to work unchanged.
 */

import { cache } from 'react';
import { siteConfig } from '@/site.config';
import { fetchBoatworkProfile, type BoatworkProfile } from './boatwork';
import { buildFallbackContent, type GeneratedContent } from './aiContent';
import { getProfileSlug, getProfileId, getProfileUrl, getBoatworkLogoUrl } from './config';
import fs from 'fs';
import path from 'path';

const PROFILE_SLUG = getProfileSlug();
const PROFILE_ID = getProfileId();

const GENERATED_CONTENT_PATH = path.join(process.cwd(), 'src', 'data', 'generated-content.json');

function loadGeneratedContent(profile: BoatworkProfile): GeneratedContent {
  try {
    if (fs.existsSync(GENERATED_CONTENT_PATH)) {
      const raw = fs.readFileSync(GENERATED_CONTENT_PATH, 'utf-8');
      const cached = JSON.parse(raw) as { content?: GeneratedContent };
      if (cached?.content) {
        if (!Array.isArray(cached.content.commonProjects)) {
          cached.content.commonProjects = [];
        }
        if (!cached.content.serviceKeywords || typeof cached.content.serviceKeywords !== 'object') {
          cached.content.serviceKeywords = {};
        }
        return cached.content;
      }
    }
  } catch {
    // Fall through to fallback
  }
  console.warn('[siteData] generated-content.json not found or invalid — using fallback. Run scripts/generate-content.ts before building.');
  return buildFallbackContent(profile);
}

// ---------- Return type ----------

export type SiteData = Omit<typeof siteConfig, 'hoursOfOperation' | 'services'> & {
  badge: BoatworkProfile['badge'];
  hoursOfOperation: Record<string, string> | null;
  serviceAreaTitle: string;
  yearEstablished: number | null;
  websiteTheme: string;
  services: { name: string; description: string; icon: string; keywords?: string[] }[];
};

// ---------- Icon mapping ----------

// Icon mapping — match API service names to existing icon keys
const SERVICE_ICON_MAP: Record<string, string> = {
  'Yacht Management': 'wheel',
  'General Marine Repair & Maintenance': 'wrench',
  'Deck & Fiberglass Repair': 'anchor',
  'Deck & Fiberglass Repair / Replacement': 'anchor',
  'Marine Electricians & Electronics': 'electric',
  'Engine Maintenance & Repair': 'engine',
  'Yacht Captains & Crew': 'captain',
};

// Trim text to a max character length at a word boundary
function trimText(text: string | null | undefined, maxLength: number): string | null {
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S+$/, '…');
}

// Trim text to a max length at a sentence boundary (period/exclamation/question)
function trimToSentence(text: string | null | undefined, maxLength: number): string | null {
  if (!text) return null;
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength);
  const lastEnd = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '));
  if (lastEnd > 50) return text.slice(0, lastEnd + 1).trim();
  return slice.replace(/\s+\S+$/, '') + '…';
}

// Generate a list of nearby service-area cities based on the contractor's city
function getNearbyAreas(city: string | null, state: string | null): string[] {
  if (!city) return [];
  const c = city.toLowerCase().trim();
  if (c === 'fort lauderdale') {
    return ['Fort Lauderdale', 'Miami', 'Hollywood', 'Pompano Beach', 'Deerfield Beach', 'Boca Raton'];
  }
  if (c === 'miami' || c === 'miami beach') {
    return ['Miami', 'Miami Beach', 'Fort Lauderdale', 'Coral Gables', 'Hialeah', 'Key Biscayne'];
  }
  if (c === 'palm beach' || c === 'west palm beach') {
    return ['West Palm Beach', 'Palm Beach', 'Boynton Beach', 'Delray Beach', 'Boca Raton', 'Lake Worth'];
  }
  if (c === 'naples') {
    return ['Naples', 'Marco Island', 'Bonita Springs', 'Cape Coral', 'Fort Myers', 'Estero'];
  }
  if (c === 'tampa') {
    return ['Tampa', 'St. Petersburg', 'Clearwater', 'Sarasota', 'Bradenton', 'Tierra Verde'];
  }
  if (c === 'sarasota') {
    return ['Sarasota', 'Bradenton', 'Venice', 'Osprey', 'Tampa', 'St. Petersburg'];
  }
  if (c === 'jacksonville') {
    return ['Jacksonville', 'Atlantic Beach', 'Neptune Beach', 'Fernandina Beach', 'St. Augustine', 'Ponte Vedra'];
  }
  // Generic fallback — city + state
  return state ? [city, `${city}, ${state}`] : [city];
}

function findIcon(serviceName: string): string {
  // Exact match first
  if (SERVICE_ICON_MAP[serviceName]) return SERVICE_ICON_MAP[serviceName];
  // Partial match
  const lower = serviceName.toLowerCase();
  if (lower.includes('management')) return 'wheel';
  if (lower.includes('repair') || lower.includes('maintenance')) return 'wrench';
  if (lower.includes('deck') || lower.includes('fiberglass')) return 'anchor';
  if (lower.includes('electric')) return 'electric';
  if (lower.includes('engine')) return 'engine';
  if (lower.includes('captain') || lower.includes('crew')) return 'captain';
  return 'anchor';
}

export const getSiteData = cache(async (): Promise<SiteData> => {
  const profile = await fetchBoatworkProfile(PROFILE_SLUG, PROFILE_ID || undefined);

  // If API is down, return static config unchanged
  if (!profile) return { ...siteConfig, badge: null, serviceAreaTitle: 'Our Service Area', yearEstablished: null, websiteTheme: 'navy-gold' };

  // Load AI-generated content from pre-build JSON (written by scripts/generate-content.ts)
  const ai = loadGeneratedContent(profile);

  // Map API services to the shape expected by ServiceCard
  const services =
    profile.services.length > 0
      ? profile.services.map((s) => ({
          name: s.name,
          description:
            ai.serviceDescriptions[s.name] ??
            s.description ??
            siteConfig.services.find((sc) => sc.name === s.name)?.description ??
            `Professional ${s.name.toLowerCase()} services.`,
          icon: findIcon(s.name),
          keywords: ai.serviceKeywords?.[s.name] ?? [],
        }))
      : profile.specialties.length > 0
      ? profile.specialties.map((s) => ({
          name: s.name,
          description: ai.serviceDescriptions[s.name] ?? `Professional ${s.name.toLowerCase()} services.`,
          icon: findIcon(s.name),
          keywords: ai.serviceKeywords?.[s.name] ?? [],
        }))
      : siteConfig.services;

  // Map API reviews (up to 5 most recent) — empty if profile has none
  const staticReviews = profile.reviews.slice(0, 5).map((r) => ({
    author: r.author,
    rating: r.rating,
    text: r.text,
    date: r.date,
  }));

  // Map API photos to portfolio shape — empty if profile has none
  const portfolio = profile.photos.map((p) => ({
    src: p.src,
    caption: p.caption ?? '',
  }));

  // Map API videos
  const videos =
    profile.videos.length > 0
      ? profile.videos.map((v) => ({
          src: v.src,
          poster: v.poster ?? '',
          caption: v.caption ?? '',
        }))
      : siteConfig.videos;

  return {
    ...siteConfig,

    // Core business info — API values with static fallback
    name: profile.name || siteConfig.name,
    // Profile tagline is user-entered — used verbatim, bypasses AI cache entirely
    // AI tagline is only a fallback when contractor hasn't set one, or when the
    // stored value is empty / a placeholder left over from onboarding.
    tagline: (
      profile.tagline &&
      profile.tagline.trim() &&
      profile.tagline.trim().toLowerCase() !== 'new tagline goes here'
    )
      ? profile.tagline
      : (ai.tagline ?? siteConfig.tagline),
    // description is the short hero blurb — first sentence, max 200 chars
    description: trimToSentence(profile.description, 200) || siteConfig.description,
    phone: profile.phone || siteConfig.phone,
    email: profile.email || siteConfig.email,
    address: profile.address || siteConfig.address,
    location: profile.address || siteConfig.location,
    city: profile.city || siteConfig.city,
    state: profile.state || siteConfig.state,

    logoUrl: profile.logoUrl || siteConfig.logoUrl,

    // about uses AI-enriched text first (full paragraphs), then full profile description, then static fallback
    about: ai.about || profile.description || siteConfig.about,

    services,
    // AI-generated commonProjects from specialties, with static fallback
    commonProjects: ai.commonProjects.length > 0
      ? ai.commonProjects
      : siteConfig.commonProjects,

    serviceAreaTitle: (() => {
      if (ai.serviceAreaTitle) return ai.serviceAreaTitle;
      const radius = profile.serviceAreaRadius ?? 0;
      const type = (profile.specialties.map((s) => s.name).join(' ') + ' ' + profile.services.map((s) => s.name).join(' ')).toLowerCase();
      if (radius > 500) return 'Serving Vessels Worldwide';
      if (type.includes('management') || type.includes('captain') || type.includes('crew')) return 'We Come to You';
      if (type.includes('marina') || type.includes('boatyard') || type.includes('facility') || type.includes('yard')) return 'Our Location';
      return 'Our Service Area';
    })(),

    serviceArea: (() => {
      const radius = profile.serviceAreaRadius ?? 0;

      // Prefer AI-generated localities from the service radius calculation
      if (ai.serviceAreaLocalities && ai.serviceAreaLocalities.length > 0) {
        // When radius > 200, keep AI list as-is (should be regional terms); limit to 5
        return ai.serviceAreaLocalities.slice(0, 5);
      }
      // The API returns a synthetic ['City area', 'City, ST'] fallback when no real list exists.
      // Only use it if it looks like a real multi-city list (more than 2 entries, or no entry ending in ' area').
      const hasRealServiceArea =
        profile.serviceArea.length > 2 ||
        (profile.serviceArea.length > 0 && !profile.serviceArea.some((a) => a.endsWith(' area')));
      if (hasRealServiceArea) return profile.serviceArea.slice(0, 5);
      const nearby = getNearbyAreas(profile.city, profile.state);
      return (nearby.length > 0 ? nearby : siteConfig.serviceArea).slice(0, 5);
    })(),
    serviceAreaDescription: profile.city
      ? `Based in ${profile.city}${profile.state ? ', ' + profile.state : ''}, serving the surrounding marine community and local waters.`
      : (ai.serviceAreaDescription || siteConfig.serviceAreaDescription),

    boatwork: {
      profileSlug: getProfileSlug(),
      profileId: getProfileId(),
      profileUrl: profile.profileUrl || getProfileUrl(),
      logoUrl: getBoatworkLogoUrl(),
      useLiveReviews: true,
      staticReviews,
    },

    portfolio,
    videos,

    seo: {
      titleTemplate: `%s | ${profile.name || siteConfig.name}`,
      defaultTitle: ai.seoTitle || siteConfig.seo.defaultTitle,
      description: ai.seoDescription || siteConfig.seo.description,
      keywords: [
        ...(ai.seoKeywords.length > 0 ? ai.seoKeywords : siteConfig.seo.keywords),
        ...(ai.serviceAreaLocalities ?? []).slice(0, 5).map((loc) => `marine services ${loc}`),
      ],
    },

    // Only use hours when the API actually returned them — never show the static template hours
    // for a live profile, as those are placeholder values that don't reflect reality.
    hoursOfOperation:
      profile.hoursOfOperation && Object.keys(profile.hoursOfOperation).length > 0
        ? profile.hoursOfOperation
        : null,

    social: {
      facebook: profile.social.facebook ?? siteConfig.social.facebook,
      instagram: profile.social.instagram ?? siteConfig.social.instagram,
      linkedin: profile.social.linkedin ?? siteConfig.social.linkedin,
      youtube: profile.social.youtube ?? siteConfig.social.youtube,
    },

    badge: profile.badge,
    yearEstablished: profile.yearEstablished,
    websiteTheme: profile.websiteTheme ?? 'navy-gold',
  };
});
