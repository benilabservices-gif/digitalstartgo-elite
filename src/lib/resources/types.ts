export interface ResourceBlock {
  type: "paragraph" | "heading" | "list";
  text?: string;
  items?: string[];
}

export interface ResourceRow {
  id: string;
  stage_id: string | null;
  slug: string;
  title: string;
  description: string;
  type: "guide" | "lien";
  content_blocks: ResourceBlock[] | null;
  external_url: string | null;
  order_index: number;
}

export interface StageWithNumber {
  id: string;
  number: number;
  title: string;
}

export interface ResourceGroup {
  stageId: string | null;
  stageLabel: string;
  stageNumber: number | null;
  resources: ResourceRow[];
}
