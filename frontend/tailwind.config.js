/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: 'rgb(var(--color-brand-bg) / <alpha-value>)',
          sidebar: 'rgb(var(--color-brand-sidebar) / <alpha-value>)',
          surface: 'rgb(var(--color-brand-surface) / <alpha-value>)',
          secondary: 'rgb(var(--color-brand-secondary) / <alpha-value>)',
          primary: 'rgb(var(--color-brand-primary) / <alpha-value>)',
          'primary-hover': 'rgb(var(--color-brand-primary-hover) / <alpha-value>)',
          'primary-light': 'rgb(var(--color-brand-primary-light) / <alpha-value>)',
          text: 'rgb(var(--color-brand-text) / <alpha-value>)',
          'text-secondary': 'rgb(var(--color-brand-text-secondary) / <alpha-value>)',
          border: 'rgb(var(--color-brand-border) / <alpha-value>)',
          danger: 'rgb(var(--color-brand-danger) / <alpha-value>)',
          warning: 'rgb(var(--color-brand-warning) / <alpha-value>)',
          success: 'rgb(var(--color-brand-success) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03)',
        'sidebar': '1px 0 3px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
