import type { Category } from "@/types/category";

export const mockCategories: Category[] = [
  {
    id: "cat-1",
    nome: "Masculino",
    slug: "masculino",
    descricao:
      "Peças masculinas com estilo urbano. Camisas, bermudas, calças e muito mais para o dia a dia.",
    imagem:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80",
    categoriaPai: null,
    ordem: 1,
    ativo: true,
    productCount: 128,
  },
  {
    id: "cat-1-1",
    nome: "Camisas",
    slug: "masculino-camisas",
    descricao: "Camisas oversized, longline e regatas para compor looks urbanos.",
    imagem:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1920&q=80",
    categoriaPai: "cat-1",
    ordem: 1,
    ativo: true,
    productCount: 48,
  },
  {
    id: "cat-1-2",
    nome: "Bermudas",
    slug: "masculino-bermudas",
    descricao: "Bermudas em diversos tecidos para conforto e estilo no verão.",
    imagem:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1920&q=80",
    categoriaPai: "cat-1",
    ordem: 2,
    ativo: true,
    productCount: 32,
  },
  {
    id: "cat-2",
    nome: "Feminino",
    slug: "feminino",
    descricao:
      "Moda feminina com tendências atuais. Cropped, vestidos, moletons e peças exclusivas.",
    imagem:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&q=80",
    categoriaPai: null,
    ordem: 2,
    ativo: true,
    productCount: 96,
  },
  {
    id: "cat-2-1",
    nome: "Cropped",
    slug: "feminino-cropped",
    descricao: "Croppeds estilosos para compor produções casuais e modernas.",
    imagem:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1920&q=80",
    categoriaPai: "cat-2",
    ordem: 1,
    ativo: true,
    productCount: 24,
  },
  {
    id: "cat-3",
    nome: "Infantil",
    slug: "infantil",
    descricao:
      "Roupas confortáveis e estilosas para meninos e meninas de todas as idades.",
    imagem:
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1920&q=80",
    categoriaPai: null,
    ordem: 3,
    ativo: true,
    productCount: 54,
  },
  {
    id: "cat-4",
    nome: "Calçados",
    slug: "calcados",
    descricao:
      "Tênis, chinelos e calçados casuais para completar o visual com conforto.",
    imagem:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1920&q=80",
    categoriaPai: null,
    ordem: 4,
    ativo: true,
    productCount: 38,
  },
  {
    id: "cat-5",
    nome: "Acessórios",
    slug: "acessorios",
    descricao:
      "Bonés, bolsas, carteiras e acessórios para complementar seu estilo.",
    imagem:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1920&q=80",
    categoriaPai: null,
    ordem: 5,
    ativo: true,
    productCount: 45,
  },
  {
    id: "cat-6",
    nome: "Promoções",
    slug: "promocoes",
    descricao:
      "Ofertas especiais com descontos imperdíveis. Aproveite enquanto durar o estoque.",
    imagem:
      "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600&q=80",
    banner:
      "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1920&q=80",
    categoriaPai: null,
    ordem: 6,
    ativo: true,
    productCount: 42,
  },
];
