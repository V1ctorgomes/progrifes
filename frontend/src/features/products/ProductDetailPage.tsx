"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "@/components/category";
import { useCart } from "@/features/cart/hooks/useCart";
import { StoreLayout } from "@/layouts/StoreLayout";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Price } from "@/components/ui/Price";
import { toStoreProduct } from "@/lib/products";
import {
  findVariantBySelection,
  getAttributeNames,
  getAttributeOptions,
  getVariantImages,
} from "@/lib/variants";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import { STOCK_STATUS_LABELS } from "@/types/variant";

interface ProductDetailPageProps {
  product: Product;
  categories: Category[];
}

export function ProductDetailPage({ product, categories }: ProductDetailPageProps) {
  return (
    <StoreLayout categories={categories}>
      <ProductDetailContent product={product} />
    </StoreLayout>
  );
}

function ProductDetailContent({ product }: { product: Product }) {
  const { addProduct, openCart, lastMessage, clearMessage } = useCart();
  const variants = product.variantes ?? [];
  const hasVariants = variants.length > 0;
  const attributeNames = useMemo(() => getAttributeNames(variants), [variants]);

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState(
    product.imagens.find((image) => image.principal)?.url ?? product.imagens[0]?.url ?? "",
  );

  const selectedVariant = useMemo(
    () => findVariantBySelection(variants, selectedAttributes),
    [variants, selectedAttributes],
  );

  const displayImages = useMemo(() => {
    const fallback = product.imagens.map((image) => image.url);
    if (!hasVariants) return fallback;
    if (selectedVariant) return getVariantImages(selectedVariant, fallback);

    const partialVariant = variants.find((variant) =>
      Object.entries(selectedAttributes).every(([name, valueId]) =>
        variant.atributos.some(
          (attr) => attr.attributeNome === name && attr.valueId === valueId,
        ),
      ),
    );

    return getVariantImages(partialVariant ?? null, fallback);
  }, [hasVariants, product.imagens, selectedAttributes, selectedVariant, variants]);

  useEffect(() => {
    if (displayImages.length) {
      setSelectedImage(displayImages[0]);
    }
  }, [displayImages]);

  const displayPrice = selectedVariant?.preco ?? product.preco;
  const displayPromotional =
    product.mostrarPrecoPromocional && (selectedVariant?.precoPromocional ?? product.precoPromocional)
      ? (selectedVariant?.precoPromocional ?? product.precoPromocional ?? undefined)
      : undefined;

  const storeProduct = toStoreProduct({
    ...product,
    preco: displayPrice,
    precoPromocional: displayPromotional ?? product.precoPromocional,
  });

  const selectionComplete =
    !hasVariants || attributeNames.every((name) => selectedAttributes[name]);

  const canAddToCart =
    selectionComplete && (!selectedVariant || selectedVariant.statusEstoque !== "sem_estoque");

  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!lastMessage) return;
    setFeedback(lastMessage);
    const timer = window.setTimeout(() => {
      setFeedback(null);
      clearMessage();
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [lastMessage, clearMessage]);

  const handleAddToCart = () => {
    const result = addProduct(product, selectedVariant ?? null, 1);
    if (result.success) {
      openCart();
    }
  };

  const handleSelectAttribute = (attributeName: string, valueId: string) => {
    setSelectedAttributes((current) => {
      const next = { ...current, [attributeName]: valueId };
      const names = getAttributeNames(variants);
      const index = names.indexOf(attributeName);
      for (let i = index + 1; i < names.length; i += 1) {
        delete next[names[i]];
      }
      return next;
    });
  };

  return (
    <main className="py-8 sm:py-12">
        <Container>
          <Breadcrumb
            items={[
              { label: "Início", href: "/" },
              { label: "Categorias", href: "/categorias" },
              {
                label: product.categoria.nome,
                href: `/categorias/${product.categoria.slug}`,
              },
              { label: product.nome, href: `/produtos/${product.slug}` },
            ]}
            className="mb-8"
          />

          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <div className="relative aspect-[3/4] overflow-hidden bg-brand-light">
                {selectedImage && (
                  <Image
                    src={selectedImage}
                    alt={product.nome}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                )}
              </div>
              {displayImages.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {displayImages.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setSelectedImage(url)}
                      className={`relative aspect-square overflow-hidden border ${
                        selectedImage === url
                          ? "border-brand-black"
                          : "border-neutral-200"
                      }`}
                    >
                      <Image src={url} alt="" fill className="object-cover" sizes="100px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-brand-gray">
                  {product.categoria.nome}
                </p>
                <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide text-brand-black">
                  {product.nome}
                </h1>
                {product.marca && (
                  <p className="mt-2 text-sm text-brand-gray">Marca: {product.marca}</p>
                )}
              </div>

              <p className="text-base text-brand-gray">{product.descricaoCurta}</p>

              <Price
                price={displayPrice}
                promotionalPrice={displayPromotional}
                installments={storeProduct.installments}
              />

              {hasVariants &&
                attributeNames.map((attributeName) => {
                  const options = getAttributeOptions(
                    variants,
                    attributeName,
                    selectedAttributes,
                  );

                  return (
                    <div key={attributeName}>
                      <p className="mb-2 text-sm font-medium uppercase tracking-wide text-brand-black">
                        {attributeName}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {options.map((option) => {
                          const selected = selectedAttributes[attributeName] === option.valueId;
                          return (
                            <button
                              key={option.valueId}
                              type="button"
                              onClick={() => handleSelectAttribute(attributeName, option.valueId)}
                              className={`min-w-[3rem] border px-4 py-2 text-sm ${
                                selected
                                  ? "border-brand-black bg-brand-black text-brand-white"
                                  : "border-neutral-300 text-brand-black hover:border-brand-black"
                              }`}
                            >
                              {option.valor}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {selectedVariant && (
                <div className="space-y-1 text-sm text-brand-gray">
                  <p>SKU: {selectedVariant.sku}</p>
                  <p>Status: {STOCK_STATUS_LABELS[selectedVariant.statusEstoque]}</p>
                </div>
              )}

              {feedback && (
                <p
                  className={`text-sm ${
                    feedback.includes("adicionado") || feedback.includes("atualizada")
                      ? "text-green-700"
                      : "text-red-600"
                  }`}
                  role="status"
                >
                  {feedback}
                </p>
              )}

              <Button fullWidth disabled={!canAddToCart} onClick={handleAddToCart}>
                {!hasVariants
                  ? "Adicionar ao carrinho"
                  : !selectionComplete
                    ? "Selecione as opções"
                    : selectedVariant?.statusEstoque === "sem_estoque"
                      ? "Indisponível"
                      : "Adicionar ao carrinho"}
              </Button>

              <div className="border-t border-neutral-200 pt-6">
                <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-brand-black">
                  Descrição
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-brand-gray">
                  {product.descricaoCompleta}
                </p>
              </div>

              <Link href={`/categorias/${product.categoria.slug}`} className="text-sm underline">
                Ver mais em {product.categoria.nome}
              </Link>
            </div>
          </div>
        </Container>
      </main>
  );
}
