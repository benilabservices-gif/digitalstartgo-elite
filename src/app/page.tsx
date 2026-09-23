import { MarketingNav } from "@/components/marketing/MarketingNav";
import { RetourEnHaut } from "@/components/marketing/RetourEnHaut";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { Probleme } from "@/components/marketing/Probleme";
import { Transformation } from "@/components/marketing/Transformation";
import { CommentCaMarche } from "@/components/marketing/CommentCaMarche";
import { LesHuitEtapes } from "@/components/marketing/LesHuitEtapes";
import { ApercuPlateforme } from "@/components/marketing/ApercuPlateforme";
import { Coaching } from "@/components/marketing/Coaching";
import { VirtuoseAI } from "@/components/marketing/VirtuoseAI";
import { Resultats } from "@/components/marketing/Resultats";
import { Temoignages } from "@/components/marketing/Temoignages";
import { Pricing } from "@/components/marketing/Pricing";
import { Faq } from "@/components/marketing/Faq";
import { CtaFinal } from "@/components/marketing/CtaFinal";

/*
  L'ordre des sections est une descente : chaque Section déclare la largeur
  interne de l'entonnoir à son bord haut et à son bord bas (1240 → 700), et
  ces largeurs se raccordent d'une section à l'autre. Le col est aux tarifs,
  la sortie s'évase dans CtaFinal.
*/
export default function HomePage() {
  return (
    <main id="top" tabIndex={-1}>
      <MarketingNav />
      <Hero />
      <Probleme />
      <Transformation />
      <CommentCaMarche />
      <LesHuitEtapes />
      <ApercuPlateforme />
      <Coaching />
      <VirtuoseAI />
      <Resultats />
      <Temoignages />
      <Pricing />
      <Faq />
      <CtaFinal />
      <Footer />
      <RetourEnHaut />
    </main>
  );
}
