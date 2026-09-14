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

export default function HomePage() {
  return (
    <main>
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
    </main>
  );
}
