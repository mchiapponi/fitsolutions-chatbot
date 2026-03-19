import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: { 500: '#1F7A7A', 600: '#0F5C5C', 700: '#0A4A4A' },
        lime: { 500: '#A6D608' },
        dark: { 900: '#0D1117', 800: '#1a1a1a' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
