import type { Banner } from "@/types/banner";

export const mockBanners: Banner[] = [
  {
    id: "hero-1",
    nome: "Nova Coleção Elements",
    tipo: "hero",
    titulo: "Nova Coleção Elements",
    subtitulo:
      "Estilo urbano com conforto premium. Peças exclusivas para o seu dia a dia.",
    imagemDesktop:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80",
    imagemMobile:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80",
    textoBotaoPrimario: "Ver coleção",
    textoBotaoSecundario: "Explorar outlet",
    linkPrimario: "#produtos",
    linkSecundario: "#outlet",
    ativo: true,
    ordem: 1,
  },
  {
    id: "hero-2",
    nome: "Frete Grátis",
    tipo: "hero",
    titulo: "Frete grátis acima de R$ 199",
    subtitulo:
      "Aproveite as novidades da temporada com entrega rápida para todo o Brasil.",
    imagemDesktop:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80",
    imagemMobile:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80",
    textoBotaoPrimario: "Comprar agora",
    textoBotaoSecundario: "Ver promoções",
    linkPrimario: "#produtos",
    linkSecundario: "#promocoes",
    ativo: true,
    ordem: 2,
  },
  {
    id: "hero-3",
    nome: "Coleção Urbana",
    tipo: "hero",
    titulo: "Vista a cidade com atitude",
    subtitulo:
      "Lançamentos exclusivos com tecidos premium e design autoral para o dia a dia.",
    imagemDesktop:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&q=80",
    imagemMobile:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80",
    textoBotaoPrimario: "Conhecer",
    textoBotaoSecundario: "Ver lookbook",
    linkPrimario: "#colecoes",
    linkSecundario: "#sobre",
    ativo: true,
    ordem: 3,
  },
  {
    id: "horizontal-1",
    nome: "Outlet Verão",
    tipo: "horizontal",
    titulo: "Outlet de Verão",
    descricao: "Até 40% OFF em peças selecionadas. Aproveite enquanto durar o estoque.",
    imagemDesktop:
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=1400&q=80",
    imagemMobile:
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80",
    textoBotaoPrimario: "Ver outlet",
    linkPrimario: "#produtos",
    ativo: true,
    ordem: 1,
  },
  {
    id: "promo-1",
    nome: "Pix com Desconto",
    tipo: "promocional",
    titulo: "5% OFF no Pix",
    descricao: "Pague via Pix e ganhe desconto extra em todo o site.",
    imagemDesktop:
      "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800&q=80",
    textoBotaoPrimario: "Aproveitar",
    linkPrimario: "#produtos",
    ativo: true,
    ordem: 1,
  },
  {
    id: "promo-2",
    nome: "Parcelamento",
    tipo: "promocional",
    titulo: "Parcele em 3x sem juros",
    descricao: "Compre agora e parcele no cartão sem juros em compras acima de R$ 99.",
    imagemDesktop:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    textoBotaoPrimario: "Comprar",
    linkPrimario: "#produtos",
    ativo: true,
    ordem: 2,
  },
  {
    id: "inst-1",
    nome: "Sobre a Grifres",
    tipo: "institucional",
    titulo: "Grifres — Moda com identidade",
    descricao:
      "Nascemos com a missão de vestir pessoas que valorizam estilo, conforto e autenticidade. Cada coleção é pensada para quem vive a cidade com atitude.",
    imagemDesktop:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
    imagemMobile:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    textoBotaoPrimario: "Conheça nossa história",
    linkPrimario: "#sobre",
    ativo: true,
    ordem: 1,
  },
];
