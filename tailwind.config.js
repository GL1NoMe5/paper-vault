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
        paper: {
          DEFAULT: '#FAF6F0',
          dot: '#E5DEC9',
          surface: '#FDFBF7',
          border: '#EFECE6',
        },
        charcoal: {
          DEFAULT: '#3D352E',
          dark: '#26201B',
          muted: '#8C7F70',
        },
        pastel: {
          sage: {
            DEFAULT: '#A3C9A8',
            dark: '#2F5233',
            light: '#EBF4ED',
          },
          coral: {
            DEFAULT: '#F4A28C',
            dark: '#7A2E1D',
            light: '#FDF1EE',
          },
          butter: {
            DEFAULT: '#F9E29C',
            dark: '#6E5611',
            light: '#FEFAEC',
          },
          lavender: {
            DEFAULT: '#D8C2E8',
            dark: '#4A3362',
            light: '#F6F0FB',
          },
          rose: {
            DEFAULT: '#F2C6CE',
            dark: '#6E2D38',
            light: '#FDF2F4',
          },
          sticky: {
            DEFAULT: '#FFF6D6',
            border: '#F2E2A6',
            text: '#524322',
          },
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Comfortaa', 'Nunito', 'sans-serif'],
        journal: ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        'warm-ambient': '0 2px 4px rgba(61,53,46,0.04), 0 12px 24px rgba(61,53,46,0.06)',
        'cozy': '0 2px 4px rgba(61,53,46,0.04), 0 12px 24px rgba(61,53,46,0.06)',
        'cozy-md': '0 4px 8px rgba(61,53,46,0.05), 0 16px 32px rgba(61,53,46,0.08)',
        'cozy-sm': '0 2px 4px rgba(61,53,46,0.04), 0 6px 12px rgba(61,53,46,0.05)',
        'sticky': '0 4px 12px rgba(61,53,46,0.08), 0 12px 24px rgba(61,53,46,0.06)',
        'inner-warm': 'inset 0 2px 4px 0 rgba(61,53,46,0.04)',
      },
      borderRadius: {
        'cozy-sm': '12px',
        'cozy': '18px',
        'cozy-lg': '24px',
        'cozy-full': '9999px',
      },
    },
  },
  plugins: [],
}
