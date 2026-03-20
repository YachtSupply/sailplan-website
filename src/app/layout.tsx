import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { getSiteData } from '@/lib/siteData';
import { getProfileSlug } from '@/lib/config';
import { Navbar, Footer } from '@/components/shared';
import './globals.css';

// When BOATWORK_URL is set (production), the theme is served dynamically via
// the CSS endpoint and the data-theme attribute is omitted. In local dev
// (BOATWORK_URL not set), data-theme provides a static fallback.
const BOATWORK_URL = process.env.BOATWORK_URL ?? '';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-W1RXJPGQVB';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const data = await getSiteData();
  return {
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
      other: [
        { rel: 'icon', url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { rel: 'icon', url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    title: { template: data.seo.titleTemplate, default: data.seo.defaultTitle },
    description: data.seo.description,
    keywords: data.seo.keywords,
    alternates: {
      canonical: process.env.NEXT_PUBLIC_SITE_URL ?? '/',
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const data = await getSiteData();
  const profileSlug = getProfileSlug();
  const themeCssUrl = BOATWORK_URL
    ? `${BOATWORK_URL}/api/v1/public/contractors/${profileSlug}/theme.css`
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: data.name,
    description: data.description,
    telephone: data.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: data.city,
      addressRegion: data.state,
      addressCountry: 'US',
    },
    image: data.logoUrl,
    sameAs: [
      data.social.facebook,
      data.social.instagram,
      data.social.linkedin,
      data.social.youtube,
      data.boatwork.profileUrl,
    ].filter(Boolean),
  };

  return (
    <html lang="en" {...(!themeCssUrl ? { 'data-theme': data.websiteTheme || 'navy-gold' } : {})}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:wght@400..900&display=swap"
          rel="stylesheet"
        />
        {themeCssUrl && (
          <link rel="stylesheet" href={themeCssUrl} />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans bg-cream">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
        <Navbar logoUrl={data.logoUrl} name={data.name} hasPortfolio={data.portfolio.length > 0 || data.videos.length > 0} phone={data.phone} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
