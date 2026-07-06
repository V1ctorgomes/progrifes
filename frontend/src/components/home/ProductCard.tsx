import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import type { Product } from "@/types/home";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group flex flex-col">
      <Link href={`/produtos/${product.slug}`} className="relative overflow-hidden bg-brand-light">
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
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
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-brand-white/95 p-3 backdrop-blur transition-transform duration-300 group-hover:translate-y-0">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" fullWidth aria-label={`Visualizar ${product.name}`}>
              Ver
            </Button>
            <Button size="sm" fullWidth aria-label={`Adicionar ${product.name} ao carrinho`}>
              Comprar
            </Button>
          </div>
        </div>
      </Link>

      <div className="mt-3 flex flex-1 flex-col gap-2">
        <Link href={`/produtos/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-brand-black">
            {product.name}
          </h3>
        </Link>

        {product.colors && product.colors.length > 0 && (
          <p className="text-xs text-brand-gray">
            {product.colors.length > 1
              ? `${product.colors.length} cores`
              : `Cor ${product.colors[0]}`}
          </p>
        )}

        <Price
          price={product.price}
          promotionalPrice={product.promotionalPrice}
          installments={product.installments}
        />
      </div>
    </article>
  );
}
