"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { BannerButton } from "@/components/banner/BannerButton";
import type { Banner } from "@/types/banner";

interface HeroSlideProps {
  banner: Banner;
  isActive: boolean;
}

export function HeroSlide({ banner, isActive }: HeroSlideProps) {
  return (
    <Container className="relative flex h-full items-center">
      <motion.div
        initial={false}
        animate={{
          opacity: isActive ? 1 : 0,
          y: isActive ? 0 : 20,
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-xl py-16 text-brand-white"
        aria-hidden={!isActive}
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-brand-accent">
          Nova temporada
        </p>
        <h1 className="font-display text-3xl font-bold uppercase leading-tight tracking-wide sm:text-4xl lg:text-5xl">
          {banner.titulo}
        </h1>
        {banner.subtitulo && (
          <p className="mt-4 text-sm leading-relaxed text-neutral-200 sm:text-base">
            {banner.subtitulo}
          </p>
        )}
        {(banner.textoBotaoPrimario ?? banner.textoBotaoSecundario) && (
          <motion.div
            initial={false}
            animate={{ opacity: isActive ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            {banner.textoBotaoPrimario && (
              <BannerButton href={banner.linkPrimario} variant="secondary">
                {banner.textoBotaoPrimario}
              </BannerButton>
            )}
            {banner.textoBotaoSecundario && (
              <BannerButton href={banner.linkSecundario} variant="outline-light">
                {banner.textoBotaoSecundario}
              </BannerButton>
            )}
          </motion.div>
        )}
      </motion.div>
    </Container>
  );
}
