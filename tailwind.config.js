/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#0A0A0A',
          surface: '#111827',
          surfaceLight: '#182234',
          overlay: '#1E3A5F',
          cyan: '#00C2FF',
          green: '#00E5A0',
          orange: '#F97316',
          white: '#FFFFFF',
          muted: '#7B7B7B',
          border: 'rgba(30, 58, 95, 0.4)',
          borderLight: 'rgba(0, 194, 255, 0.2)'
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['Space Mono', 'ui-monospace', 'monospace']
      }
    },
  },
  plugins: [],
}
