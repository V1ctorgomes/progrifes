"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Printer,
  RefreshCw,
  ShoppingCart,
  Truck,
  User,
} from "lucide-react";
import { Modal } from "@/components/admin/Modal";
import { getErrorMessage, ordersAdminApi, deliveryPersonsAdminApi } from "@/lib/admin-api";
import { cn, formatCurrency } from "@/utils/cn";
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

const fieldClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-black outline-none transition-colors focus:border-brand-black focus:ring-1 focus:ring-brand-black";

export function OrderDetailAdminPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState("");

  const { data: order, isLoading, isFetching, refetch, isError } = useQuery({
    queryKey: ["admin", "orders", id],
    queryFn: () => ordersAdminApi.getById(id),
    enabled: Boolean(id),
  });

  const { data: history = [] } = useQuery({
    queryKey: ["admin", "orders", id, "history"],
    queryFn: () => ordersAdminApi.getHistory(id),
    enabled: Boolean(id),
  });

  const canAssignDeliveryPerson =
    order && order.status !== "CANCELADO" && order.status !== "ENTREGUE";

  const { data: availableDeliveryPersons = [] } = useQuery({
    queryKey: ["admin", "delivery-persons", "available"],
    queryFn: () => deliveryPersonsAdminApi.listAvailable(),
    enabled: Boolean(canAssignDeliveryPerson),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "orders", id] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "orders", id, "history"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "delivery-persons"] });
  };

  const assignDeliveryPersonMutation = useMutation({
    mutationFn: (deliveryPersonId: string | null) =>
      ordersAdminApi.assignDeliveryPerson(id, deliveryPersonId),
    onSuccess: async () => {
      setActionError("");
      setSelectedDeliveryPersonId("");
      await invalidate();
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

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
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-neutral-300" />
        <p className="text-sm font-medium text-neutral-500">Carregando pedido...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-medium text-neutral-500">Pedido não encontrado.</p>
        <Link
          href="/admin/pedidos"
          className="mt-2 rounded-xl bg-brand-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Voltar para listagem
        </Link>
      </div>
    );
  }

  const canChangeStatus = order.nextStatuses.length > 0;

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/pedidos"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 transition-colors hover:text-brand-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para pedidos
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-black">
            Pedido {order.numeroFormatado}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Criado em {new Date(order.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <OrderStatusBadge label={order.statusLabel} color={order.statusCor} />
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4 text-neutral-500", isFetching && "animate-spin")} />
            Atualizar
          </button>
          <button
            type="button"
            onClick={printOrder}
            className="flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
        </div>
      </div>

      {actionError ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {actionError}
        </p>
      ) : null}

      {canChangeStatus ? (
        <section className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-brand-black">Alterar status</h2>
              <p className="text-xs font-medium text-neutral-400">
                Avance o pedido para o próximo estado operacional
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {order.nextStatuses.map((next) => (
              <button
                key={next.value}
                type="button"
                disabled={statusMutation.isPending || cancelMutation.isPending}
                onClick={() => {
                  if (next.value === "CANCELADO") {
                    setCancelOpen(true);
                    return;
                  }
                  statusMutation.mutate(next.value);
                }}
                className={cn(
                  "flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition-all disabled:opacity-50",
                  next.value === "CANCELADO"
                    ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                    : "text-white shadow-sm",
                )}
                style={
                  next.value !== "CANCELADO"
                    ? { backgroundColor: next.cor }
                    : undefined
                }
              >
                {next.nome}
              </button>
            ))}
          </div>
          <div className="mt-4 max-w-xs">
            <label className="mb-1.5 block text-sm font-medium text-brand-black">
              Ou selecione no dropdown
            </label>
            <select
              className={fieldClass}
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
      ) : null}

      {order.status === "CANCELADO" && order.motivoCancelamento ? (
        <section className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <h2 className="text-sm font-semibold text-red-800">Motivo do cancelamento</h2>
          <p className="mt-1 text-sm text-red-700">{order.motivoCancelamento}</p>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-5 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-brand-black">Cliente</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-neutral-400">Nome</dt>
              <dd className="mt-0.5 font-medium text-brand-black">{order.clienteNome}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-neutral-400">Telefone</dt>
              <dd className="mt-0.5 font-medium text-brand-black">{order.clienteTelefone}</dd>
            </div>
            {order.customerId ? (
              <div>
                <dt className="text-xs font-medium text-neutral-400">Cadastro</dt>
                <dd className="mt-0.5">
                  <Link
                    href={`/admin/clientes/${order.customerId}`}
                    className="font-semibold text-brand-black underline-offset-4 hover:underline"
                  >
                    Ver cliente no ERP
                  </Link>
                </dd>
              </div>
            ) : null}
            {order.clienteEmail ? (
              <div>
                <dt className="text-xs font-medium text-neutral-400">E-mail</dt>
                <dd className="mt-0.5 font-medium text-brand-black">{order.clienteEmail}</dd>
              </div>
            ) : null}
          </dl>

          <div className="border-t border-neutral-100 pt-5">
            <h2 className="mb-3 text-base font-semibold text-brand-black">Endereço</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-neutral-400">CEP</dt>
                <dd className="mt-0.5 font-medium text-brand-black">{order.cep}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-neutral-400">Rua / Número</dt>
                <dd className="mt-0.5 font-medium text-brand-black">
                  {order.rua}, {order.numeroEndereco}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-neutral-400">Bairro</dt>
                <dd className="mt-0.5 font-medium text-brand-black">{order.bairro}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-neutral-400">Cidade / Estado</dt>
                <dd className="mt-0.5 font-medium text-brand-black">
                  {order.cidade} / {order.estado}
                </dd>
              </div>
              {order.complemento ? (
                <div>
                  <dt className="text-xs font-medium text-neutral-400">Complemento</dt>
                  <dd className="mt-0.5 font-medium text-brand-black">{order.complemento}</dd>
                </div>
              ) : null}
              {order.referencia ? (
                <div>
                  <dt className="text-xs font-medium text-neutral-400">Referência</dt>
                  <dd className="mt-0.5 font-medium text-brand-black">{order.referencia}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {canAssignDeliveryPerson ? (
            <div className="border-t border-neutral-100 pt-5">
              <div className="mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-neutral-500" />
                <h2 className="text-base font-semibold text-brand-black">Entregador</h2>
              </div>
              {order.deliveryPerson ? (
                <p className="text-sm font-medium text-brand-black">
                  {order.deliveryPerson.name}
                  <span className="ml-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                    ({order.deliveryPerson.status})
                  </span>
                </p>
              ) : (
                <p className="text-sm text-neutral-500">Nenhum entregador atribuído.</p>
              )}
              <div className="mt-3 space-y-2">
                <select
                  className={fieldClass}
                  value={selectedDeliveryPersonId}
                  disabled={assignDeliveryPersonMutation.isPending}
                  onChange={(event) => setSelectedDeliveryPersonId(event.target.value)}
                >
                  <option value="">Selecionar entregador disponível...</option>
                  {availableDeliveryPersons.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} — {person.phone}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!selectedDeliveryPersonId || assignDeliveryPersonMutation.isPending}
                    onClick={() =>
                      assignDeliveryPersonMutation.mutate(selectedDeliveryPersonId)
                    }
                    className="flex h-9 items-center rounded-xl bg-brand-black px-3 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Atribuir
                  </button>
                  {order.deliveryPersonId ? (
                    <button
                      type="button"
                      disabled={assignDeliveryPersonMutation.isPending}
                      onClick={() => assignDeliveryPersonMutation.mutate(null)}
                      className="flex h-9 items-center rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-brand-black shadow-sm transition-all hover:bg-neutral-50 disabled:opacity-50"
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : order.deliveryPerson ? (
            <div className="border-t border-neutral-100 pt-5">
              <div className="mb-2 flex items-center gap-2">
                <Truck className="h-4 w-4 text-neutral-500" />
                <h2 className="text-base font-semibold text-brand-black">Entregador</h2>
              </div>
              <p className="text-sm font-medium text-brand-black">{order.deliveryPerson.name}</p>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-brand-black">Produtos</h2>
          <div className="space-y-4">
            {order.itens.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 border-b border-neutral-100 pb-4 last:border-0 last:pb-0"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                  {item.imagem ? (
                    <Image
                      src={item.imagem}
                      alt={item.produtoNome}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-black">{item.produtoNome}</p>
                  <p className="text-sm text-neutral-500">
                    {formatVariant(item.cor, item.tamanho)} · SKU {item.sku}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {item.quantidade}x {formatCurrency(item.precoUnitario)} ={" "}
                    <span className="font-bold text-brand-black">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-neutral-100 pt-4 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-neutral-500">Subtotal</span>
              <span className="font-medium text-brand-black">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-500">Entrega</span>
              <span className="font-medium text-brand-black">
                {formatCurrency(order.taxaEntrega)}
              </span>
            </div>
            {order.prazoEntregaMinutos ? (
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">Prazo informado</span>
                <span className="font-medium text-brand-black">
                  {order.prazoEntregaMinutos} min
                </span>
              </div>
            ) : null}
            <div className="flex justify-between py-2 text-base font-bold text-brand-black">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-4 text-sm">
            <p className="font-semibold text-brand-black">Forma de pagamento</p>
            <p className="mt-1 text-neutral-500">
              {PAYMENT_METHOD_LABELS[order.formaPagamento]}
            </p>
            {order.formaPagamento === "DINHEIRO" && order.trocoPara != null ? (
              <p className="mt-1 font-medium text-brand-black">
                Troco para: {formatCurrency(order.trocoPara)}
              </p>
            ) : null}
          </div>

          {order.observacoes ? (
            <div className="mt-4 border-t border-neutral-100 pt-4 text-sm">
              <p className="font-semibold text-brand-black">Observações</p>
              <p className="mt-1 whitespace-pre-wrap text-neutral-500">{order.observacoes}</p>
            </div>
          ) : null}
        </section>
      </div>

      <section className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-brand-black">Timeline</h2>
        {history.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum registro no histórico.</p>
        ) : (
          <ol className="space-y-0">
            {history.map((entry, index) => (
              <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                {index < history.length - 1 ? (
                  <span className="absolute left-[7px] top-4 h-full w-px bg-neutral-200" />
                ) : null}
                <span
                  className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-brand-black bg-white"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-semibold text-brand-black">{entry.descricao}</p>
                  <p className="text-xs font-medium text-neutral-400">
                    {formatTime(entry.createdAt)}
                  </p>
                  {entry.usuario ? (
                    <p className="text-xs font-medium text-neutral-400">
                      por {entry.usuario.nome}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <OrderPrintView order={order} />

      <Modal open={cancelOpen} title="Cancelar pedido" onClose={() => setCancelOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            Informe o motivo do cancelamento. Esta ação ficará registrada no histórico.
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">
              Motivo do cancelamento *
            </label>
            <textarea
              className={`min-h-28 ${fieldClass}`}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo..."
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={() => setCancelOpen(false)}
              className="flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-brand-black shadow-sm transition-all hover:bg-neutral-50"
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={!motivo.trim() || cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
              className="flex h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-5 text-sm font-semibold text-red-600 shadow-sm transition-all hover:bg-red-50 disabled:opacity-50"
            >
              Confirmar cancelamento
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
