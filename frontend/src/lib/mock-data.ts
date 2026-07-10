import type {
  Benefit,
  Collection,
  NavItem,
} from "@/types/home";

export const navItems: NavItem[] = [
  { label: "Início", href: "/" },
  { label: "Produtos", href: "#produtos" },
  { label: "Categorias", href: "/categorias" },
  { label: "Sobre", href: "#sobre" },
  { label: "Contato", href: "#contato" },
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

export const storeInfo = {
  name: "Grifres",
  description:
    "Moda urbana com identidade própria. Peças exclusivas para quem busca estilo e conforto no dia a dia.",
  whatsapp: "+55 (85) 99847-5755",
  whatsappLink: "5585998475755",
  address: "Rua Padre Francisco Pita, 528, Jardim das Oliveiras, Fortaleza - CE",
  hours: "Seg a Sex: 9h às 18h | Sáb: 9h às 13h",
  cartCount: 2,
};
