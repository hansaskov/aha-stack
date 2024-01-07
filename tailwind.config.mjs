/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#155630",
          secondary: "#afcfbc",
          accent: "#8cc0a1",
          neutral: "#1f2e26",
          "base-100": "#f9fbfa",
        },
        dark: {
          primary: "#1ebc5c",
          secondary: "#104b2f",
          accent: "#061e13",
          neutral: "#212b27",
          "base-100": "#111614",
        },
      },
    ],
  },
};
