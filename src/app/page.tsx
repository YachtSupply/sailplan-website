export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { GiAnchor } from 'react-icons/gi';
import { FiPhone, FiArrowRight, FiClock } from 'react-icons/fi';
import { getSiteData } from '@/lib/siteData';
import { formatPhone } from '@/lib/phoneUtils';
import { ServiceCard, ReviewCard, SectionWrapper, BoatworkBadge, BoatworkVerifiedBadge, PortfolioGrid, ServiceAreaMap } from '@/components/shared';

export async function generateMetadata(): Promise<Metadata> {
  const siteData = await getSiteData();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const title = `${siteData.name} — Marine Services in ${siteData.city}, ${siteData.state}`;
  const description = siteData.seo.description || `${siteData.name} provides expert marine services in ${siteData.city}, ${siteData.state}. Trusted by local boat owners. Get a free quote today.`;
  return {
    title,
    description,
    alternates: {
      canonical: siteUrl || '/',
    },
  };
}

function formatAbout(text: string) {
  if (!text) return null;

  // Split into paragraphs on double newlines; single newlines become spaces
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

  // Full text always stays in DOM for SEO — max-height CSS controls visibility
  return (
    <div className="mb-6">
      {/* First paragraph — always visible */}
      <p className="text-text font-sans leading-relaxed mb-4">{first}</p>

      {/* CSS accordion — remaining paragraphs in DOM, max-height toggled */}
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


export default async function HomePage() {
  const siteConfig = await getSiteData();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  const reviews = siteConfig.boatwork.staticReviews;
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 5;

  const phone = formatPhone(siteConfig.phone);
  const hasPortfolio = siteConfig.portfolio.length > 0 || siteConfig.videos.length > 0;

  // Strip leading business name from hero description to avoid duplication with <h1>
  const heroDescription = (() => {
    const raw = siteConfig.description || 'Professional marine services for boat owners in your area.';
    const escapedName = siteConfig.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return raw.replace(new RegExp(`^${escapedName}[,\\s]+`, 'i'), '');
  })();

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: siteConfig.name,
    description: siteConfig.about,
    url: siteUrl || undefined,
    telephone: phone?.href.replace('tel:', '') ?? siteConfig.phone,
    email: siteConfig.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: siteConfig.city,
      addressRegion: siteConfig.state,
      addressCountry: 'US',
    },
    image: siteConfig.logoUrl,
    priceRange: '$$',
    areaServed: siteConfig.serviceArea,
    sameAs: [
      siteConfig.social.facebook,
      siteConfig.social.instagram,
      siteConfig.boatwork.profileUrl,
    ].filter(Boolean),
    aggregateRating: reviews.length > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviews.length,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
  };

  const reviewSchemas = reviews.map((r) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: { '@type': 'LocalBusiness', name: siteConfig.name },
    reviewRating: { '@type': 'Rating', ratingValue: r.rating },
    author: { '@type': 'Person', name: r.author },
    reviewBody: r.text,
    datePublished: r.date,
  }));

  const serviceSchemas = siteConfig.services.map((s) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: s.name,
    provider: { '@type': 'LocalBusiness', name: siteConfig.name },
    description: s.description,
    areaServed: `${siteConfig.city}, ${siteConfig.state}`,
  }));

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const formatHours = (h: string) => h === 'Open' ? 'Open All Day' : h;

  return (
    <>
      {/* Hero */}
      <section className="relative bg-hero-gradient text-white overflow-hidden" style={{ minHeight: '85vh' }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="waves" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M0 40 Q20 20 40 40 Q60 60 80 40" stroke="var(--color-accent)" strokeWidth="1" fill="none"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#waves)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center" style={{ minHeight: '85vh' }}>
          <div className="mb-8">
            <Image
              src={siteConfig.logoUrl}
              alt={siteConfig.name}
              width={120}
              height={120}
              className="rounded-full mx-auto border-2 border-gold/40"
              unoptimized
            />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-gold/60" />
            <span className="text-gold text-xs font-sans font-semibold uppercase tracking-widest">
              {siteConfig.city}, {siteConfig.state}
            </span>
            <div className="h-px w-12 bg-gold/60" />
          </div>

          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-4 leading-tight">
            {siteConfig.name}
          </h1>
          <p className="text-gold-light font-serif text-xl md:text-2xl italic mb-4">
            {siteConfig.tagline}
          </p>
          <p className="text-slate-300 font-sans text-lg max-w-3xl mx-auto mb-10 leading-relaxed">
            {heroDescription}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/services"
              className="bg-gold text-navy font-sans font-bold px-8 py-4 hover:bg-gold-light transition-colors uppercase tracking-widest text-sm whitespace-nowrap"
            >
              Our Services
            </Link>
            <Link
              href="/contact"
              className="border border-gold/50 text-white font-sans font-semibold px-8 py-4 hover:border-gold hover:bg-white/5 transition-all uppercase tracking-widest text-sm whitespace-nowrap"
            >
              Request a Quote
            </Link>
          </div>

          {phone && (
            <a href={phone.href} className="mt-8 flex items-center gap-2 text-gold-light hover:text-gold transition-colors">
              <FiPhone size={16} />
              <span className="font-sans text-sm">{phone.display}</span>
            </a>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-cream to-transparent" />
      </section>

      {/* Gold divider */}
      <div className="gold-rule-full" />

      {/* Services Preview */}
      <SectionWrapper variant="cream" id="services">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-gold/60" />
            <GiAnchor className="text-gold" size={20} />
            <div className="h-px w-8 bg-gold/60" />
          </div>
          <h2 className="font-serif text-4xl font-bold text-navy mb-4">What We Do</h2>
          <p className="text-text-light font-sans max-w-2xl mx-auto leading-relaxed">
            Comprehensive marine services delivered with the expertise and care your vessel deserves.
          </p>
        </div>
        <div className={`grid gap-px bg-cream-dark ${
          siteConfig.services.length === 1 ? 'grid-cols-1' :
          siteConfig.services.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          siteConfig.services.length === 4 ? 'grid-cols-1 md:grid-cols-2' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {siteConfig.services.map((s) => (
            <div key={s.name} className="bg-cream">
              <ServiceCard {...s} />
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 whitespace-nowrap text-navy font-sans font-semibold text-sm uppercase tracking-widest hover:text-gold transition-colors border-b border-gold/40 pb-1"
          >
            View All Services <FiArrowRight size={14} className="flex-shrink-0 inline-block" />
          </Link>
        </div>
      </SectionWrapper>

      <div className="gold-rule-full" />

      {/* About + Boatwork */}
      <SectionWrapper variant="white" id="about">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-gold/60" />
              <span className="text-gold text-xs font-sans font-semibold uppercase tracking-widest">About Us</span>
            </div>
            <h2 className="font-serif text-4xl font-bold text-navy mb-6">About Our Business</h2>
            {siteConfig.yearEstablished && (
              <p className="text-gold font-sans text-sm font-semibold uppercase tracking-widest mb-4">
                Serving {siteConfig.city} since {siteConfig.yearEstablished}
              </p>
            )}
            {formatAbout(siteConfig.about)}
            <Link href="/services" className="inline-flex items-center gap-2 whitespace-nowrap text-navy font-sans font-semibold text-sm uppercase tracking-widest hover:text-gold transition-colors border-b border-gold/40 pb-1">
              Our Services <FiArrowRight size={14} className="flex-shrink-0 inline-block" />
            </Link>
          </div>
          <div className="bg-cream border border-cream-dark p-8 flex flex-col items-center text-center">
            <div className="mb-6">
              <Image
                src={siteConfig.logoUrl}
                alt={siteConfig.name}
                width={100}
                height={100}
                className="rounded-full mx-auto"
                unoptimized
              />
            </div>
            {reviews.length > 0 ? (
              <>
                <div className="flex mb-3">
                  {[1,2,3,4,5].map((i) => (
                    <span key={i} className={`text-xl ${i <= Math.round(avgRating) ? 'text-gold' : 'text-gray-300'}`}>★</span>
                  ))}
                </div>
                <p className="font-serif text-lg text-navy mb-2">{avgRating.toFixed(1)} Star Rated on Boatwork</p>
                <p className="text-text-light font-sans text-sm mb-6">Read verified reviews from real boat owners</p>
              </>
            ) : (
              <>
                <p className="font-serif text-lg text-navy mb-2">New on Boatwork</p>
                <p className="text-text-light font-sans text-sm mb-6">No reviews yet — be one of the first</p>
              </>
            )}
            <BoatworkVerifiedBadge
                size="sm"
                badgeUrl={siteConfig.badge?.badgeUrl}
                svgUrl={siteConfig.badge?.svgUrl}
                embedCode={siteConfig.badge?.embedCode}
                pixelUrl={siteConfig.badge?.pixelUrl}
                profileUrl={siteConfig.badge?.profileUrl}
              />
          </div>
        </div>
      </SectionWrapper>

      {/* Reviews — hidden if profile has no reviews */}
      {reviews.length > 0 && (
        <>
          <div className="gold-rule-full" />
          <SectionWrapper variant="cream" id="reviews">
            <div className="text-center mb-14">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-gold/60" />
                <GiAnchor className="text-gold" size={20} />
                <div className="h-px w-8 bg-gold/60" />
              </div>
              <h2 className="font-serif text-4xl font-bold text-navy mb-4">What Our Clients Say</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-cream-dark">
              {siteConfig.boatwork.staticReviews.map((r) => (
                <div key={r.author} className="bg-cream">
                  <ReviewCard {...r} />
                </div>
              ))}
            </div>
          </SectionWrapper>
        </>
      )}

      {/* Portfolio — hidden if profile has no photos and no videos */}
      {hasPortfolio && (
        <>
          <div className="gold-rule-full" />
          <SectionWrapper variant="white" id="portfolio">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-gold/60" />
                <GiAnchor className="text-gold" size={20} />
                <div className="h-px w-8 bg-gold/60" />
              </div>
              <h2 className="font-serif text-4xl font-bold text-navy mb-4">Our Work</h2>
              <p className="text-text-light font-sans max-w-xl mx-auto">
                A glimpse of what we do for local boat owners.
              </p>
            </div>
            <PortfolioGrid items={siteConfig.portfolio.slice(0, 6)} videos={siteConfig.videos} businessName={siteConfig.name} />
            <div className="text-center mt-10">
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 text-navy font-sans font-semibold text-sm uppercase tracking-widest hover:text-gold transition-colors border-b border-gold/40 pb-1 whitespace-nowrap"
              >
                View Full Portfolio <FiArrowRight size={14} className="flex-shrink-0 inline-block" />
              </Link>
            </div>
          </SectionWrapper>
        </>
      )}

      <div className="gold-rule-full" />

      {/* Service Area */}
      <SectionWrapper variant="white" id="service-area">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-gold/60" />
              <span className="text-gold text-xs font-sans font-semibold uppercase tracking-widest">Service Area</span>
            </div>
            <h2 className="font-serif text-4xl font-bold text-navy mb-6">{siteConfig.serviceAreaTitle}</h2>
            <p className="text-text font-sans mb-4 leading-relaxed">
              {siteConfig.serviceAreaDescription}
            </p>
            <ul className="space-y-3">
              {siteConfig.serviceArea.map((a) => (
                <li key={a} className="flex items-center gap-3 font-sans text-text">
                  <span className="w-2 h-2 bg-gold rounded-full flex-shrink-0" />
                  <span className="font-semibold">{a}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="h-96 lg:h-full min-h-[360px]">
            <ServiceAreaMap localities={siteConfig.serviceArea} />
          </div>
        </div>
      </SectionWrapper>

      {/* Business Hours — always shown; falls back to "Available 24/7" when no data */}
      <>
        <div className="gold-rule-full" />
        <SectionWrapper variant="cream" id="hours">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <FiClock className="text-gold flex-shrink-0" size={22} />
              <h2 className="font-serif text-3xl font-bold text-navy">Business Hours</h2>
            </div>
            <div className="bg-white border border-cream-dark p-6 space-y-2">
              {siteConfig.hoursOfOperation && dayOrder.some((d) => !!siteConfig.hoursOfOperation![d])
                ? dayOrder.map((day) => {
                    const hours = siteConfig.hoursOfOperation![day];
                    if (!hours) return null;
                    return (
                      <div key={day} className="flex justify-between font-sans text-sm">
                        <span className="text-navy font-semibold w-28">{day}</span>
                        <span className="text-text">{formatHours(hours)}</span>
                      </div>
                    );
                  })
                : <p className="text-text font-sans text-sm text-center py-2">Available 24/7</p>
              }
            </div>
          </div>
        </SectionWrapper>
      </>

      {/* CTA */}
      <SectionWrapper variant="navy">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-gold/40" />
            <GiAnchor className="text-gold" size={20} />
            <div className="h-px w-12 bg-gold/40" />
          </div>
          <h2 className="font-serif text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-slate-300 font-sans mb-3">Speak directly with our team about your vessel.</p>
          {phone ? (
            <a href={phone.href} className="text-gold font-serif text-3xl font-bold block mb-10 hover:text-gold-light transition-colors">
              {phone.display}
            </a>
          ) : (
            <a href={`tel:${siteConfig.phone}`} className="text-gold font-serif text-3xl font-bold block mb-10 hover:text-gold-light transition-colors">
              {siteConfig.phone}
            </a>
          )}
          <Link
            href="/contact"
            className="inline-block bg-gold text-navy font-sans font-bold px-10 py-4 hover:bg-gold-light transition-colors uppercase tracking-widest text-sm whitespace-nowrap"
          >
            Contact Us
          </Link>
        </div>
      </SectionWrapper>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      {reviewSchemas.map((schema, i) => (
        <script
          key={`review-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {serviceSchemas.map((schema, i) => (
        <script
          key={`service-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
