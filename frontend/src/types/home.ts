export type Product = {
  id: string;
  name: string;
  image: string;
  price: number;
  promotionalPrice?: number;
  discountPercent?: number;
  freeShipping?: boolean;
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  model?: string;
  installments?: number;
};

export type Category = {
  id: string;
  name: string;
  image: string;
  slug: string;
};

export type HeroSlide = {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
};

export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};
