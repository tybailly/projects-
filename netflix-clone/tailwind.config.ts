import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#e50914",
          black: "#141414",
          dark: "#181818"
        }
      }
    }
  },
  plugins: []
};

export default config;
