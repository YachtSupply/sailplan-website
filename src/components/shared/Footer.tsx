import Link from 'next/link';
import Image from 'next/image';
import { FiFacebook, FiInstagram, FiLinkedin, FiYoutube, FiPhone, FiMapPin } from 'react-icons/fi';
import { TEMPLATE_VERSION } from '@/site.config';
import { getSiteData } from '@/lib/siteData';
import { formatPhone } from '@/lib/phoneUtils';
import { BoatworkBadge } from './BoatworkBadge';

const navLinks: [string, string][] = [
  ['/', 'Home'],
  ['/about', 'About'],
  ['/services', 'Services'],
  ['/portfolio', 'Portfolio'],
  ['/contact', 'Contact'],
  ['/privacy', 'Privacy Policy'],
];

export async function Footer() {
  const siteConfig = await getSiteData();
  const phone = formatPhone(siteConfig.phone);
  return (
    <footer className="bg-navy text-white">
      {/* marine-pro-template v1.0.0 */}
      <div className="gold-rule-full" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src={siteConfig.logoUrl}
                alt={siteConfig.name}
                width={52}
                height={52}
                className="rounded-full object-cover"
                unoptimized
              />
              <span className="font-serif text-xl font-bold text-white">{siteConfig.name}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">{siteConfig.tagline}</p>
            <div className="space-y-2">
              <a href={phone?.href ?? `tel:${siteConfig.phone}`} className="flex items-center gap-2 text-slate-400 hover:text-gold transition-colors text-sm">
                <FiPhone size={14} className="text-gold" />
                {phone?.display ?? siteConfig.phone}
              </a>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <FiMapPin size={14} className="text-gold" />
                {siteConfig.address}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs font-sans font-semibold uppercase tracking-widest text-gold mb-5">Navigation</p>
            <ul className="space-y-3">
              {navLinks.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-slate-400 text-sm hover:text-white transition-colors font-sans">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <p className="text-xs font-sans font-semibold uppercase tracking-widest text-gold mb-5">Connect</p>
            <div className="flex gap-4 mb-6">
              {siteConfig.social.facebook && (
                <a href={siteConfig.social.facebook} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-gold transition-colors">
                  <FiFacebook size={20} />
                </a>
              )}
              {siteConfig.social.instagram && (
                <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-gold transition-colors">
                  <FiInstagram size={20} />
                </a>
              )}
              {siteConfig.social.linkedin && (
                <a href={siteConfig.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-gold transition-colors">
                  <FiLinkedin size={20} />
                </a>
              )}
              {siteConfig.social.youtube && (
                <a href={siteConfig.social.youtube} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-gold transition-colors">
                  <FiYoutube size={20} />
                </a>
              )}
            </div>
            <BoatworkBadge
              profileUrl={siteConfig.badge?.profileUrl}
              badgeUrl={siteConfig.badge?.badgeUrl}
              svgUrl={siteConfig.badge?.svgUrl}
              embedCode={siteConfig.badge?.embedCode}
              inverted={true}
            />
          </div>
        </div>

        <div className="gold-rule mt-10 mb-6" />

        <div className="text-center text-slate-500 text-xs font-sans">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          {/* marine-pro-template v{TEMPLATE_VERSION} */}
        </div>
      </div>
    </footer>
  );
}
