export interface CartItem {
  produtoId: string;
  varianteId: string;
  nome: string;
  imagem: string;
  cor?: string;
  tamanho?: string;
  sku: string;
  preco: number;
  quantidade: number;
  estoqueMax: number;
  ativo: boolean;
}

export interface CartItemInput {
  produtoId: string;
  varianteId: string;
  nome: string;
  imagem: string;
  cor?: string;
  tamanho?: string;
  sku: string;
  preco: number;
  estoqueMax: number;
  ativo: boolean;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  shipping: number | null;
  discount: number | null;
  total: number;
}

export interface CartActionResult {
  success: boolean;
  message?: string;
}
