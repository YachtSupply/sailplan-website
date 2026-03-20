export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { GiAnchor } from 'react-icons/gi';
import { FiPhone, FiMapPin, FiClock, FiFacebook, FiInstagram } from 'react-icons/fi';
import { getSiteData } from '@/lib/siteData';
import { formatPhone } from '@/lib/phoneUtils';
import { ContactForm, SectionWrapper, BoatworkBadge } from '@/components/shared';

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteData();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  return {
    title: 'Contact',
    description: siteConfig.seo.description || `Contact ${siteConfig.name} for premier yacht management and marine services in ${siteConfig.city}, ${siteConfig.state}.`,
    alternates: {
      canonical: siteUrl ? `${siteUrl}/contact` : '/contact',
    },
  };
}

export default async function ContactPage() {
  const siteConfig = await getSiteData();
  const phone = formatPhone(siteConfig.phone);
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const formatHours = (h: string) => h === 'Open' ? 'Open All Day' : h;
  const mapQuery = [siteConfig.address, siteConfig.city, siteConfig.state].filter(Boolean).join(', ');
  const hasBadge = !!(siteConfig.badge && (siteConfig.badge.svgUrl || siteConfig.badge.embedCode || siteConfig.badge.badgeUrl));

  return (
    <>
      <section className="bg-hero-gradient text-white py-24 px-4 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 bg-gold/60" />
            <GiAnchor className="text-gold" size={18} />
            <div className="h-px w-8 bg-gold/60" />
          </div>
          <h1 className="font-serif text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-slate-300 font-sans max-w-xl mx-auto">
            We would love to discuss how we can care for your vessel.
          </p>
        </div>
      </section>

      <div className="gold-rule-full" />

      <SectionWrapper variant="cream">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Form */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-gold/60" />
              <span className="text-gold text-xs font-sans font-semibold uppercase tracking-widest">Send a Message</span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-navy mb-8">Request a Quote</h2>
            <ContactForm />
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-gold/60" />
                <span className="text-gold text-xs font-sans font-semibold uppercase tracking-widest">Contact Information</span>
              </div>
              <h2 className="font-serif text-3xl font-bold text-navy mb-8">Reach Us Directly</h2>
            </div>

            <div className="bg-white border border-cream-dark p-8 space-y-6">
              <div className="flex items-start gap-4">
                <FiPhone className="text-gold mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="text-xs font-sans font-semibold uppercase tracking-widest text-navy mb-1">Phone</p>
                  <a href={phone?.href ?? `tel:${siteConfig.phone}`} className="text-text font-sans hover:text-gold transition-colors">
                    {phone?.display ?? siteConfig.phone}
                  </a>
                </div>
              </div>

              <div className="h-px bg-cream-dark" />

              <div className="flex items-start gap-4">
                <FiMapPin className="text-gold mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="text-xs font-sans font-semibold uppercase tracking-widest text-navy mb-1">Location</p>
                  <p className="text-text font-sans">{siteConfig.address}</p>
                </div>
              </div>

              <div className="h-px bg-cream-dark" />

              <div className="flex items-start gap-4">
                <FiClock className="text-gold mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="text-xs font-sans font-semibold uppercase tracking-widest text-navy mb-1">Business Hours</p>
                  <div className="space-y-1">
                    {siteConfig.hoursOfOperation && dayOrder.some((d) => !!siteConfig.hoursOfOperation![d])
                      ? dayOrder.map((day) => {
                          const hours = siteConfig.hoursOfOperation![day];
                          if (!hours) return null;
                          return (
                            <div key={day} className="flex gap-2 text-sm font-sans">
                              <span className="text-navy font-semibold w-24">{day}</span>
                              <span className="text-text">{formatHours(hours)}</span>
                            </div>
                          );
                        })
                      : <span className="text-text font-sans text-sm">Available 24/7</span>
                    }
                  </div>
                </div>
              </div>

              <div className="h-px bg-cream-dark" />

              {(siteConfig.social.facebook || siteConfig.social.instagram) && (
                <div>
                  <p className="text-xs font-sans font-semibold uppercase tracking-widest text-navy mb-3">Follow Us</p>
                  <div className="flex gap-4">
                    {siteConfig.social.facebook && (
                      <a href={siteConfig.social.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-text hover:text-gold transition-colors text-sm font-sans">
                        <FiFacebook size={16} /> Facebook
                      </a>
                    )}
                    {siteConfig.social.instagram && (
                      <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-text hover:text-gold transition-colors text-sm font-sans">
                        <FiInstagram size={16} /> Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {mapQuery && (
              <div className="bg-white border border-cream-dark overflow-hidden">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed&z=14`}
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Map"
                />
                <div className="px-4 py-3 border-t border-cream-dark">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-sans font-semibold text-gold hover:text-gold/80 transition-colors flex items-center gap-1"
                  >
                    <FiMapPin size={12} /> Get Directions ↗
                  </a>
                </div>
              </div>
            )}

            {hasBadge && (
              <div className="bg-white border border-gold/30 p-6 flex items-center justify-between">
                <div>
                  <p className="font-serif font-semibold text-navy mb-1">Verified on Boatwork</p>
                  <p className="text-text-light font-sans text-xs">Read reviews from real clients</p>
                </div>
                <BoatworkBadge
                  profileUrl={siteConfig.badge?.profileUrl ?? siteConfig.boatwork.profileUrl}
                  badgeUrl={siteConfig.badge?.badgeUrl}
                  svgUrl={siteConfig.badge?.svgUrl}
                  embedCode={siteConfig.badge?.embedCode}
                />
              </div>
            )}

            <p className="text-xs text-text-light font-sans text-center border-t border-cream-dark pt-4">
              🔒 Your information is kept strictly confidential and never shared.
            </p>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
