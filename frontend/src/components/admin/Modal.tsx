"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, title, onClose, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fechar modal"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded border border-neutral-200 bg-brand-white p-6 shadow-lg",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-brand-black">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-brand-gray hover:text-brand-black"
          >
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
