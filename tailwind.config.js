/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      "xs": "420px",
      "sm": "640px",
      "md": "768px",
      "lg": "1024px",
      "xl": "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        primary: "#FF5F5F", // Punchy Coral
        accent: "#FFD700", // Bright Yellow
        "background-light": "#F9FAFB",
        "sidebar-bg": "#FFFFFF",
        "column-bg": "#F3F4F6",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.5rem",
        xl: "1rem",
        full: "9999px",
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
