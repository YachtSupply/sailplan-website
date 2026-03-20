import { GiAnchor, GiShipWheel, GiWaves } from 'react-icons/gi';
import { FiTool, FiZap, FiUsers } from 'react-icons/fi';

const iconMap: Record<string, React.ReactNode> = {
  wheel: <GiShipWheel size={28} />,
  anchor: <GiAnchor size={28} />,
  waves: <GiWaves size={28} />,
  wrench: <FiTool size={28} />,
  electric: <FiZap size={28} />,
  engine: <FiTool size={28} />,
  captain: <FiUsers size={28} />,
};

interface ServiceCardProps {
  name: string;
  description: string;
  icon: string;
  keywords?: string[];
}

export function ServiceCard({ name, description, icon, keywords }: ServiceCardProps) {
  return (
    <div className="bg-white border border-cream-dark hover:border-gold/40 p-8 group transition-all duration-300 hover:shadow-lg flex flex-col">
      <div className="text-gold mb-5 group-hover:scale-110 transition-transform duration-300 inline-block">
        {iconMap[icon] ?? iconMap.anchor}
      </div>
      <h3 className="font-serif text-lg font-semibold text-navy mb-3">{name}</h3>
      <p className="text-text-light text-sm leading-relaxed font-sans">{description}</p>
      {keywords && keywords.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {keywords.map((kw) => (
            <li key={kw} className="flex items-start gap-2 text-xs font-sans text-text-light">
              <span className="mt-1 w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0" />
              <span>{kw}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
