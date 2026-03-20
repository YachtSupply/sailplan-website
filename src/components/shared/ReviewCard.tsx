interface ReviewCardProps {
  author: string;
  rating: number;
  text: string;
  date: string;
}

export function ReviewCard({ author, rating, text, date }: ReviewCardProps) {
  const formatted = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  return (
    <div className="bg-white border border-cream-dark p-8 flex flex-col h-64">
      <div className="flex mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <span key={i} className="text-gold text-lg">★</span>
        ))}
      </div>
      <p className="text-text font-sans text-sm leading-relaxed mb-6 flex-1 overflow-hidden line-clamp-5 italic">
        &ldquo;{text}&rdquo;
      </p>
      <div className="border-t border-cream-dark pt-4 flex items-center justify-between">
        <p className="font-serif font-semibold text-navy text-sm">{author}</p>
        <p className="text-text-light text-xs font-sans">{formatted}</p>
      </div>
    </div>
  );
}
