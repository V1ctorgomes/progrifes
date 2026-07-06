import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { Collection } from "@/types/home";

interface CollectionCardProps {
  collection: Collection;
  reversed?: boolean;
}

export function CollectionCard({ collection, reversed = false }: CollectionCardProps) {
  return (
    <article
      className={`grid items-center gap-6 md:grid-cols-2 md:gap-10 ${
        reversed ? "md:[&>div:first-child]:order-2" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-light">
        <Image
          src={collection.image}
          alt={collection.title}
          fill
          loading="lazy"
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      <div className="flex flex-col justify-center">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-brand-accent">
          Coleção
        </p>
        <h3 className="font-display text-2xl font-bold uppercase tracking-wider text-brand-black sm:text-3xl">
          {collection.title}
        </h3>
        <p className="mt-4 text-sm leading-relaxed text-brand-gray sm:text-base">
          {collection.description}
        </p>
        <div className="mt-6">
          <Button variant="outline">Explorar coleção</Button>
        </div>
      </div>
    </article>
  );
}
