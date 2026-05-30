/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#006030",
        "primary-container": "#007b40",
        "on-primary": "#ffffff",
        secondary: "#a04100",
        "secondary-container": "#fc7728",
        "on-secondary": "#ffffff",
        background: "#f9f9ff",
        "on-background": "#151c27",
        surface: "#f9f9ff",
        "on-surface": "#151c27",
        "surface-container": "#e7eefe",
        "surface-container-low": "#f0f3ff",
        "surface-container-lowest": "#ffffff",
        "on-surface-variant": "#3f4940",
        "outline-variant": "#becabd",
        outline: "#6f7a6f",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
      },
      fontFamily: {
        body: ["Inter", "sans-serif"],
        code: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
