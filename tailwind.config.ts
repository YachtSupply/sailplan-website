import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy:         'rgb(var(--color-primary-rgb) / <alpha-value>)',
        'navy-light': 'rgb(var(--color-primary-light-rgb) / <alpha-value>)',
        blue:         'rgb(var(--color-primary-light-rgb) / <alpha-value>)',
        gold:         'rgb(var(--color-accent-rgb) / <alpha-value>)',
        'gold-dark':  'rgb(var(--color-accent-dark-rgb) / <alpha-value>)',
        'gold-light': 'rgb(var(--color-accent-light-rgb) / <alpha-value>)',
        cream:        'rgb(var(--color-bg-rgb) / <alpha-value>)',
        'cream-dark': 'rgb(var(--color-bg-dark-rgb) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-lato)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
