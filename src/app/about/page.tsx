export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { GiAnchor } from 'react-icons/gi';
import { FiArrowRight, FiMapPin } from 'react-icons/fi';
import { getSiteData } from '@/lib/siteData';
import { SectionWrapper, BoatworkVerifiedBadge } from '@/components/shared';

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteData();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  return {
    title: 'About',
    description: siteConfig.seo.description || `Learn about ${siteConfig.name} — trusted marine services in ${siteConfig.city}, ${siteConfig.state}.`,
    alternates: {
      canonical: siteUrl ? `${siteUrl}/about` : '/about',
    },
  };
}

function formatAbout(text: string) {
  if (!text) return null;

  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    return (
      <div className="mb-6">
        <p className="text-text font-sans leading-relaxed">{text}</p>
      </div>
    );
  }

  const first = paragraphs[0];
  const rest = paragraphs.slice(1);

  return (
    <div className="mb-6">
      <p className="text-text font-sans leading-relaxed mb-4">{first}</p>
      <details className="group">
        <summary className="cursor-pointer list-none text-gold font-sans text-sm font-semibold uppercase tracking-widest hover:text-gold-light transition-colors mb-3 inline-block border-b border-gold/40 pb-0.5 select-none">
          <span className="group-open:hidden">Read more</span>
          <span className="hidden group-open:inline">Show less</span>
        </summary>
        <div className="about-accordion overflow-hidden transition-[max-height] duration-300 ease-in-out">
          {rest.map((p, i) => (
            <p key={i} className="text-text font-sans leading-relaxed mb-4">{p}</p>
          ))}
        </div>
      </details>
      <style>{`
        .about-accordion { display: block !important; max-height: 0; }
        details[open] .about-accordion { max-height: 3000px; }
      `}</style>
    </div>
  );
}

export default async function AboutPage() {
  const siteConfig = await getSiteData();

  return (
    <>
      {/* Hero */}
      <section className="bg-hero-gradient text-white py-24 px-4 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-gold/60" />
            <GiAnchor className="text-gold" size={18} />
            <div className="h-px w-8 bg-gold/60" />
          </div>
          <h1 className="font-serif text-5xl font-bold mb-4">{siteConfig.name}</h1>
          <p className="text-gold-light font-serif text-xl italic mb-4">{siteConfig.tagline}</p>
          {siteConfig.yearEstablished && (
            <p className="text-slate-300 font-sans text-sm uppercase tracking-widest">
              Serving {siteConfig.city} since {siteConfig.yearEstablished}
            </p>
          )}
        </div>
      </section>

      <div className="gold-rule-full" />

      {/* About content */}
      <SectionWrapper variant="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-gold/60" />
              <span className="text-gold text-xs font-sans font-semibold uppercase tracking-widest">Our Story</span>
            </div>
            <h2 className="font-serif text-4xl font-bold text-navy mb-6">About Our Business</h2>
            {siteConfig.yearEstablished && (
              <p className="text-gold font-sans text-sm font-semibold uppercase tracking-widest mb-4">
                Serving {siteConfig.city} since {siteConfig.yearEstablished}
              </p>
            )}
            {formatAbout(siteConfig.about)}
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 whitespace-nowrap bg-navy text-white font-sans font-semibold px-8 py-4 hover:bg-navy/80 transition-colors uppercase tracking-widest text-sm mt-2"
            >
              Get a Quote <FiArrowRight size={14} className="flex-shrink-0 inline-block" />
            </Link>
          </div>

          <div className="space-y-8">
            {/* Logo + badge panel */}
            <div className="bg-cream border border-cream-dark p-8 flex flex-col items-center text-center">
              <Image
                src={siteConfig.logoUrl}
                alt={siteConfig.name}
                width={100}
                height={100}
                className="rounded-full mx-auto mb-6"
                unoptimized
              />
              <div className="flex mb-3">
                {[1,2,3,4,5].map((i) => <span key={i} className="text-gold text-xl">★</span>)}
              </div>
              <p className="font-serif text-lg text-navy mb-2">5-Star Rated on Boatwork</p>
              <p className="text-text-light font-sans text-sm mb-6">Verified reviews from real boat owners</p>
              <BoatworkVerifiedBadge
                size="sm"
                badgeUrl={siteConfig.badge?.badgeUrl}
                svgUrl={siteConfig.badge?.svgUrl}
                embedCode={siteConfig.badge?.embedCode}
                pixelUrl={siteConfig.badge?.pixelUrl}
                profileUrl={siteConfig.badge?.profileUrl}
              />
            </div>

            {/* Service area */}
            <div className="bg-cream border border-cream-dark p-8">
              <div className="flex items-center gap-3 mb-4">
                <FiMapPin className="text-gold" size={18} />
                <span className="text-gold text-xs font-sans font-semibold uppercase tracking-widest">Coverage Area</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-navy mb-4">{siteConfig.serviceAreaTitle}</h3>
              <p className="text-text-light font-sans text-sm mb-4">{siteConfig.serviceAreaDescription}</p>
              <ul className="space-y-2">
                {siteConfig.serviceArea.map((a) => (
                  <li key={a} className="flex items-center gap-3 font-sans text-text text-sm">
                    <span className="w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </SectionWrapper>

      <div className="gold-rule-full" />

      {/* CTA */}
      <SectionWrapper variant="navy">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-gold/40" />
            <GiAnchor className="text-gold" size={20} />
            <div className="h-px w-12 bg-gold/40" />
          </div>
          <h2 className="font-serif text-4xl font-bold mb-4">Ready to Work Together?</h2>
          <p className="text-slate-300 font-sans mb-8 max-w-xl mx-auto">
            Contact our team today to discuss your vessel and get a personalized quote.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-gold text-navy font-sans font-bold px-10 py-4 hover:bg-gold-light transition-colors uppercase tracking-widest text-sm whitespace-nowrap"
          >
            Get a Quote
          </Link>
        </div>
      </SectionWrapper>
    </>
  );
}
