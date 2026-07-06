import { BannerType, PrismaClient } from "@prisma/client";

const bannerSeeds = [
  {
    nome: "Nova Coleção Elements",
    titulo: "Nova Coleção Elements",
    subtitulo:
      "Estilo urbano com conforto premium. Peças exclusivas para o seu dia a dia.",
    imagemDesktop:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80",
    imagemMobile:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80",
    tipo: BannerType.HERO,
    textoBotaoPrimario: "Ver coleção",
    textoBotaoSecundario: "Explorar outlet",
    linkPrimario: "#produtos",
    linkSecundario: "#outlet",
    ordem: 1,
  },
  {
    nome: "Frete Grátis",
    titulo: "Frete grátis acima de R$ 199",
    subtitulo:
      "Aproveite as novidades da temporada com entrega rápida para todo o Brasil.",
    imagemDesktop:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80",
    imagemMobile:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80",
    tipo: BannerType.HERO,
    textoBotaoPrimario: "Comprar agora",
    textoBotaoSecundario: "Ver promoções",
    linkPrimario: "#produtos",
    linkSecundario: "#promocoes",
    ordem: 2,
  },
  {
    nome: "Coleção Urbana",
    titulo: "Vista a cidade com atitude",
    subtitulo:
      "Lançamentos exclusivos com tecidos premium e design autoral para o dia a dia.",
    imagemDesktop:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&q=80",
    imagemMobile:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80",
    tipo: BannerType.HERO,
    textoBotaoPrimario: "Conhecer",
    textoBotaoSecundario: "Ver lookbook",
    linkPrimario: "#colecoes",
    linkSecundario: "#sobre",
    ordem: 3,
  },
  {
    nome: "Outlet Verão",
    titulo: "Outlet de Verão",
    descricao: "Até 40% OFF em peças selecionadas. Aproveite enquanto durar o estoque.",
    imagemDesktop:
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=1400&q=80",
    imagemMobile:
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80",
    tipo: BannerType.HORIZONTAL,
    textoBotaoPrimario: "Ver outlet",
    linkPrimario: "#produtos",
    ordem: 1,
  },
  {
    nome: "Pix com Desconto",
    titulo: "5% OFF no Pix",
    descricao: "Pague via Pix e ganhe desconto extra em todo o site.",
    imagemDesktop:
      "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800&q=80",
    tipo: BannerType.PROMOCIONAL,
    textoBotaoPrimario: "Aproveitar",
    linkPrimario: "#produtos",
    ordem: 1,
  },
  {
    nome: "Parcelamento",
    titulo: "Parcele em 3x sem juros",
    descricao: "Compre agora e parcele no cartão sem juros em compras acima de R$ 99.",
    imagemDesktop:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    tipo: BannerType.PROMOCIONAL,
    textoBotaoPrimario: "Comprar",
    linkPrimario: "#produtos",
    ordem: 2,
  },
  {
    nome: "Sobre a Grifres",
    titulo: "Grifres — Moda com identidade",
    descricao:
      "Nascemos com a missão de vestir pessoas que valorizam estilo, conforto e autenticidade.",
    imagemDesktop:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
    imagemMobile:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    tipo: BannerType.INSTITUCIONAL,
    textoBotaoPrimario: "Conheça nossa história",
    linkPrimario: "#sobre",
    ordem: 1,
  },
];

const categorySeeds = [
  {
    id: "seed-masculino",
    nome: "Masculino",
    slug: "masculino",
    descricao:
      "Peças masculinas com estilo urbano. Camisas, bermudas, calças e muito mais para o dia a dia.",
    imagem:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80",
    ordem: 1,
  },
  {
    id: "seed-masculino-camisas",
    nome: "Camisas",
    slug: "masculino-camisas",
    descricao: "Camisas oversized, longline e regatas para compor looks urbanos.",
    imagem:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1920&q=80",
    parentSlug: "masculino",
    ordem: 1,
  },
  {
    id: "seed-masculino-bermudas",
    nome: "Bermudas",
    slug: "masculino-bermudas",
    descricao: "Bermudas em diversos tecidos para conforto e estilo no verão.",
    imagem:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1920&q=80",
    parentSlug: "masculino",
    ordem: 2,
  },
  {
    id: "seed-feminino",
    nome: "Feminino",
    slug: "feminino",
    descricao:
      "Moda feminina com tendências atuais. Cropped, vestidos, moletons e peças exclusivas.",
    imagem:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&q=80",
    ordem: 2,
  },
  {
    id: "seed-feminino-cropped",
    nome: "Cropped",
    slug: "feminino-cropped",
    descricao: "Croppeds estilosos para compor produções casuais e modernas.",
    imagem:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1920&q=80",
    parentSlug: "feminino",
    ordem: 1,
  },
  {
    id: "seed-infantil",
    nome: "Infantil",
    slug: "infantil",
    descricao:
      "Roupas confortáveis e estilosas para meninos e meninas de todas as idades.",
    imagem:
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1920&q=80",
    ordem: 3,
  },
  {
    id: "seed-calcados",
    nome: "Calçados",
    slug: "calcados",
    descricao:
      "Tênis, chinelos e calçados casuais para completar o visual com conforto.",
    imagem:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1920&q=80",
    ordem: 4,
  },
  {
    id: "seed-acessorios",
    nome: "Acessórios",
    slug: "acessorios",
    descricao:
      "Bonés, bolsas, carteiras e acessórios para complementar seu estilo.",
    imagem:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1920&q=80",
    ordem: 5,
  },
  {
    id: "seed-promocoes",
    nome: "Promoções",
    slug: "promocoes",
    descricao:
      "Ofertas especiais com descontos imperdíveis. Aproveite enquanto durar o estoque.",
    imagem:
      "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1920&q=80",
    ordem: 6,
  },
];

export async function ensureInitialContent(prisma: PrismaClient): Promise<void> {
  const bannerCount = await prisma.banner.count();
  if (bannerCount === 0) {
    await prisma.banner.createMany({ data: bannerSeeds });
    console.log(`Seed: ${bannerSeeds.length} banners criados`);
  }

  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    const slugToId = new Map<string, string>();

    for (const item of categorySeeds.filter((c) => !c.parentSlug)) {
      const created = await prisma.category.create({
        data: {
          id: item.id,
          nome: item.nome,
          slug: item.slug,
          descricao: item.descricao,
          imagem: item.imagem,
          banner: item.banner,
          ordem: item.ordem,
        },
      });
      slugToId.set(item.slug, created.id);
    }

    for (const item of categorySeeds.filter((c) => c.parentSlug)) {
      const parentId = slugToId.get(item.parentSlug!);
      await prisma.category.create({
        data: {
          id: item.id,
          nome: item.nome,
          slug: item.slug,
          descricao: item.descricao,
          imagem: item.imagem,
          banner: item.banner,
          ordem: item.ordem,
          categoriaPaiId: parentId,
        },
      });
    }

    console.log(`Seed: ${categorySeeds.length} categorias criadas`);
  }
}
