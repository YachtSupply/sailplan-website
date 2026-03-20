export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { GiAnchor } from 'react-icons/gi';
import { FiArrowRight, FiCheckCircle, FiAnchor } from 'react-icons/fi';
import { getSiteData } from '@/lib/siteData';
import { ServiceCard, SectionWrapper, ServiceAreaMap } from '@/components/shared';

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteData();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  return {
    title: 'Services',
    description: siteConfig.seo.description || `Premier yacht management and marine services by ${siteConfig.name} in ${siteConfig.city}, ${siteConfig.state}.`,
    alternates: {
      canonical: siteUrl ? `${siteUrl}/services` : '/services',
    },
  };
}

export default async function ServicesPage() {
  const siteConfig = await getSiteData();

  return (
    <>
      <section className="bg-hero-gradient text-white py-24 px-4 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-gold/60" />
            <GiAnchor className="text-gold" size={18} />
            <div className="h-px w-8 bg-gold/60" />
          </div>
          <h1 className="font-serif text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-slate-300 font-sans max-w-xl mx-auto mb-8">{siteConfig.tagline}</p>
          <Link
            href="/contact"
            className="inline-block bg-gold text-navy font-sans font-bold px-8 py-4 hover:bg-gold-light transition-colors uppercase tracking-widest text-sm whitespace-nowrap"
          >
            Get a Quote
          </Link>
        </div>
      </section>

      <div className="gold-rule-full" />

      <SectionWrapper variant="cream">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl font-bold text-navy mb-4">Comprehensive Marine Expertise</h2>
          <p className="text-text-light font-sans max-w-2xl mx-auto leading-relaxed">
            Every service delivered with the precision and attention your investment deserves.
          </p>
        </div>
        <div className={`grid gap-px bg-cream-dark ${
          siteConfig.services.length === 1 ? 'grid-cols-1' :
          siteConfig.services.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          siteConfig.services.length === 4 ? 'grid-cols-1 md:grid-cols-2' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {siteConfig.services.map((s) => (
            <div key={s.name} className="bg-cream flex flex-col">
              <ServiceCard {...s} />
              <div className="px-8 pb-8 bg-white border border-cream-dark border-t-0 -mt-px">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 whitespace-nowrap text-navy font-sans font-semibold text-xs uppercase tracking-widest hover:text-gold transition-colors border-b border-gold/40 pb-0.5"
                >
                  Request a Quote <FiArrowRight size={12} className="flex-shrink-0 inline-block" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {siteConfig.serviceAreaTitle !== 'Our Location' && (
          <div className="mt-10 flex items-center justify-center gap-3 bg-cream border border-cream-dark px-8 py-5 max-w-xl mx-auto">
            <FiAnchor className="text-gold flex-shrink-0" size={18} />
            <p className="font-sans text-sm text-text-light">
              <span className="font-semibold text-navy">Mobile service available</span> — we come to your marina or dock.
            </p>
          </div>
        )}
      </SectionWrapper>

      <div className="gold-rule-full" />

      <SectionWrapper variant="white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-gold/60" />
              <span className="text-gold text-xs font-sans font-semibold uppercase tracking-widest">Common Projects</span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-navy mb-8">What We Manage</h2>
            <ul className="space-y-4">
              {siteConfig.commonProjects?.map((p) => (
                <li key={p} className="flex items-start gap-3 font-sans text-text">
                  <FiCheckCircle className="text-gold mt-0.5 flex-shrink-0" size={18} />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-cream border border-cream-dark p-10">
            {siteConfig.portfolio.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-6 -mx-2">
                {siteConfig.portfolio.slice(0, 2).map((photo, i) => (
                  <div key={i} className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={photo.src}
                      alt={photo.caption || `Work by ${siteConfig.name}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}
            <h3 className="font-serif text-2xl font-bold text-navy mb-4">Have a Special Project?</h3>
            <p className="text-text-light font-sans mb-8 leading-relaxed">
              Not sure which service you need? Our team is happy to discuss your vessel and recommend the right approach.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 whitespace-nowrap bg-navy text-white font-sans font-semibold px-8 py-4 hover:bg-navy/80 transition-colors uppercase tracking-widest text-sm"
            >
              Get a Quote <FiArrowRight size={14} className="flex-shrink-0 inline-block" />
            </Link>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
