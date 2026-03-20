export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GiAnchor } from 'react-icons/gi';
import { getSiteData } from '@/lib/siteData';
import { SectionWrapper, PortfolioGrid } from '@/components/shared';

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteData();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  return {
    title: 'Portfolio',
    description: siteConfig.seo.description || `See our work — ${siteConfig.name} yacht management and marine services portfolio in ${siteConfig.city}, ${siteConfig.state}.`,
    alternates: {
      canonical: siteUrl ? `${siteUrl}/portfolio` : '/portfolio',
    },
  };
}

export default async function PortfolioPage() {
  const siteConfig = await getSiteData();

  if (siteConfig.portfolio.length === 0 && siteConfig.videos.length === 0) {
    redirect('/');
  }

  return (
    <>
      <section className="bg-hero-gradient text-white py-24 px-4 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-gold/60" />
            <GiAnchor className="text-gold" size={18} />
            <div className="h-px w-8 bg-gold/60" />
          </div>
          <h1 className="font-serif text-5xl font-bold mb-4">Our Work</h1>
          <p className="text-slate-300 font-sans max-w-xl mx-auto">
            A selection of recent projects from {siteConfig.name}.
          </p>
        </div>
      </section>

      <div className="gold-rule-full" />

      <SectionWrapper variant="cream">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-navy mb-4">Recent Projects</h2>
          <p className="text-text-light font-sans max-w-xl mx-auto">
            Click any image to view full size. Every project handled with the highest standards of care.
          </p>
        </div>
        <PortfolioGrid items={siteConfig.portfolio} videos={siteConfig.videos} businessName={siteConfig.name} />
      </SectionWrapper>

      <div className="gold-rule-full" />

      <SectionWrapper variant="navy">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold mb-4">Ready to Discuss Your Vessel?</h2>
          <p className="text-slate-300 font-sans mb-8">Let&apos;s talk about what your yacht needs.</p>
          <Link
            href="/contact"
            className="inline-block bg-gold text-navy font-sans font-bold px-10 py-4 hover:bg-gold-light transition-colors uppercase tracking-widest text-sm whitespace-nowrap"
          >
            Request a Quote
          </Link>
        </div>
      </SectionWrapper>
    </>
  );
}
