/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",         // App.tsx, main.tsx, etc. in root
    "./pages/**/*.{js,ts,jsx,tsx}", // All files inside pages folder
    // Add more folders if you create them later, e.g.:
    // "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // You can add custom colors, fonts, etc. here later
    },
  },
  plugins: [],
};