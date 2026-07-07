"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  AccountReceivablePrintView,
  printAccountReceivable,
} from "@/features/admin/accounts-receivable/AccountReceivablePrintView";
import { ReceivableStatusBadge } from "@/features/admin/accounts-receivable/ReceivableStatusBadge";
import { useAuth } from "@/hooks/useAuth";
import {
  accountsReceivableAdminApi,
  financialAdminApi,
  getErrorMessage,
} from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";

function canWriteReceivables(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("receivables:write");
}

export function AccountReceivableDetailAdminPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canWrite = canWriteReceivables(permissions);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reverseReceiptId, setReverseReceiptId] = useState<string | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [reverseMotivo, setReverseMotivo] = useState("");
  const [formError, setFormError] = useState("");

  const [receiveForm, setReceiveForm] = useState({
    valor: 0,
    paymentMethodId: "",
    destination: "cashbox" as "cashbox" | "bank",
    financialAccountId: "",
    cashboxId: "",
    recebidoEm: new Date().toISOString().slice(0, 16),
  });

  const { data: account, isLoading } = useQuery({
    queryKey: ["admin", "accounts-receivable", id],
    queryFn: () => accountsReceivableAdminApi.getById(id),
    enabled: Boolean(id),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["admin", "financial", "payment-methods"],
    queryFn: financialAdminApi.paymentMethods,
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ["admin", "financial", "accounts"],
    queryFn: financialAdminApi.accounts,
  });

  const { data: cashboxes } = useQuery({
    queryKey: ["admin", "financial", "cashboxes"],
    queryFn: financialAdminApi.cashboxes,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "accounts-receivable"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "financial"] });
  };

  const receiveMutation = useMutation({
    mutationFn: () =>
      accountsReceivableAdminApi.receive(id, {
        valor: receiveForm.valor,
        paymentMethodId: receiveForm.paymentMethodId,
        financialAccountId:
          receiveForm.destination === "bank" ? receiveForm.financialAccountId : undefined,
        cashboxId: receiveForm.destination === "cashbox" ? receiveForm.cashboxId : undefined,
        recebidoEm: new Date(receiveForm.recebidoEm).toISOString(),
      }),
    onSuccess: () => {
      invalidate();
      setReceiveOpen(false);
      setFormError("");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => accountsReceivableAdminApi.cancel(id, { motivo: cancelMotivo }),
    onSuccess: () => {
      invalidate();
      setCancelOpen(false);
      setCancelMotivo("");
      setFormError("");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const reverseMutation = useMutation({
    mutationFn: () =>
      accountsReceivableAdminApi.reverse(id, {
        receiptId: reverseReceiptId!,
        motivo: reverseMotivo || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setReverseReceiptId(null);
      setReverseMotivo("");
      setFormError("");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  if (isLoading) {
    return <p className="text-sm text-brand-gray">Carregando conta a receber...</p>;
  }

  if (!account) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-brand-gray">Conta a receber não encontrada.</p>
        <Link href="/admin/financeiro/contas-receber" className="text-sm underline">
          Voltar
        </Link>
      </div>
    );
  }

  const canReceive =
    canWrite &&
    !["CANCELADO", "RECEBIDO", "ESTORNADO"].includes(account.status) &&
    account.saldo > 0;

  const canCancel =
    canWrite &&
    account.status !== "CANCELADO" &&
    account.valorRecebido === 0;

  function openReceiveModal() {
    if (!account) return;
    setReceiveForm({
      valor: account.saldo,
      paymentMethodId: account.paymentMethodId,
      destination: "cashbox",
      financialAccountId: bankAccounts?.[0]?.id ?? "",
      cashboxId: cashboxes?.[0]?.id ?? "",
      recebidoEm: new Date().toISOString().slice(0, 16),
    });
    setFormError("");
    setReceiveOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/financeiro/contas-receber"
            className="text-sm text-brand-gray hover:text-brand-black"
          >
            ← Contas a receber
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
              {account.numeroFormatado}
            </h1>
            <ReceivableStatusBadge status={account.status} />
          </div>
          <p className="text-sm text-brand-gray">
            {account.customerNome}
            {account.orderId && (
              <>
                {" "}
                · Pedido{" "}
                <Link href={`/admin/pedidos/${account.orderId}`} className="underline">
                  {account.orderNumeroFormatado}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={printAccountReceivable}>
            Imprimir
          </Button>
          {canReceive && (
            <Button size="sm" onClick={openReceiveModal}>
              Registrar recebimento
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-neutral-200 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-gray">Valor original</p>
          <p className="mt-1 font-medium">{formatCurrency(account.valorOriginal)}</p>
        </div>
        <div className="border border-neutral-200 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-gray">Recebido</p>
          <p className="mt-1 font-medium">{formatCurrency(account.valorRecebido)}</p>
        </div>
        <div className="border border-neutral-200 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-gray">Saldo</p>
          <p className="mt-1 font-medium">{formatCurrency(account.saldo)}</p>
        </div>
        <div className="border border-neutral-200 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-gray">Vencimento</p>
          <p className="mt-1">
            {new Date(account.vencimento).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="font-medium text-brand-black">Detalhes</h2>
          <div className="border border-neutral-200 p-4 text-sm text-brand-gray">
            <p>Categoria: {account.categoryNome}</p>
            <p className="mt-1">Plano de contas: {account.chartAccountNome}</p>
            <p className="mt-1">Forma prevista: {account.paymentMethodNome}</p>
            <p className="mt-1">Origem: {account.originType}</p>
            {account.documento && <p className="mt-1">Documento: {account.documento}</p>}
            {account.observacoes && <p className="mt-1">Obs.: {account.observacoes}</p>}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-brand-black">Recebimentos</h2>
          <div className="border border-neutral-200">
            {account.recebimentos.length === 0 ? (
              <p className="p-4 text-sm text-brand-gray">Nenhum recebimento registrado.</p>
            ) : (
              <ul className="divide-y divide-neutral-200">
                {account.recebimentos.map((receipt) => (
                  <li key={receipt.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                    <div>
                      <p className="font-medium text-brand-black">
                        {formatCurrency(receipt.valor)} — {receipt.paymentMethodNome}
                      </p>
                      <p className="text-brand-gray">
                        {new Date(receipt.recebidoEm).toLocaleString("pt-BR")}
                        {receipt.estornado && " · Estornado"}
                      </p>
                    </div>
                    {canWrite && !receipt.estornado && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReverseReceiptId(receipt.id);
                          setReverseMotivo("");
                          setFormError("");
                        }}
                      >
                        Estornar
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium text-brand-black">Histórico</h2>
        <div className="border border-neutral-200">
          {account.historico.length === 0 ? (
            <p className="p-4 text-sm text-brand-gray">Sem eventos registrados.</p>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {account.historico.map((entry) => (
                <li key={entry.id} className="p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-brand-black">{entry.operacao}</p>
                    <p className="text-brand-gray">
                      {new Date(entry.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <p className="mt-1 text-brand-gray">{entry.descricao}</p>
                  {entry.usuarioNome && (
                    <p className="mt-1 text-xs text-brand-gray">Por {entry.usuarioNome}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <AccountReceivablePrintView account={account} />

      <Modal open={receiveOpen} onClose={() => setReceiveOpen(false)} title="Registrar recebimento">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            receiveMutation.mutate();
          }}
        >
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Input
            type="number"
            min="0.01"
            step="0.01"
            max={account.saldo}
            required
            value={receiveForm.valor || ""}
            onChange={(event) =>
              setReceiveForm({ ...receiveForm, valor: Number(event.target.value) })
            }
          />
          <select
            required
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            value={receiveForm.paymentMethodId}
            onChange={(event) =>
              setReceiveForm({ ...receiveForm, paymentMethodId: event.target.value })
            }
          >
            {paymentMethods?.map((method) => (
              <option key={method.id} value={method.id}>
                {method.nome}
              </option>
            ))}
          </select>
          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            value={receiveForm.destination}
            onChange={(event) =>
              setReceiveForm({
                ...receiveForm,
                destination: event.target.value as "cashbox" | "bank",
              })
            }
          >
            <option value="cashbox">Caixa</option>
            <option value="bank">Conta bancária</option>
          </select>
          {receiveForm.destination === "cashbox" ? (
            <select
              required
              className="w-full border border-neutral-300 px-3 py-2 text-sm"
              value={receiveForm.cashboxId}
              onChange={(event) =>
                setReceiveForm({ ...receiveForm, cashboxId: event.target.value })
              }
            >
              {cashboxes?.map((cashbox) => (
                <option key={cashbox.id} value={cashbox.id}>
                  {cashbox.nome}
                </option>
              ))}
            </select>
          ) : (
            <select
              required
              className="w-full border border-neutral-300 px-3 py-2 text-sm"
              value={receiveForm.financialAccountId}
              onChange={(event) =>
                setReceiveForm({ ...receiveForm, financialAccountId: event.target.value })
              }
            >
              {bankAccounts?.map((bankAccount) => (
                <option key={bankAccount.id} value={bankAccount.id}>
                  {bankAccount.nome}
                </option>
              ))}
            </select>
          )}
          <Input
            type="datetime-local"
            value={receiveForm.recebidoEm}
            onChange={(event) =>
              setReceiveForm({ ...receiveForm, recebidoEm: event.target.value })
            }
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setReceiveOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={receiveMutation.isPending}>
              {receiveMutation.isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancelar conta">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            cancelMutation.mutate();
          }}
        >
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Input
            required
            placeholder="Motivo do cancelamento"
            value={cancelMotivo}
            onChange={(event) => setCancelMotivo(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              Voltar
            </Button>
            <Button type="submit" disabled={cancelMutation.isPending}>
              Confirmar cancelamento
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(reverseReceiptId)}
        onClose={() => setReverseReceiptId(null)}
        title="Estornar recebimento"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            reverseMutation.mutate();
          }}
        >
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Input
            placeholder="Motivo do estorno (opcional)"
            value={reverseMotivo}
            onChange={(event) => setReverseMotivo(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setReverseReceiptId(null)}>
              Voltar
            </Button>
            <Button type="submit" disabled={reverseMutation.isPending}>
              Confirmar estorno
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
