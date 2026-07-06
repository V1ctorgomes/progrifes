"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
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
    const timer = setInterval(() => goTo(current + 1), 6000);
    return () => clearInterval(timer);
  }, [current, goTo]);

  const slide = slides[current];

  return (
    <section id="inicio" className="relative overflow-hidden bg-brand-black" aria-label="Banner principal">
      <div className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
        {slides.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              index === current ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={index !== current}
          >
            <Image
              src={item.image}
              alt={item.title}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          </div>
        ))}

        <Container className="relative flex h-full items-center">
          <div className="max-w-xl animate-slide-up py-16 text-brand-white">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-brand-accent">
              Nova temporada
            </p>
            <h1 className="font-display text-3xl font-bold uppercase leading-tight tracking-wide sm:text-4xl lg:text-5xl">
              {slide.title}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-200 sm:text-base">
              {slide.subtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button variant="primary" className="bg-brand-white text-brand-black hover:bg-brand-light">
                {slide.primaryCta}
              </Button>
              <Button variant="outline" className="border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-black">
                {slide.secondaryCta}
              </Button>
            </div>
          </div>
        </Container>

        <button
          type="button"
          onClick={() => goTo(current - 1)}
          className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-brand-white/20 p-2 text-brand-white backdrop-blur transition hover:bg-brand-white/40 sm:block"
          aria-label="Slide anterior"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-brand-white/20 p-2 text-brand-white backdrop-blur transition hover:bg-brand-white/40 sm:block"
          aria-label="Próximo slide"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>

        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === current ? "w-8 bg-brand-white" : "w-4 bg-brand-white/40",
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
