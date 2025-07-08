/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'treehouse': {
          'teal': '#14b8a6',
          'orange': '#f97316',
        }
      }
    },
  },
  plugins: [],
} 