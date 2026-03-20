interface ServiceAreaMapProps {
  localities?: string[];
}

export function ServiceAreaMap({ localities }: ServiceAreaMapProps) {
  // Centered on South Florida (between all three counties), zoomed to show Broward, Miami-Dade, Palm Beach
  const embedUrl =
    'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d369476!2d-80.2!3d26.1!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus';

  const rawLocalities =
    localities && localities.length > 0
      ? localities
      : ['Broward County', 'Miami-Dade County', 'Palm Beach County', 'Monroe County'];

  // Limit to max 5 entries, single row display
  const displayLocalities = rawLocalities.slice(0, 5);

  return (
    <div className="relative w-full h-full min-h-[360px] border border-cream-dark overflow-hidden">
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: 360 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Service Area Map"
        className="absolute inset-0 w-full h-full"
      />
      {/* Locality keyword overlays — max 5, single row */}
      <div className="absolute bottom-0 left-0 right-0 bg-navy/80 px-4 py-2 flex flex-nowrap gap-x-4 overflow-hidden">
        {displayLocalities.map((locality) => (
          <span key={locality} className="text-gold text-xs font-sans font-semibold uppercase tracking-wide whitespace-nowrap flex-shrink-0">
            {locality}
          </span>
        ))}
      </div>
    </div>
  );
}
