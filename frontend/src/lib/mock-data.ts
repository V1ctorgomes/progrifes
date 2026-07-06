import type {
  Benefit,
  Collection,
  NavItem,
  Product,
} from "@/types/home";

export const navItems: NavItem[] = [
  { label: "Início", href: "/" },
  { label: "Produtos", href: "#produtos" },
  { label: "Categorias", href: "/categorias" },
  { label: "Sobre", href: "#sobre" },
  { label: "Contato", href: "#contato" },
];

export const featuredProducts: Product[] = [
  {
    id: "p1",
    name: "Camisa Over Raiz Fundamental Elements",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    price: 129.99,
    discountPercent: 0,
    freeShipping: true,
    colors: ["Off White"],
    installments: 3,
    categorySlug: "masculino-camisas",
  },
  {
    id: "p2",
    name: "Camisa Over Fresh Wave Elements",
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
    price: 129.99,
    discountPercent: 0,
    freeShipping: true,
    colors: ["Amarelo"],
    installments: 3,
    categorySlug: "masculino-camisas",
  },
  {
    id: "p3",
    name: "Camisa Over Street Elements",
    image:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
    price: 129.99,
    discountPercent: 0,
    freeShipping: true,
    colors: ["Branco"],
    installments: 3,
    categorySlug: "masculino-camisas",
  },
  {
    id: "p4",
    name: "Bermuda Moletom Love Game",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
    price: 109.99,
    discountPercent: 0,
    freeShipping: true,
    colors: ["Preto", "Off White"],
    installments: 3,
    categorySlug: "masculino-bermudas",
  },
];

export const collections: Collection[] = [
  {
    id: "c1",
    title: "Coleção Inverno",
    description:
      "Peças quentes e estilosas para enfrentar o frio com atitude. Moletom, jaquetas e acessórios exclusivos.",
    image:
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80",
    slug: "inverno",
  },
  {
    id: "c2",
    title: "Coleção Elements",
    description:
      "Linha urbana com design minimalista. Camisas oversized, bermudas e calças para o dia a dia.",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
    slug: "elements",
  },
];

export const benefits: Benefit[] = [
  {
    id: "b1",
    icon: "truck",
    title: "Entrega rápida",
    description: "Enviamos para todo o Brasil com rastreamento em tempo real.",
  },
  {
    id: "b2",
    icon: "whatsapp",
    title: "Atendimento via WhatsApp",
    description: "Tire suas dúvidas e finalize compras com nossa equipe.",
  },
  {
    id: "b3",
    icon: "quality",
    title: "Produtos de qualidade",
    description: "Tecidos selecionados e acabamento premium em cada peça.",
  },
  {
    id: "b4",
    icon: "payment",
    title: "Pagamento facilitado",
    description: "Parcele em até 3x sem juros ou pague via Pix com desconto.",
  },
];

export const recentProducts: Product[] = [
  {
    id: "r1",
    name: "Cropped Over Brasil Classic Futwear",
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80",
    price: 79.99,
    freeShipping: true,
    colors: ["Amarelo", "Verde", "Azul"],
    installments: 2,
    categorySlug: "feminino-cropped",
  },
  {
    id: "r2",
    name: "Calça Jeans Skinny Elements",
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
    price: 179.99,
    freeShipping: true,
    colors: ["Azul"],
    installments: 3,
    categorySlug: "masculino",
  },
  {
    id: "r3",
    name: "Boardshort P4 — Outlet",
    image:
      "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&q=80",
    price: 159.99,
    promotionalPrice: 120.0,
    discountPercent: 25,
    freeShipping: true,
    installments: 3,
    categorySlug: "promocoes",
  },
  {
    id: "r4",
    name: "Camisa Long Pocket Elements",
    image:
      "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=600&q=80",
    price: 99.99,
    freeShipping: true,
    colors: ["Off White"],
    installments: 3,
    categorySlug: "masculino-camisas",
  },
];

export const allProducts: Product[] = [...featuredProducts, ...recentProducts];

export const storeInfo = {
  name: "Grifres",
  description:
    "Moda urbana com identidade própria. Peças exclusivas para quem busca estilo e conforto no dia a dia.",
  whatsapp: "(85) 98948-4821",
  whatsappLink: "5585989484821",
  address: "Rua Padre Francisco Pita, 528, Jardim das Oliveiras, Fortaleza - CE",
  hours: "Seg a Sex: 9h às 18h | Sáb: 9h às 13h",
  cartCount: 2,
};
