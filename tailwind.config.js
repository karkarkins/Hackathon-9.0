/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fish: {
          pond: '#0f766e',
          deep: '#0d9488',
          light: '#2dd4bf',
          foam: '#ccfbf1',
        }
      },
    },
  },
  plugins: [],
}
