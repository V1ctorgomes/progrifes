"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StoreLayout } from "@/layouts/StoreLayout";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { storeInfo } from "@/lib/mock-data";
import type { Category } from "@/types/category";

interface CheckoutSuccessPageProps {
  categories: Category[];
}

export function CheckoutSuccessPage({ categories }: CheckoutSuccessPageProps) {
  const searchParams = useSearchParams();
  const pedido = searchParams.get("pedido");
  const numeroFormatado = pedido ? `#${String(pedido).padStart(6, "0")}` : null;
  const whatsappUrl = `https://wa.me/${storeInfo.whatsappLink}`;

  return (
    <StoreLayout categories={categories}>
      <main className="py-16 sm:py-24">
        <Container className="max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-whatsapp text-brand-white">
            <WhatsAppIcon className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-brand-black">
            Pedido realizado!
          </h1>
          {numeroFormatado && (
            <p className="mt-3 text-lg font-semibold text-brand-black">Pedido {numeroFormatado}</p>
          )}
          <p className="mt-4 text-brand-gray">
            Seu pedido foi registrado no sistema. Envie a mensagem no WhatsApp para confirmar o
            atendimento com nossa equipe.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="whatsapp" fullWidth>
                Abrir WhatsApp
              </Button>
            </a>
            <Link href="/">
              <Button variant="outline" fullWidth>
                Voltar à loja
              </Button>
            </Link>
          </div>
        </Container>
      </main>
    </StoreLayout>
  );
}
