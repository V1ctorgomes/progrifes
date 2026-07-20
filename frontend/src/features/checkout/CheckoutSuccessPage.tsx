"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pedido) return;

    const storedUrl = sessionStorage.getItem(`checkout-whatsapp-${pedido}`);
    if (storedUrl) {
      setWhatsappUrl(storedUrl);
      return;
    }

    setWhatsappUrl(`https://wa.me/${storeInfo.whatsappLink}`);
  }, [pedido]);

  const handleConfirmWhatsApp = () => {
    if (!whatsappUrl) return;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <StoreLayout categories={categories}>
      <main className="py-16 sm:py-24">
        <Container className="max-w-xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <span className="text-2xl font-bold">!</span>
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-black">
            Quase lá!
          </h1>

          {numeroFormatado ? (
            <p className="mt-3 text-lg font-semibold text-brand-black">
              Pedido {numeroFormatado} registrado
            </p>
          ) : null}

          <div className="mt-6 space-y-3 rounded-2xl border border-neutral-100 bg-white p-5 text-left text-sm text-neutral-500 shadow-sm">
            <p>
              Seu pedido foi salvo no sistema, mas ainda <strong className="text-brand-black">não está confirmado</strong>.
            </p>
            <p>
              Para finalizar, é necessário enviar a confirmação via <strong className="text-brand-black">WhatsApp</strong>.
              Nossa equipe só dará andamento após receber sua mensagem.
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Clique no botão abaixo para abrir o WhatsApp</li>
              <li>Envie a mensagem do pedido (já vem pronta)</li>
              <li>Aguarde a confirmação da loja</li>
            </ol>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Button
              type="button"
              variant="whatsapp"
              fullWidth
              disabled={!whatsappUrl}
              onClick={handleConfirmWhatsApp}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <WhatsAppIcon className="h-5 w-5" />
                Confirmar pedido no WhatsApp
              </span>
            </Button>

            <Link href="/">
              <Button variant="outline" fullWidth>
                Voltar à loja
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-xs font-medium text-neutral-400">
            Sem a confirmação pelo WhatsApp, o pedido pode não ser processado.
          </p>
        </Container>
      </main>
    </StoreLayout>
  );
}
