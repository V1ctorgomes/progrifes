"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ExpenseStatusBadge } from "@/features/admin/expenses/ExpenseStatusBadge";
import { useAuth } from "@/hooks/useAuth";
import {
  expensesAdminApi,
  financialAdminApi,
  getErrorMessage,
} from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";

function canWriteExpenses(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("expenses:write");
}

export function ExpenseDetailAdminPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canWrite = canWriteExpenses(permissions);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const { data: expense, isLoading } = useQuery({
    queryKey: ["admin", "expenses", id],
    queryFn: () => expensesAdminApi.getById(id),
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
    queryClient.invalidateQueries({ queryKey: ["admin", "expenses"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "financial"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "cash-flow"] });
  };

  const payMutation = useMutation({
    mutationFn: () =>
      expensesAdminApi.pay(id, {
        valor: payForm.valor,
        paymentMethodId: payForm.paymentMethodId,
        financialAccountId:
          payForm.destination === "bank" ? payForm.financialAccountId : undefined,
        cashboxId: payForm.destination === "cashbox" ? payForm.cashboxId : undefined,
        pagoEm: payForm.pagoEm,
      }),
    onSuccess: () => {
      invalidate();
      setPayOpen(false);
      setFormError("");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => expensesAdminApi.cancel(id, { motivo: cancelMotivo }),
    onSuccess: () => {
      invalidate();
      setCancelOpen(false);
      setCancelMotivo("");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const reverseMutation = useMutation({
    mutationFn: () =>
      expensesAdminApi.reverse(id, {
        paymentId: reversePaymentId!,
        motivo: reverseMotivo || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setReversePaymentId(null);
      setReverseMotivo("");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const attachmentMutation = useMutation({
    mutationFn: (file: File) =>
      new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1] ?? result;
          expensesAdminApi
            .addAttachment(id, {
              nome: file.name,
              tipo: file.type || "application/octet-stream",
              conteudoBase64: base64,
            })
            .then(() => resolve())
            .catch(reject);
        };
        reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
        reader.readAsDataURL(file);
      }),
    onSuccess: invalidate,
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  if (isLoading) {
    return <p className="text-brand-gray">Carregando despesa...</p>;
  }

  if (!expense) {
    return <p className="text-brand-gray">Despesa não encontrada.</p>;
  }

  const canPay = ["PENDENTE", "PARCIALMENTE_PAGO", "VENCIDO"].includes(expense.status);
  const canCancel = ["PENDENTE", "VENCIDO"].includes(expense.status) && expense.valorPago === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/financeiro/despesas"
            className="text-sm text-brand-gray underline"
          >
            ← Voltar às despesas
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            {expense.numeroFormatado}
          </h1>
          <p className="text-brand-gray">{expense.descricao}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExpenseStatusBadge status={expense.status} />
          {canWrite && canPay && (
            <Button
              size="sm"
              onClick={() => {
                setPayForm((current) => ({
                  ...current,
                  valor: expense.saldo,
                  paymentMethodId: expense.paymentMethodId ?? paymentMethods?.[0]?.id ?? "",
                }));
                setPayOpen(true);
              }}
            >
              Pagar
            </Button>
          )}
          {canWrite && canCancel && (
            <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)}>
              Cancelar
            </Button>
          )}
          {canWrite && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.xml,.jpg,.jpeg,.png,.docx"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) attachmentMutation.mutate(file);
                  event.target.value = "";
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Anexar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="border border-neutral-200 bg-brand-white p-4">
          <p className="text-xs uppercase text-brand-gray">Valor</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(expense.valor)}</p>
        </div>
        <div className="border border-neutral-200 bg-brand-white p-4">
          <p className="text-xs uppercase text-brand-gray">Saldo</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(expense.saldo)}</p>
        </div>
        <div className="border border-neutral-200 bg-brand-white p-4">
          <p className="text-xs uppercase text-brand-gray">Vencimento</p>
          <p className="mt-1 text-xl font-semibold">
            {new Date(expense.vencimento).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="border border-neutral-200 bg-brand-white p-4">
          <p className="text-xs uppercase text-brand-gray">Categoria</p>
          <p className="mt-1 text-xl font-semibold">{expense.categoryNome}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Detalhes</h2>
          <div className="border border-neutral-200 bg-brand-white p-4 text-sm">
            <p>Fornecedor: {expense.supplierNome ?? "—"}</p>
            <p className="mt-1">Centro de custo: {expense.costCenterNome}</p>
            <p className="mt-1">Plano de contas: {expense.chartAccountNome}</p>
            <p className="mt-1">Documento: {expense.documento ?? "—"}</p>
            <p className="mt-1">
              Competência: {new Date(expense.competencia).toLocaleDateString("pt-BR")}
            </p>
            {expense.recorrente && (
              <p className="mt-1">
                Recorrente: {expense.frequencia ?? "—"}
                {expense.proximaRecorrencia
                  ? ` · Próxima: ${new Date(expense.proximaRecorrencia).toLocaleDateString("pt-BR")}`
                  : ""}
              </p>
            )}
            {expense.parcelaNumero && expense.totalParcelas ? (
              <p className="mt-1">
                Parcela {expense.parcelaNumero} de {expense.totalParcelas}
              </p>
            ) : null}
            {expense.observacoes && <p className="mt-2 text-brand-gray">{expense.observacoes}</p>}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Anexos</h2>
          <div className="border border-neutral-200 bg-brand-white">
            {expense.anexos.length === 0 ? (
              <p className="p-4 text-sm text-brand-gray">Nenhum anexo.</p>
            ) : (
              <ul className="divide-y divide-neutral-200">
                {expense.anexos.map((anexo) => (
                  <li key={anexo.id} className="flex items-center justify-between p-4 text-sm">
                    <span>{anexo.nome}</span>
                    <span className="text-brand-gray">{anexo.tipo}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Pagamentos</h2>
        <div className="border border-neutral-200 bg-brand-white">
          {expense.pagamentos.length === 0 ? (
            <p className="p-4 text-sm text-brand-gray">Nenhum pagamento registrado.</p>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {expense.pagamentos.map((payment) => (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm"
                >
                  <div>
                    <p className="font-medium">{formatCurrency(payment.valor)}</p>
                    <p className="text-brand-gray">
                      {new Date(payment.pagoEm).toLocaleString("pt-BR")} ·{" "}
                      {payment.paymentMethodNome}
                    </p>
                  </div>
                  {canWrite && !payment.estornado && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReversePaymentId(payment.id)}
                    >
                      Estornar
                    </Button>
                  )}
                  {payment.estornado && (
                    <span className="text-xs uppercase text-brand-gray">Estornado</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Histórico</h2>
        <div className="border border-neutral-200 bg-brand-white">
          <ul className="divide-y divide-neutral-200">
            {expense.historico.map((entry) => (
              <li key={entry.id} className="p-4 text-sm">
                <p className="font-medium text-brand-black">{entry.operacao}</p>
                <p className="text-brand-gray">{entry.descricao}</p>
                <p className="mt-1 text-xs text-brand-gray">
                  {new Date(entry.createdAt).toLocaleString("pt-BR")}
                  {entry.usuarioNome ? ` · ${entry.usuarioNome}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Registrar pagamento">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            payMutation.mutate();
          }}
        >
          <Input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={payForm.valor}
            onChange={(event) =>
              setPayForm((current) => ({ ...current, valor: Number(event.target.value) }))
            }
          />
          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            required
            value={payForm.paymentMethodId}
            onChange={(event) =>
              setPayForm((current) => ({ ...current, paymentMethodId: event.target.value }))
            }
          >
            <option value="">Forma de pagamento</option>
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
              setPayForm((current) => ({
                ...current,
                destination: event.target.value as "cashbox" | "bank",
              }))
            }
          >
            <option value="cashbox">Caixa</option>
            <option value="bank">Conta bancária</option>
          </select>
          {payForm.destination === "cashbox" ? (
            <select
              className="w-full border border-neutral-300 px-3 py-2 text-sm"
              required
              value={payForm.cashboxId}
              onChange={(event) =>
                setPayForm((current) => ({ ...current, cashboxId: event.target.value }))
              }
            >
              <option value="">Caixa</option>
              {cashboxes?.map((cashbox) => (
                <option key={cashbox.id} value={cashbox.id}>
                  {cashbox.nome}
                </option>
              ))}
            </select>
          ) : (
            <select
              className="w-full border border-neutral-300 px-3 py-2 text-sm"
              required
              value={payForm.financialAccountId}
              onChange={(event) =>
                setPayForm((current) => ({
                  ...current,
                  financialAccountId: event.target.value,
                }))
              }
            >
              <option value="">Conta bancária</option>
              {bankAccounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.nome}
                </option>
              ))}
            </select>
          )}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={payMutation.isPending}>
              Confirmar pagamento
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancelar despesa">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            cancelMutation.mutate();
          }}
        >
          <Input
            required
            placeholder="Motivo do cancelamento"
            value={cancelMotivo}
            onChange={(event) => setCancelMotivo(event.target.value)}
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
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
          <Input
            placeholder="Motivo (opcional)"
            value={reverseMotivo}
            onChange={(event) => setReverseMotivo(event.target.value)}
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
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
