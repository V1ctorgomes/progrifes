"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="bg-brand-light font-sans text-brand-black">
        <Container className="flex min-h-screen flex-col items-center justify-center py-16 text-center">
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">
            Algo deu errado
          </h1>
          <p className="mt-3 max-w-md text-sm text-brand-gray">
            Não foi possível carregar a página. Se o problema persistir, verifique se o backend
            está online e se a variável <code>BACKEND_URL</code> está configurada no frontend.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button type="button" onClick={() => reset()}>
              Tentar novamente
            </Button>
            <Link href="/">
              <Button type="button" variant="outline">
                Ir para a loja
              </Button>
            </Link>
          </div>
        </Container>
      </body>
    </html>
  );
}
