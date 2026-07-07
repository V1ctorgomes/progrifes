export type InventoryOutputType =
  | "PERDA"
  | "AVARIA"
  | "CONSUMO_INTERNO"
  | "DOACAO"
  | "AJUSTE_NEGATIVO"
  | "OUTROS";

export const OUTPUT_TYPE_LABELS: Record<InventoryOutputType, string> = {
  PERDA: "Perda",
  AVARIA: "Avaria",
  CONSUMO_INTERNO: "Consumo Interno",
  DOACAO: "Doação",
  AJUSTE_NEGATIVO: "Ajuste Negativo",
  OUTROS: "Outros",
};

export const MANUAL_OUTPUT_TYPES = Object.keys(OUTPUT_TYPE_LABELS) as InventoryOutputType[];
