'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center max-w-md px-6">
        <h2 className="font-serif text-3xl font-bold text-navy mb-4">
          Something went wrong
        </h2>
        <p className="text-text font-sans mb-8">
          We&apos;re having trouble loading this page. Please try again.
        </p>
        <button
          onClick={reset}
          className="bg-gold text-navy font-sans font-bold px-8 py-3 hover:bg-gold-light transition-colors uppercase tracking-widest text-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
