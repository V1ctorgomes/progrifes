"use client";

import { RefreshCw } from "lucide-react";

export function AuthLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8F9FA]">
      <RefreshCw className="h-8 w-8 animate-spin text-neutral-300" />
      <p className="text-sm font-medium text-neutral-500">Carregando sessão...</p>
    </div>
  );
}
