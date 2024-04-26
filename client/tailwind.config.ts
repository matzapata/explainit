import type { Config } from "tailwindcss";

const brand = {
  50: "#F9F5FF",
  100: "#F4EBFF",
  200: "#E9D7FE",
  300: "#D6BBFB",
  400: "#B692F6",
  500: "#9E77ED",
  600: "#7F56D9",
  700: "#6941C6",
  800: "#53389E",
  900: "#42307D",
}
const gray = {
  25: "#FCFCFC",
  50: "#FAFAFA",
  100: "#F4F4F5",
  200: "#E4E4E7",
  300: "#D1D1D6",
  400: "#A0A0AB",
  500: "#70707B",
  600: "#51525C",
  700: "#3F3F46",
  800: "#26272B",
  900: "#18181B",
  950: "#131316",
}

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      colors: {
        gray,
        brand,
        background: gray["950"],
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: brand["700"],
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: gray["800"],
        "accent-foreground": "white",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        border: gray["800"],
        input: gray["800"],
        ring: "hsl(var(--ring))",
      },
    },
  },
  plugins: [require('tailwindcss-bg-patterns')],
};
export default config;
