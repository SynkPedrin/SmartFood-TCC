import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple:     '#6d28d9',
          cyan:       '#0891b2',
          'cyan-light':'#22d3ee',
          sand:       '#f4ede1',
        },
        bg: {
          root:     '#f4ede1',
          surface:  '#faf5ee',
          elevated: '#ffffff',
        },
        accent: {
          purple: '#6d28d9',
          cyan:   '#0891b2',
          amber:  '#d97706',
          rose:   '#e11d48',
        },
      },
      backgroundImage: {
        'brand-gradient':   'linear-gradient(135deg, #6d28d9 0%, #0891b2 100%)',
        'brand-gradient-h': 'linear-gradient(90deg, #6d28d9, #0891b2)',
        'logo-gradient':    'linear-gradient(135deg, #6d28d9, #4f46e5, #0891b2)',
        'card-purple': 'linear-gradient(135deg, rgba(109,40,217,0.12), rgba(109,40,217,0.04))',
        'card-cyan':   'linear-gradient(135deg, rgba(8,145,178,0.12), rgba(8,145,178,0.04))',
        'card-amber':  'linear-gradient(135deg, rgba(217,119,6,0.12), rgba(217,119,6,0.04))',
      },
      fontFamily: {
        sans:    ['Space Grotesk', '-apple-system', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        display: ['Space Grotesk', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'neo':          '4px 4px 0 0 rgba(0,0,0,0.82)',
        'neo-hover':    '6px 6px 0 0 rgba(0,0,0,0.88)',
        'neo-purple':   '4px 4px 0 0 rgba(109,40,217,0.60)',
        'neo-cyan':     '4px 4px 0 0 rgba(8,145,178,0.60)',
        'card':         '4px 4px 0 0 rgba(0,0,0,0.80), 0 4px 20px rgba(0,0,0,0.08)',
        'card-hover':   '6px 6px 0 0 rgba(0,0,0,0.88), 0 8px 28px rgba(0,0,0,0.12)',
      },
      animation: {
        'orb-float':    'orb-float 22s ease-in-out infinite',
        'orb-float-r':  'orb-float 28s ease-in-out infinite reverse',
        'brand-shimmer':'brand-shimmer 4s linear infinite',
        'shimmer':      'shimmer-skeleton 1.6s linear infinite',
        'pulse-dot':    'pulse-dot 2s ease infinite',
        'glow-pulse':   'glow-pulse 3s ease infinite',
        'fade-slide':   'fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
      },
    },
  },
  plugins: [],
};

export default config;
