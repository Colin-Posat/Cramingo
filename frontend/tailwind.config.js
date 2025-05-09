/** @type {import('tailwindcss').Config} */ 
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      animation: {
        shine: 'shine 1s ease',
      },
      keyframes: {
        shine: {
          '100%': {
            right: '-10%',
          },
        },
      },
    },
  },
  plugins: [],
}