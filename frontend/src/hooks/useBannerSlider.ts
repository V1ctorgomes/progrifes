"use client";

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";

const AUTOPLAY_INTERVAL = 6000;
const SWIPE_THRESHOLD = 50;

interface UseBannerSliderOptions {
  total: number;
  autoplay?: boolean;
}

export function useBannerSlider({ total, autoplay = true }: UseBannerSliderOptions) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      setCurrent((index + total) % total);
    },
    [total],
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (!autoplay || isPaused || total <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prevIndex) => (prevIndex + 1) % total);
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [autoplay, isPaused, total]);

  const handleTouchStart = (clientX: number) => {
    touchStartX.current = clientX;
    touchEndX.current = clientX;
  };

  const handleTouchMove = (clientX: number) => {
    touchEndX.current = clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) < SWIPE_THRESHOLD) return;
    if (diff > 0) next();
    else prev();
  };

  const sliderProps = {
    onMouseEnter: () => setIsPaused(true),
    onMouseLeave: () => setIsPaused(false),
    onTouchStart: (e: TouchEvent) => handleTouchStart(e.touches[0].clientX),
    onTouchMove: (e: TouchEvent) => handleTouchMove(e.touches[0].clientX),
    onTouchEnd: () => handleTouchEnd(),
  };

  return {
    current,
    goTo,
    next,
    prev,
    isPaused,
    sliderProps,
  };
}
