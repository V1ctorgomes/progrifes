export type Category = {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  imagem: string;
  banner: string;
  categoriaPai: string | null;
  ordem: number;
  ativo: boolean;
  productCount: number;
};

export type BreadcrumbItem = {
  label: string;
  href: string;
};
