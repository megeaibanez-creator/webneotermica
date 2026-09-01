import type { Config } from "tailwindcss";

/**
 * Paleta extraída de la propuesta 08-definitiva.html (y de neotermica.com):
 * azul pizarra + rojo corporativo. Nada de neones.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16202b",
        brand: {
          DEFAULT: "#597D95",
          dark: "#41617a",
          light: "#8aa8bf",
        },
        accent: {
          DEFAULT: "var(--clima)",
          dark: "var(--clima-dark)",
        },
        page: "#f5f8fb",
        soft: "#eef3f8",
        ice: "#E5EEF5",
        mutedink: "#5c6b7a",
        line: "#e2e9f0",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px rgba(28,50,72,.08)",
        deep: "0 24px 60px rgba(28,50,72,.12)",
        glow: "0 12px 30px rgba(203,10,61,.34)",
      },
      borderRadius: {
        "4xl": "28px",
      },
      maxWidth: {
        site: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
