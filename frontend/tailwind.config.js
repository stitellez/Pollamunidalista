/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: '#0a0f1e',
          900: '#0d1529',
          800: '#111e38',
        }
      }
    },
  },
  plugins: [],
}
