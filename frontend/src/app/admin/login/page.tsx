"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Boxes, RefreshCw } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/admin");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8F9FA]">
        <RefreshCw className="h-8 w-8 animate-spin text-neutral-300" />
        <p className="text-sm font-medium text-neutral-500">Carregando sessão...</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F9FA] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(10,10,10,0.06),_transparent_55%)]" />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A0A0A] text-white shadow-sm">
            <Boxes className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-black">
            Grifres ERP
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Acesso administrativo — entre para continuar
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-brand-black">Entrar</h2>
            <p className="mt-1 text-xs font-medium text-neutral-400">
              Use o e-mail e a senha da sua conta
            </p>
          </div>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs font-medium text-neutral-400">
          Administração · Grifres
        </p>
      </div>
    </div>
  );
}
