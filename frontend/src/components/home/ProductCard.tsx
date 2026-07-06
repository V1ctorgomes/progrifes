import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import type { Product } from "@/types/home";
import { cn } from "@/utils/cn";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden bg-brand-light">
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          {product.discountPercent !== undefined && product.discountPercent > 0 && (
            <Badge variant="sale">{product.discountPercent}% OFF</Badge>
          )}
          {product.freeShipping && <Badge variant="shipping">Frete grátis</Badge>}
        </div>

        <div className="relative aspect-[3/4]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            loading="lazy"
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 25vw"
          />

          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-brand-white p-2 transition-transform duration-300 group-hover:translate-y-0">
            <button
              type="button"
              className="w-full bg-brand-black py-2.5 text-xs font-medium uppercase tracking-wider text-brand-white transition hover:bg-brand-dark"
              aria-label={`Comprar ${product.name}`}
            >
              Comprar
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-2.5">
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="sr-only">Cores disponíveis</span>
            {product.colors.map((color) => (
              <span
                key={color.name}
                title={color.name}
                className={cn(
                  "h-4 w-4 rounded-full border border-neutral-300",
                  color.hex === "#ffffff" && "ring-1 ring-inset ring-neutral-200",
                )}
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {product.colors.length > 1 && (
              <span className="text-[10px] text-brand-gray">+{product.colors.length - 1}</span>
            )}
          </div>
        )}

        {product.sizes && product.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="sr-only">Tamanhos disponíveis</span>
            {product.sizes.map((size) => (
              <span
                key={size}
                className="min-w-[28px] border border-neutral-300 px-1.5 py-0.5 text-center text-[10px] font-medium text-brand-black"
              >
                {size}
              </span>
            ))}
          </div>
        )}

        {product.model && (
          <p className="text-[10px] uppercase tracking-wide text-brand-gray">
            Modelo {product.model}
          </p>
        )}

        <h3 className="line-clamp-2 text-xs font-normal leading-snug text-brand-black sm:text-sm">
          {product.name}
        </h3>

        <Price
          price={product.price}
          promotionalPrice={product.promotionalPrice}
          installments={product.installments}
        />

        <button
          type="button"
          className="mt-auto w-full border border-brand-black bg-brand-black py-2.5 text-xs font-medium uppercase tracking-wider text-brand-white transition hover:bg-brand-dark sm:hidden"
          aria-label={`Comprar ${product.name}`}
        >
          Comprar
        </button>
      </div>
    </article>
  );
}
