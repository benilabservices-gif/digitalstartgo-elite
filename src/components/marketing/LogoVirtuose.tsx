import Image from "next/image";

/**
 * Le logo officiel, posé sur la plaque blanche pour laquelle il a été dessiné
 * (le fichier est un PNG opaque, il ne peut pas flotter sur le marine).
 * Le recadrage retire les marges du fichier et la tagline, qui reprend mot pour
 * mot le titre H1 de la page — l'afficher deux fois affaiblirait les deux.
 */
export function PlaqueLogo({
  largeur = "320px",
  className = "",
  prioritaire = false,
}: {
  largeur?: string;
  className?: string;
  prioritaire?: boolean;
}) {
  return (
    <span className={`plaque-logo ${className}`} style={{ ["--plaque" as string]: largeur }}>
      <span>
        {/* Le fichier source pèse 1,16 Mo : on passe par l'optimiseur Next
            (WebP/AVIF, variantes 480 et 960) — la cible est souvent en
            connexion mobile. La taille réelle vient du CSS, pas de ces
            attributs, qui ne servent qu'à fixer le ratio. */}
        <Image
          src="/logo-virtuose-funnel.png"
          alt="Virtuose Funnel"
          width={480}
          height={320}
          sizes="480px"
          priority={prioritaire}
        />
      </span>
    </span>
  );
}

/**
 * Réduction vectorielle du signe du logo pour les fonds marine, où le PNG
 * opaque ne peut pas aller : les trois barres d'entonnoir qui se resserrent
 * et la flèche qui remonte. Mêmes ors que le fichier officiel.
 */
export function SigneVirtuose({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 26 26"
      className={className}
      aria-hidden="true"
      focusable="false"
      width="22"
      height="22"
    >
      <defs>
        <linearGradient id="or-signe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F8CC5A" />
          <stop offset="100%" stopColor="#D4A017" />
        </linearGradient>
      </defs>
      <path d="M2 4 H20 L17 9.4 H5 Z" fill="url(#or-signe)" />
      <path d="M6.2 11.6 H15.8 L13.2 17 H8.8 Z" fill="url(#or-signe)" />
      <path d="M9.6 19.2 H12.4 L11.6 24 H10.4 Z" fill="url(#or-signe)" />
      <path
        d="M15.5 12.5 C20 11.5 22 8 23.2 3.6"
        fill="none"
        stroke="#93A7C9"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M20.4 3.2 L24 2.2 L23.2 5.9 Z" fill="#93A7C9" />
    </svg>
  );
}
