/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        textile: {
          50: '#faf8f5',
          100: '#f5f0e8',
          200: '#e8dfd0',
          300: '#d4c4a8',
          400: '#b89f7e',
          500: '#9e8264',
          600: '#8a6f56',
          700: '#6b5743',
          800: '#4a3c30',
          900: '#2d2520',
          950: '#1a1510',
        },
        couture: {
          cream: '#faf8f5',
          ivory: '#f5f0e8',
          linen: '#e8dfd0',
          taupe: '#d4c4a8',
          sand: '#b89f7e',
          bark: '#8a6f56',
          espresso: '#4a3c30',
          coffee: '#2d2520',
          mocha: '#1a1510',
          gold: '#c9a96e',
          goldLight: '#e0c896',
          goldDark: '#a8884a',
          rose: '#c4a4a4',
          sage: '#9caf88',
          charcoal: '#3d3d3d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
