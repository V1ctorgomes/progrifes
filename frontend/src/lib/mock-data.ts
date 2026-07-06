import type { Category, HeroSlide, NavItem, Product } from "@/types/home";

export const navItems: NavItem[] = [
  { label: "Início", href: "#inicio" },
  { label: "Produtos", href: "#produtos" },
  { label: "Categorias", href: "#categorias" },
  { label: "Sobre", href: "#sobre" },
  { label: "Contato", href: "#contato" },
];

export const heroSlides: HeroSlide[] = [
  {
    id: "1",
    image:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80",
    alt: "Nova coleção Elements",
  },
  {
    id: "2",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80",
    alt: "Lançamentos da temporada",
  },
  {
    id: "3",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&q=80",
    alt: "Coleção urbana",
  },
];

export const categories: Category[] = [
  {
    id: "1",
    name: "Camisas",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
    slug: "camisas",
  },
  {
    id: "2",
    name: "Bermudas",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80",
    slug: "bermudas",
  },
  {
    id: "3",
    name: "Calças",
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80",
    slug: "calcas",
  },
  {
    id: "4",
    name: "Kids",
    image:
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400&q=80",
    slug: "kids",
  },
  {
    id: "5",
    name: "Acessórios",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
    slug: "acessorios",
  },
  {
    id: "6",
    name: "Feminino",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",
    slug: "feminino",
  },
];

const baseProducts: Omit<Product, "id">[] = [
  {
    name: "Camisa Over Raiz Fundamental Elements",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    price: 129.99,
    discountPercent: 0,
    freeShipping: true,
    colors: [{ name: "Off White", hex: "#f5f0e8" }],
    sizes: ["P", "M", "G"],
    model: "over",
    installments: 3,
  },
  {
    name: "Camisa Over Fresh Wave Elements",
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
    price: 129.99,
    freeShipping: true,
    colors: [{ name: "Amarelo", hex: "#e8c547" }],
    sizes: ["P", "M", "G"],
    model: "over",
    installments: 3,
  },
  {
    name: "Camisa Over Street Elements",
    image:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
    price: 129.99,
    freeShipping: true,
    colors: [{ name: "Branco", hex: "#ffffff" }],
    sizes: ["P", "M", "G"],
    model: "over",
    installments: 3,
  },
  {
    name: "Camisa Over Gothic Seal Elements",
    image:
      "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=600&q=80",
    price: 129.99,
    freeShipping: true,
    colors: [{ name: "Off White", hex: "#f5f0e8" }],
    sizes: ["P", "M", "G"],
    model: "over",
    installments: 3,
  },
  {
    name: "Camisa Long Pocket Elements",
    image:
      "https://images.unsplash.com/photo-1618354691373-d851b5d3dc4c?w=600&q=80",
    price: 99.99,
    freeShipping: true,
    colors: [{ name: "Off White", hex: "#f5f0e8" }],
    sizes: ["P", "M", "G"],
    model: "long",
    installments: 3,
  },
  {
    name: "Bermuda Moletom Love Game",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
    price: 109.99,
    freeShipping: true,
    colors: [
      { name: "Preto", hex: "#1a1a1a" },
      { name: "Off White", hex: "#f5f0e8" },
    ],
    sizes: ["P", "M", "G"],
    model: "moletom",
    installments: 3,
  },
  {
    name: "Bermuda Brim Street Sand Elements",
    image:
      "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&q=80",
    price: 129.99,
    freeShipping: true,
    colors: [{ name: "Caqui", hex: "#c4a882" }],
    sizes: ["P", "M", "G", "GG"],
    model: "brim",
    installments: 3,
  },
  {
    name: "Calça Jeans Skinny Elements",
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
    price: 179.99,
    freeShipping: true,
    colors: [
      { name: "Azul", hex: "#3d5a80" },
      { name: "Preto", hex: "#1a1a1a" },
    ],
    sizes: ["38", "40", "42", "44", "46"],
    model: "skinny",
    installments: 3,
  },
];

export const newArrivals: Product[] = baseProducts.slice(0, 8).map((p, i) => ({
  ...p,
  id: `new-${i + 1}`,
}));

export const bestSellers: Product[] = [
  {
    id: "bs-1",
    name: "Cropped Over Brasil Classic Futwear",
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80",
    price: 79.99,
    freeShipping: true,
    colors: [
      { name: "Amarelo", hex: "#e8c547" },
      { name: "Verde", hex: "#4a7c59" },
      { name: "Azul", hex: "#3d5a80" },
    ],
    sizes: ["P", "M", "G"],
    model: "cropped",
    installments: 2,
  },
  {
    id: "bs-2",
    name: "Cropped BRK Nation Futwear",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
    price: 79.99,
    freeShipping: true,
    colors: [
      { name: "Amarelo", hex: "#e8c547" },
      { name: "Azul", hex: "#3d5a80" },
      { name: "Branco", hex: "#ffffff" },
    ],
    sizes: ["P", "M", "G"],
    model: "cropped",
    installments: 2,
  },
  {
    id: "bs-3",
    name: "Camisa Over BRK Identity Elements",
    image:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
    price: 129.99,
    freeShipping: true,
    colors: [
      { name: "Preto", hex: "#1a1a1a" },
      { name: "Off White", hex: "#f5f0e8" },
    ],
    sizes: ["P", "M", "G"],
    model: "over",
    installments: 3,
  },
  {
    id: "bs-4",
    name: "Camisa Long Sand Classic Elements",
    image:
      "https://images.unsplash.com/photo-1618354691373-d851b5d3dc4c?w=600&q=80",
    price: 99.99,
    freeShipping: true,
    colors: [
      { name: "Creme", hex: "#e8dcc8" },
      { name: "Cinza", hex: "#9e9e9e" },
      { name: "Preto", hex: "#1a1a1a" },
    ],
    sizes: ["P", "M", "G"],
    model: "long",
    installments: 3,
  },
];

export const outletProducts: Product[] = [
  {
    id: "out-1",
    name: "Boardshort P4",
    image:
      "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&q=80",
    price: 159.99,
    promotionalPrice: 120.0,
    discountPercent: 25,
    freeShipping: true,
    colors: [{ name: "Bege", hex: "#c4a882" }],
    sizes: ["38", "40", "42", "44", "46"],
    model: "boardshort",
    installments: 3,
  },
  {
    id: "out-2",
    name: "Boardshort P3",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
    price: 159.99,
    promotionalPrice: 120.0,
    discountPercent: 25,
    freeShipping: true,
    colors: [{ name: "Vermelho", hex: "#c0392b" }],
    sizes: ["38", "40", "42", "44", "46"],
    model: "boardshort",
    installments: 3,
  },
  {
    id: "out-3",
    name: "Boardshort P2",
    image:
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80",
    price: 159.99,
    promotionalPrice: 120.0,
    discountPercent: 25,
    freeShipping: true,
    colors: [{ name: "Amarelo", hex: "#e8c547" }],
    sizes: ["38", "40", "42", "44", "46"],
    model: "boardshort",
    installments: 3,
  },
  {
    id: "out-4",
    name: "Boardshort P1",
    image:
      "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80",
    price: 159.99,
    promotionalPrice: 120.0,
    discountPercent: 25,
    freeShipping: true,
    colors: [{ name: "Amarelo", hex: "#f1c40f" }],
    sizes: ["38", "40", "42", "44", "46"],
    model: "boardshort",
    installments: 3,
  },
];

export const storeInfo = {
  name: "Grifres",
  instagram: "grifresbrand",
  description:
    "Moda urbana com identidade própria. Peças exclusivas para quem busca estilo e conforto.",
  whatsapp: "(85) 98948-4821",
  whatsappLink: "5585989484821",
  address: "Rua Padre Francisco Pita, 528, Jardim das Oliveiras, Fortaleza - CE",
  cnpj: "00.000.000/0001-00",
  cartCount: 2,
};
