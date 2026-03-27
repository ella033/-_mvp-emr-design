// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // src 폴더 내 모든 JS/TS/JSX/TSX 파일
  ],
  theme: {
    extend: {
      keyframes: {
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
          "50%": { opacity: "0.7", transform: "scale(1.08) rotate(10deg)" },
        },
        swing: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(12deg)" },
          "75%": { transform: "rotate(-12deg)" },
        },
      },
    },
  },
  plugins: [
    // 예: require('@tailwindcss/forms'), require('@tailwindcss/typography') 등
  ],
};
