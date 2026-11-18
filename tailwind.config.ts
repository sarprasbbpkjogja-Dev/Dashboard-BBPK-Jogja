import type { Config } from "tailwindcss";

// Token desain dari spesifikasi, bagian "Aturan desain UI".
// Komponen hanya memakai nama token ini, bukan kode warna langsung.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "#F5F3EE",
        surface: "#FFFFFF",
        line: "#E2DED4",
        "line-soft": "#F0EDE6",
        ink: "#17262B",
        muted: "#5A6A6E",
        primary: { DEFAULT: "#0B5550", soft: "#DCEBE8", hover: "#073B37" },
        sidebar: { DEFAULT: "#0E2E2C", active: "#1C4A46", ink: "#C7D6D3", quiet: "#A9BDBA", rule: "#22504B" },
        accent: { DEFAULT: "#E9A45B", strong: "#C8791F", ink: "#3A1F05" },
        warn: { soft: "#F8E9D6", ink: "#7A430F" },
        danger: { soft: "#F6E3DF", ink: "#7E2A1F", line: "#C98F85" },
        neutral: { soft: "#ECEAE4", ink: "#2F3B3E" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      minHeight: { tap: "44px" },
      minWidth: { tap: "44px" },
    },
  },
  plugins: [],
};

export default config;
