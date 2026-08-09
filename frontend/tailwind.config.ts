import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['var(--font-cairo)', 'sans-serif'],
        tajawal: ['var(--font-tajawal)', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#faf7f2',
          100: '#f0e6d6',
          200: '#e0cba8',
          300: '#cba876',
          400: '#b8894f',
          500: '#a06f3a',
          600: '#85592f',
          700: '#6b4527',
          800: '#4a2f1c',
          900: '#2e1c11',
          950: '#1a0f09',
        },
        ink: {
          900: '#141210',
          950: '#0b0a09',
        },
      },
      boxShadow: {
        soft: '0 8px 30px -8px rgba(0,0,0,0.12)',
        gold: '0 8px 30px -8px rgba(160,111,58,0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
