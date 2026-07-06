export interface ProductImage {
  id: string;
  url: string;
  ordem: number;
  principal: boolean;
}

export interface ProductCategoryRef {
  id: string;
  nome: string;
  slug: string;
}

export interface Product {
  id: string;
  nome: string;
  slug: string;
  descricaoCurta: string;
  descricaoCompleta: string;
  categoriaId: string;
  categoria: ProductCategoryRef;
  codigoInterno?: string | null;
  marca?: string | null;
  preco: number;
  precoPromocional?: number | null;
  custo?: number | null;
  mostrarPrecoPromocional: boolean;
  ativo: boolean;
  destaque: boolean;
  novo: boolean;
  ordem: number;
  imagens: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductsListResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductInput {
  nome: string;
  slug?: string;
  descricaoCurta: string;
  descricaoCompleta: string;
  categoriaId: string;
  codigoInterno?: string;
  marca?: string;
  preco: number;
  precoPromocional?: number;
  custo?: number;
  mostrarPrecoPromocional?: boolean;
  ativo?: boolean;
  destaque?: boolean;
  novo?: boolean;
  ordem?: number;
  imagens: Array<{ url: string; ordem?: number; principal?: boolean }>;
}
