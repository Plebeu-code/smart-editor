interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 24, md: 32, lg: 48 };
const textSizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' };

export default function Logo({ size = 'md', className = '' }: Props) {
  const px = sizes[size];
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width={px} height={px} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="9" fill="#FFB800" fillOpacity="0.12" />
        <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" stroke="#FFB800" strokeOpacity="0.25" />
        <path d="M8 24V8l10 8-10 8Z" fill="#FFB800" />
        <path d="M18 12h6M18 16h4M18 20h5" stroke="#FFB800" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      <span className={`font-extrabold tracking-tight ${textSizes[size]} text-white`}>
        Smart<span className="text-accent">Editor</span>
      </span>
    </div>
  );
}
