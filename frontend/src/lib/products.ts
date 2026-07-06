import type { Product as StoreProduct } from "@/types/home";
import type { Product } from "@/types/product";

export function toStoreProduct(product: Product): StoreProduct {
  const mainImage =
    product.imagens.find((image) => image.principal) ?? product.imagens[0];
  const promotionalPrice =
    product.mostrarPrecoPromocional && product.precoPromocional
      ? product.precoPromocional
      : undefined;

  return {
    id: product.id,
    name: product.nome,
    slug: product.slug,
    image: mainImage?.url ?? "",
    price: product.preco,
    promotionalPrice,
    discountPercent:
      promotionalPrice && product.preco > promotionalPrice
        ? Math.round(((product.preco - promotionalPrice) / product.preco) * 100)
        : undefined,
    freeShipping: true,
    installments: 3,
    categorySlug: product.categoria.slug,
  };
}

export function toStoreProducts(products: Product[]): StoreProduct[] {
  return products.map(toStoreProduct);
}
