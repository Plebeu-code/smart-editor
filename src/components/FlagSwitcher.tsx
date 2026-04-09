'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Lang } from '@/lib/i18n/translations';

const FLAGS: { lang: Lang; flag: string; label: string }[] = [
  { lang: 'pt', flag: '🇧🇷', label: 'Português' },
  { lang: 'en', flag: '🇺🇸', label: 'English' },
];

interface Props {
  compact?: boolean; // icon-only mode for tight spaces
}

export default function FlagSwitcher({ compact = false }: Props) {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-surface">
      {FLAGS.map(({ lang: l, flag, label }) => {
        const isActive = lang === l;
        return (
          <button
            key={l}
            onClick={() => setLang(l)}
            title={label}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm
              transition-all duration-200 font-semibold
              ${isActive
                ? 'bg-accent text-bg shadow-gold'
                : 'text-text-muted hover:text-text-primary hover:bg-card'
              }
            `}
          >
            <span className="text-base leading-none">{flag}</span>
            {!compact && (
              <span className="text-xs hidden sm:inline">{l.toUpperCase()}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
