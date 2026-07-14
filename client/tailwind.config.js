import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        purple: colors.orange,
        indigo: colors.orange,
        blue: colors.red,
        violet: colors.red,
        cyan: colors.rose,
      }
    },
  },
  variants: {
    extend: {
      display: ['print'],
    },
  },
  plugins: [],
};
