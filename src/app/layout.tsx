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
  title: {
    default: "Virtuose Funnel — Transformez votre audience en système de vente",
    template: "%s | Virtuose Funnel",
  },
  description:
    "Virtuose Funnel est un programme d'accompagnement guidé pour construire, lancer et optimiser votre système d'acquisition et de conversion.",
  keywords: [
    "funnel",
    "acquisition",
    "conversion",
    "coaching",
    "entrepreneuriat",
    "lead magnet",
    "système de vente",
  ],
  authors: [{ name: "Virtuose Funnel" }],
  creator: "Virtuose Funnel",
  publisher: "Virtuose Funnel",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://virtuosefunnel.com",
    title: "Virtuose Funnel — Transformez votre audience en système de vente",
    description:
      "Virtuose Funnel est un programme d'accompagnement guidé pour construire, lancer et optimiser votre système d'acquisition et de conversion.",
    siteName: "Virtuose Funnel",
    images: [
      {
        url: "/logo-virtuose-funnel.png",
        width: 1200,
        height: 630,
        alt: "Virtuose Funnel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtuose Funnel — Transformez votre audience en système de vente",
    description:
      "Virtuose Funnel est un programme d'accompagnement guidé pour construire, lancer et optimiser votre système d'acquisition et de conversion.",
    images: ["/logo-virtuose-funnel.png"],
    creator: "@virtuosefunnel",
  },
  metadataBase: new URL("https://virtuosefunnel.com"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${archivo.variable} ${newsreader.variable}`}>
      <body className="font-serif antialiased">{children}</body>
    </html>
  );
}
