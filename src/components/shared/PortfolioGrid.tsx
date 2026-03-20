'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Video from 'yet-another-react-lightbox/plugins/video';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';

interface PortfolioItem {
  src: string;
  caption: string;
}

interface VideoItem {
  src: string;
  poster?: string;
  caption?: string;
}

interface PortfolioGridProps {
  items: PortfolioItem[];
  videos?: VideoItem[];
  businessName?: string;
}

function getVideoMimeType(src: string): string {
  const ext = src.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'mov') return 'video/mp4';
  if (ext === 'ogg' || ext === 'ogv') return 'video/ogg';
  return 'video/mp4';
}

function VideoThumbnail({ src, poster, alt }: { src: string; poster?: string; alt: string }) {
  const [thumb, setThumb] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (poster || attempted.current) return;
    attempted.current = true;
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';
    video.src = src;

    const capture = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          // Only use if canvas isn't blank (cross-origin frames produce blank)
          if (dataUrl !== 'data:,') setThumb(dataUrl);
        }
      } catch {
        // CORS or security error — leave thumb as null, dark bg shows
      }
    };

    const onLoaded = () => { video.currentTime = 0.1; };
    video.addEventListener('loadeddata', onLoaded, { once: true });
    video.addEventListener('seeked', capture, { once: true });

    return () => {
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('seeked', capture);
      video.src = '';
    };
  }, [src, poster]);

  const imgSrc = poster || thumb;

  if (imgSrc) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        unoptimized
      />
    );
  }

  // Fallback: dark gradient background (better than plain black)
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy/80" />
  );
}

export function PortfolioGrid({ items, videos = [], businessName }: PortfolioGridProps) {
  const [index, setIndex] = useState(-1);

  const imageSlides = items.map((item) => ({
    src: item.src,
    title: item.caption,
  }));

  const videoSlides = videos.map((v) => ({
    type: 'video' as const,
    poster: v.poster || undefined,
    title: v.caption || undefined,
    sources: [{ src: v.src, type: getVideoMimeType(v.src) }],
    width: 1920,
    height: 1080,
  }));

  const slides = [...imageSlides, ...videoSlides];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className="relative aspect-[4/3] overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <Image
              src={item.src}
              alt={item.caption || (businessName ? `${businessName} marine service project ${i + 1}` : `Marine service project ${i + 1}`)}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
            <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/50 transition-all duration-300 flex items-end">
              <p className="text-white font-sans text-sm font-medium px-4 py-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                {item.caption}
              </p>
            </div>
            <div className="absolute top-3 right-3 w-8 h-8 bg-gold/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-white text-xs">⊕</span>
            </div>
          </button>
        ))}
        {videos.map((v, i) => (
          <button
            key={`video-${i}`}
            onClick={() => setIndex(items.length + i)}
            className="relative aspect-[4/3] overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <VideoThumbnail
              src={v.src}
              poster={v.poster || undefined}
              alt={v.caption || `Video ${i + 1}`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 bg-white/80 rounded-full flex items-center justify-center shadow-lg group-hover:bg-white transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-navy ml-1">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/50 transition-all duration-300 flex items-end">
              <p className="text-white font-sans text-sm font-medium px-4 py-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                {v.caption}
              </p>
            </div>
            <div className="absolute top-3 right-3 w-8 h-8 bg-gold/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-white text-xs">⊕</span>
            </div>
          </button>
        ))}
      </div>

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={slides}
        plugins={[Captions, Video]}
        video={{ autoPlay: true, controls: true, playsInline: true }}
        styles={{
          container: { backgroundColor: 'rgba(14, 26, 45, 0.97)' },
          root: {
            '--yarl__slide_captions_container_background': 'rgba(0,0,0,0.5)',
            '--yarl__slide_max_width': '92vw',
            '--yarl__slide_max_height': '92vh',
          } as Record<string, string>,
        }}
      />
    </>
  );
}
