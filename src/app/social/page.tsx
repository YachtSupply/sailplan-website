import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { GiAnchor } from 'react-icons/gi';
import { FiInstagram, FiFacebook, FiCamera, FiVideo, FiMessageSquare, FiStar, FiSun } from 'react-icons/fi';
import { SectionWrapper } from '@/components/shared';
import { getSiteData } from '@/lib/siteData';

export async function generateMetadata(): Promise<Metadata> {
  const data = await getSiteData();
  return {
    title: 'Social Media',
    description: `Social media marketing strategy and content calendar for ${data.name} — managed by Boatwork.`,
  };
}

const pillars = [
  {
    icon: <FiCamera size={22} />,
    label: 'The Work',
    pct: '40%',
    description: 'Real job photos and videos. Before/afters, teak restoration, haulouts, engine bays. No stock photos — ever.',
  },
  {
    icon: <FiMessageSquare size={22} />,
    label: 'Education',
    pct: '25%',
    description: 'Quick tips for yacht owners. Positions us as the expert in South Florida waters and builds trust before they call.',
  },
  {
    icon: <FiStar size={22} />,
    label: 'Social Proof',
    pct: '20%',
    description: 'Real reviews, client shoutouts, and completed project reveals pulled directly from our Boatwork profile.',
  },
  {
    icon: <FiSun size={22} />,
    label: 'Lifestyle',
    pct: '15%',
    description: 'Fort Lauderdale marina life, sunsets, and the Florida boating lifestyle. Aspirational and authentic.',
  },
];

const calendar = [
  {
    day: 'Monday',
    platforms: ['instagram', 'facebook'],
    format: 'Before & After Photo',
    copy: 'Teak doesn\'t lie. Before and after from a recent project in Fort Lauderdale. This is what 20 hours of hand-sanding, bleaching, and oiling looks like. Worth every minute.',
    tags: '#YachtsEtc #TekDecks #FortLauderdale #YachtMaintenance',
  },
  {
    day: 'Tuesday',
    platforms: ['instagram'],
    format: 'Video Reel',
    copy: 'Your yacht deserves this level of attention. See what we do for our clients. Link in bio to request a quote.',
    tags: '#YachtManagement #SouthFlorida #MarineServices',
  },
  {
    day: 'Wednesday',
    platforms: ['facebook'],
    format: 'Educational Post',
    copy: '3 things every South Florida boat owner should check before summer season:\n\n1. Through-hulls and seacocks — can you close them?\n2. Zincs — are they depleted?\n3. Running gear — any growth or dings on the prop?\n\nWe handle all of this. Call 1-305-332-6015.',
    tags: '#YachtMaintenance #FortLauderdale #BoatCare',
  },
  {
    day: 'Thursday',
    platforms: ['instagram'],
    format: 'Detail / Close-Up Photo',
    copy: 'The details matter. Freshly refinished running gear on a recent haulout. Everything below the waterline protected and dialed in.',
    tags: '#YachtDetailing #BottomPaint #FortLauderdaleYachts',
  },
  {
    day: 'Friday',
    platforms: ['instagram', 'facebook'],
    format: 'Review Spotlight',
    copy: '"Anniel\'s attention to detail is impeccable. His knowledge of a broad range of yacht systems is outstanding and he takes pride in his work. I know the boat is in great hands." — Jacob R. ⭐⭐⭐⭐⭐\n\nThis is why we do what we do.',
    tags: '#ClientReview #Boatwork #YachtsEtc',
  },
  {
    day: 'Saturday',
    platforms: ['instagram'],
    format: 'Lifestyle / Marina Shot',
    copy: 'Another week on the water. Fort Lauderdale\'s marine community is something special. Proud to keep these vessels running.',
    tags: '#FortLauderdale #MarineLife #YachtLife #SouthFlorida',
  },
  {
    day: 'Sunday',
    platforms: ['facebook'],
    format: 'Service Spotlight',
    copy: 'Did you know Yachts Etc. handles full yacht management programs? From routine maintenance to crew management to emergency repairs — one call, one team, everything handled. Serving Broward, Miami-Dade, Palm Beach, and Monroe counties.',
    tags: '#YachtManagement #SouthFlorida #MarineServices',
  },
];

const platformIcon = (p: string) =>
  p === 'instagram'
    ? <span key="ig" className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-white bg-[#E1306C] px-2 py-0.5 rounded-full"><FiInstagram size={11} /> Instagram</span>
    : <span key="fb" className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-white bg-[#1877F2] px-2 py-0.5 rounded-full"><FiFacebook size={11} /> Facebook</span>;

export default async function SocialPage() {
  const siteData = await getSiteData();
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
          <h1 className="font-serif text-5xl font-bold mb-4">Social Media</h1>
          <p className="text-slate-300 font-sans max-w-xl mx-auto">
            Managed social media marketing for {siteData.name} — powered by Boatwork.
          </p>
          <div className="flex items-center justify-center gap-6 mt-8">
            {siteData.social.instagram && (
              <a href={siteData.social.instagram} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-gold/40 text-white px-5 py-2.5 hover:border-gold hover:bg-white/5 transition-all font-sans text-sm font-semibold">
                <FiInstagram size={16} /> @yachts.etc
              </a>
            )}
            {siteData.social.facebook && (
              <a href={siteData.social.facebook} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-gold/40 text-white px-5 py-2.5 hover:border-gold hover:bg-white/5 transition-all font-sans text-sm font-semibold">
                <FiFacebook size={16} /> Facebook
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="gold-rule-full" />

      {/* Strategy Overview */}
      <SectionWrapper variant="cream">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-gold/60" />
            <GiAnchor className="text-gold" size={20} />
            <div className="h-px w-8 bg-gold/60" />
          </div>
          <h2 className="font-serif text-4xl font-bold text-navy mb-4">Our Strategy</h2>
          <p className="text-text-light font-sans max-w-2xl mx-auto leading-relaxed">
            Four content pillars, seven posts per week across Instagram and Facebook. Every post uses real photos from our work — no stock, no filler.
          </p>
        </div>

        {/* Frequency badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <div className="bg-white border border-cream-dark px-6 py-4 text-center">
            <p className="font-serif text-3xl font-bold text-navy">4x</p>
            <p className="text-xs font-sans font-semibold uppercase tracking-widest text-gold mt-1">Instagram / week</p>
          </div>
          <div className="bg-white border border-cream-dark px-6 py-4 text-center">
            <p className="font-serif text-3xl font-bold text-navy">3x</p>
            <p className="text-xs font-sans font-semibold uppercase tracking-widest text-gold mt-1">Facebook / week</p>
          </div>
          <div className="bg-white border border-cream-dark px-6 py-4 text-center">
            <p className="font-serif text-3xl font-bold text-navy">7</p>
            <p className="text-xs font-sans font-semibold uppercase tracking-widest text-gold mt-1">Total posts / week</p>
          </div>
          <div className="bg-white border border-cream-dark px-6 py-4 text-center">
            <p className="font-serif text-3xl font-bold text-navy">0</p>
            <p className="text-xs font-sans font-semibold uppercase tracking-widest text-gold mt-1">Stock photos used</p>
          </div>
        </div>

        {/* Content pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-cream-dark">
          {pillars.map((p) => (
            <div key={p.label} className="bg-white p-8">
              <div className="text-gold mb-4">{p.icon}</div>
              <div className="flex items-baseline gap-2 mb-3">
                <p className="font-serif text-lg font-bold text-navy">{p.label}</p>
                <span className="text-xs font-sans font-semibold text-gold">{p.pct}</span>
              </div>
              <p className="text-text-light font-sans text-sm leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      <div className="gold-rule-full" />

      {/* Content Calendar */}
      <SectionWrapper variant="white">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-gold/60" />
            <GiAnchor className="text-gold" size={20} />
            <div className="h-px w-8 bg-gold/60" />
          </div>
          <h2 className="font-serif text-4xl font-bold text-navy mb-4">Weekly Content Calendar</h2>
          <p className="text-text-light font-sans max-w-xl mx-auto">
            Sample week of content — copy written, platforms assigned, hashtags ready. Marina handles scheduling.
          </p>
        </div>

        <div className="space-y-px bg-cream-dark border border-cream-dark">
          {calendar.map((item, i) => (
            <div key={item.day} className={`bg-white p-6 sm:p-8 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-start`}>
              {/* Day + platforms */}
              <div>
                <p className="font-serif text-xl font-bold text-navy mb-2">{item.day}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {item.platforms.map(platformIcon)}
                </div>
                <p className="text-xs font-sans font-semibold uppercase tracking-widest text-gold">{item.format}</p>
              </div>

              {/* Copy + tags */}
              <div>
                <div className="bg-cream border-l-2 border-gold px-5 py-4 mb-4">
                  <p className="font-sans text-sm text-text leading-relaxed whitespace-pre-line">{item.copy}</p>
                </div>
                <p className="font-sans text-xs text-blue">{item.tags}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>

      <div className="gold-rule-full" />

      {/* Powered by Boatwork */}
      <SectionWrapper variant="navy">
        <div className="text-center">
          <p className="text-xs font-sans font-semibold uppercase tracking-widest text-gold mb-6">Powered by</p>
          <div className="flex justify-center mb-6">
            <Image
              src={siteData.boatwork.logoUrl}
              alt="Boatwork"
              width={160}
              height={40}
              className="h-8 w-auto brightness-0 invert opacity-80"
              unoptimized
            />
          </div>
          <p className="text-slate-300 font-sans text-sm max-w-md mx-auto mb-8 leading-relaxed">
            Social media management, website hosting, Boatwork reviews integration, and 24/7 AI support — all in one place.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-gold text-navy font-sans font-bold px-10 py-4 hover:bg-gold-light transition-colors uppercase tracking-widest text-sm whitespace-nowrap"
          >
            Get Started with Boatwork
          </Link>
        </div>
      </SectionWrapper>
    </>
  );
}
