import type { CartActionResult, CartItem, CartItemInput, CartTotals } from "@/types/cart";
import type { Product } from "@/types/product";
import type { ProductVariant } from "@/types/variant";

const STORAGE_KEY = "grifres-cart";

export function loadCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCartItems(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function calculateTotals(items: CartItem[]): CartTotals {
  const itemCount = items.reduce((sum, item) => sum + item.quantidade, 0);
  const subtotal = items.reduce((sum, item) => sum + item.preco * item.quantidade, 0);

  return {
    itemCount,
    subtotal,
    shipping: null,
    discount: null,
    total: subtotal,
  };
}

export function buildCartItemInput(
  product: Product,
  variant?: ProductVariant | null,
): CartItemInput {
  if (variant) {
    const cor = variant.atributos.find((attr) => attr.attributeNome === "Cor")?.valor;
    const tamanho = variant.atributos.find((attr) => attr.attributeNome === "Tamanho")?.valor;
    const imagem =
      variant.imagens.find((image) => image.principal)?.url ??
      variant.imagens[0]?.url ??
      product.imagens.find((image) => image.principal)?.url ??
      product.imagens[0]?.url ??
      "";

    const preco =
      product.mostrarPrecoPromocional && variant.precoPromocional
        ? variant.precoPromocional
        : variant.preco;

    return {
      produtoId: product.id,
      varianteId: variant.id,
      nome: product.nome,
      imagem,
      cor,
      tamanho,
      sku: variant.sku,
      preco,
      estoqueMax: variant.estoque,
      ativo: variant.ativo,
    };
  }

  const imagem =
    product.imagens.find((image) => image.principal)?.url ?? product.imagens[0]?.url ?? "";
  const preco =
    product.mostrarPrecoPromocional && product.precoPromocional
      ? product.precoPromocional
      : product.preco;

  return {
    produtoId: product.id,
    varianteId: `product:${product.id}`,
    nome: product.nome,
    imagem,
    sku: product.codigoInterno ?? product.slug,
    preco,
    estoqueMax: 99,
    ativo: product.ativo,
  };
}

export function addCartItem(items: CartItem[], input: CartItemInput, quantity = 1): CartActionResult {
  if (!input.ativo) {
    return { success: false, message: "Esta variante não está disponível" };
  }

  if (quantity < 1) {
    return { success: false, message: "Quantidade inválida" };
  }

  const existing = items.find((item) => item.varianteId === input.varianteId);
  const currentQty = existing?.quantidade ?? 0;
  const nextQty = currentQty + quantity;

  if (nextQty > input.estoqueMax) {
    return {
      success: false,
      message: `Estoque insuficiente. Disponível: ${input.estoqueMax}`,
    };
  }

  if (existing) {
    return {
      success: true,
      message: "Quantidade atualizada no carrinho",
    };
  }

  return { success: true, message: "Produto adicionado ao carrinho" };
}

export function mergeCartItem(items: CartItem[], input: CartItemInput, quantity = 1): CartItem[] {
  const existing = items.find((item) => item.varianteId === input.varianteId);

  if (existing) {
    return items.map((item) =>
      item.varianteId === input.varianteId
        ? {
            ...item,
            ...input,
            quantidade: item.quantidade + quantity,
          }
        : item,
    );
  }

  return [...items, { ...input, quantidade: quantity }];
}

export function updateCartItemQuantity(
  items: CartItem[],
  varianteId: string,
  quantity: number,
): CartActionResult & { items: CartItem[] } {
  const item = items.find((entry) => entry.varianteId === varianteId);
  if (!item) {
    return { success: false, message: "Item não encontrado", items };
  }

  if (quantity <= 0) {
    return {
      success: true,
      items: items.filter((entry) => entry.varianteId !== varianteId),
    };
  }

  if (quantity > item.estoqueMax) {
    return {
      success: false,
      message: `Estoque insuficiente. Disponível: ${item.estoqueMax}`,
      items,
    };
  }

  return {
    success: true,
    items: items.map((entry) =>
      entry.varianteId === varianteId ? { ...entry, quantidade: quantity } : entry,
    ),
  };
}

export function removeCartItem(items: CartItem[], varianteId: string): CartItem[] {
  return items.filter((item) => item.varianteId !== varianteId);
}

export function clearCartItems(): CartItem[] {
  return [];
}

export function getItemSubtotal(item: CartItem): number {
  return item.preco * item.quantidade;
}
