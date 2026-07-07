"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { getErrorMessage, ordersAdminApi } from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";
import { PAYMENT_METHOD_LABELS, type OrderStatus } from "@/types/order";
import { OrderPrintView, printOrder } from "./OrderPrintView";
import { OrderStatusBadge } from "./OrderStatusBadge";

function formatVariant(cor?: string | null, tamanho?: string | null) {
  const parts = [cor, tamanho].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "—";
}

function formatTime(date: string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetailAdminPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [actionError, setActionError] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin", "orders", id],
    queryFn: () => ordersAdminApi.getById(id),
    enabled: Boolean(id),
  });

  const { data: history = [] } = useQuery({
    queryKey: ["admin", "orders", id, "history"],
    queryFn: () => ordersAdminApi.getHistory(id),
    enabled: Boolean(id),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "orders", id] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "orders", id, "history"] });
  };

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersAdminApi.updateStatus(id, status),
    onSuccess: async () => {
      setActionError("");
      await invalidate();
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersAdminApi.cancel(id, motivo),
    onSuccess: async () => {
      setActionError("");
      setCancelOpen(false);
      setMotivo("");
      await invalidate();
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  if (isLoading) {
    return <p className="text-sm text-brand-gray">Carregando pedido...</p>;
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-brand-gray">Pedido não encontrado.</p>
        <Link href="/admin/pedidos" className="text-sm underline">
          Voltar para listagem
        </Link>
      </div>
    );
  }

  const canChangeStatus = order.nextStatuses.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/pedidos" className="text-sm text-brand-gray hover:text-brand-black">
            ← Voltar para pedidos
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Pedido {order.numeroFormatado}
          </h1>
          <p className="text-sm text-brand-gray">
            Criado em {new Date(order.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge label={order.statusLabel} color={order.statusCor} />
          <Button variant="outline" size="sm" onClick={printOrder}>
            Imprimir
          </Button>
        </div>
      </div>

      {actionError && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {canChangeStatus && (
        <section className="border border-neutral-200 bg-brand-light p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-black">
            Alterar status
          </h2>
          <div className="flex flex-wrap gap-2">
            {order.nextStatuses.map((next) => (
              <Button
                key={next.value}
                size="sm"
                variant={next.value === "CANCELADO" ? "outline" : "primary"}
                disabled={statusMutation.isPending || cancelMutation.isPending}
                onClick={() => {
                  if (next.value === "CANCELADO") {
                    setCancelOpen(true);
                    return;
                  }
                  statusMutation.mutate(next.value);
                }}
                style={
                  next.value !== "CANCELADO"
                    ? { backgroundColor: next.cor, borderColor: next.cor }
                    : { color: next.cor, borderColor: next.cor }
                }
              >
                {next.nome}
              </Button>
            ))}
          </div>
          <div className="mt-3">
            <label className="mb-1.5 block text-sm font-medium text-brand-black">
              Ou selecione no dropdown
            </label>
            <select
              className="w-full max-w-xs border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm sm:w-auto"
              defaultValue=""
              disabled={statusMutation.isPending}
              onChange={(e) => {
                const value = e.target.value as OrderStatus;
                if (!value) return;
                if (value === "CANCELADO") {
                  setCancelOpen(true);
                  e.target.value = "";
                  return;
                }
                statusMutation.mutate(value);
                e.target.value = "";
              }}
            >
              <option value="">Selecionar próximo status...</option>
              {order.nextStatuses.map((next) => (
                <option key={next.value} value={next.value}>
                  {next.nome}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {order.status === "CANCELADO" && order.motivoCancelamento && (
        <section className="rounded border border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-semibold text-red-800">Motivo do cancelamento</h2>
          <p className="mt-1 text-sm text-red-700">{order.motivoCancelamento}</p>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 border border-neutral-200 p-4 lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Cliente</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-brand-gray">Nome</dt>
              <dd>{order.clienteNome}</dd>
            </div>
            <div>
              <dt className="text-brand-gray">Telefone</dt>
              <dd>{order.clienteTelefone}</dd>
            </div>
            {order.clienteEmail && (
              <div>
                <dt className="text-brand-gray">E-mail</dt>
                <dd>{order.clienteEmail}</dd>
              </div>
            )}
          </dl>

          <h2 className="pt-2 text-sm font-semibold uppercase tracking-wide">Endereço</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-brand-gray">CEP</dt>
              <dd>{order.cep}</dd>
            </div>
            <div>
              <dt className="text-brand-gray">Rua / Número</dt>
              <dd>
                {order.rua}, {order.numeroEndereco}
              </dd>
            </div>
            <div>
              <dt className="text-brand-gray">Bairro</dt>
              <dd>{order.bairro}</dd>
            </div>
            <div>
              <dt className="text-brand-gray">Cidade / Estado</dt>
              <dd>
                {order.cidade} / {order.estado}
              </dd>
            </div>
            {order.complemento && (
              <div>
                <dt className="text-brand-gray">Complemento</dt>
                <dd>{order.complemento}</dd>
              </div>
            )}
            {order.referencia && (
              <div>
                <dt className="text-brand-gray">Referência</dt>
                <dd>{order.referencia}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="border border-neutral-200 p-4 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Produtos</h2>
          <div className="space-y-4">
            {order.itens.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 border-b border-neutral-100 pb-4 last:border-0 last:pb-0"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-brand-light">
                  {item.imagem ? (
                    <Image
                      src={item.imagem}
                      alt={item.produtoNome}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-brand-gray">
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.produtoNome}</p>
                  <p className="text-sm text-brand-gray">
                    {formatVariant(item.cor, item.tamanho)} · SKU {item.sku}
                  </p>
                  <p className="text-sm">
                    {item.quantidade}x {formatCurrency(item.precoUnitario)} ={" "}
                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-neutral-200 pt-4 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-brand-gray">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-brand-gray">Entrega</span>
              <span>{formatCurrency(order.taxaEntrega)}</span>
            </div>
            <div className="flex justify-between py-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className="mt-4 border-t border-neutral-200 pt-4 text-sm">
            <p className="font-medium">Forma de pagamento</p>
            <p className="text-brand-gray">{PAYMENT_METHOD_LABELS[order.formaPagamento]}</p>
            {order.formaPagamento === "DINHEIRO" && order.trocoPara != null && (
              <p className="mt-1">Troco para: {formatCurrency(order.trocoPara)}</p>
            )}
          </div>

          {order.observacoes && (
            <div className="mt-4 border-t border-neutral-200 pt-4 text-sm">
              <p className="font-medium">Observações</p>
              <p className="mt-1 whitespace-pre-wrap text-brand-gray">{order.observacoes}</p>
            </div>
          )}
        </section>
      </div>

      <section className="border border-neutral-200 p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Timeline</h2>
        {history.length === 0 ? (
          <p className="text-sm text-brand-gray">Nenhum registro no histórico.</p>
        ) : (
          <ol className="space-y-0">
            {history.map((entry, index) => (
              <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                {index < history.length - 1 && (
                  <span className="absolute left-[7px] top-4 h-full w-px bg-neutral-300" />
                )}
                <span
                  className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-brand-black bg-brand-white"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium">{entry.descricao}</p>
                  <p className="text-xs text-brand-gray">{formatTime(entry.createdAt)}</p>
                  {entry.usuario && (
                    <p className="text-xs text-brand-gray">
                      por {entry.usuario.nome}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <OrderPrintView order={order} />

      <Modal open={cancelOpen} title="Cancelar pedido" onClose={() => setCancelOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-brand-gray">
            Informe o motivo do cancelamento. Esta ação ficará registrada no histórico.
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">
              Motivo do cancelamento *
            </label>
            <textarea
              className="min-h-28 w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="outline"
              disabled={!motivo.trim() || cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              Confirmar cancelamento
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
