#!/usr/bin/env node
/**
 * Pre-build AI content generation script.
 *
 * Fetches the Boatwork contractor profile, calls Claude Sonnet to generate
 * SEO-enriched website content, and writes src/data/generated-content.json.
 *
 * Run this BEFORE `vercel deploy` (or `next build`) in your CI/CD pipeline:
 *
 *   BOATWORK_PROFILE_SLUG=yachts-etc ANTHROPIC_API_KEY=sk-ant-... node scripts/generate-content.mjs
 *
 * The JSON is committed so Vercel can read it at build time without needing
 * ANTHROPIC_API_KEY in its environment.
 *
 * Cache invalidation: regenerates only when profile.updatedAt, specialties,
 * services, or CONTENT_VERSION changes — same logic as the old runtime cache.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(__dirname, '..', 'src', 'data', 'generated-content.json');

// Increment this when the AI prompt or GeneratedContent shape changes significantly.
const CONTENT_VERSION = '7';

// ---------- Config ----------

const PROFILE_SLUG = process.env.BOATWORK_PROFILE_SLUG;
const PROFILE_ID = process.env.BOATWORK_PROFILE_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!PROFILE_SLUG && !PROFILE_ID) {
  console.error('[generate-content] Error: BOATWORK_PROFILE_SLUG or BOATWORK_PROFILE_ID environment variable is required');
  process.exit(1);
}

if (!ANTHROPIC_API_KEY) {
  console.error('[generate-content] Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

// ---------- Boatwork API ----------

async function fetchProfile(slug, profileId) {
  const url = profileId
    ? `https://boatwork.co/api/v1/public/contractors/by-id/${profileId}`
    : `https://boatwork.co/api/v1/public/contractors/${slug}`;
  console.log(`[generate-content] Fetching profile: ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    const identifier = profileId ? `id "${profileId}"` : `slug "${slug}"`;
    throw new Error(`Boatwork API returned ${res.status} for ${identifier}`);
  }

  const data = await res.json();
  const p = data.data ?? data;

  return {
    name: p.name ?? p.businessName ?? slug ?? profileId,
    slug: p.slug ?? slug ?? '',
    tagline: p.tagline ?? null,
    badge: p.badge ?? null,
    description: p.description ?? p.bio ?? null,
    phone: p.phone ?? null,
    email: p.email ?? null,
    address: p.address ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    logoUrl: p.logoUrl ?? p.logo_url ?? null,
    coverImageUrl: p.coverImageUrl ?? p.cover_image_url ?? null,
    isVerified: p.isVerified ?? p.is_verified ?? false,
    rating: p.rating ?? null,
    reviewCount: p.reviewCount ?? p.review_count ?? 0,
    reviews: p.reviews ?? [],
    services: p.services ?? [],
    specialties: p.specialties ?? [],
    photos: p.photos ?? [],
    videos: p.videos ?? [],
    yearEstablished: p.yearEstablished ?? p.year_established ?? null,
    serviceAreaRadius: p.serviceAreaRadius ?? p.service_area_radius ?? null,
    serviceArea: p.serviceArea ?? p.service_area ?? [],
    profileUrl: p.profileUrl ?? p.profile_url ?? `https://boatwork.co/pro/${slug}`,
    updatedAt: p.updatedAt ?? p.updated_at ?? new Date().toISOString(),
    hoursOfOperation: p.hoursOfOperation ?? p.hours_of_operation ?? {},
    social: p.social ?? { facebook: null, instagram: null, linkedin: null, youtube: null },
  };
}

// ---------- Service area coordinates ----------

const KNOWN_COORDS = {
  'fort lauderdale': [26.1224, -80.1373],
  'miami': [25.7617, -80.1918],
  'miami beach': [25.7907, -80.1300],
  'west palm beach': [26.7153, -80.0534],
  'palm beach': [26.7056, -80.0364],
  'boca raton': [26.3683, -80.1289],
  'naples': [26.1420, -81.7948],
  'cape coral': [26.5629, -81.9495],
  'fort myers': [26.6406, -81.8723],
  'tampa': [27.9506, -82.4572],
  'st. petersburg': [27.7676, -82.6403],
  'clearwater': [27.9659, -82.8001],
  'sarasota': [27.3364, -82.5307],
  'bradenton': [27.4989, -82.5748],
  'jacksonville': [30.3322, -81.6557],
  'key west': [24.5551, -81.7800],
  'marathon': [24.7215, -81.0499],
};

async function getCityCoordinates(city, state) {
  const key = city.toLowerCase().trim();
  if (KNOWN_COORDS[key]) {
    return { lat: KNOWN_COORDS[key][0], lng: KNOWN_COORDS[key][1] };
  }
  try {
    const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state ?? '')}&country=US&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'marine-pro-website-template/1.0' } });
    if (res.ok) {
      const data = await res.json();
      if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {}
  return null;
}

async function getServiceAreaLocalities(profile, client) {
  const city = profile.city ?? 'Fort Lauderdale';
  const state = profile.state ?? 'FL';
  const radius = profile.serviceAreaRadius ?? 40;

  const coords = await getCityCoordinates(city, state);
  const locationDesc = coords
    ? `centered at ${coords.lat.toFixed(4)}°N, ${Math.abs(coords.lng).toFixed(4)}°W (${city}, ${state})`
    : `centered on ${city}, ${state}`;

  let prompt;
  if (radius > 200) {
    // Use regional/broad terms rather than specific city names
    prompt = `List exactly 5 broad regional marine service areas (e.g. "Gulf Coast", "East Coast", "Caribbean", "Atlantic Seaboard") for a business with a ${radius}-mile radius ${locationDesc}. Use regional terms, not specific city names. Return ONLY a JSON array of 5 strings, no markdown, no explanation:\n["Region 1", "Region 2", ...]`;
  } else {
    prompt = `List exactly 5 of the largest, most SEO-friendly city and locality names within a ${radius}-mile radius ${locationDesc}, relevant to marine and boating services. Include the center city. Focus on coastal communities and waterfront towns. Return ONLY a JSON array of exactly 5 strings, no markdown, no explanation:\n["City 1", "City 2", ...]`;
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = message.content[0]?.type === 'text' ? message.content[0].text : '[]';
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((s) => typeof s === 'string')) {
      return parsed.slice(0, 5);
    }
  } catch (err) {
    console.warn('[generate-content] Failed to get service area localities:', err.message);
  }
  return [city, `${city}, ${state}`];
}

function getServiceAreaTitle(profile) {
  const radius = profile.serviceAreaRadius ?? 0;
  const typeStr = [
    ...profile.specialties.map((s) => s.name),
    ...profile.services.map((s) => s.name),
  ].join(' ').toLowerCase();

  if (radius > 500) return 'Serving Vessels Worldwide';
  if (typeStr.includes('marina') || typeStr.includes('boatyard') || typeStr.includes('facility') || typeStr.includes('yard')) {
    return 'Our Location';
  }
  if (typeStr.includes('management') || typeStr.includes('captain') || typeStr.includes('crew') || typeStr.includes('mobile')) {
    return 'We Come to You';
  }
  return 'Our Service Area';
}

// ---------- Fallback content ----------

function buildFallbackContent(profile) {
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
    serviceAreaLocalities: [],
    serviceKeywords: {},
  };
}

// ---------- Claude API ----------

async function callClaude(profile, client) {
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

  const serviceAreaRadius = profile.serviceAreaRadius ?? 0;
  const serviceList = profile.services.length > 0 ? profile.services : profile.specialties;
  const serviceDescriptionsTemplate = serviceList
    .map((s) => `  "${s.name}": "1-3 sentences about this service — describe what is done and why it matters. Use only service/trade keywords. NO city names, NO locality names, NO geographic references whatsoever."`)
    .join(',\n');

  const serviceKeywordsTemplate = serviceList
    .map((s) => `  "${s.name}": ["3-5 bullet strings: what is included in this service, service-specific only, no locality keywords"]`)
    .join(',\n');

  const globalScopeNote = serviceAreaRadius > 500
    ? 'This business serves clients globally — emphasize wide-reaching or international scope rather than local city references.'
    : `Include geographic keywords: ${city}, ${state}, and nearby waters/communities.`;

  const userPrompt = `Generate SEO-enriched website content for this marine contractor. Return ONLY valid JSON with no markdown code fences.

Business: ${profile.name}
Location: ${city}, ${state}
Specialties: ${specialtyNames}
Services: ${serviceNames}
Service area: ${areas}
Service area radius: ${serviceAreaRadius} miles
In business since: ${profile.yearEstablished ?? 'N/A'}
Original description: ${profile.description ?? 'N/A'}

Return this exact JSON structure:
{
  "tagline": "short punchy tagline, 5-8 words, matches their voice",
  "about": "REQUIRED: Write 100-300 words (minimum 3 paragraphs) for the About Our Business section. DO NOT write a single sentence or short paragraph — write a full, rich about section. Start from the original description above as your base and expand it substantially. Preserve every factual detail and the contractor's authentic voice. Paragraph 1: introduce the business, what they do, and their location. Paragraph 2: describe their services and expertise using service-specific keywords (${specialtyNames}). Paragraph 3: describe who they serve and their commitment to quality. ${globalScopeNote} Do not add superlatives the contractor did not use. Minimum 100 words — aim for 200-300 words.",
  "seoTitle": "${profile.name} | ${primaryService} ${city}, ${state}",
  "seoDescription": "150-160 chars with city and primary service keywords plus CTA",
  "seoKeywords": ["6-8 [service] [city] pattern keywords"],
  "serviceDescriptions": {
${serviceDescriptionsTemplate}
  },
  "serviceAreaDescription": "one sentence (max 20 words) describing mobile marine service based in ${city}, ${state} serving ${areas}",
  "commonProjects": ["5-7 concise 8-15 word bullet items describing types of projects a boat owner would need done, derived from specialties: ${specialtyNames}"],
  "serviceKeywords": {
${serviceKeywordsTemplate}
  }
}

IMPORTANT: In serviceDescriptions, write a unique, specific 1-3 sentence description for each service that explains what ${profile.name} actually does for that service — not generic filler. Use only service-related keywords in these descriptions — do NOT include city names, locality names, or geographic references. Use the exact service names shown above as the JSON keys.

For serviceKeywords, provide 3-5 concise bullet strings per service describing what is specifically included (e.g. for 'Yacht Management': ['Vendor scheduling and coordination', 'Routine maintenance oversight', 'Vessel readiness checks', 'Budget tracking and reporting']). Service-specific only — no locality or city keywords.`;

  console.log('[generate-content] Calling Claude...');
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    temperature: 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(cleaned);

  if (!parsed.tagline || !parsed.about || !parsed.seoTitle) {
    throw new Error('Claude returned invalid content structure');
  }
  if (!Array.isArray(parsed.commonProjects)) parsed.commonProjects = [];
  if (!parsed.serviceDescriptions || typeof parsed.serviceDescriptions !== 'object') {
    parsed.serviceDescriptions = {};
  }
  if (!parsed.serviceKeywords || typeof parsed.serviceKeywords !== 'object') {
    parsed.serviceKeywords = {};
  }

  return parsed;
}

// ---------- Cache helpers ----------

function readCache() {
  try {
    if (!fs.existsSync(CACHE_PATH)) return null;
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

function writeCache(data) {
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[generate-content] Wrote ${CACHE_PATH}`);
}

// ---------- Main ----------

async function main() {
  const profile = await fetchProfile(PROFILE_SLUG, PROFILE_ID);

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

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  let content;
  try {
    content = await callClaude(profile, client);
    console.log('[generate-content] Claude generation succeeded');
  } catch (err) {
    console.warn('[generate-content] Claude call failed, using fallback:', err.message);
    content = buildFallbackContent(profile);
  }

  console.log('[generate-content] Generating service area localities...');
  content.serviceAreaLocalities = await getServiceAreaLocalities(profile, client);
  content.serviceAreaTitle = getServiceAreaTitle(profile);

  writeCache({
    updatedAt: profile.updatedAt,
    specialtiesKey,
    servicesKey,
    contentVersion: CONTENT_VERSION,
    content,
  });
}

main().catch((err) => {
  console.error('[generate-content] Fatal error:', err);
  process.exit(1);
});
