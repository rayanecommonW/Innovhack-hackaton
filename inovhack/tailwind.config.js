/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bet-black': '#000000',
        'bet-dark': '#0A0A0A',
        'bet-gray': '#1A1A1A',
        'bet-light-gray': '#2A2A2A',
        'bet-accent': '#FFFFFF',
      },
    },
  },
  plugins: [],
}

