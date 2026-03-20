#!/usr/bin/env tsx
/**
 * Pre-build AI content generation script.
 *
 * Fetches the Boatwork contractor profile, calls Claude Sonnet to generate
 * SEO-enriched website content, and writes src/data/generated-content.json.
 *
 * Run this BEFORE `vercel deploy` (or `next build`) in your CI/CD pipeline:
 *
 *   BOATWORK_PROFILE_SLUG=yachts-etc ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/generate-content.ts
 *
 * The JSON is committed so Vercel can read it at build time without needing
 * ANTHROPIC_API_KEY in its environment.
 *
 * Cache invalidation: regenerates only when profile.updatedAt, specialties,
 * services, or CONTENT_VERSION changes.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(__dirname, '..', 'src', 'data', 'generated-content.json');

// Increment this when the AI prompt or GeneratedContent shape changes significantly.
const CONTENT_VERSION = '2';

// ---------- Types ----------

interface BoatworkService {
  name: string;
  description?: string | null;
}

interface BoatworkProfile {
  name: string;
  slug: string;
  tagline: string | null;
  badge: unknown;
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
  reviews: unknown[];
  services: BoatworkService[];
  specialties: BoatworkService[];
  photos: unknown[];
  videos: unknown[];
  serviceArea: string[];
  profileUrl: string;
  updatedAt: string;
  hoursOfOperation: Record<string, string>;
  social: { facebook: string | null; instagram: string | null; linkedin: string | null; youtube: string | null };
}

interface GeneratedContent {
  tagline: string;
  about: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  serviceDescriptions: Record<string, string>;
  serviceAreaDescription: string;
  commonProjects: string[];
}

interface CacheFile {
  updatedAt: string;
  specialtiesKey: string;
  servicesKey: string;
  contentVersion: string;
  content: GeneratedContent;
}

// ---------- Config ----------

const PROFILE_SLUG = process.env.BOATWORK_PROFILE_SLUG;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!PROFILE_SLUG) {
  console.error('[generate-content] Error: BOATWORK_PROFILE_SLUG environment variable is required');
  process.exit(1);
}

if (!ANTHROPIC_API_KEY) {
  console.error('[generate-content] Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

// ---------- Boatwork API ----------

async function fetchProfile(slug: string): Promise<BoatworkProfile> {
  const url = `https://boatwork.co/api/v1/public/contractors/${slug}`;
  console.log(`[generate-content] Fetching profile: ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Boatwork API returned ${res.status} for slug "${slug}"`);
  }

  const data = await res.json() as Record<string, unknown>;
  const p = (data.data ?? data) as Record<string, unknown>;

  return {
    name: (p.name ?? p.businessName ?? slug) as string,
    slug: (p.slug ?? slug) as string,
    tagline: (p.tagline ?? null) as string | null,
    badge: p.badge ?? null,
    description: (p.description ?? p.bio ?? null) as string | null,
    phone: (p.phone ?? null) as string | null,
    email: (p.email ?? null) as string | null,
    address: (p.address ?? null) as string | null,
    city: (p.city ?? null) as string | null,
    state: (p.state ?? null) as string | null,
    logoUrl: (p.logoUrl ?? p.logo_url ?? null) as string | null,
    coverImageUrl: (p.coverImageUrl ?? p.cover_image_url ?? null) as string | null,
    isVerified: (p.isVerified ?? p.is_verified ?? false) as boolean,
    rating: (p.rating ?? null) as number | null,
    reviewCount: (p.reviewCount ?? p.review_count ?? 0) as number,
    reviews: (p.reviews ?? []) as unknown[],
    services: (p.services ?? []) as BoatworkService[],
    specialties: (p.specialties ?? []) as BoatworkService[],
    photos: (p.photos ?? []) as unknown[],
    videos: (p.videos ?? []) as unknown[],
    serviceArea: (p.serviceArea ?? p.service_area ?? []) as string[],
    profileUrl: (p.profileUrl ?? p.profile_url ?? `https://boatwork.co/pro/${slug}`) as string,
    updatedAt: (p.updatedAt ?? p.updated_at ?? new Date().toISOString()) as string,
    hoursOfOperation: (p.hoursOfOperation ?? p.hours_of_operation ?? {}) as Record<string, string>,
    social: (p.social ?? { facebook: null, instagram: null, linkedin: null, youtube: null }) as BoatworkProfile['social'],
  };
}

// ---------- Fallback content ----------

function buildFallbackContent(profile: BoatworkProfile): GeneratedContent {
  const city = profile.city ?? 'Fort Lauderdale';
  const state = profile.state ?? 'FL';
  const primaryService = profile.specialties[0]?.name ?? profile.services[0]?.name ?? 'Yacht Management';

  return {
    tagline: 'Where Luxury Meets Meticulous Care',
    about: profile.description ?? `${profile.name} is a premier marine services provider based in ${city}, ${state}. Offering comprehensive yacht management and maintenance services, the team delivers expert care with precision and professionalism.`,
    seoTitle: `${profile.name} | ${primaryService} ${city}, ${state}`,
    seoDescription: `${profile.name} provides expert ${primaryService.toLowerCase()} and marine services in ${city}, ${state}. Trusted by yacht owners across South Florida.`,
    seoKeywords: [
      `${primaryService.toLowerCase()} ${city}`,
      `marine services ${city}`,
      `yacht maintenance ${city}`,
      `boat repair ${city}`,
      `yacht management ${state}`,
    ],
    serviceDescriptions: Object.fromEntries(
      (profile.services.length > 0 ? profile.services : profile.specialties).map((s) => [
        s.name,
        s.description ?? `Professional ${s.name.toLowerCase()} services in ${city}, ${state}.`,
      ]),
    ),
    serviceAreaDescription: profile.serviceArea.length > 0
      ? `Serving yacht owners across ${profile.serviceArea.join(', ')}.`
      : `Based in ${city}, serving the greater South Florida yachting community.`,
    commonProjects: [],
  };
}

// ---------- Claude API ----------

async function callClaude(profile: BoatworkProfile): Promise<GeneratedContent> {
  const city = profile.city ?? 'Fort Lauderdale';
  const state = profile.state ?? 'FL';
  const specialtyNames = profile.specialties.length > 0
    ? profile.specialties.map((s) => s.name).join(', ')
    : profile.services.map((s) => s.name).join(', ');
  const serviceNames = profile.services.map((s) => s.name).join(', ') || specialtyNames;
  const areas = profile.serviceArea.join(', ') || 'South Florida';
  const primaryService = profile.specialties[0]?.name ?? profile.services[0]?.name ?? 'Yacht Management';

  const systemPrompt = `You are an expert local SEO copywriter for marine service businesses.
Your job is to enrich contractor profile content for their website —
preserving their original voice, tone, and personality while naturally
weaving in location-specific and service-specific keywords that help them
rank in local search.

Rules:
- Never change the factual claims or specific details the contractor provided
- Keep the contractor's authentic voice — if they sound casual, keep it casual; if formal, keep it formal
- Add location keywords naturally (city, county, region) — don't force them
- Add service keywords that match what the contractor actually does
- Do NOT add superlatives ("best", "premier", "leading") unless the contractor already uses them
- Output must sound human-written, not like marketing copy`;

  const serviceList = profile.services.length > 0 ? profile.services : profile.specialties;
  const serviceDescriptionsTemplate = serviceList
    .map((s) => `  "${s.name}": "one SEO-friendly sentence specific to this service"`)
    .join(',\n');

  const userPrompt = `Generate SEO-enriched website content for this marine contractor. Return ONLY valid JSON with no markdown code fences.

Business: ${profile.name}
Location: ${city}, ${state}
Specialties: ${specialtyNames}
Services: ${serviceNames}
Service area: ${areas}
Original description: ${profile.description ? profile.description.slice(0, 500) : 'N/A'}

Return this exact JSON structure:
{
  "tagline": "short punchy tagline, 5-8 words, matches their voice",
  "about": "Write 2-3 sentences (max 100 words) introducing this business for their website. Preserve their authentic voice. Mention what they do and where they serve. Do not add superlatives they didn't use.",
  "seoTitle": "${profile.name} | ${primaryService} ${city}, ${state}",
  "seoDescription": "150-160 chars with city and primary service keywords plus CTA",
  "seoKeywords": ["6-8 [service] [city] pattern keywords"],
  "serviceDescriptions": {
${serviceDescriptionsTemplate}
  },
  "serviceAreaDescription": "one sentence (max 20 words) describing mobile marine service based in ${city}, ${state} serving ${areas}",
  "commonProjects": ["5-7 concise 8-15 word bullet items describing types of projects a boat owner would need done, derived from specialties: ${specialtyNames}"]
}

IMPORTANT: In serviceDescriptions, write a unique, specific 1-sentence description for each service that explains what ${profile.name} actually does for that service — not generic filler. Use the exact service names shown above as the JSON keys.`;

  console.log('[generate-content] Calling Claude...');
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    temperature: 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(cleaned) as GeneratedContent;

  if (!parsed.tagline || !parsed.about || !parsed.seoTitle) {
    throw new Error('Claude returned invalid content structure');
  }
  if (!Array.isArray(parsed.commonProjects)) parsed.commonProjects = [];
  if (!parsed.serviceDescriptions || typeof parsed.serviceDescriptions !== 'object') {
    parsed.serviceDescriptions = {};
  }

  return parsed;
}

// ---------- Cache helpers ----------

function readCache(): CacheFile | null {
  try {
    if (!fs.existsSync(CACHE_PATH)) return null;
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')) as CacheFile;
  } catch {
    return null;
  }
}

function writeCache(data: CacheFile): void {
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[generate-content] Wrote ${CACHE_PATH}`);
}

// ---------- Main ----------

async function main(): Promise<void> {
  const profile = await fetchProfile(PROFILE_SLUG!);

  const specialtiesKey = profile.specialties.map((s) => s.name).sort().join(',');
  const servicesKey = profile.services.map((s) => s.name).sort().join(',');

  // Check if existing cache is still valid
  const cached = readCache();
  if (
    cached &&
    cached.updatedAt === profile.updatedAt &&
    cached.specialtiesKey === specialtiesKey &&
    cached.servicesKey === servicesKey &&
    cached.contentVersion === CONTENT_VERSION
  ) {
    console.log('[generate-content] Cache is current — no regeneration needed');
    return;
  }

  let content: GeneratedContent;
  try {
    content = await callClaude(profile);
    console.log('[generate-content] Claude generation succeeded');
  } catch (err) {
    console.warn('[generate-content] Claude call failed, using fallback:', (err as Error).message);
    content = buildFallbackContent(profile);
  }

  writeCache({
    updatedAt: profile.updatedAt,
    specialtiesKey,
    servicesKey,
    contentVersion: CONTENT_VERSION,
    content,
  });
}

main().catch((err: Error) => {
  console.error('[generate-content] Fatal error:', err);
  process.exit(1);
});
