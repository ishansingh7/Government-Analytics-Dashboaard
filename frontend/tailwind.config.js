/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1d4ed8',   // blue
        secondary: '#9333ea', // purple
      },

      // OPTIONAL (nice UI upgrades 🔥)
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },

      boxShadow: {
        soft: "0 10px 25px rgba(0,0,0,0.08)",
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};