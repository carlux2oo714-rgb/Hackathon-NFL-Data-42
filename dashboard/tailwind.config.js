/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Rojo bermellón; el tono base (500) es #E34234.
        bermellon: {
          50: '#fdf3f1',
          100: '#fce4df',
          200: '#f9c9bf',
          300: '#f4a291',
          400: '#ec7259',
          500: '#e34234',
          600: '#cc2f22',
          700: '#aa251b',
          800: '#8c221b',
          900: '#74221c',
        },
      },
    },
  },
  plugins: [],
}
