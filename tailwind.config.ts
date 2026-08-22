import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Shadcn UI colors
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        // Stitch UI colors
        "surface-variant": "#37333d",
        "on-primary": "#3c0091",
        "on-secondary": "#003824",
        "secondary-fixed": "#6ffbbe",
        "surface-tint": "#d0bcff",
        "on-background": "#e7e0ed",
        "on-tertiary-fixed-variant": "#673d00",
        "primary-900": "#4C1D95",
        "on-primary-container": "#340080",
        "tertiary": "#ffb869",
        "on-error-container": "#ffdad6",
        "surface-container": "#211e27",
        "on-secondary-fixed": "#002113",
        "inverse-on-surface": "#322f39",
        "primary-fixed-dim": "#d0bcff",
        "surface-container-lowest": "#0f0d15",
        "on-primary-fixed": "#23005c",
        "tertiary-fixed": "#ffdcbb",
        "on-tertiary-container": "#3f2300",
        "secondary-fixed-dim": "#4edea3",
        "outline": "#958ea0",
        "primary-fixed": "#e9ddff",
        "error": "#EF4444",
        "on-surface": "#e7e0ed",
        "primary-container": "#a078ff",
        "text-secondary": "var(--text-secondary)",
        "surface-container-low": "#1d1a23",
        "on-surface-variant": "var(--on-surface-variant)",
        "on-error": "#690005",
        "inverse-primary": "#6d3bd7",
        "surface-2": "var(--surface-2)",
        "surface-bright": "#3b3742",
        "error-container": "#93000a",
        "on-tertiary": "#482900",
        "secondary-container": "#00a572",
        "on-secondary-container": "#00311f",
        "bg-base": "var(--bg-base)",
        "surface-1": "var(--surface-1)",
        "on-secondary-fixed-variant": "#005236",
        "surface-dim": "#15121b",
        "inverse-surface": "#e7e0ed",
        "tertiary-fixed-dim": "#ffb869",
        "surface": "#15121b",
        "tertiary-container": "#ca801e",
        "outline-variant": "#494454",
        "accent-amber": "#F59E0B",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        "on-primary-fixed-variant": "#5516be",
        "on-tertiary-fixed": "#2c1700",
        "surface-container-high": "#2c2832",
        "info": "#3B82F6",
        "surface-container-highest": "#37333d"
      },
      backgroundImage: {
        "primary-gradient": "linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "var(--radius)",
        "md": "calc(var(--radius) - 2px)",
        "sm": "calc(var(--radius) - 4px)",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "gutter": "16px",
        "sp-6": "24px",
        "margin-mobile": "16px",
        "sp-4": "16px",
        "base": "4px",
        "margin-desktop": "32px",
        "sp-2": "8px",
        "sp-8": "32px",
        "sp-3": "12px",
        "sp-1": "4px"
      },
      fontFamily: {
        "display-xl": ["Plus Jakarta Sans", "sans-serif"],
        "display-xl-mobile": ["Plus Jakarta Sans", "sans-serif"],
        "headline-md": ["Plus Jakarta Sans", "sans-serif"],
        "body-base": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "label-mono": ["JetBrains Mono", "monospace"],
        "headline-lg": ["Plus Jakarta Sans", "sans-serif"]
      },
      fontSize: {
        "display-xl": ["36px", { "lineHeight": "40px", "fontWeight": "800" }],
        "display-xl-mobile": ["30px", { "lineHeight": "36px", "fontWeight": "800" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "body-base": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "label-mono": ["12px", { "lineHeight": "16px", "fontWeight": "500" }],
        "headline-lg": ["30px", { "lineHeight": "36px", "fontWeight": "700" }]
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(139, 92, 246, 0.4)',
      }
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;
