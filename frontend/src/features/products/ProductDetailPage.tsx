"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Breadcrumb } from "@/components/category";
import { StoreLayout } from "@/layouts/StoreLayout";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Price } from "@/components/ui/Price";
import { toStoreProduct } from "@/lib/products";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

interface ProductDetailPageProps {
  product: Product;
  categories: Category[];
}

export function ProductDetailPage({ product, categories }: ProductDetailPageProps) {
  const storeProduct = toStoreProduct(product);
  const [selectedImage, setSelectedImage] = useState(
    product.imagens.find((image) => image.principal)?.url ?? product.imagens[0]?.url ?? "",
  );

  const promotionalPrice =
    product.mostrarPrecoPromocional && product.precoPromocional
      ? product.precoPromocional
      : undefined;

  return (
    <StoreLayout categories={categories}>
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
              {product.imagens.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {product.imagens.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedImage(image.url)}
                      className={`relative aspect-square overflow-hidden border ${
                        selectedImage === image.url
                          ? "border-brand-black"
                          : "border-neutral-200"
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="100px"
                      />
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
                price={product.preco}
                promotionalPrice={promotionalPrice}
                installments={storeProduct.installments}
              />

              <Button fullWidth disabled>
                Adicionar ao carrinho
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
    </StoreLayout>
  );
}
