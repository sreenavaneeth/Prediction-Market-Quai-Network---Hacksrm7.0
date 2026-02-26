/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mono: {
          black: "#000000",
          dark: "#1A1A1A",
          dark2: "#2E2E2E",
          light: "#F7F7F7",
          light2: "#E0E0E0",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: "0 10px 24px rgba(0, 0, 0, 0.08)",
        panelDark: "0 12px 28px rgba(0, 0, 0, 0.42)",
      },
      animation: {
        "route-in": "routeIn 260ms ease-out",
        "route-out": "routeOut 220ms ease-in",
      },
      keyframes: {
        routeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        routeOut: {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
}
