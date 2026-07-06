"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import type { HeroSlide } from "@/types/home";
import { cn } from "@/utils/cn";

interface HeroProps {
  slides: HeroSlide[];
}

export function Hero({ slides }: HeroProps) {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      setCurrent((index + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    const timer = setInterval(() => goTo(current + 1), 5000);
    return () => clearInterval(timer);
  }, [current, goTo]);

  return (
    <section id="inicio" className="relative bg-brand-white" aria-label="Banner principal">
      <div className="relative aspect-[4/3] w-full sm:aspect-[21/9]">
        {slides.map((item, index) => (
          <Link
            key={item.id}
            href={item.href ?? "#produtos"}
            className={cn(
              "absolute inset-0 block transition-opacity duration-700",
              index === current ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            aria-hidden={index !== current}
            tabIndex={index === current ? 0 : -1}
          >
            <Image
              src={item.image}
              alt={item.alt}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
          </Link>
        ))}

        <button
          type="button"
          onClick={() => goTo(current - 1)}
          className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-brand-white/80 p-1.5 text-brand-black shadow transition hover:bg-brand-white sm:block"
          aria-label="Slide anterior"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-brand-white/80 p-1.5 text-brand-black shadow transition hover:bg-brand-white sm:block"
          aria-label="Próximo slide"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(index)}
              className={cn(
                "h-1.5 rounded-full bg-brand-white transition-all shadow",
                index === current ? "w-6" : "w-3 opacity-60",
              )}
              aria-label={`Ir para slide ${index + 1}`}
              aria-current={index === current}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
