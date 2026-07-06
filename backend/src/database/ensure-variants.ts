import { PrismaClient } from "@prisma/client";

const colorValues = ["Preto", "Branco", "Azul"];
const sizeValues = ["P", "M", "G"];

const colorImages: Record<string, string> = {
  Preto: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
  Branco: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
  Azul: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
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
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (normalized.length <= 2) return normalized;
  return normalized.slice(0, 2);
}

export async function ensureVariants(prisma: PrismaClient): Promise<void> {
  await ensureAttribute(prisma, "Cor", colorValues);
  await ensureAttribute(prisma, "Tamanho", sizeValues);

  const variantCount = await prisma.productVariant.count();
  if (variantCount > 0) {
    return;
  }

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

  const colors = corAttr.valores.filter((value) =>
    ["Preto", "Branco"].includes(value.valor),
  );
  const sizes = tamAttr.valores.filter((value) => sizeValues.includes(value.valor));

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { slug: { contains: "camisa" } },
        { slug: { contains: "cropped" } },
      ],
    },
    take: 4,
  });

  let created = 0;

  for (const product of products) {
    const prefix = product.slug.split("-").slice(0, 2).join("-").toUpperCase().slice(0, 8);

    for (const color of colors) {
      for (const size of sizes) {
        const sku = `${prefix}-${abbreviate(color.valor)}-${abbreviate(size.valor)}`;
        const existing = await prisma.productVariant.findUnique({ where: { sku } });
        if (existing) continue;

        await prisma.productVariant.create({
          data: {
            produtoId: product.id,
            sku,
            estoque: 15,
            estoqueMinimo: 3,
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
                  url: colorImages[color.valor] ?? colorImages.Preto,
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

  if (created > 0) {
    console.log(`Seed: ${created} variantes criadas`);
  }
}
