/**
 * AI-generated content loader.
 *
 * The actual AI generation happens in scripts/generate-content.mjs,
 * which runs before the Vercel build and writes src/data/generated-content.json.
 *
 * At build/runtime, this module just reads that static JSON file.
 * No Anthropic SDK, no API calls, no ANTHROPIC_API_KEY needed here.
 */

import fs from 'fs';
import path from 'path';
import type { BoatworkProfile } from './boatwork';

// ---------- Public types ----------

export interface GeneratedContent {
  tagline: string;               // Only used as fallback if profile.tagline is null
  about: string;                 // Enriched about text — voice-preserving + SEO
  seoTitle: string;              // "{Name} | {Primary Service} {City}, {State}"
  seoDescription: string;        // 150-160 chars, city + service keywords + CTA
  seoKeywords: string[];         // 6-8 "[service] [city]" patterns
  serviceDescriptions: Record<string, string>;  // Per-specialty 1-3 sentence descriptions
  serviceAreaDescription: string;  // Coverage copy from counties/radius
  commonProjects: string[];      // Bullet items derived from specialties
  serviceAreaLocalities: string[];  // AI-generated locality names within service radius
  serviceAreaTitle?: string;     // Dynamic section title based on business type
  serviceKeywords: Record<string, string[]>;  // Per-service bullet keywords
}

interface CachedContent {
  updatedAt: string;
  specialtiesKey?: string;
  servicesKey?: string;
  contentVersion?: string;
  content: GeneratedContent;
}

// ---------- Fallback content (used when generated-content.json is missing) ----------

export function buildFallbackContent(profile: BoatworkProfile): GeneratedContent {
  const city = profile.city ?? 'Fort Lauderdale';
  const state = profile.state ?? 'FL';
  const primaryService = profile.specialties[0]?.name ?? profile.services[0]?.name ?? 'Yacht Management';

  return {
    tagline: 'Where Luxury Meets Meticulous Care',
    about: profile.description ?? `${profile.name} is a premier marine services provider based in ${city}, ${state}. Offering comprehensive yacht management and maintenance services, the team delivers expert care with precision and professionalism. From routine maintenance to complete vessel oversight, every detail is handled with the highest standards.`,
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
        ('description' in s ? s.description : null) ?? `Professional ${s.name.toLowerCase()} services in ${city}, ${state}.`,
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

// ---------- Main export ----------

const CACHE_PATH = path.join(process.cwd(), 'src', 'data', 'generated-content.json');

/**
 * Loads AI-generated content from src/data/generated-content.json.
 * That file is written by scripts/generate-content.mjs before the build.
 * Falls back to static content derived from the profile if the file is missing.
 */
export async function generateSiteContent(profile: BoatworkProfile): Promise<GeneratedContent> {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const raw = fs.readFileSync(CACHE_PATH, 'utf-8');
      const cached = JSON.parse(raw) as CachedContent;
      if (cached?.content) {
        if (!Array.isArray(cached.content.commonProjects)) {
          cached.content.commonProjects = [];
        }
        if (!Array.isArray(cached.content.serviceAreaLocalities)) {
          cached.content.serviceAreaLocalities = [];
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

  console.warn('[aiContent] generated-content.json not found or invalid — using fallback content. Run scripts/generate-content.mjs before building.');
  return buildFallbackContent(profile);
}
