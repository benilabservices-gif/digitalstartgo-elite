import type { Metadata } from "next";
import { Archivo, Newsreader } from "next/font/google";
import "./globals.css";

// Archivo est variable sur l'axe de largeur (wdth 62→125) : c'est ce qui permet
// les titres « expanded » sans charger une seconde famille.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Virtuose Funnel",
  description:
    "L'accompagnement guidé en 8 étapes qui transforme votre audience en système de vente.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${archivo.variable} ${newsreader.variable}`}>
      <body className="font-serif antialiased">{children}</body>
    </html>
  );
}
