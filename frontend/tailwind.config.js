/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F7F5F0',
        parchment: '#EDE9E2',
        navy: {
          900: '#061024',
          800: '#0B1B3D',
          700: '#112855',
          600: '#1A3A6E',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E8C86E',
          dark: '#B8962F',
          muted: '#C9B896',
        },
        ink: {
          DEFAULT: '#1A202C',
          light: '#4A5568',
          muted: '#8A94A6',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#FAFAF7',
        },
        risk: {
          bajo: '#2E7D32',
          estandar: '#D4AF37',
          alto: '#B71C1C',
        },
        estate: {
          pendiente: '#D4AF37',
          en_revision: '#2563EB',
          observado: '#7C3AED',
          activo: '#2E7D32',
          bloqueado: '#B71C1C',
          rechazado: '#5A6578',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(6, 16, 36, 0.06)',
        'card': '0 4px 20px rgba(6, 16, 36, 0.08)',
        'elevated': '0 12px 40px rgba(6, 16, 36, 0.12)',
        'glow': '0 0 24px rgba(212, 175, 55, 0.25)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
}
