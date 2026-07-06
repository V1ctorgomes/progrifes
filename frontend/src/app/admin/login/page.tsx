"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLoading } from "@/components/auth/AuthLoading";
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

  if (isLoading) {
    return <AuthLoading />;
  }

  if (isAuthenticated) {
    return <AuthLoading />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4">
      <div className="w-full max-w-md border border-neutral-200 bg-brand-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl font-semibold uppercase tracking-widest text-brand-black">
            Grifres
          </p>
          <p className="mt-2 text-sm text-brand-gray">ERP Comercial — Acesso administrativo</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
