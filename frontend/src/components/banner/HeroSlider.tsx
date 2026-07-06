"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BannerCard } from "@/components/banner/BannerCard";
import { BannerImage } from "@/components/banner/BannerImage";
import { BannerIndicators } from "@/components/banner/BannerIndicators";
import { BannerNavigation } from "@/components/banner/BannerNavigation";
import { HeroSlide } from "@/components/banner/HeroSlide";
import { useBannerSlider } from "@/hooks/useBannerSlider";
import type { Banner } from "@/types/banner";

interface HeroSliderProps {
  banners: Banner[];
}

export function HeroSlider({ banners }: HeroSliderProps) {
  const { current, goTo, next, prev, sliderProps } = useBannerSlider({
    total: banners.length,
    autoplay: true,
  });

  if (banners.length === 0) return null;

  const activeBanner = banners[current];

  return (
    <BannerCard id="inicio" className="bg-brand-black" ariaLabel="Banner principal">
      <div
        className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]"
        {...sliderProps}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeBanner.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <BannerImage banner={activeBanner} priority={current === 0} overlay />
            <div className="absolute inset-0 flex items-center">
              <HeroSlide banner={activeBanner} isActive />
            </div>
          </motion.div>
        </AnimatePresence>

        <BannerNavigation onPrev={prev} onNext={next} variant="light" />

        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
          <BannerIndicators
            total={banners.length}
            current={current}
            onSelect={goTo}
            variant="light"
          />
        </div>
      </div>
    </BannerCard>
  );
}
