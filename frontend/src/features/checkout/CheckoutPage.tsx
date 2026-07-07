"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { useCart } from "@/features/cart/hooks/useCart";
import { StoreLayout } from "@/layouts/StoreLayout";
import { getDeliverySettings, lookupNeighborhood } from "@/lib/delivery-api";
import { createOrder, getOrderErrorMessage } from "@/lib/orders-api";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import type { Category } from "@/types/category";
import type { PaymentMethod } from "@/types/order";
import { PAYMENT_METHOD_LABELS } from "@/types/order";
import { formatCurrency } from "@/utils/cn";

interface CheckoutPageProps {
  categories: Category[];
}

interface CheckoutForm {
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail: string;
  cep: string;
  rua: string;
  numeroEndereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
  referencia: string;
  formaPagamento: PaymentMethod;
  precisaTroco: boolean;
  trocoPara: string;
  observacoes: string;
}

const emptyForm: CheckoutForm = {
  clienteNome: "",
  clienteTelefone: "",
  clienteEmail: "",
  cep: "",
  rua: "",
  numeroEndereco: "",
  bairro: "",
  cidade: "",
  estado: "",
  complemento: "",
  referencia: "",
  formaPagamento: "PIX",
  precisaTroco: false,
  trocoPara: "",
  observacoes: "",
};

export function CheckoutPage({ categories }: CheckoutPageProps) {
  return (
    <StoreLayout categories={categories}>
      <CheckoutContent />
    </StoreLayout>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const { items, totals, clearCart, isHydrated } = useCart();
  const [form, setForm] = useState<CheckoutForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedAddress, setDebouncedAddress] = useState({
    bairro: "",
    cidade: "",
    estado: "",
  });

  const { data: deliverySettings, isLoading: deliveryLoading } = useQuery({
    queryKey: ["delivery", "settings"],
    queryFn: getDeliverySettings,
    staleTime: 60_000,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAddress({
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim(),
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [form.bairro, form.cidade, form.estado]);

  const canLookupNeighborhood =
    debouncedAddress.bairro.length > 0 &&
    debouncedAddress.cidade.length > 0 &&
    debouncedAddress.estado.length > 0;

  const { data: neighborhoodLookup, isFetching: neighborhoodLoading } = useQuery({
    queryKey: ["delivery", "neighborhood-lookup", debouncedAddress],
    queryFn: () => lookupNeighborhood(debouncedAddress),
    enabled: canLookupNeighborhood,
    staleTime: 30_000,
  });

  const shippingFee = neighborhoodLookup?.found ? neighborhoodLookup.neighborhood.deliveryFee : null;
  const deliveryTimeMinutes = neighborhoodLookup?.found
    ? neighborhoodLookup.neighborhood.averageDeliveryTime
    : null;
  const neighborhoodBlocked =
    canLookupNeighborhood && neighborhoodLookup && !neighborhoodLookup.found;

  const canCheckout =
    (deliverySettings?.availability.canAcceptOrders ?? false) &&
    (!canLookupNeighborhood || neighborhoodLookup?.found === true);
  const checkoutDisabledReason = !deliverySettings?.enabled
    ? "As entregas estão temporariamente indisponíveis."
    : !deliverySettings?.availability.isOpenNow
      ? deliverySettings?.closedMessage
      : neighborhoodBlocked
        ? neighborhoodLookup?.message
        : totals.subtotal < (deliverySettings?.minimumOrderValue ?? 0)
          ? `Pedido mínimo para entrega: ${formatCurrency(deliverySettings?.minimumOrderValue ?? 0)}`
          : canLookupNeighborhood && neighborhoodLoading
            ? "Validando bairro de entrega..."
            : !canLookupNeighborhood
              ? "Informe bairro, cidade e estado para calcular a entrega"
              : undefined;

  useEffect(() => {
    if (isHydrated && items.length === 0) {
      router.replace("/carrinho");
    }
  }, [isHydrated, items.length, router]);

  useEffect(() => {
    if (deliverySettings && !deliverySettings.enabled) {
      router.replace("/carrinho");
    }
  }, [deliverySettings, router]);

  const update = (field: keyof CheckoutForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!canCheckout || neighborhoodBlocked) {
      setError(checkoutDisabledReason ?? "Entrega indisponível no momento");
      return;
    }

    if (!form.clienteNome.trim() || !form.clienteTelefone.trim()) {
      setError("Nome e telefone são obrigatórios");
      return;
    }

    if (
      !form.cep.trim() ||
      !form.rua.trim() ||
      !form.numeroEndereco.trim() ||
      !form.bairro.trim() ||
      !form.cidade.trim() ||
      !form.estado.trim()
    ) {
      setError("Preencha todos os campos obrigatórios do endereço");
      return;
    }

    if (form.formaPagamento === "DINHEIRO" && form.precisaTroco && !form.trocoPara) {
      setError("Informe o valor para troco");
      return;
    }

    const invalidVariant = items.find((item) => item.varianteId.startsWith("product:"));
    if (invalidVariant) {
      setError(`O produto "${invalidVariant.nome}" precisa de variante selecionada`);
      return;
    }

    setLoading(true);

    try {
      const order = await createOrder({
        clienteNome: form.clienteNome.trim(),
        clienteTelefone: form.clienteTelefone.trim(),
        clienteEmail: form.clienteEmail.trim() || undefined,
        cep: form.cep.trim(),
        rua: form.rua.trim(),
        numeroEndereco: form.numeroEndereco.trim(),
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim(),
        complemento: form.complemento.trim() || undefined,
        referencia: form.referencia.trim() || undefined,
        formaPagamento: form.formaPagamento,
        trocoPara:
          form.formaPagamento === "DINHEIRO" && form.precisaTroco
            ? Number(form.trocoPara)
            : undefined,
        observacoes: form.observacoes.trim() || undefined,
        itens: items.map((item) => ({
          varianteId: item.varianteId,
          quantidade: item.quantidade,
        })),
      });

      clearCart();
      sessionStorage.setItem(`checkout-whatsapp-${order.numero}`, order.whatsappUrl);
      router.push(`/checkout/sucesso?pedido=${order.numero}`);
    } catch (submitError) {
      setError(getOrderErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated || items.length === 0 || deliveryLoading) {
    return (
      <Container className="py-12">
        <p className="text-sm text-brand-gray">Carregando checkout...</p>
      </Container>
    );
  }

  if (!deliverySettings?.enabled) {
    return (
      <Container className="py-12">
        <p className="text-sm text-brand-gray">Entrega indisponível no momento.</p>
      </Container>
    );
  }

  return (
    <main className="py-8 sm:py-12">
        <Container>
          <div className="mb-8">
            <Link href="/carrinho" className="text-sm text-brand-gray underline">
              ← Voltar ao carrinho
            </Link>
            <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide text-brand-black">
              Checkout
            </h1>
            <p className="mt-2 text-sm text-brand-gray">
              Preencha seus dados para finalizar o pedido via WhatsApp
            </p>
            {deliverySettings.message ? (
              <p className="mt-3 whitespace-pre-line rounded border border-neutral-200 bg-brand-light p-3 text-sm text-brand-gray">
                {deliverySettings.message}
              </p>
            ) : null}
            {!canCheckout && checkoutDisabledReason ? (
              <p className="mt-3 text-sm text-red-600">{checkoutDisabledReason}</p>
            ) : null}
            {neighborhoodLookup?.found ? (
              <p className="mt-3 text-sm text-emerald-700">
                Entrega disponível para {neighborhoodLookup.neighborhood.name}:{" "}
                {formatCurrency(neighborhoodLookup.neighborhood.deliveryFee)} · Prazo médio de{" "}
                {neighborhoodLookup.neighborhood.averageDeliveryTime} min
              </p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-8">
              <section className="space-y-4 border border-neutral-200 p-4">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-brand-black">
                  Dados do cliente
                </h2>
                <Input
                  label="Nome *"
                  value={form.clienteNome}
                  onChange={(e) => update("clienteNome", e.target.value)}
                  required
                />
                <Input
                  label="Telefone *"
                  value={form.clienteTelefone}
                  onChange={(e) => update("clienteTelefone", e.target.value)}
                  placeholder="(85) 99999-9999"
                  required
                />
                <Input
                  label="E-mail"
                  type="email"
                  value={form.clienteEmail}
                  onChange={(e) => update("clienteEmail", e.target.value)}
                />
              </section>

              <section className="space-y-4 border border-neutral-200 p-4">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-brand-black">
                  Endereço de entrega
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="CEP *"
                    value={form.cep}
                    onChange={(e) => update("cep", e.target.value)}
                    required
                  />
                  <Input
                    label="Estado *"
                    value={form.estado}
                    onChange={(e) => update("estado", e.target.value)}
                    maxLength={2}
                    required
                  />
                </div>
                <Input
                  label="Rua *"
                  value={form.rua}
                  onChange={(e) => update("rua", e.target.value)}
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Número *"
                    value={form.numeroEndereco}
                    onChange={(e) => update("numeroEndereco", e.target.value)}
                    required
                  />
                  <Input
                    label="Bairro *"
                    value={form.bairro}
                    onChange={(e) => update("bairro", e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Cidade *"
                  value={form.cidade}
                  onChange={(e) => update("cidade", e.target.value)}
                  required
                />
                <Input
                  label="Complemento"
                  value={form.complemento}
                  onChange={(e) => update("complemento", e.target.value)}
                />
                <Input
                  label="Ponto de referência"
                  value={form.referencia}
                  onChange={(e) => update("referencia", e.target.value)}
                />
              </section>

              <section className="space-y-4 border border-neutral-200 p-4">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-brand-black">
                  Forma de pagamento
                </h2>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => update("formaPagamento", method)}
                      className={`border px-4 py-3 text-sm ${
                        form.formaPagamento === method
                          ? "border-brand-black bg-brand-black text-brand-white"
                          : "border-neutral-300"
                      }`}
                    >
                      {PAYMENT_METHOD_LABELS[method]}
                    </button>
                  ))}
                </div>

                {form.formaPagamento === "DINHEIRO" && (
                  <div className="space-y-3 border-t border-neutral-200 pt-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.precisaTroco}
                        onChange={(e) => update("precisaTroco", e.target.checked)}
                      />
                      Precisa de troco?
                    </label>
                    {form.precisaTroco && (
                      <Input
                        label="Troco para"
                        type="number"
                        step="0.01"
                        value={form.trocoPara}
                        onChange={(e) => update("trocoPara", e.target.value)}
                      />
                    )}
                  </div>
                )}
              </section>

              <section className="space-y-4 border border-neutral-200 p-4">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-brand-black">
                  Observações
                </h2>
                <textarea
                  className="min-h-[100px] w-full border border-neutral-300 px-4 py-2.5 text-sm"
                  value={form.observacoes}
                  onChange={(e) => update("observacoes", e.target.value)}
                  placeholder="Ex.: Entregar após 18h, não tocar a campainha..."
                />
              </section>
            </div>

            <div className="space-y-4">
              <div className="border border-neutral-200 p-4">
                <h2 className="mb-4 font-display text-lg font-semibold uppercase tracking-wide text-brand-black">
                  Seu pedido
                </h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.varianteId} className="flex gap-3">
                      <div className="relative h-16 w-12 shrink-0 bg-brand-light">
                        {item.imagem && (
                          <Image
                            src={item.imagem}
                            alt={item.nome}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-medium text-brand-black">{item.nome}</p>
                        <p className="text-brand-gray">
                          {[item.cor, item.tamanho].filter(Boolean).join(" / ")}
                        </p>
                        <p className="text-brand-gray">
                          {item.quantidade}x {formatCurrency(item.preco)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <CartSummary
                totals={totals}
                showCheckout={false}
                deliveryMessage={deliverySettings.message}
                minimumOrderValue={deliverySettings.minimumOrderValue}
                shippingFee={shippingFee}
                deliveryTimeMinutes={deliveryTimeMinutes}
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button
                type="submit"
                fullWidth
                variant="whatsapp"
                disabled={loading || !canCheckout}
              >
                {loading ? "Processando..." : "Finalizar pedido"}
              </Button>
            </div>
          </form>
        </Container>
      </main>
  );
}
