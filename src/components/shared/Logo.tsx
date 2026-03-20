import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/site.config';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
  logoUrl?: string;
  name?: string;
}

export function Logo({ size = 'md', inverted = false, logoUrl, name }: LogoProps) {
  const imgSize = { sm: 36, md: 44, lg: 56 }[size];
  const textSize = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' }[size];
  const src = logoUrl || siteConfig.logoUrl;
  const displayName = name || siteConfig.name;

  return (
    <Link href="/" className="flex items-center gap-3 group">
      <Image
        src={src}
        alt={displayName}
        width={imgSize}
        height={imgSize}
        className="rounded-full object-cover flex-shrink-0"
        unoptimized
      />
      <span
        className={`font-serif font-bold tracking-tight ${textSize} ${
          inverted ? 'text-white' : 'text-navy'
        } group-hover:text-gold transition-colors`}
      >
        {displayName}
      </span>
    </Link>
  );
}
