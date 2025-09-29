/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'garba-orange': '#FF6B35',
        'garba-yellow': '#F7C548',
        'garba-red': '#E94F37',
        'garba-blue': '#1B9AAA',
        'garba-dark': '#2C3E50',
      },
      fontFamily: {
        'sans': ['Poppins', 'sans-serif'],
        'display': ['"Playfair Display"', 'serif'],
      },
      backgroundImage: {
        'garba-pattern': "url('/src/assets/garba-bg.jpg')",
      }
    },
  },
  plugins: [],
}
