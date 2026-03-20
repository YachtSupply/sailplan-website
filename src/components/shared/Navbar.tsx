'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiMenu, FiX, FiPhone } from 'react-icons/fi';
import { Logo } from './Logo';

const ALL_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/portfolio', label: 'Portfolio', requiresPortfolio: true },
  { href: '/social', label: 'Social' },
  { href: '/contact', label: 'Contact' },
];

interface NavbarProps {
  logoUrl?: string;
  name?: string;
  hasPortfolio?: boolean;
  phone?: string | null;
}

export function Navbar({ logoUrl, name, hasPortfolio = false, phone }: NavbarProps) {
  const links = ALL_LINKS.filter((l) => !l.requiresPortfolio || hasPortfolio);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white shadow-md border-b border-gold/20'
          : 'bg-white/95 backdrop-blur-sm border-b border-gold/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          <Logo logoUrl={logoUrl} name={name} />
          <div className="hidden md:flex items-center gap-6">
            {phone && (
              <a
                href={`tel:${phone.replace(/\D/g, '')}`}
                className="flex items-center gap-1.5 text-sm font-sans font-medium text-navy hover:text-gold transition-colors whitespace-nowrap"
              >
                <FiPhone size={14} className="text-gold" />
                {phone}
              </a>
            )}
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-sans font-medium text-navy hover:text-gold transition-colors tracking-wide uppercase"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="bg-navy text-white text-sm font-sans font-semibold px-6 py-2.5 border border-gold/40 hover:bg-navy/80 hover:border-gold transition-all tracking-wide uppercase whitespace-nowrap"
            >
              Request Quote
            </Link>
          </div>
          <button
            className="md:hidden p-2 text-navy"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-gold/20 bg-white px-4 py-6 flex flex-col gap-5 whitespace-nowrap">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-sans font-medium text-navy uppercase tracking-wide"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="bg-navy text-white text-sm font-semibold px-6 py-3 text-center border border-gold/40 uppercase tracking-wide whitespace-nowrap"
            onClick={() => setOpen(false)}
          >
            Request Quote
          </Link>
        </div>
      )}
    </nav>
  );
}
