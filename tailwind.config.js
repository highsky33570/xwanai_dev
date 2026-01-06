// import { heroui } from "@heroui/theme"
const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}", "*.{js,ts,jsx,tsx,mdx}"
    ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
    "themes": {
      "light": {
        "colors": {
          "default": {
            "50": "#fafafa",
            "100": "#f2f2f3",
            "200": "#ebebec",
            "300": "#e3e3e6",
            "400": "#dcdcdf",
            "500": "#d4d4d8",
            "600": "#afafb2",
            "700": "#8a8a8c",
            "800": "#656567",
            "900": "#404041",
            "foreground": "#000",
            "DEFAULT": "#d4d4d8"
          },
          "primary": {
            "50": "#fdf6ee",
            "100": "#fae9d7",
            "200": "#f7ddbf",
            "300": "#f5d0a7",
            "400": "#f2c490",
            "500": "#efb778",
            "600": "#c59763",
            "700": "#9b774e",
            "800": "#725739",
            "900": "#483724",
            "foreground": "#000",
            "DEFAULT": "#efb778"
          },
          "secondary": {
            "50": "#eee4f8",
            "100": "#d7bfef",
            "200": "#bf99e5",
            "300": "#a773db",
            "400": "#904ed2",
            "500": "#7828c8",
            "600": "#6321a5",
            "700": "#4e1a82",
            "800": "#39135f",
            "900": "#240c3c",
            "foreground": "#fff",
            "DEFAULT": "#7828c8"
          },
          "success": {
            "50": "#e2f8ec",
            "100": "#b9efd1",
            "200": "#91e5b5",
            "300": "#68dc9a",
            "400": "#40d27f",
            "500": "#17c964",
            "600": "#13a653",
            "700": "#0f8341",
            "800": "#0b5f30",
            "900": "#073c1e",
            "foreground": "#000",
            "DEFAULT": "#17c964"
          },
          "warning": {
            "50": "#fef4e4",
            "100": "#fce4bd",
            "200": "#fad497",
            "300": "#f9c571",
            "400": "#f7b54a",
            "500": "#f5a524",
            "600": "#ca881e",
            "700": "#9f6b17",
            "800": "#744e11",
            "900": "#4a320b",
            "foreground": "#000",
            "DEFAULT": "#f5a524"
          },
          "danger": {
            "50": "#fee1eb",
            "100": "#fbb8cf",
            "200": "#f98eb3",
            "300": "#f76598",
            "400": "#f53b7c",
            "500": "#f31260",
            "600": "#c80f4f",
            "700": "#9e0c3e",
            "800": "#73092e",
            "900": "#49051d",
            "foreground": "#000",
            "DEFAULT": "#f31260"
          },
          "background": "#ffffff",
          "foreground": {
            "50": "#dfdfdf",
            "100": "#b3b3b3",
            "200": "#868686",
            "300": "#595959",
            "400": "#2d2d2d",
            "500": "#000000",
            "600": "#000000",
            "700": "#000000",
            "800": "#000000",
            "900": "#000000",
            "foreground": "#fff",
            "DEFAULT": "#000000"
          },
          "content1": {
            "DEFAULT": "#ffffff",
            "foreground": "#000"
          },
          "content2": {
            "DEFAULT": "#f4f4f5",
            "foreground": "#000"
          },
          "content3": {
            "DEFAULT": "#e4e4e7",
            "foreground": "#000"
          },
          "content4": {
            "DEFAULT": "#d4d4d8",
            "foreground": "#000"
          },
          "focus": "#EFB778",
        }
      },
      "dark": {
        "colors": {
          "default": {
            "50": "#0a080c",
            "100": "#100d13",
            "200": "#151219",
            "300": "#1b1620",
            "400": "#211b27",
            "500": "#48434d",
            "600": "#6f6b73",
            "700": "#969398",
            "800": "#bcbbbe",
            "900": "#e3e3e4",
            "foreground": "#fff",
            "DEFAULT": "#211b27"
          },
          "primary": {
            "50": "#483724",
            "100": "#725739",
            "200": "#9b774e",
            "300": "#c59763",
            "400": "#efb778",
            "500": "#f2c490",
            "600": "#f5d0a7",
            "700": "#f7ddbf",
            "800": "#fae9d7",
            "900": "#fdf6ee",
            "foreground": "#000",
            "DEFAULT": "#efb778"
          },
          "secondary": {
            "50": "#240c3c",
            "100": "#39135f",
            "200": "#4e1a82",
            "300": "#6321a5",
            "400": "#7828c8",
            "500": "#904ed2",
            "600": "#a773db",
            "700": "#bf99e5",
            "800": "#d7bfef",
            "900": "#eee4f8",
            "foreground": "#fff",
            "DEFAULT": "#7828c8"
          },
          "success": {
            "50": "#073c1e",
            "100": "#0b5f30",
            "200": "#0f8341",
            "300": "#13a653",
            "400": "#17c964",
            "500": "#40d27f",
            "600": "#68dc9a",
            "700": "#91e5b5",
            "800": "#b9efd1",
            "900": "#e2f8ec",
            "foreground": "#000",
            "DEFAULT": "#17c964"
          },
          "warning": {
            "50": "#4a320b",
            "100": "#744e11",
            "200": "#9f6b17",
            "300": "#ca881e",
            "400": "#f5a524",
            "500": "#f7b54a",
            "600": "#f9c571",
            "700": "#fad497",
            "800": "#fce4bd",
            "900": "#fef4e4",
            "foreground": "#000",
            "DEFAULT": "#f5a524"
          },
          "danger": {
            "50": "#49051d",
            "100": "#73092e",
            "200": "#9e0c3e",
            "300": "#c80f4f",
            "400": "#f31260",
            "500": "#f53b7c",
            "600": "#f76598",
            "700": "#f98eb3",
            "800": "#fbb8cf",
            "900": "#fee1eb",
            "foreground": "#000",
            "DEFAULT": "#f31260"
          },
          "background": "#211B27",
          "foreground": {
            "50": "#4d4d4d",
            "100": "#797979",
            "200": "#a6a6a6",
            "300": "#d2d2d2",
            "400": "#ffffff",
            "500": "#ffffff",
            "600": "#ffffff",
            "700": "#ffffff",
            "800": "#ffffff",
            "900": "#ffffff",
            "foreground": "#000",
            "DEFAULT": "#ffffff"
          },
          "content1": {
            "DEFAULT": "#2B2635",
            "foreground": "#fff"
          },
          "content2": {
            "DEFAULT": "#393041",
            "foreground": "#fff"
          },
          "content3": {
            "DEFAULT": "#3B344A",
            "foreground": "#fff"
          },
          "content4": {
            "DEFAULT": "#52525b",
            "foreground": "#fff"
          },
          "focus": "#EFB778",
        }
      }
    },
    "layout": {
      "fontSize": {
        "tiny": "0.75rem",
        "small": "0.875rem",
        "medium": "1rem",
        "large": "1.125rem"
      },
      "lineHeight": {
        "tiny": "1rem",
        "small": "1.25rem",
        "medium": "1.5rem",
        "large": "1.75rem"
      },
      "radius": {
        "small": "0.5rem",
        "medium": "0.75rem",
        "large": "0.875rem"
      },
      "borderWidth": {
        "small": "1px",
        "medium": "2px",
        "large": "3px"
      },
      "disabledOpacity": "0.5",
      "dividerWeight": "1",
      "hoverOpacity": "0.9"
    }
  })
],
}

module.exports = config;
