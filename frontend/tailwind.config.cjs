/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 'sans' to domyślna klasa font-sans w Tailwindzie
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        'pet-green': '#16a34a',
        'pet-accent': '#f97316',
      },
    },
  },
  plugins: [],
}