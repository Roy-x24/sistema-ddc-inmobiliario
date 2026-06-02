/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fondo: '#F8F9FA',
        sidebar: '#1B2A4A',
        acento: '#2563EB',
        riesgo: {
          bajo: '#16A34A',
          estandar: '#D97706',
          alto: '#DC2626',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Source Sans 3"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
