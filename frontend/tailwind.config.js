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
          50: '#f0f9ff',
          500: '#0284c7',
          600: '#0284c7',
          900: '#0c4a6e',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          900: '#064e3b'
        }
      }
    },
  },
  plugins: [],
}
