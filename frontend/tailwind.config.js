/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        serif: ['Cinzel', 'serif'],
      },
      colors: {
        // Parish Colors - References CSS variables from index.css
        // Primary: #1B3A6B | Secondary: #005A9C | Tertiary: #BA0021 | Gold: #C9A84C
        parish: {
          primary: '#1B3A6B',
          secondary: '#005A9C',
          tertiary: '#BA0021',
          gold: '#C9A84C',
        },
        // Tailwind-compatible aliases
        blue: {
          DEFAULT: '#1B3A6B',
          light: '#2E5FA3',
          muted: '#4A7CC7',
          dark: '#0F2444',
          parish: '#1B3A6B',
          legacy: '#005A9C',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E2C06A',
          dark: '#A6832A',
          parish: '#C9A84C',
        },
        // Parchment Colors
        parchment: {
          DEFAULT: '#F5ECD7',
          dark: '#E8D5B0',
          deep: '#D4B483',
          light: '#FDF5E6',
          cream: '#FAF0E6',
        },
        // Church Brand Colors
        church: {
          primary: '#1B3A6B',
          secondary: '#C9A84C',
          accent: '#BA0021',
        },
        // Liturgical Colors
        liturgical: {
          white: '#F8F8F8',
          whiteDark: '#E8E8E8',
          red: '#BA0021',
          redLight: '#D42A4A',
          redDark: '#8A0018',
          green: '#2E7D32',
          greenLight: '#4CAF50',
          greenDark: '#1B5E20',
          purple: '#5D4E8C',
          purpleLight: '#7B6BA8',
          purpleDark: '#4A348A',
          rose: '#C9A5A5',
          roseLight: '#E5C4C4',
          roseDark: '#A88A8A',
        },
        // Text Colors
        text: {
          primary: '#1B3A6B',
          secondary: '#4A5568',
          muted: '#718096',
          light: '#A0AEC0',
        }
      },
      // Custom utilities for church theme (moved from GlobalTheme.js)
      backgroundImage: {
        'parchment-texture': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B4513' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      },
      backgroundColor: {
        'parchment-page': 'linear-gradient(135deg, #FDF5E6 0%, #FAF0E6 100%)',
      },
      borderWidth: {
        'parchment': '6px',
      },
      borderColor: {
        'parchment': '#1B3A6B',
      },
      boxShadow: {
        'parchment': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'parchment-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
