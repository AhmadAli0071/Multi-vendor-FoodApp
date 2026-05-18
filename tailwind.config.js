/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#D81B60',
        secondary: '#004E89',
        success: '#06D6A0',
        warning: '#FFD166',
        danger: '#EF476F',
      },
    },
  },
  plugins: [],
}
