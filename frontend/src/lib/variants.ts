import type { ProductVariant } from "@/types/variant";

export function getAttributeNames(variants: ProductVariant[]): string[] {
  const names = new Set<string>();
  for (const variant of variants) {
    for (const attr of variant.atributos) {
      names.add(attr.attributeNome);
    }
  }
  return Array.from(names);
}

export function getAttributeOptions(
  variants: ProductVariant[],
  attributeName: string,
  selected: Record<string, string>,
) {
  const activeVariants = variants.filter((variant) => variant.ativo);
  const otherAttributes = Object.entries(selected).filter(([name]) => name !== attributeName);

  const map = new Map<string, { valueId: string; valor: string }>();

  for (const variant of activeVariants) {
    const matchesOthers = otherAttributes.every(([name, valueId]) =>
      variant.atributos.some(
        (attr) => attr.attributeNome === name && attr.valueId === valueId,
      ),
    );

    if (!matchesOthers) continue;

    const attr = variant.atributos.find((item) => item.attributeNome === attributeName);
    if (attr) {
      map.set(attr.valueId, { valueId: attr.valueId, valor: attr.valor });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.valor.localeCompare(b.valor));
}

export function findVariantBySelection(
  variants: ProductVariant[],
  selected: Record<string, string>,
) {
  const entries = Object.entries(selected);
  if (!entries.length) return null;

  return (
    variants.find(
      (variant) =>
        variant.ativo &&
        entries.every(([name, valueId]) =>
          variant.atributos.some(
            (attr) => attr.attributeNome === name && attr.valueId === valueId,
          ),
        ) &&
        variant.atributos.length === entries.length,
    ) ?? null
  );
}

export function getVariantImages(variant: ProductVariant | null, fallbackImages: string[]) {
  if (variant?.imagens.length) {
    return variant.imagens.map((image) => image.url);
  }
  return fallbackImages;
}

export function formatVariantLabel(variant: ProductVariant) {
  return variant.atributos.map((attr) => attr.valor).join(" / ");
}
