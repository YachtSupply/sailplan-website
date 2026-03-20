import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';

  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'bingbot', allow: '/' },
      { userAgent: 'Applebot', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'Claude-Web', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'YouBot', allow: '/' },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
