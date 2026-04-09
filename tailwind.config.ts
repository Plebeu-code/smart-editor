import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:              '#050508',
        'bg-deep':       '#020204',
        surface:         '#0A0A0F',
        'surface-2':     '#0D0D16',
        card:            '#0F0F1A',
        'card-hover':    '#141420',
        accent:          '#FFB800',
        'accent-dim':    '#CC9300',
        'accent-light':  '#FFD166',
        'accent-glow':   'rgba(255,184,0,0.15)',
        border:          'rgba(255,184,0,0.10)',
        'border-strong': 'rgba(255,184,0,0.22)',
        'text-primary':  '#FFFFFF',
        'text-secondary':'#9090B0',
        'text-muted':    '#505068',
        success:         '#22C55E',
        danger:          '#EF4444',
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient':    'linear-gradient(135deg, #FFB800 0%, #FF8C00 100%)',
        'gold-gradient-h':  'linear-gradient(90deg, #FFB800 0%, #FF6B00 100%)',
        'surface-gradient': 'linear-gradient(180deg, #0A0A0F 0%, #050508 100%)',
        'card-gradient':    'linear-gradient(135deg, rgba(255,184,0,0.06) 0%, rgba(15,15,26,0.9) 100%)',
        'hero-gradient':    'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,184,0,0.12) 0%, transparent 60%)',
        'glow-radial':      'radial-gradient(circle at center, rgba(255,184,0,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'gold':     '0 0 20px rgba(255,184,0,0.18)',
        'gold-lg':  '0 0 48px rgba(255,184,0,0.22)',
        'gold-xl':  '0 0 80px rgba(255,184,0,0.28)',
        'card':     '0 4px 32px rgba(0,0,0,0.5)',
        'card-lg':  '0 8px 48px rgba(0,0,0,0.6)',
        'inset-top':'inset 0 1px 0 rgba(255,184,0,0.08)',
      },
      animation: {
        'pulse-gold':  'pulse-gold 2.5s ease-in-out infinite',
        'slide-up':    'slide-up 0.45s cubic-bezier(0.16,1,0.3,1)',
        'slide-down':  'slide-down 0.35s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':     'fade-in 0.35s ease-out',
        'float':       'float 6s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'glow-pulse':  'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%,100%': { boxShadow: '0 0 20px rgba(255,184,0,0.15)' },
          '50%':      { boxShadow: '0 0 48px rgba(255,184,0,0.35)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'float': {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-12px)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'glow-pulse': {
          '0%,100%': { opacity: '0.5' },
          '50%':     { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
