import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#191612",
        saffron: "#e6a544",
        cream: "#f4efe5",
        maroon: "#612c27"
      }
    }
  },
  plugins: []
};

export default config;
