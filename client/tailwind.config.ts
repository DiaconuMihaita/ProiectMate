import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Manrope", "sans-serif"]
      },
      colors: {
        ink: "#0b1020",
        mist: "#97a6c5",
        pulse: "#21d4fd",
        ember: "#ff9a44",
        lime: "#b5f44a"
      }
    }
  },
  plugins: []
} satisfies Config;
