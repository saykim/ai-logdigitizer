/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // 시스템 다크모드 설정을 따름
  theme: {
    extend: {},
  },
  plugins: [],
}
