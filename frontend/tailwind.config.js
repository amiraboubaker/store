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
          cream: '#fdf0d5',
          ivory: '#fbeada',
          linen: '#e7dcc4',
          taupe: '#a9bcc9',
          sand: '#669bbc',
          bark: '#3a556b',
          espresso: '#003049',
          coffee: '#002233',
          mocha: '#001521',
          gold: '#c1121f',
          goldLight: '#e63946',
          goldDark: '#780000',
          rose: '#c1121f',
          sage: '#669bbc',
          charcoal: '#003049',
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
        'float-soft': 'floatSoft 6s ease-in-out infinite',
        'ken-burns': 'kenBurns 22s ease-out infinite alternate',
        'slide-down': 'slideDown 0.5s ease-out',
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
        floatSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        kenBurns: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.15)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
