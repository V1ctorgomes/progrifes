export type Product = {
  id: string;
  name: string;
  image: string;
  price: number;
  promotionalPrice?: number;
  discountPercent?: number;
  freeShipping?: boolean;
  colors?: string[];
  installments?: number;
  categorySlug?: string;
};

export type Collection = {
  id: string;
  title: string;
  description: string;
  image: string;
  slug: string;
};

export type Benefit = {
  id: string;
  icon: "truck" | "whatsapp" | "quality" | "payment";
  title: string;
  description: string;
};

export type NavItem = {
  label: string;
  href: string;
};
