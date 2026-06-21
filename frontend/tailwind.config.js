/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef6ee",
          100: "#fdead7",
          500: "#f5740a",
          600: "#e65c05",
          700: "#bf4708",
        },
      },
    },
  },
  plugins: [],
};
