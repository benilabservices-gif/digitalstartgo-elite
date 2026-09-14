import type { Config } from "tailwindcss";

/*
  Palette ancrée sur le logo officiel : le marine profond du « V » et l'or
  dégradé des barres d'entonnoir. Chaque valeur a été vérifiée en contraste
  contre les fonds sur lesquels elle est réellement posée.
*/
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Le marine le plus profond du logo : fonds graves (Hero, sortie).
        ink: "#0A1531",
        // Le marine royal du corps du « V » : immersion produit.
        navy: "#15326B",
        // Fond clair dominant, franchement froid — le blanc du logo, adouci.
        paper: "#EDEFF4",
        // Texte principal sur fond clair (14,5:1).
        dark: "#101D38",
        // Texte secondaire sur fond clair (6,3:1).
        secondary: "#4B5772",
        // Or de surface : ne porte jamais que du texte marine (9,3:1).
        gold: "#F0B928",
        amber: "#F8CC5A",
        // Or profond : la seule déclinaison lisible en TEXTE sur fond clair (5,4:1).
        ochre: "#7E5B0E",
        // Texte tertiaire sur fond marine (7,4:1 sur ink).
        steel: "#93A7C9",
        success: "#1F6B4A",
        warning: "#8A5A08",
        error: "#A32B2B",
      },
      // Les filets de la marque sont plus discrets que le premier cran de
      // Tailwind (10 %) : sans ces valeurs, `border-dark/12` n'est pas généré.
      opacity: {
        8: "0.08",
        12: "0.12",
      },
      fontFamily: {
        display: ["var(--font-archivo)", "Helvetica Neue", "Arial", "sans-serif"],
        heading: ["var(--font-archivo)", "Helvetica Neue", "Arial", "sans-serif"],
        sans: ["var(--font-archivo)", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["var(--font-newsreader)", "Iowan Old Style", "Georgia", "serif"],
      },
      keyframes: {
        // Séquence d'ouverture unique de la page : les parois se tracent,
        // puis le contenu monte. Rien d'autre n'est animé au scroll.
        "tracer-paroi": {
          "0%": { strokeDashoffset: "1", opacity: "0" },
          "12%": { opacity: "1" },
          "100%": { strokeDashoffset: "0", opacity: "1" },
        },
        "monter-en-place": {
          "0%": { transform: "translateY(18px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        apparaitre: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        curseur: {
          "0%, 45%": { opacity: "1" },
          "50%, 95%": { opacity: "0" },
        },
      },
      animation: {
        "tracer-paroi": "tracer-paroi 1400ms cubic-bezier(0.22,1,0.36,1) forwards",
        "monter-en-place": "monter-en-place 760ms cubic-bezier(0.16,1,0.3,1) forwards",
        apparaitre: "apparaitre 900ms ease-out forwards",
        curseur: "curseur 1200ms steps(1, end) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
