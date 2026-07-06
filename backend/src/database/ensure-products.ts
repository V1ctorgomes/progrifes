import { PrismaClient } from "@prisma/client";

const productSeeds = [
  {
    nome: "Camisa Over Raiz Fundamental Elements",
    slug: "camisa-over-raiz-fundamental-elements",
    descricaoCurta: "Camisa oversized com design minimalista.",
    descricaoCompleta:
      "Camisa oversized confeccionada em algodão premium com modelagem contemporânea e acabamento de alta qualidade.",
    categorySlug: "masculino-camisas",
    preco: 129.99,
    destaque: true,
    novo: true,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
  },
  {
    nome: "Camisa Over Fresh Wave Elements",
    slug: "camisa-over-fresh-wave-elements",
    descricaoCurta: "Camisa oversized com estampa exclusiva.",
    descricaoCompleta:
      "Peça urbana com caimento solto, ideal para compor looks casuais com conforto e estilo.",
    categorySlug: "masculino-camisas",
    preco: 129.99,
    destaque: true,
    novo: true,
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
  },
  {
    nome: "Camisa Over Street Elements",
    slug: "camisa-over-street-elements",
    descricaoCurta: "Camisa streetwear com tecido leve.",
    descricaoCompleta:
      "Modelagem ampla com detalhes autorais para o dia a dia urbano.",
    categorySlug: "masculino-camisas",
    preco: 129.99,
    destaque: true,
    image:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
  },
  {
    nome: "Bermuda Moletom Love Game",
    slug: "bermuda-moletom-love-game",
    descricaoCurta: "Bermuda em moletom com conforto premium.",
    descricaoCompleta:
      "Bermuda confeccionada em moletom de alta gramatura com cós elástico e bolsos funcionais.",
    categorySlug: "masculino-bermudas",
    preco: 109.99,
    destaque: true,
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
  },
  {
    nome: "Cropped Over Brasil Classic Futwear",
    slug: "cropped-over-brasil-classic-futwear",
    descricaoCurta: "Cropped estiloso para produções casuais.",
    descricaoCompleta:
      "Cropped com modelagem justa e tecido macio para o visual moderno.",
    categorySlug: "feminino-cropped",
    preco: 79.99,
    novo: true,
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80",
  },
  {
    nome: "Calça Jeans Skinny Elements",
    slug: "calca-jeans-skinny-elements",
    descricaoCurta: "Calça jeans com modelagem skinny.",
    descricaoCompleta:
      "Jeans com elastano para maior conforto e caimento perfeito.",
    categorySlug: "masculino",
    preco: 179.99,
    novo: true,
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
  },
  {
    nome: "Boardshort P4 — Outlet",
    slug: "boardshort-p4-outlet",
    descricaoCurta: "Boardshort com preço promocional.",
    descricaoCompleta:
      "Boardshort leve e resistente, ideal para o verão e momentos de lazer.",
    categorySlug: "promocoes",
    preco: 159.99,
    precoPromocional: 120,
    mostrarPrecoPromocional: true,
    image:
      "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&q=80",
  },
  {
    nome: "Camisa Long Pocket Elements",
    slug: "camisa-long-pocket-elements",
    descricaoCurta: "Camisa longline com bolso frontal.",
    descricaoCompleta:
      "Camisa longline com bolso aplicado e tecido premium para uso diário.",
    categorySlug: "masculino-camisas",
    preco: 99.99,
    novo: true,
    image:
      "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=600&q=80",
  },
];

export async function ensureProducts(prisma: PrismaClient): Promise<void> {
  const productCount = await prisma.product.count();
  if (productCount > 0) {
    return;
  }

  const categories = await prisma.category.findMany();
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));

  for (const [index, item] of productSeeds.entries()) {
    const categoriaId = categoryBySlug.get(item.categorySlug);
    if (!categoriaId) {
      continue;
    }

    await prisma.product.create({
      data: {
        nome: item.nome,
        slug: item.slug,
        descricaoCurta: item.descricaoCurta,
        descricaoCompleta: item.descricaoCompleta,
        categoriaId,
        preco: item.preco,
        precoPromocional: item.precoPromocional,
        mostrarPrecoPromocional: item.mostrarPrecoPromocional ?? false,
        destaque: item.destaque ?? false,
        novo: item.novo ?? false,
        ordem: index + 1,
        imagens: {
          create: [{ url: item.image, ordem: 1, principal: true }],
        },
      },
    });
  }

  console.log(`Seed: ${productSeeds.length} produtos criados`);
}
