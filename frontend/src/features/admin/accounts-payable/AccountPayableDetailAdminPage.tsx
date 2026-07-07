"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  AccountPayablePrintView,
  printAccountPayable,
} from "@/features/admin/accounts-payable/AccountPayablePrintView";
import { PayableStatusBadge } from "@/features/admin/accounts-payable/PayableStatusBadge";
import { useAuth } from "@/hooks/useAuth";
import {
  accountsPayableAdminApi,
  financialAdminApi,
  getErrorMessage,
} from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";

function canWritePayables(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("payables:write");
}

export function AccountPayableDetailAdminPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canWrite = canWritePayables(permissions);

  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reversePaymentId, setReversePaymentId] = useState<string | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [reverseMotivo, setReverseMotivo] = useState("");
  const [formError, setFormError] = useState("");

  const [payForm, setPayForm] = useState({
    valor: 0,
    paymentMethodId: "",
    destination: "cashbox" as "cashbox" | "bank",
    financialAccountId: "",
    cashboxId: "",
    pagoEm: new Date().toISOString().slice(0, 16),
  });

  const { data: account, isLoading } = useQuery({
    queryKey: ["admin", "accounts-payable", id],
    queryFn: () => accountsPayableAdminApi.getById(id),
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
    queryClient.invalidateQueries({ queryKey: ["admin", "accounts-payable"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "financial"] });
  };

  const payMutation = useMutation({
    mutationFn: () =>
      accountsPayableAdminApi.pay(id, {
        valor: payForm.valor,
        paymentMethodId: payForm.paymentMethodId,
        financialAccountId:
          payForm.destination === "bank" ? payForm.financialAccountId : undefined,
        cashboxId: payForm.destination === "cashbox" ? payForm.cashboxId : undefined,
        pagoEm: new Date(payForm.pagoEm).toISOString(),
      }),
    onSuccess: () => {
      invalidate();
      setPayOpen(false);
      setFormError("");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => accountsPayableAdminApi.cancel(id, { motivo: cancelMotivo }),
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
      accountsPayableAdminApi.reverse(id, {
        paymentId: reversePaymentId!,
        motivo: reverseMotivo || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setReversePaymentId(null);
      setReverseMotivo("");
      setFormError("");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  if (isLoading) {
    return <p className="text-sm text-brand-gray">Carregando conta a pagar...</p>;
  }

  if (!account) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-brand-gray">Conta a pagar não encontrada.</p>
        <Link href="/admin/financeiro/contas-pagar" className="text-sm underline">
          Voltar
        </Link>
      </div>
    );
  }

  const canPay =
    canWrite &&
    !["CANCELADO", "PAGO", "ESTORNADO"].includes(account.status) &&
    account.saldo > 0;

  const canCancel =
    canWrite &&
    account.status !== "CANCELADO" &&
    account.valorPago === 0;

  function openPayModal() {
    if (!account) return;
    setPayForm({
      valor: account.saldo,
      paymentMethodId: account.paymentMethodId,
      destination: "cashbox",
      financialAccountId: bankAccounts?.[0]?.id ?? "",
      cashboxId: cashboxes?.[0]?.id ?? "",
      pagoEm: new Date().toISOString().slice(0, 16),
    });
    setFormError("");
    setPayOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/financeiro/contas-pagar"
            className="text-sm text-brand-gray hover:text-brand-black"
          >
            ← Contas a pagar
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
              {account.numeroFormatado}
            </h1>
            <PayableStatusBadge status={account.status} />
          </div>
          <p className="text-sm text-brand-gray">
            {account.supplierNome}
            {account.purchaseOrderId && (
              <>
                {" "}
                · Ordem de compra{" "}
                <Link href={`/admin/compras/${account.purchaseOrderId}`} className="underline">
                  {account.orderNumeroFormatado}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={printAccountPayable}>
            Imprimir
          </Button>
          {canPay && (
            <Button size="sm" onClick={openPayModal}>
              Registrar pagamento
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
          <p className="text-xs uppercase tracking-wide text-brand-gray">Pago</p>
          <p className="mt-1 font-medium">{formatCurrency(account.valorPago)}</p>
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
            {account.numeroNota && <p className="mt-1">Nota fiscal: {account.numeroNota}</p>}
            {account.observacoes && <p className="mt-1">Obs.: {account.observacoes}</p>}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-brand-black">Pagamentos</h2>
          <div className="border border-neutral-200">
            {account.pagamentos.length === 0 ? (
              <p className="p-4 text-sm text-brand-gray">Nenhum pagamento registrado.</p>
            ) : (
              <ul className="divide-y divide-neutral-200">
                {account.pagamentos.map((payment) => (
                  <li key={payment.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                    <div>
                      <p className="font-medium text-brand-black">
                        {formatCurrency(payment.valor)} — {payment.paymentMethodNome}
                      </p>
                      <p className="text-brand-gray">
                        {new Date(payment.pagoEm).toLocaleString("pt-BR")}
                        {payment.estornado && " · Estornado"}
                      </p>
                    </div>
                    {canWrite && !payment.estornado && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReversePaymentId(payment.id);
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

      <AccountPayablePrintView account={account} />

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Registrar pagamento">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            payMutation.mutate();
          }}
        >
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Input
            type="number"
            min="0.01"
            step="0.01"
            max={account.saldo}
            required
            value={payForm.valor || ""}
            onChange={(event) =>
              setPayForm({ ...payForm, valor: Number(event.target.value) })
            }
          />
          <select
            required
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            value={payForm.paymentMethodId}
            onChange={(event) =>
              setPayForm({ ...payForm, paymentMethodId: event.target.value })
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
            value={payForm.destination}
            onChange={(event) =>
              setPayForm({
                ...payForm,
                destination: event.target.value as "cashbox" | "bank",
              })
            }
          >
            <option value="cashbox">Caixa</option>
            <option value="bank">Conta bancária</option>
          </select>
          {payForm.destination === "cashbox" ? (
            <select
              required
              className="w-full border border-neutral-300 px-3 py-2 text-sm"
              value={payForm.cashboxId}
              onChange={(event) =>
                setPayForm({ ...payForm, cashboxId: event.target.value })
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
              value={payForm.financialAccountId}
              onChange={(event) =>
                setPayForm({ ...payForm, financialAccountId: event.target.value })
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
            value={payForm.pagoEm}
            onChange={(event) =>
              setPayForm({ ...payForm, pagoEm: event.target.value })
            }
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={payMutation.isPending}>
              {payMutation.isPending ? "Salvando..." : "Confirmar"}
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
        open={Boolean(reversePaymentId)}
        onClose={() => setReversePaymentId(null)}
        title="Estornar pagamento"
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
            <Button type="button" variant="outline" onClick={() => setReversePaymentId(null)}>
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
