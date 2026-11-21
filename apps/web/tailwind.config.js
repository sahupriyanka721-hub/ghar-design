/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f5fb',
          100: '#e1ecf7',
          200: '#c6daf0',
          300: '#9ec1e5',
          400: '#6fa3d7',
          500: '#4383c5',
          600: '#2c568c', // Logo light/apex navy blue
          700: '#1e3d6b', // Logo signature royal navy blue
          800: '#16355c', // Logo rich navy blue
          850: '#122e50', // Logo deep navy blue
          900: '#102646', // Logo primary dark navy blue
          950: '#0e2242', // Logo house base gradient navy blue
        },
        slate: {
          700: '#264263', // Logo-harmonized navy slate
          800: '#1a365d', // Logo-harmonized deep navy body text
          900: '#102646', // Logo signature royal navy blue for headings/titles
          950: '#0e2242', // Deepest logo navy blue
        },
        gold: {
          50: '#fffdf5',
          100: '#fff9e6',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
