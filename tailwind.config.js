/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F1923',
        surface: '#1F2937',
        primary: '#00E701',
        secondary: '#00E5FF',
        danger: '#FF1744',
        warning: '#FF9100',
        gold: '#FFD700',
        purple: '#B388FF'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Orbitron', 'sans-serif']
      }
    },
  },
  plugins: [],
}
