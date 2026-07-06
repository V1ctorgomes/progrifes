"use client";

export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-black border-t-transparent" />
        <p className="text-sm text-brand-gray">Carregando sessão...</p>
      </div>
    </div>
  );
}
