import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tema Primario: Tech Ethos (Claro)
        "tech-bg": "#F9FAFB",
        "tech-surface": "#FFFFFF",
        "tech-border": "#E5E7EB",
        "tech-text": "#111827",
        "tech-muted": "#4B5563",
        "tech-brand": "#0088aa",
        
        // Tema Secundario: Obsidian Teal (Oscuro)
        "obsidian-bg": "#0D1117",
        "obsidian-surface": "#161B22",
        "obsidian-border": "#30363D",
        "obsidian-text": "#F0F6FC",
        "obsidian-muted": "#8B949E",
        "obsidian-teal": "#00C9A7",
      },
      fontFamily: {
        prompt: ["var(--font-prompt)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
