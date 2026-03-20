import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';
  const now = new Date().toISOString();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/services`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/portfolio`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${baseUrl}/social`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
