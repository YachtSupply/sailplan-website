/**
 * Fetch and normalize a contractor profile from the Boatwork public API.
 *
 * Endpoint: GET /api/v1/public/contractors/{slug}
 * No auth required — public endpoint.
 *
 * Returns null on any failure so the site can fall back to static config.
 */

const BOATWORK_API = 'https://boatwork.co/api/v1';

// ---------- Public types ----------

export interface BoatworkReview {
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface BoatworkService {
  name: string;
  description: string | null;
}

export interface BoatworkPhoto {
  src: string;
  caption: string | null;
}

export interface BoatworkVideo {
  src: string;
  poster: string | null;
  caption: string | null;
}

export interface BoatworkSpecialty {
  id: string;
  name: string;
  slug: string;
}

export interface BoatworkBadge {
  token: string | null;
  badgeUrl: string | null;
  svgUrl: string | null;
  embedCode: string | null;
  pixelUrl: string | null;
  profileUrl: string;
  isVerified: boolean;
}

export interface BoatworkProfile {
  name: string;
  slug: string;
  tagline: string | null;
  badge: BoatworkBadge | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  isVerified: boolean;
  rating: number | null;
  reviewCount: number;
  reviews: BoatworkReview[];
  services: BoatworkService[];
  photos: BoatworkPhoto[];
  videos: BoatworkVideo[];
  specialties: BoatworkSpecialty[];
  yearEstablished: number | null;
  serviceAreaRadius: number | null;
  serviceArea: string[];
  profileUrl: string;
  updatedAt: string;
  hoursOfOperation: Record<string, string> | null;
  websiteTheme: string | null;
  social: {
    facebook: string | null;
    instagram: string | null;
    linkedin: string | null;
    youtube: string | null;
  };
}

// ---------- Helpers ----------

function asString(val: unknown): string | null {
  return typeof val === 'string' && val.length > 0 ? val : null;
}

function asNumber(val: unknown): number | null {
  return typeof val === 'number' && !Number.isNaN(val) ? val : null;
}

function normalizeReview(raw: Record<string, unknown>): BoatworkReview | null {
  const author = asString(raw.author) ?? asString(raw.name);
  const rating = asNumber(raw.rating);
  const text = asString(raw.text) ?? asString(raw.body) ?? asString(raw.content);
  const date = asString(raw.date) ?? asString(raw.createdAt) ?? '';
  if (!author || rating === null || !text) return null;
  return { author, rating, text, date };
}

function normalizeService(raw: Record<string, unknown>): BoatworkService | null {
  const name = asString(raw.name) ?? asString(raw.title);
  if (!name) return null;
  return { name, description: asString(raw.description) };
}

function normalizePhoto(raw: Record<string, unknown>): BoatworkPhoto | null {
  const src =
    asString(raw.src) ??
    asString(raw.url) ??
    asString(raw.imageUrl) ??
    asString(raw.photoUrl) ??
    asString(raw.image) ??
    asString(raw.fileUrl);
  if (!src) return null;
  return { src, caption: asString(raw.caption) ?? asString(raw.title) };
}

function normalizeVideo(raw: Record<string, unknown>): BoatworkVideo | null {
  const src = asString(raw.src) ?? asString(raw.url) ?? asString(raw.videoUrl);
  if (!src) return null;
  return {
    src,
    poster: asString(raw.poster) ?? asString(raw.thumbnailUrl),
    caption: asString(raw.caption) ?? asString(raw.title),
  };
}

function safeArray<T>(arr: unknown, mapper: (item: Record<string, unknown>) => T | null): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => mapper(item as Record<string, unknown>)).filter(Boolean) as T[];
}

// ---------- Main fetch ----------

export async function fetchBoatworkProfile(slug: string, profileId?: string): Promise<BoatworkProfile | null> {
  try {
    const url = profileId
      ? `${BOATWORK_API}/public/contractors/by-id/${profileId}`
      : `${BOATWORK_API}/public/contractors/${slug}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      next: { revalidate: 60 },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const identifier = profileId ? `id "${profileId}"` : `slug "${slug}"`;
      console.warn(`[boatwork] API returned ${res.status} for ${identifier}`);
      return null;
    }

    const json = await res.json();
    // The API may wrap the profile in a `data` key or return it at the top level.
    const raw = (json?.data ?? json) as Record<string, unknown>;

    if (!raw || typeof raw !== 'object') return null;

    const reviews = safeArray(raw.reviews, normalizeReview);

    const profile: BoatworkProfile = {
      name: asString(raw.name) ?? asString(raw.businessName) ?? slug,
      slug,
      tagline: asString(raw.tagline),
      description: asString(raw.description) ?? asString(raw.about),
      phone: asString(raw.phone) ?? asString(raw.telephone),
      email: asString(raw.email),
      address: asString(raw.address) ?? asString(raw.location),
      city: asString(raw.city),
      state: asString(raw.state),
      logoUrl: asString(raw.logoUrl) ?? asString(raw.logo),
      coverImageUrl: asString(raw.coverImageUrl) ?? asString(raw.coverImage),
      isVerified: raw.isVerified === true || raw.verified === true,
      rating: asNumber(raw.rating) ?? asNumber(raw.averageRating),
      reviewCount: (asNumber(raw.reviewCount) ?? reviews.length) as number,
      reviews,
      services: safeArray(raw.services, normalizeService),
      photos: safeArray(raw.photos ?? raw.portfolio ?? raw.images ?? raw.gallery ?? raw.mediaItems, normalizePhoto),
      videos: safeArray(raw.videos, normalizeVideo),
      specialties: Array.isArray(raw.specialties)
        ? (raw.specialties as unknown[]).flatMap((s) => {
            if (typeof s === 'object' && s !== null) {
              const o = s as Record<string, unknown>;
              const name = asString(o.name);
              if (!name) return [];
              return [{ id: asString(o.id) ?? '', name, slug: asString(o.slug) ?? '' }];
            }
            return [];
          })
        : [],
      yearEstablished: asNumber(raw.yearEstablished) ?? asNumber(raw.year_established),
      serviceAreaRadius: asNumber(raw.serviceAreaRadius) ?? asNumber(raw.service_area_radius),
      serviceArea: (() => {
        if (Array.isArray(raw.serviceArea) && (raw.serviceArea as unknown[]).length > 0) {
          return (raw.serviceArea as unknown[]).filter((s): s is string => typeof s === 'string');
        }
        // API does not return serviceArea — generate a fallback from city/state
        const city = asString(raw.city);
        const state = asString(raw.state);
        if (city && state) return [`${city} area`, `${city}, ${state}`];
        if (city) return [`${city} area`];
        return [];
      })(),
      profileUrl: asString(raw.profileUrl) ?? `https://boatwork.co/pro/${slug}/`,
      updatedAt: asString(raw.updatedAt) ?? new Date().toISOString(),
      social: {
        facebook: asString((raw.social as Record<string, unknown>)?.facebook) ?? asString(raw.facebookUrl) ?? null,
        instagram: asString((raw.social as Record<string, unknown>)?.instagram) ?? asString(raw.instagramUrl) ?? null,
        linkedin: asString((raw.social as Record<string, unknown>)?.linkedin) ?? asString(raw.linkedinUrl) ?? null,
        youtube: asString((raw.social as Record<string, unknown>)?.youtube) ?? asString(raw.youtubeUrl) ?? null,
      },
      badge: (() => {
        const b = raw.badge as Record<string, unknown> | null | undefined;
        if (!b || typeof b !== 'object') return null;
        return {
          token: asString(b.token),
          badgeUrl: asString(b.badgeUrl),
          svgUrl: asString(b.svgUrl) ?? asString(b.svg_url),
          embedCode: asString(b.embedCode) ?? asString(b.embed_code),
          pixelUrl: asString(b.pixelUrl),
          profileUrl: asString(b.profileUrl) ?? `https://boatwork.co/pro/${slug}/`,
          isVerified: b.isVerified === true || b.verified === true,
        };
      })(),
      hoursOfOperation: (() => {
        const h = raw.hoursOfOperation;
        if (!h) return null;
        if (typeof h === 'object') return h as Record<string, string>;
        if (typeof h === 'string') {
          try { return JSON.parse(h) as Record<string, string>; } catch { return null; }
        }
        return null;
      })(),
      websiteTheme: asString(raw.websiteTheme),
    };

    return profile;
  } catch (err) {
    console.error('[boatwork] Failed to fetch profile:', err);
    return null;
  }
}
