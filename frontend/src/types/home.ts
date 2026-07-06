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
};

export type Category = {
  id: string;
  name: string;
  image: string;
  slug: string;
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

export type HeroSlide = {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
};

export type InstitutionalBanner = {
  image: string;
  title: string;
  description: string;
  cta: string;
};

export type NavItem = {
  label: string;
  href: string;
};
