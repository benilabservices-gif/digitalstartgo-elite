export interface MissionChamp {
  cle: string;
  libelle: string;
  aide?: string;
  type: "texte" | "texte_long" | "nombre" | "lien" | "choix" | "liste";
  options?: string[];
  points?: number[];
  obligatoire?: boolean;
  min_lignes?: number;
  max_lignes?: number;
  prerempli_depuis?: { mission?: string; cle?: string } | { profil?: string };
}

export interface MissionData {
  id: string;
  code: string;
  number: number;
  active?: boolean;
  ordre?: number;
  title: string;
  objective: string;
  estimated_duration_minutes: number;
  why: string;
  exemple_avant: string;
  exemple_apres: string;
  champs: MissionChamp[];
  criteres: string[];
  guide_outil?: Array<{ titre: string; texte: string; lien_video?: string }>;
  prompts_ia?: Array<{ titre: string; prompt: string }>;
  bonus_elite?: string;
}

export function formatContenu(champs: MissionChamp[], reponses: Record<string, string | string[]>): string {
  const lines: string[] = [];
  for (const champ of champs) {
    const val = reponses[champ.cle];
    if (val === undefined || val === "") continue;
    if (Array.isArray(val)) {
      lines.push(`${champ.libelle} :`);
      val.forEach((v) => lines.push(`  • ${v}`));
    } else {
      lines.push(`${champ.libelle} : ${val}`);
    }
  }
  let text = lines.join("\n");
  if (text.length > 4000) text = text.slice(0, 3997) + "...";
  return text;
}
