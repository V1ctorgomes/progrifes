"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { PurchaseOrderForm } from "@/features/admin/purchase-orders/PurchaseOrderForm";
import {
  printPurchaseOrder,
  PurchaseOrderPrintView,
} from "@/features/admin/purchase-orders/PurchaseOrderPrintView";
import { PurchaseOrderStatusBadge } from "@/features/admin/purchase-orders/PurchaseOrderStatusBadge";
import { ReceiveGoodsForm } from "@/features/admin/goods-receipts/ReceiveGoodsForm";
import { useAuth } from "@/hooks/useAuth";
import {
  getErrorMessage,
  goodsReceiptsAdminApi,
  purchaseOrdersAdminApi,
} from "@/lib/admin-api";
import type { PurchaseOrderInput, PurchaseOrderStatus } from "@/types/purchase-order";
import { formatAddress } from "@/types/supplier";
import { formatCurrency } from "@/utils/cn";

function canWritePurchases(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("purchases:write");
}

function canApprovePurchases(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("purchases:approve");
}

function formatTime(date: string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PurchaseOrderDetailAdminPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canWrite = canWritePurchases(permissions);
  const canApprove = canApprovePurchases(permissions);

  const [editOpen, setEditOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [formError, setFormError] = useState("");
  const [receiveError, setReceiveError] = useState("");
  const [actionError, setActionError] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin", "purchase-orders", id],
    queryFn: () => purchaseOrdersAdminApi.getById(id),
    enabled: Boolean(id),
  });

  const { data: history = [] } = useQuery({
    queryKey: ["admin", "purchase-orders", id, "history"],
    queryFn: () => purchaseOrdersAdminApi.getHistory(id),
    enabled: Boolean(id),
  });

  const { data: receiptSummary } = useQuery({
    queryKey: ["admin", "purchase-orders", id, "receipt-summary"],
    queryFn: () => purchaseOrdersAdminApi.getReceiptSummary(id),
    enabled: Boolean(id),
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ["admin", "purchase-orders", id, "receipts"],
    queryFn: () => purchaseOrdersAdminApi.getReceipts(id),
    enabled: Boolean(id),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "purchase-orders"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "purchase-orders", id] });
    await queryClient.invalidateQueries({
      queryKey: ["admin", "purchase-orders", id, "history"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["admin", "purchase-orders", id, "receipt-summary"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["admin", "purchase-orders", id, "receipts"],
    });
    await queryClient.invalidateQueries({ queryKey: ["admin", "goods-receipts"] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload: PurchaseOrderInput) => purchaseOrdersAdminApi.update(id, payload),
    onSuccess: async () => {
      setFormError("");
      await invalidate();
      setEditOpen(false);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: (status: PurchaseOrderStatus) => purchaseOrdersAdminApi.updateStatus(id, status),
    onSuccess: async () => {
      setActionError("");
      await invalidate();
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => purchaseOrdersAdminApi.cancel(id, motivo),
    onSuccess: async () => {
      setActionError("");
      setCancelOpen(false);
      setMotivo("");
      await invalidate();
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const duplicateMutation = useMutation({
    mutationFn: () => purchaseOrdersAdminApi.duplicate(id),
    onSuccess: (duplicated) => {
      router.push(`/admin/compras/${duplicated.id}`);
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => purchaseOrdersAdminApi.remove(id),
    onSuccess: () => {
      router.push("/admin/compras");
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const receiveMutation = useMutation({
    mutationFn: goodsReceiptsAdminApi.create,
    onSuccess: async (receipt) => {
      setReceiveError("");
      await invalidate();
      setReceiveOpen(false);
      router.push(`/admin/compras/recebimentos/${receipt.id}`);
    },
    onError: (error) => setReceiveError(getErrorMessage(error)),
  });

  if (isLoading) {
    return <p className="text-sm text-brand-gray">Carregando ordem...</p>;
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-brand-gray">Ordem não encontrada.</p>
        <Link href="/admin/compras" className="text-sm underline">
          Voltar para compras
        </Link>
      </div>
    );
  }

  const canChangeStatus = order.nextStatuses.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/compras" className="text-sm text-brand-gray hover:text-brand-black">
            ← Ordens de compra
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            {order.numeroFormatado}
          </h1>
          <p className="text-sm text-brand-gray">
            Criada em {new Date(order.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PurchaseOrderStatusBadge label={order.statusLabel} color={order.statusCor} />
          <Button variant="outline" size="sm" onClick={printPurchaseOrder}>
            Imprimir
          </Button>
          {canWrite && receiptSummary?.canReceive && (
            <Button
              className="hidden md:inline-flex"
              size="sm"
              onClick={() => setReceiveOpen(true)}
            >
              Receber mercadorias
            </Button>
          )}
          {canWrite && order.canEdit && (
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              Editar
            </Button>
          )}
          {canWrite && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => duplicateMutation.mutate()}
              disabled={duplicateMutation.isPending}
            >
              Duplicar
            </Button>
          )}
          {canWrite && order.status === "RASCUNHO" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Excluir esta ordem em rascunho?")) {
                  deleteMutation.mutate();
                }
              }}
            >
              Excluir
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {canChangeStatus && (
        <div className="flex flex-wrap gap-2">
          {order.nextStatuses.map((status) => {
            const isApprove = status.value === "APROVADA";
            if (isApprove && !canApprove) return null;
            const isCancel = status.value === "CANCELADA";
            return (
              <Button
                key={status.value}
                variant={isCancel ? "outline" : "primary"}
                size="sm"
                onClick={() => {
                  if (isCancel) {
                    setCancelOpen(true);
                    return;
                  }
                  statusMutation.mutate(status.value);
                }}
                disabled={statusMutation.isPending}
              >
                {status.nome}
              </Button>
            );
          })}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-neutral-200 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-gray">Fornecedor</p>
          <p className="mt-1 font-medium">{order.fornecedor.nomeFantasia}</p>
          <p className="text-sm text-brand-gray">{order.fornecedor.razaoSocial}</p>
        </div>
        <div className="border border-neutral-200 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-gray">Datas</p>
          <p className="mt-1 text-sm">
            Data: {new Date(order.data).toLocaleDateString("pt-BR")}
          </p>
          <p className="text-sm">
            Previsão: {new Date(order.previsaoEntrega).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="border border-neutral-200 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-gray">Responsável</p>
          <p className="mt-1">{order.responsavel?.nome ?? "—"}</p>
        </div>
        <div className="border border-neutral-200 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-gray">Pedido fornecedor</p>
          <p className="mt-1">{order.pedidoFornecedor ?? "—"}</p>
        </div>
      </div>

      {order.fornecedor.endereco && (
        <section>
          <h2 className="mb-2 font-medium text-brand-black">Endereço do fornecedor</h2>
          <p className="text-sm text-brand-gray">{formatAddress(order.fornecedor.endereco)}</p>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-medium text-brand-black">Itens</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Produto</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-right">Qtd</th>
                {receiptSummary && (
                  <>
                    <th className="px-4 py-3 text-right">Recebida</th>
                    <th className="px-4 py-3 text-right">Pendente</th>
                  </>
                )}
                <th className="px-4 py-3 text-right">Unit.</th>
                <th className="px-4 py-3 text-right">Desc.</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.itens.map((item) => {
                const summaryItem = receiptSummary?.itens.find((row) => row.id === item.id);
                return (
                  <tr key={item.id} className="border-t border-neutral-200">
                    <td className="px-4 py-3">{item.produtoNome}</td>
                    <td className="px-4 py-3">{item.sku}</td>
                    <td className="px-4 py-3 text-right">{item.quantidade}</td>
                    {receiptSummary && (
                      <>
                        <td className="px-4 py-3 text-right">
                          {summaryItem?.quantidadeRecebida ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {summaryItem?.quantidadePendente ?? item.quantidade}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-right">{formatCurrency(item.valorUnitario)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.desconto)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.subtotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {receipts.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-brand-black">Recebimentos</h2>
            <Link href="/admin/compras/recebimentos" className="text-sm underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-2">
            {receipts.map((receipt) => (
              <Link
                key={receipt.id}
                href={`/admin/compras/recebimentos/${receipt.id}`}
                className="flex flex-wrap items-center justify-between gap-2 border border-neutral-200 p-3 text-sm hover:bg-brand-light"
              >
                <span className="font-medium">{receipt.numeroFormatado}</span>
                <span>{formatCurrency(receipt.valorTotal)}</span>
                <span className="text-brand-gray">
                  {new Date(receipt.createdAt).toLocaleString("pt-BR")}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-sm space-y-2 border border-neutral-200 p-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Frete</span>
          <span>{formatCurrency(order.frete)}</span>
        </div>
        <div className="flex justify-between">
          <span>Descontos</span>
          <span>{formatCurrency(order.desconto)}</span>
        </div>
        <div className="flex justify-between border-t border-neutral-200 pt-2 font-semibold">
          <span>Total geral</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </section>

      {order.observacoes && (
        <section>
          <h2 className="mb-2 font-medium text-brand-black">Observações</h2>
          <p className="whitespace-pre-wrap text-sm text-brand-gray">{order.observacoes}</p>
        </section>
      )}

      {order.motivoCancelamento && (
        <section>
          <h2 className="mb-2 font-medium text-brand-black">Motivo do cancelamento</h2>
          <p className="text-sm text-red-700">{order.motivoCancelamento}</p>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-medium text-brand-black">Timeline</h2>
        {history.length === 0 ? (
          <p className="text-sm text-brand-gray">Nenhum evento registrado.</p>
        ) : (
          <ol className="space-y-3 border-l-2 border-neutral-200 pl-4">
            {history.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full bg-brand-black" />
                <p className="font-medium">{entry.statusLabel}</p>
                <p className="text-sm text-brand-gray">{entry.descricao}</p>
                <p className="text-xs text-brand-gray">
                  {formatTime(entry.createdAt)}
                  {entry.usuario ? ` · ${entry.usuario.nome}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <PurchaseOrderPrintView order={order} />

      <Modal
        open={receiveOpen}
        onClose={() => {
          setReceiveOpen(false);
          setReceiveError("");
        }}
        title="Receber mercadorias"
      >
        {receiptSummary && (
          <ReceiveGoodsForm
            purchaseOrderId={id}
            summary={receiptSummary}
            onSubmit={(data) => receiveMutation.mutate(data)}
            loading={receiveMutation.isPending}
            error={receiveError}
          />
        )}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setFormError("");
        }}
        title="Editar ordem de compra"
      >
        <PurchaseOrderForm
          initial={order}
          onSubmit={(data) => updateMutation.mutate(data)}
          loading={updateMutation.isPending}
          error={formError}
        />
      </Modal>

      <Modal
        open={cancelOpen}
        onClose={() => {
          setCancelOpen(false);
          setMotivo("");
        }}
        title="Cancelar ordem"
      >
        <div className="space-y-4">
          <p className="text-sm text-brand-gray">Informe o motivo do cancelamento.</p>
          <textarea
            className="min-h-24 w-full border border-neutral-300 px-4 py-2.5 text-sm"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo..."
          />
          <Button
            onClick={() => cancelMutation.mutate()}
            disabled={!motivo.trim() || cancelMutation.isPending}
          >
            Confirmar cancelamento
          </Button>
        </div>
      </Modal>
    </div>
  );
}
