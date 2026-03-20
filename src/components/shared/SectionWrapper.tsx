import { clsx } from 'clsx';

interface SectionWrapperProps {
  children: React.ReactNode;
  variant?: 'cream' | 'white' | 'navy' | 'dark';
  className?: string;
  id?: string;
}

export function SectionWrapper({ children, variant = 'white', className, id }: SectionWrapperProps) {
  const variants = {
    white: 'bg-white',
    cream: 'bg-cream',
    navy: 'bg-navy text-white',
    dark: 'bg-[#0D1F35] text-white',
  };
  return (
    <section id={id} className={clsx('py-20 px-4 sm:px-6 lg:px-8', variants[variant], className)}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}
