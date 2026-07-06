"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CookieBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-brand-white p-4 shadow-lg sm:p-5"
      role="dialog"
      aria-label="Aviso de cookies"
    >
      <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-center text-xs text-brand-gray sm:text-left sm:text-sm">
          Ao navegar por este site{" "}
          <strong className="font-medium text-brand-black">você aceita o uso de cookies</strong>{" "}
          para agilizar a sua experiência de compra.
        </p>
        <Button size="sm" onClick={() => setVisible(false)} className="flex-shrink-0">
          Entendi
        </Button>
      </Container>
    </div>
  );
}
