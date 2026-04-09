/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: { 50: '#f0f4ff', 100: '#dbe4ff', 200: '#b4c6fc', 400: '#5b8def', 500: '#3672e8', 600: '#1d5bd6', 700: '#1647a8', 900: '#0d2b66' },
        surface: { 0: '#ffffff', 50: '#f8f9fb', 100: '#f1f3f7', 200: '#e4e7ee', 300: '#cdd2dc', 800: '#2a2f3a', 900: '#1a1e27' },
        go: '#16a34a',
        hold: '#d97706',
        nogo: '#dc2626',
      },
    },
  },
  plugins: [],
};
