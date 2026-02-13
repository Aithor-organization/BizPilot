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
        /* Brand: Deep Navy + Warm Amber */
        brand: {
          50: '#EEF0FC',
          100: '#DDE2F8',
          200: '#BBC5F2',
          300: '#8B9EE8',
          400: '#5B72D8',
          500: '#3B52C4',
          600: '#2D40A0',
          700: '#243380',
          800: '#1B2559',
          900: '#0F1629',
        },
        accent: {
          50: '#FEFAED',
          100: '#FDF3DA',
          200: '#FAE8B5',
          300: '#F5D78A',
          400: '#F0C060',
          500: '#E8A838',
          600: '#D4940A',
          700: '#B36B0A',
          800: '#8B4D08',
          900: '#6B3A00',
        },
        /* Warm Stone (off-white) */
        surface: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
        /* Semantic colors from CSS vars */
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Noto Sans KR', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'hero': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(28, 25, 23, 0.04)',
        'surface': '0 1px 3px rgba(28, 25, 23, 0.06), 0 1px 2px rgba(28, 25, 23, 0.04)',
        'elevated': '0 4px 6px -1px rgba(28, 25, 23, 0.06), 0 2px 4px -1px rgba(28, 25, 23, 0.04)',
        'float': '0 10px 15px -3px rgba(28, 25, 23, 0.06), 0 4px 6px -2px rgba(28, 25, 23, 0.03)',
        'brand': '0 4px 12px rgba(27, 37, 89, 0.15)',
      },
      animation: {
        'fade-up': 'fadeSlideUp 0.5s ease-out both',
        'fade-in': 'fadeSlideIn 0.6s ease-out both',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeSlideUp: {
          from: { opacity: '0.01', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeSlideIn: {
          from: { opacity: '0.01', transform: 'translateY(20px)', filter: 'blur(4px)' },
          to: { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
