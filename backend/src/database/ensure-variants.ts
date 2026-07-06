import { PrismaClient } from "@prisma/client";
import { productSeeds } from "./ensure-products";

const colorValues = ["Preto", "Branco", "Azul", "Cinza"];
const sizeValues = ["P", "M", "G", "GG"];

const colorImages: Record<string, string> = {
  Preto: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
  Branco: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
  Azul: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
  Cinza: "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=600&q=80",
};

const productVariantConfig: Record<
  string,
  { colors: string[]; sizes: string[]; estoque: number; estoqueMinimo: number }
> = {
  "camisa-over-raiz-fundamental-elements": {
    colors: ["Preto", "Branco", "Azul"],
    sizes: ["P", "M", "G", "GG"],
    estoque: 24,
    estoqueMinimo: 4,
  },
  "camisa-over-fresh-wave-elements": {
    colors: ["Preto", "Branco", "Azul"],
    sizes: ["P", "M", "G", "GG"],
    estoque: 20,
    estoqueMinimo: 4,
  },
  "camisa-over-street-elements": {
    colors: ["Preto", "Branco", "Cinza"],
    sizes: ["P", "M", "G", "GG"],
    estoque: 18,
    estoqueMinimo: 3,
  },
  "camisa-long-pocket-elements": {
    colors: ["Preto", "Branco"],
    sizes: ["P", "M", "G"],
    estoque: 15,
    estoqueMinimo: 3,
  },
  "bermuda-moletom-love-game": {
    colors: ["Preto", "Cinza"],
    sizes: ["P", "M", "G", "GG"],
    estoque: 22,
    estoqueMinimo: 4,
  },
  "cropped-over-brasil-classic-futwear": {
    colors: ["Branco", "Preto", "Azul"],
    sizes: ["P", "M", "G"],
    estoque: 16,
    estoqueMinimo: 3,
  },
  "calca-jeans-skinny-elements": {
    colors: ["Azul", "Preto"],
    sizes: ["P", "M", "G", "GG"],
    estoque: 14,
    estoqueMinimo: 3,
  },
  "boardshort-p4-outlet": {
    colors: ["Azul", "Preto", "Branco"],
    sizes: ["P", "M", "G"],
    estoque: 12,
    estoqueMinimo: 2,
  },
};

async function ensureAttribute(
  prisma: PrismaClient,
  nome: string,
  valores: string[],
) {
  let attribute = await prisma.attribute.findUnique({ where: { nome } });

  if (!attribute) {
    attribute = await prisma.attribute.create({
      data: {
        nome,
        tipo: "text",
        valores: { create: valores.map((valor) => ({ valor })) },
      },
    });
    return attribute;
  }

  for (const valor of valores) {
    await prisma.attributeValue.upsert({
      where: {
        attributeId_valor: { attributeId: attribute.id, valor },
      },
      create: { attributeId: attribute.id, valor },
      update: {},
    });
  }

  return attribute;
}

function abbreviate(value: string) {
  const map: Record<string, string> = {
    Preto: "PT",
    Branco: "BR",
    Azul: "AZ",
    Cinza: "CZ",
    PP: "PP",
    P: "P",
    M: "M",
    G: "G",
    GG: "GG",
  };

  return map[value] ?? value.toUpperCase().slice(0, 2);
}

function buildBarcode(productCode: string, color: string, size: string) {
  const numeric = `${productCode}${abbreviate(color)}${abbreviate(size)}`
    .replace(/[^A-Z0-9]/g, "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const base = String(7891000000000 + (numeric % 999999999));
  return base.slice(0, 13);
}

function combinationKey(colorId: string, sizeId: string) {
  return [colorId, sizeId].sort().join(":");
}

export async function ensureVariants(prisma: PrismaClient): Promise<void> {
  await ensureAttribute(prisma, "Cor", colorValues);
  await ensureAttribute(prisma, "Tamanho", sizeValues);

  const [corAttr, tamAttr] = await Promise.all([
    prisma.attribute.findUnique({
      where: { nome: "Cor" },
      include: { valores: true },
    }),
    prisma.attribute.findUnique({
      where: { nome: "Tamanho" },
      include: { valores: true },
    }),
  ]);

  if (!corAttr || !tamAttr) {
    return;
  }

  const colorByName = new Map(corAttr.valores.map((value) => [value.valor, value]));
  const sizeByName = new Map(tamAttr.valores.map((value) => [value.valor, value]));
  const codeBySlug = new Map(productSeeds.map((item) => [item.slug, item.codigoInterno]));

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
  });

  let created = 0;
  let updated = 0;

  for (const product of products) {
    const config = productVariantConfig[product.slug];
    if (!config) continue;

    const productCode = product.codigoInterno ?? codeBySlug.get(product.slug) ?? "PRD";
    const precoPromocional =
      product.mostrarPrecoPromocional && product.precoPromocional
        ? Number(product.precoPromocional)
        : null;

    const existingVariants = await prisma.productVariant.findMany({
      where: { produtoId: product.id, deletedAt: null },
      include: {
        atributos: { include: { attributeValue: { include: { attribute: true } } } },
        imagens: true,
      },
    });

    const existingCombinations = new Map(
      existingVariants.map((variant) => {
        const colorId = variant.atributos.find(
          (attr) => attr.attributeValue.attribute.nome === "Cor",
        )?.attributeValueId;
        const sizeId = variant.atributos.find(
          (attr) => attr.attributeValue.attribute.nome === "Tamanho",
        )?.attributeValueId;

        if (!colorId || !sizeId) return [variant.sku, variant];
        return [combinationKey(colorId, sizeId), variant];
      }),
    );

    for (const colorName of config.colors) {
      const color = colorByName.get(colorName);
      if (!color) continue;

      for (const sizeName of config.sizes) {
        const size = sizeByName.get(sizeName);
        if (!size) continue;

        const key = combinationKey(color.id, size.id);
        const existing = existingCombinations.get(key);

        if (existing) {
          const needsUpdate =
            !existing.codigoBarras ||
            existing.estoque === 0 ||
            existing.imagens.length === 0;

          if (needsUpdate) {
            await prisma.productVariant.update({
              where: { id: existing.id },
              data: {
                codigoBarras:
                  existing.codigoBarras ??
                  buildBarcode(productCode, colorName, sizeName),
                estoque: existing.estoque === 0 ? config.estoque : existing.estoque,
                estoqueMinimo:
                  existing.estoqueMinimo === 0 ? config.estoqueMinimo : existing.estoqueMinimo,
                preco: existing.preco ?? Number(product.preco),
                precoPromocional: existing.precoPromocional ?? precoPromocional,
                custo: existing.custo ?? (product.custo ? Number(product.custo) : null),
                imagens:
                  existing.imagens.length === 0
                    ? {
                        create: [
                          {
                            url: colorImages[colorName] ?? colorImages.Preto,
                            ordem: 1,
                            principal: true,
                          },
                        ],
                      }
                    : undefined,
              },
            });
            updated += 1;
          }
          continue;
        }

        const sku = `${productCode}-${abbreviate(colorName)}-${abbreviate(sizeName)}`;
        const skuTaken = await prisma.productVariant.findUnique({ where: { sku } });
        if (skuTaken) continue;

        await prisma.productVariant.create({
          data: {
            produtoId: product.id,
            sku,
            codigoBarras: buildBarcode(productCode, colorName, sizeName),
            preco: Number(product.preco),
            precoPromocional: precoPromocional,
            custo: product.custo ? Number(product.custo) : null,
            estoque: config.estoque,
            estoqueMinimo: config.estoqueMinimo,
            ativo: true,
            atributos: {
              create: [
                { attributeValueId: color.id },
                { attributeValueId: size.id },
              ],
            },
            imagens: {
              create: [
                {
                  url: colorImages[colorName] ?? colorImages.Preto,
                  ordem: 1,
                  principal: true,
                },
              ],
            },
          },
        });

        created += 1;
      }
    }
  }

  if (created > 0 || updated > 0) {
    console.log(`Seed: ${created} variantes criadas, ${updated} variantes atualizadas`);
  }
}
